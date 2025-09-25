import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

// Cloud Storage Configuration
export interface StorageConfig {
  provider: 'aws' | 'azure' | 'local';
  aws?: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    bucket: string;
  };
  azure?: {
    connectionString: string;
    containerName: string;
  };
  local?: {
    uploadPath: string;
    baseUrl: string;
  };
}

export interface UploadResult {
  url: string;
  thumbnailUrl?: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  width?: number;
  height?: number;
}

export interface ImageProcessingOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  generateThumbnail?: boolean;
  thumbnailSize?: { width: number; height: number };
}

class StorageService {
  private config: StorageConfig;
  private s3?: AWS.S3;

  constructor(config: StorageConfig) {
    this.config = config;
    
    if (config.provider === 'aws' && config.aws) {
      AWS.config.update({
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
        region: config.aws.region,
      });
      this.s3 = new AWS.S3();
    }
  }

  async uploadFile(
    file: Buffer | string,
    filename: string,
    mimeType: string,
    options: ImageProcessingOptions = {}
  ): Promise<UploadResult> {
    const fileId = uuidv4();
    const fileExtension = path.extname(filename);
    const baseName = path.basename(filename, fileExtension);
    
    try {
      let processedFile: Buffer;
      let dimensions: { width?: number; height?: number } = {};

      // Process image if it's an image file
      if (mimeType.startsWith('image/')) {
        const imageBuffer = Buffer.isBuffer(file) ? file : Buffer.from(file);
        
        // Get original dimensions
        const metadata = await sharp(imageBuffer).metadata();
        dimensions = {
          width: metadata.width,
          height: metadata.height
        };

        // Process image
        let sharpInstance = sharp(imageBuffer);

        // Resize if specified
        if (options.width || options.height) {
          sharpInstance = sharpInstance.resize(options.width, options.height, {
            fit: 'inside',
            withoutEnlargement: true
          });
        }

        // Convert format if specified
        if (options.format) {
          switch (options.format) {
            case 'jpeg':
              sharpInstance = sharpInstance.jpeg({ quality: options.quality || 90 });
              break;
            case 'png':
              sharpInstance = sharpInstance.png({ quality: options.quality || 90 });
              break;
            case 'webp':
              sharpInstance = sharpInstance.webp({ quality: options.quality || 90 });
              break;
          }
        }

        processedFile = await sharpInstance.toBuffer();
      } else {
        processedFile = Buffer.isBuffer(file) ? file : Buffer.from(file);
      }

      // Upload main file
      const uploadResult = await this.uploadToStorage(
        processedFile,
        `${fileId}${fileExtension}`,
        mimeType
      );

      // Generate and upload thumbnail if requested
      let thumbnailUrl: string | undefined;
      if (options.generateThumbnail && mimeType.startsWith('image/')) {
        thumbnailUrl = await this.generateThumbnail(
          Buffer.isBuffer(file) ? file : Buffer.from(file),
          fileId,
          options.thumbnailSize || { width: 300, height: 300 }
        );
      }

      return {
        url: uploadResult.url,
        thumbnailUrl,
        filePath: uploadResult.filePath,
        fileSize: processedFile.length,
        mimeType,
        width: dimensions.width,
        height: dimensions.height
      };
    } catch (error) {
      console.error('Upload failed:', error);
      throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async uploadToStorage(
    file: Buffer,
    filename: string,
    mimeType: string
  ): Promise<{ url: string; filePath: string }> {
    switch (this.config.provider) {
      case 'aws':
        return this.uploadToS3(file, filename, mimeType);
      case 'azure':
        return this.uploadToAzure(file, filename, mimeType);
      case 'local':
        return this.uploadToLocal(file, filename, mimeType);
      default:
        throw new Error(`Unsupported storage provider: ${this.config.provider}`);
    }
  }

  private async uploadToS3(
    file: Buffer,
    filename: string,
    mimeType: string
  ): Promise<{ url: string; filePath: string }> {
    if (!this.s3 || !this.config.aws) {
      throw new Error('AWS S3 not configured');
    }

    const params: AWS.S3.PutObjectRequest = {
      Bucket: this.config.aws.bucket,
      Key: `assets/${filename}`,
      Body: file,
      ContentType: mimeType,
      ACL: 'public-read',
      CacheControl: 'max-age=31536000', // 1 year cache
    };

    try {
      const result = await this.s3.upload(params).promise();
      return {
        url: result.Location,
        filePath: `assets/${filename}`
      };
    } catch (error) {
      console.error('S3 upload failed:', error);
      throw new Error('Failed to upload to S3');
    }
  }

  private async uploadToAzure(
    file: Buffer,
    filename: string,
    mimeType: string
  ): Promise<{ url: string; filePath: string }> {
    // Azure Blob Storage implementation would go here
    throw new Error('Azure Blob Storage not implemented yet');
  }

  private async uploadToLocal(
    file: Buffer,
    filename: string,
    mimeType: string
  ): Promise<{ url: string; filePath: string }> {
    if (!this.config.local) {
      throw new Error('Local storage not configured');
    }

    const uploadPath = this.config.local.uploadPath;
    const filePath = path.join(uploadPath, filename);
    const url = `${this.config.local.baseUrl}/${filename}`;

    // Ensure directory exists
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });

    // Write file
    await fs.promises.writeFile(filePath, file);

    return { url, filePath };
  }

