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
      this.isConfigured = false;
      return;
    }

    // Initialize the Blob service client with SAS token
    this.blobServiceClient = new BlobServiceClient(
      `https://${accountName}.blob.core.windows.net?${sasToken}`,
    );

    this.containerClient = this.blobServiceClient.getContainerClient(containerName);
    this.isConfigured = true;
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

      await blockBlobClient.upload(file.buffer, file.size);

      return {
        url: blockBlobClient.url,
        path: blobName,
        contentType: file.mimetype,
        size: file.size,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error uploading file: ${message}`);
      throw new Error('Failed to upload file to Azure Storage');
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