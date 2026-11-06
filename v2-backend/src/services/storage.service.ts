import { Injectable, Logger, BadRequestException, Optional } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';
import { validateFileContent } from '../utils/file-content-validator';
import { MalwareScanService } from './malware-scan.service';
import { ImageOptimiserService } from './image-optimiser.service';

export interface StorageUploadResult {
  success: boolean;
  url: string;
  fileName: string;
  fullPath: string;
  variants?: {
    thumbnailUrl?: string;
    desktopUrl?: string;
    fullUrl?: string;
  };
}

export interface MulterUploadedFile {
  fieldname?: string;
  originalname: string;
  encoding?: string;
  mimetype?: string;
  size?: number;
  buffer: Buffer;
  destination?: string;
  filename?: string;
  path?: string;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private bucketName = process.env.FIREBASE_STORAGE_BUCKET || 'proptii-16946.firebasestorage.app';

  constructor(
    @Optional() private readonly malwareScan?: MalwareScanService,
    @Optional() private readonly imageOptimiser?: ImageOptimiserService,
  ) {}

  private getBucket() {
    return admin.storage().bucket(this.bucketName);
  }

  async uploadFile(
    file: MulterUploadedFile,
    folder: string = 'documents',
  ): Promise<StorageUploadResult> {
    // 1. Magic byte validation
    const validation = validateFileContent(file.buffer, file.originalname, file.mimetype);
    if (!validation.valid) {
      this.logger.warn(`[StorageService] Prohibited file upload attempt ${file.originalname}: ${validation.error}`);
      throw new BadRequestException(validation.error || 'The uploaded file content is not permitted');
    }

    // 2. Task p4-11: Malware scanning and quarantine check
    if (this.malwareScan) {
      await this.malwareScan.verifyOrThrow(file.buffer, file.originalname);
    }

    try {
      const bucket = this.getBucket();
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 11);
      const cleanOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      const uniqueFileName = `${timestamp}-${randomStr}_${cleanOriginalName}`;
      const filePath = folder ? `${folder.replace(/^\/|\/$/g, '')}/${uniqueFileName}` : uniqueFileName;

      const fileRef = bucket.file(filePath);
      const downloadToken = crypto.randomUUID();

      await fileRef.save(file.buffer, {
        contentType: file.mimetype || 'application/octet-stream',
        metadata: {
          contentDisposition: `attachment; filename="${encodeURIComponent(cleanOriginalName)}"`,
          metadata: {
            firebaseStorageDownloadTokens: downloadToken,
            originalName: file.originalname,
            uploadedAt: new Date().toISOString(),
            'x-content-type-options': 'nosniff',
          },
        },
      });

      // Firebase Storage standardized permanent download URL
      const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filePath)}?alt=media&token=${downloadToken}`;

      this.logger.log(`[StorageService] Uploaded ${filePath} -> ${publicUrl}`);

      // 3. Task p4-12: Automatic image optimisation with WebP variants
      const isImage = (file.mimetype && file.mimetype.startsWith('image/')) || folder.includes('photo');
      let variants: StorageUploadResult['variants'] = undefined;

      if (isImage && this.imageOptimiser) {
        try {
          const { thumbnailBuffer, desktopBuffer, fullBuffer } = await this.imageOptimiser.optimiseImage(file.buffer);

          const thumbToken = crypto.randomUUID();
          const desktopToken = crypto.randomUUID();
          const fullToken = crypto.randomUUID();

          const thumbPath = `${folder}/thumbs/${uniqueFileName}.webp`;
          const desktopPath = `${folder}/desktop/${uniqueFileName}.webp`;
          const fullPath = `${folder}/full/${uniqueFileName}.webp`;

          await Promise.all([
            bucket.file(thumbPath).save(thumbnailBuffer, {
              contentType: 'image/webp',
              metadata: { metadata: { firebaseStorageDownloadTokens: thumbToken } },
            }),
            bucket.file(desktopPath).save(desktopBuffer, {
              contentType: 'image/webp',
              metadata: { metadata: { firebaseStorageDownloadTokens: desktopToken } },
            }),
            bucket.file(fullPath).save(fullBuffer, {
              contentType: 'image/webp',
              metadata: { metadata: { firebaseStorageDownloadTokens: fullToken } },
            }),
          ]);

          variants = {
            thumbnailUrl: `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(thumbPath)}?alt=media&token=${thumbToken}`,
            desktopUrl: `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(desktopPath)}?alt=media&token=${desktopToken}`,
            fullUrl: `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fullPath)}?alt=media&token=${fullToken}`,
          };
          this.logger.log(`[StorageService] Created responsive WebP variants for ${uniqueFileName}`);
        } catch (optErr: any) {
          this.logger.warn(`[StorageService] Variant generation non-fatal error: ${optErr?.message}`);
        }
      }

      return {
        success: true,
        url: publicUrl,
        fileName: uniqueFileName,
        fullPath: filePath,
        variants,
      };
    } catch (err: any) {
      this.logger.error(`[StorageService] Error uploading file: ${err.message}`, err.stack);
      throw err;
    }
  }

  async deleteFile(filePath: string): Promise<boolean> {
    try {
      const bucket = this.getBucket();
      const fileRef = bucket.file(filePath);
      const [exists] = await fileRef.exists();
      if (exists) {
        await fileRef.delete();
      }
      return true;
    } catch (err: any) {
      this.logger.warn(`[StorageService] Error deleting file ${filePath}: ${err.message}`);
      return true; // Optimistic deletion
    }
  }
}
