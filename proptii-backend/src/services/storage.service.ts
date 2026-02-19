import { Injectable, Logger } from '@nestjs/common';
import { BlobServiceClient } from '@azure/storage-blob';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StorageService {
  private blobServiceClient: BlobServiceClient;
  private containerClient: any;
  private readonly logger = new Logger(StorageService.name);
  private readonly isConfigured: boolean;

  constructor(private configService: ConfigService) {
    const accountName = this.configService.get<string>('AZURE_STORAGE_ACCOUNT_NAME');
    const containerName = this.configService.get<string>('AZURE_STORAGE_CONTAINER_NAME');
    const sasToken = this.configService.get<string>('AZURE_STORAGE_SAS_TOKEN');

    if (!accountName || !containerName || !sasToken) {
      this.logger.warn(
        'Azure Storage configuration is incomplete. Property document uploads will be disabled.',
      );
      this.logger.warn(`Account: ${accountName ? 'SET' : 'MISSING'}, Container: ${containerName ? 'SET' : 'MISSING'}, SAS Token: ${sasToken ? 'SET' : 'MISSING'}`);
      this.isConfigured = false;
      return;
    }

    try {
      // Initialize the Blob service client with SAS token
      // SAS token can start with '?', 'sp=', 'sv=', 'st=', etc. - normalize it
      let normalizedSasToken = sasToken.trim();
      // If it doesn't start with '?', add it (SAS tokens need '?' prefix in URLs)
      if (!normalizedSasToken.startsWith('?')) {
        normalizedSasToken = `?${normalizedSasToken}`;
      }

      const accountUrl = `https://${accountName}.blob.core.windows.net${normalizedSasToken}`;
      this.logger.log(`Initializing Azure Storage with account: ${accountName}, container: ${containerName}`);
      this.logger.debug(`SAS token format: ${normalizedSasToken.substring(0, 20)}...`);

      this.blobServiceClient = new BlobServiceClient(accountUrl);
      this.containerClient = this.blobServiceClient.getContainerClient(containerName);
      
      // Ensure container exists (only if SAS token has create permissions)
      this.ensureContainerExists(containerName).catch((error) => {
        this.logger.warn(`Could not verify/create container: ${error.message}`);
        // Continue anyway - container might already exist or SAS might not have create permissions
      });
      
      this.isConfigured = true;
      this.logger.log('✅ Azure Storage initialized successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to initialize Azure Storage: ${message}`);
      this.isConfigured = false;
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string,
  ): Promise<{ url: string; path: string; contentType: string; size: number }> {
    if (!this.isConfigured || !this.containerClient) {
      this.logger.error('Attempted to upload file but Azure Storage is not configured.');
      throw new Error('STORAGE_NOT_CONFIGURED');
    }

    try {
      const safeFileName = this.getSafeFileName(file.originalname);
      const blobName = `${folder}/${Date.now()}-${safeFileName}`;
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

      // Upload with proper content type
      await blockBlobClient.upload(file.buffer, file.size, {
        blobHTTPHeaders: {
          blobContentType: file.mimetype || 'application/octet-stream',
        },
      });

      // Get the URL - if using SAS token, the URL should already include it
      const blobUrl = blockBlobClient.url;

      this.logger.log(`Successfully uploaded file: ${blobName} (${file.size} bytes)`);

      return {
        url: blobUrl,
        path: blobName,
        contentType: file.mimetype || 'application/octet-stream',
        size: file.size,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      const errorDetails = error instanceof Error ? error.stack : String(error);
      this.logger.error(`Error uploading file: ${message}`);
      this.logger.error(`Error details: ${errorDetails}`);
      throw new Error(`Failed to upload file to Azure Storage: ${message}`);
    }
  }

  async deleteFile(blobUrl: string): Promise<void> {
    try {
      const blobName = this.getBlobNameFromUrl(blobUrl);
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.delete();
    } catch (error) {
      this.logger.error(`Error deleting file: ${error.message}`);
      throw new Error('Failed to delete file from Azure Storage');
    }
  }

  private getBlobNameFromUrl(blobUrl: string): string {
    const url = new URL(blobUrl);
    return url.pathname.substring(url.pathname.indexOf('/', 1) + 1);
  }

  private async ensureContainerExists(containerName: string): Promise<void> {
    try {
      const exists = await this.containerClient.exists();
      if (!exists) {
        this.logger.log(`Container '${containerName}' does not exist, attempting to create...`);
        await this.containerClient.create({
          access: 'blob', // Public read access for blobs
        });
        this.logger.log(`✅ Container '${containerName}' created successfully`);
      } else {
        this.logger.log(`✅ Container '${containerName}' already exists`);
      }
    } catch (error) {
      // If creation fails due to permissions, that's okay - container might already exist
      // or SAS token might not have create permissions (which is fine if container exists)
      const message = error instanceof Error ? error.message : 'Unknown error';
      if (message.includes('ContainerAlreadyExists') || message.includes('already exists')) {
        this.logger.log(`Container '${containerName}' already exists`);
      } else {
        throw error;
      }
    }
  }

  private getSafeFileName(originalName?: string): string {
    if (!originalName) {
      return 'document';
    }

    const normalized = originalName
      .toLowerCase()
      .replace(/[^a-z0-9.\-_]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (normalized.length === 0) {
      const extension = originalName.includes('.')
        ? originalName.substring(originalName.lastIndexOf('.')).toLowerCase()
        : '';
      return extension ? `document${extension}` : 'document';
    }

    return normalized;
  }
}