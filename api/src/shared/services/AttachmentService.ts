import {
    BlobServiceClient,
    StorageSharedKeyCredential,
    generateBlobSASQueryParameters,
    BlobSASPermissions,
} from '@azure/storage-blob';
import { BaseService } from './BaseService';
import { AppError } from '../middleware/error-handling';
import { validateEnv } from '../config/environment';
import { MessageAttachment } from '../types/messaging';
import { MessageAttachmentModel } from '../models/messaging.models';

const ALLOWED_MIME_TYPES = new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
]);

const MAX_FILE_SIZE_BYTES = 10_485_760;

/**
 * Service for uploading message attachments to Azure Blob Storage and
 * persisting metadata in the `message_attachments` MongoDB collection.
 */
export class AttachmentService extends BaseService {
    constructor() {
        super(MessageAttachmentModel);
    }

    async uploadAttachment(
        file: Buffer,
        fileName: string,
        mimeType: string,
        sizeBytes: number,
        uploaderId: string,
        conversationId: string,
    ): Promise<MessageAttachment> {
        if (!ALLOWED_MIME_TYPES.has(mimeType)) {
            throw new AppError(
                415,
                `Unsupported media type: ${mimeType}. Allowed types are: ${[...ALLOWED_MIME_TYPES].join(', ')}`,
                'UNSUPPORTED_MEDIA_TYPE',
            );
        }

        if (sizeBytes > MAX_FILE_SIZE_BYTES) {
            throw new AppError(
                413,
                `File size ${sizeBytes} bytes exceeds the maximum allowed size of ${MAX_FILE_SIZE_BYTES} bytes (10 MB)`,
                'FILE_TOO_LARGE',
            );
        }

        const config = validateEnv();

        if (!config.BLOB_STORAGE_CONNECTION_STRING) {
            throw new AppError(500, 'Blob Storage is not configured: BLOB_STORAGE_CONNECTION_STRING is missing', 'BLOB_STORAGE_NOT_CONFIGURED');
        }

        const containerName = config.BLOB_STORAGE_CONTAINER_NAME ?? 'message-attachments';
        const attachmentId = crypto.randomUUID();
        const blobPath = `${conversationId}/${attachmentId}/${fileName}`;

        try {
            const blobServiceClient = BlobServiceClient.fromConnectionString(config.BLOB_STORAGE_CONNECTION_STRING);
            const containerClient = blobServiceClient.getContainerClient(containerName);
            // Auto-create the container if it doesn't exist (handles fresh Azurite restarts and new deployments)
            await containerClient.createIfNotExists();
            const blockBlobClient = containerClient.getBlockBlobClient(blobPath);
            await blockBlobClient.uploadData(file, { blobHTTPHeaders: { blobContentType: mimeType } });
        } catch (error) {
            const detail = error instanceof Error ? error.message : String(error);
            console.error('[AttachmentService] Blob upload failed:', detail);
            throw new AppError(502, `Failed to upload file to Blob Storage: ${detail}`, 'BLOB_UPLOAD_FAILED');
        }

        const now = new Date().toISOString();
        const attachment: MessageAttachment = {
            id: attachmentId,
            conversationId,
            messageId: '',
            uploaderId,
            fileName,
            mimeType,
            sizeBytes,
            blobPath,
            uploadedAt: now,
        };

        await MessageAttachmentModel.create(attachment);
        return attachment;
    }

    async generateSasUrl(attachmentId: string, conversationId: string): Promise<string> {
        const attachment = await MessageAttachmentModel.findOne({ id: attachmentId, conversationId }).lean<MessageAttachment>();

        if (!attachment) {
            throw new AppError(404, 'Attachment not found', 'ATTACHMENT_NOT_FOUND');
        }

        const config = validateEnv();

        if (!config.BLOB_STORAGE_CONNECTION_STRING) {
            throw new AppError(500, 'Blob Storage is not configured: BLOB_STORAGE_CONNECTION_STRING is missing', 'BLOB_STORAGE_NOT_CONFIGURED');
        }

        const containerName = config.BLOB_STORAGE_CONTAINER_NAME ?? 'message-attachments';
        const expirySeconds = config.ATTACHMENT_SAS_EXPIRY_SECONDS;
        const expiresOn = new Date(Date.now() + expirySeconds * 1000);

        const accountNameMatch = config.BLOB_STORAGE_CONNECTION_STRING.match(/AccountName=([^;]+)/);
        const accountKeyMatch = config.BLOB_STORAGE_CONNECTION_STRING.match(/AccountKey=([^;]+)/);

        if (!accountNameMatch || !accountKeyMatch) {
            throw new AppError(500, 'Invalid Blob Storage connection string: cannot extract account credentials', 'BLOB_STORAGE_CONFIG_ERROR');
        }

        const sharedKeyCredential = new StorageSharedKeyCredential(accountNameMatch[1], accountKeyMatch[1]);

        const sasQueryParameters = generateBlobSASQueryParameters(
            {
                containerName,
                blobName: attachment.blobPath,
                permissions: BlobSASPermissions.parse('r'),
                expiresOn,
            },
            sharedKeyCredential,
        );

        const blobServiceClient = BlobServiceClient.fromConnectionString(config.BLOB_STORAGE_CONNECTION_STRING);
        const blockBlobClient = blobServiceClient.getContainerClient(containerName).getBlockBlobClient(attachment.blobPath);

        return `${blockBlobClient.url}?${sasQueryParameters.toString()}`;
    }
}
