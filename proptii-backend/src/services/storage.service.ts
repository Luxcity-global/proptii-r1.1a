import { Injectable, Logger } from '@nestjs/common';
import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StorageService {
  private blobServiceClient: BlobServiceClient;
  private containerClient: any;
  private readonly logger = new Logger(StorageService.name);

  constructor(private configService: ConfigService) {
    const accountName = this.configService.get<string>('AZURE_STORAGE_ACCOUNT_NAME');
    const containerName = this.configService.get<string>('AZURE_STORAGE_CONTAINER_NAME');
    const sasToken = this.configService.get<string>('AZURE_STORAGE_SAS_TOKEN');

    if (!accountName || !containerName || !sasToken) {
      throw new Error('Azure Storage configuration is incomplete');
    }

    // Initialize the Blob service client with SAS token
    this.blobServiceClient = new BlobServiceClient(
      `https://${accountName}.blob.core.windows.net?${sasToken}`
    );
    
    this.containerClient = this.blobServiceClient.getContainerClient(containerName);
  }

  async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
    try {
      const blobName = `${folder}/${Date.now()}-${file.originalname}`;
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      
      await blockBlobClient.upload(file.buffer, file.size);
      
      return blockBlobClient.url;
    } catch (error) {
      this.logger.error(`Error uploading file: ${error.message}`);
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
}