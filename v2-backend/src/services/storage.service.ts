import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

export interface StorageUploadResult {
  success: boolean;
  url: string;
  fileName: string;
  fullPath: string;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private bucketName = process.env.FIREBASE_STORAGE_BUCKET || 'proptii-16946.firebasestorage.app';

  private getBucket() {
    return admin.storage().bucket(this.bucketName);
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'documents',
  ): Promise<StorageUploadResult> {
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
          metadata: {
            firebaseStorageDownloadTokens: downloadToken,
            originalName: file.originalname,
            uploadedAt: new Date().toISOString(),
          },
        },
      });

      // Firebase Storage standardized permanent download URL
      const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filePath)}?alt=media&token=${downloadToken}`;

      this.logger.log(`[StorageService] Uploaded ${filePath} -> ${publicUrl}`);

      return {
        success: true,
        url: publicUrl,
        fileName: uniqueFileName,
        fullPath: filePath,
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