  private async generateThumbnail(
    imageBuffer: Buffer,
    fileId: string,
    size: { width: number; height: number }
  ): Promise<string> {
    try {
      const thumbnailBuffer = await sharp(imageBuffer)
        .resize(size.width, size.height, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 80 })
        .toBuffer();

      const thumbnailFilename = `${fileId}_thumb.jpg`;
      const thumbnailResult = await this.uploadToStorage(
        thumbnailBuffer,
        thumbnailFilename,
        'image/jpeg'
      );

      return thumbnailResult.url;
    } catch (error) {
      console.error('Thumbnail generation failed:', error);
      throw new Error('Failed to generate thumbnail');
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    switch (this.config.provider) {
      case 'aws':
        await this.deleteFromS3(filePath);
        break;
      case 'azure':
        await this.deleteFromAzure(filePath);
        break;
      case 'local':
        await this.deleteFromLocal(filePath);
        break;
      default:
        throw new Error(`Unsupported storage provider: ${this.config.provider}`);
    }
  }

  private async deleteFromS3(filePath: string): Promise<void> {
    if (!this.s3 || !this.config.aws) {
      throw new Error('AWS S3 not configured');
    }

    const params: AWS.S3.DeleteObjectRequest = {
      Bucket: this.config.aws.bucket,
      Key: filePath,
    };

    try {
      await this.s3.deleteObject(params).promise();
    } catch (error) {
      console.error('S3 delete failed:', error);
      throw new Error('Failed to delete from S3');
    }
  }

  private async deleteFromAzure(filePath: string): Promise<void> {
    // Azure Blob Storage delete implementation would go here
    throw new Error('Azure Blob Storage delete not implemented yet');
  }

  private async deleteFromLocal(filePath: string): Promise<void> {
    try {
      await fs.promises.unlink(filePath);
    } catch (error) {
      console.error('Local delete failed:', error);
      throw new Error('Failed to delete local file');
    }
  }

  async getSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
    switch (this.config.provider) {
      case 'aws':
        return this.getS3SignedUrl(filePath, expiresIn);
      case 'azure':
        return this.getAzureSignedUrl(filePath, expiresIn);
      case 'local':
        return this.getLocalUrl(filePath);
      default:
        throw new Error(`Unsupported storage provider: ${this.config.provider}`);
    }
  }

  private async getS3SignedUrl(filePath: string, expiresIn: number): Promise<string> {
    if (!this.s3 || !this.config.aws) {
      throw new Error('AWS S3 not configured');
    }

    const params: AWS.S3.GetObjectRequest = {
      Bucket: this.config.aws.bucket,
      Key: filePath,
    };

    try {
      return this.s3.getSignedUrl('getObject', {
        ...params,
        Expires: expiresIn,
      });
    } catch (error) {
      console.error('S3 signed URL generation failed:', error);
      throw new Error('Failed to generate signed URL');
    }
  }

  private async getAzureSignedUrl(filePath: string, expiresIn: number): Promise<string> {
    // Azure Blob Storage signed URL implementation would go here
    throw new Error('Azure Blob Storage signed URL not implemented yet');
  }

  private getLocalUrl(filePath: string): string {
    if (!this.config.local) {
      throw new Error('Local storage not configured');
    }

    const filename = path.basename(filePath);
    return `${this.config.local.baseUrl}/${filename}`;
  }
}

// Default storage configuration
const defaultStorageConfig: StorageConfig = {
  provider: 'local',
  local: {
    uploadPath: path.join(process.cwd(), 'uploads'),
    baseUrl: 'http://localhost:3001/uploads'
  }
};

// Initialize storage service
export const storageService = new StorageService(
  process.env.STORAGE_CONFIG ? JSON.parse(process.env.STORAGE_CONFIG) : defaultStorageConfig
);

export default StorageService;

