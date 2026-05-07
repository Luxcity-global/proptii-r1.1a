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

/**
 * The four MIME types permitted for message attachments.
 */
const ALLOWED_MIME_TYPES = new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
]);

/** Maximum permitted file size in bytes (10 MB). */
const MAX_FILE_SIZE_BYTES = 10_485_760;

/**
 * Service for uploading message attachments to Azure Blob Storage and
 * persisting metadata in the `message_attachments` Cosmos DB container.
 *
 * @container message_attachments
 * @partitionKey /conversationId
 */
export class AttachmentService extends BaseService {
    constructor() {
        super('message_attachments');
    }

    /**
     * Validates, uploads, and persists a file attachment.
     *
     * Validation order:
     *  1. MIME type must be one of the four allowed values (HTTP 415).
     *  2. File size must not exceed 10 MB (HTTP 413).
     *  3. Upload to Azure Blob Storage (HTTP 502 on failure — no Cosmos DB record created).
     *  4. Persist metadata in `message_attachments` and return the document.
     *
     * @param file         Raw file buffer to upload.
     * @param fileName     Original file name (used in the blob path).
     * @param mimeType     MIME type declared by the caller.
     * @param sizeBytes    File size in bytes.
     * @param uploaderId   ID of the user performing the upload.
     * @param conversationId  Conversation the attachment belongs to (partition key).
     */
    async uploadAttachment(
        file: Buffer,
        fileName: string,
        mimeType: string,
        sizeBytes: number,
        uploaderId: string,
        conversationId: string,
    ): Promise<MessageAttachment> {
        // 1. Validate MIME type
        if (!ALLOWED_MIME_TYPES.has(mimeType)) {
            throw new AppError(
                415,
                `Unsupported media type: ${mimeType}. Allowed types are: ${[...ALLOWED_MIME_TYPES].join(', ')}`,
                'UNSUPPORTED_MEDIA_TYPE',
            );
        }

        // 2. Validate file size
        if (sizeBytes > MAX_FILE_SIZE_BYTES) {
            throw new AppError(
                413,
                `File size ${sizeBytes} bytes exceeds the maximum allowed size of ${MAX_FILE_SIZE_BYTES} bytes (10 MB)`,
                'FILE_TOO_LARGE',
            );
        }

        const config = validateEnv();

        if (!config.BLOB_STORAGE_CONNECTION_STRING) {
            throw new AppError(
                500,
                'Blob Storage is not configured: BLOB_STORAGE_CONNECTION_STRING is missing',
                'BLOB_STORAGE_NOT_CONFIGURED',
            );
        }

        const containerName =
            config.BLOB_STORAGE_CONTAINER_NAME ?? 'message-attachments';

        const attachmentId = crypto.randomUUID();
        const blobPath = `${conversationId}/${attachmentId}/${fileName}`;

        // 3. Upload to Azure Blob Storage — do NOT create a Cosmos DB record on failure
        try {
            const blobServiceClient = BlobServiceClient.fromConnectionString(
                config.BLOB_STORAGE_CONNECTION_STRING,
            );
            const containerClient = blobServiceClient.getContainerClient(containerName);
            const blockBlobClient = containerClient.getBlockBlobClient(blobPath);

            await blockBlobClient.uploadData(file, {
                blobHTTPHeaders: { blobContentType: mimeType },
            });
        } catch (error) {
            throw new AppError(
                502,
                'Failed to upload file to Blob Storage',
                'BLOB_UPLOAD_FAILED',
            );
        }

        // 4. Persist metadata in Cosmos DB
        const now = new Date().toISOString();
        const attachment: MessageAttachment = {
            id: attachmentId,
            conversationId,
            messageId: '', // Will be set when the message is created
            uploaderId,
            fileName,
            mimeType,
            sizeBytes,
            blobPath,
            uploadedAt: now,
        };

        return this.create<MessageAttachment>(attachment);
    }

    /**
     * Generates a time-limited SAS URL for the given attachment.
     *
     * The expiry is read from `ATTACHMENT_SAS_EXPIRY_SECONDS` (default: 3600 s).
     *
     * @param attachmentId   ID of the attachment document.
     * @param conversationId Partition key for the `message_attachments` container.
     * @returns A fully-qualified SAS URL string.
     */
    async generateSasUrl(attachmentId: string, conversationId: string): Promise<string> {
        // Retrieve attachment metadata (throws 404 via BaseService if not found)
        const attachment = await this.getById<MessageAttachment>(attachmentId, conversationId);

        const config = validateEnv();

        if (!config.BLOB_STORAGE_CONNECTION_STRING) {
            throw new AppError(
                500,
                'Blob Storage is not configured: BLOB_STORAGE_CONNECTION_STRING is missing',
                'BLOB_STORAGE_NOT_CONFIGURED',
            );
        }

        const containerName =
            config.BLOB_STORAGE_CONTAINER_NAME ?? 'message-attachments';

        const expirySeconds = config.ATTACHMENT_SAS_EXPIRY_SECONDS;
        const expiresOn = new Date(Date.now() + expirySeconds * 1000);

        // Parse account name and key from the connection string
        const accountNameMatch = config.BLOB_STORAGE_CONNECTION_STRING.match(
            /AccountName=([^;]+)/,
        );
        const accountKeyMatch = config.BLOB_STORAGE_CONNECTION_STRING.match(
            /AccountKey=([^;]+)/,
        );

        if (!accountNameMatch || !accountKeyMatch) {
            throw new AppError(
                500,
                'Invalid Blob Storage connection string: cannot extract account credentials',
                'BLOB_STORAGE_CONFIG_ERROR',
            );
        }

        const accountName = accountNameMatch[1];
        const accountKey = accountKeyMatch[1];

        const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);

        const sasQueryParameters = generateBlobSASQueryParameters(
            {
                containerName,
                blobName: attachment.blobPath,
                permissions: BlobSASPermissions.parse('r'),
                expiresOn,
            },
            sharedKeyCredential,
        );

        const blobServiceClient = BlobServiceClient.fromConnectionString(
            config.BLOB_STORAGE_CONNECTION_STRING,
        );
        const containerClient = blobServiceClient.getContainerClient(containerName);
        const blockBlobClient = containerClient.getBlockBlobClient(attachment.blobPath);

        return `${blockBlobClient.url}?${sasQueryParameters.toString()}`;
    }
}
