/**
 * Unit tests for AttachmentService — MongoDB version.
 */

const mockUploadData = jest.fn();
const mockGetBlockBlobClient = jest.fn(() => ({
    uploadData: mockUploadData,
    url: 'https://mockaccount.blob.core.windows.net/message-attachments/conv1/att1/file.pdf',
}));
const mockGetContainerClient = jest.fn(() => ({ 
    getBlockBlobClient: mockGetBlockBlobClient,
    createIfNotExists: jest.fn().mockResolvedValue({}) 
}));
const mockFromConnectionString = jest.fn(() => ({ getContainerClient: mockGetContainerClient }));

jest.mock('@azure/storage-blob', () => ({
    BlobServiceClient: { fromConnectionString: mockFromConnectionString },
    StorageSharedKeyCredential: jest.fn().mockImplementation(() => ({})),
    generateBlobSASQueryParameters: jest.fn(() => ({ toString: () => 'sv=2021&se=...&sig=abc' })),
    BlobSASPermissions: { parse: jest.fn(() => ({})) },
}));

const mockAttachmentCreate = jest.fn();
const mockAttachmentFindOne = jest.fn();

jest.mock('../../models/messaging.models', () => ({
    MessageAttachmentModel: {
        create: mockAttachmentCreate,
        findOne: mockAttachmentFindOne,
    },
    ConversationModel: { findOne: jest.fn(), find: jest.fn(), create: jest.fn(), findOneAndUpdate: jest.fn() },
    MessageModel: { find: jest.fn(), create: jest.fn(), findOneAndUpdate: jest.fn(), countDocuments: jest.fn() },
    ConversationParticipantModel: { find: jest.fn(), create: jest.fn() },
    AuditLogModel: { create: jest.fn() },
    NotificationLogModel: { findOne: jest.fn(), create: jest.fn() },
    UserModel: { findOne: jest.fn(), findOneAndUpdate: jest.fn() },
}));

jest.mock('../../config/mongodb', () => ({
    getMongoConnection: jest.fn().mockResolvedValue({}),
}));

jest.mock('../../config/environment', () => ({
    validateEnv: jest.fn(() => ({
        MONGODB_URI: 'mongodb://localhost:27017',
        MONGODB_DB_NAME: 'test',
        BLOB_STORAGE_CONNECTION_STRING: 'DefaultEndpointsProtocol=https;AccountName=mockaccount;AccountKey=bW9ja2tleQ==;EndpointSuffix=core.windows.net',
        BLOB_STORAGE_CONTAINER_NAME: 'message-attachments',
        ATTACHMENT_SAS_EXPIRY_SECONDS: 3600,
    })),
}));

import { AttachmentService } from '../AttachmentService';
import { AppError } from '../../middleware/error-handling';

function lean<T>(value: T) { return { lean: () => value }; }

const makeBuffer = (size: number): Buffer => Buffer.alloc(size, 'a');

const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
] as const;

describe('AttachmentService', () => {
    let service: AttachmentService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new AttachmentService();
    });

    describe('uploadAttachment — MIME type validation', () => {
        it('throws AppError 415 for an unsupported MIME type', async () => {
            await expect(
                service.uploadAttachment(makeBuffer(100), 'file.exe', 'application/octet-stream', 100, 'user-1', 'conv-1'),
            ).rejects.toMatchObject({ statusCode: 415, code: 'UNSUPPORTED_MEDIA_TYPE' });
        });

        it('throws AppError 415 for image/png', async () => {
            await expect(
                service.uploadAttachment(makeBuffer(100), 'photo.png', 'image/png', 100, 'user-1', 'conv-1'),
            ).rejects.toMatchObject({ statusCode: 415, code: 'UNSUPPORTED_MEDIA_TYPE' });
        });

        it('throws AppError 415 for an empty MIME type string', async () => {
            await expect(
                service.uploadAttachment(makeBuffer(100), 'file', '', 100, 'user-1', 'conv-1'),
            ).rejects.toMatchObject({ statusCode: 415, code: 'UNSUPPORTED_MEDIA_TYPE' });
        });

        it.each(ALLOWED_MIME_TYPES)('does NOT throw 415 for allowed MIME type: %s', async (mimeType) => {
            mockUploadData.mockResolvedValueOnce(undefined);
            mockAttachmentCreate.mockResolvedValueOnce({});
            await expect(
                service.uploadAttachment(makeBuffer(100), 'file', mimeType, 100, 'user-1', 'conv-1'),
            ).resolves.not.toThrow();
        });
    });

    describe('uploadAttachment — file size validation', () => {
        it('throws AppError 413 when sizeBytes exceeds 10 MB', async () => {
            await expect(
                service.uploadAttachment(makeBuffer(1), 'big.pdf', 'application/pdf', 10_485_761, 'user-1', 'conv-1'),
            ).rejects.toMatchObject({ statusCode: 413, code: 'FILE_TOO_LARGE' });
        });

        it('does NOT throw 413 for exactly 10 MB', async () => {
            mockUploadData.mockResolvedValueOnce(undefined);
            mockAttachmentCreate.mockResolvedValueOnce({});
            await expect(
                service.uploadAttachment(makeBuffer(10_485_760), 'exact.pdf', 'application/pdf', 10_485_760, 'user-1', 'conv-1'),
            ).resolves.not.toThrow();
        });
    });

    describe('uploadAttachment — successful upload', () => {
        it('calls BlobServiceClient.fromConnectionString and uploads the buffer', async () => {
            mockUploadData.mockResolvedValueOnce(undefined);
            mockAttachmentCreate.mockResolvedValueOnce({});

            const result = await service.uploadAttachment(makeBuffer(1024), 'doc.pdf', 'application/pdf', 1024, 'uploader-1', 'conv-2');

            expect(mockFromConnectionString).toHaveBeenCalledTimes(1);
            expect(mockUploadData).toHaveBeenCalledTimes(1);
            expect(mockAttachmentCreate).toHaveBeenCalledTimes(1);

            expect(result.fileName).toBe('doc.pdf');
            expect(result.mimeType).toBe('application/pdf');
            expect(result.sizeBytes).toBe(1024);
            expect(result.uploaderId).toBe('uploader-1');
            expect(result.conversationId).toBe('conv-2');
        });

        it('sets blobPath to {conversationId}/{attachmentId}/{fileName}', async () => {
            mockUploadData.mockResolvedValueOnce(undefined);
            mockAttachmentCreate.mockResolvedValueOnce({});

            await service.uploadAttachment(makeBuffer(512), 'agreement.pdf', 'application/pdf', 512, 'user-x', 'conv-abc');

            const persistedDoc = mockAttachmentCreate.mock.calls[0][0];
            expect(persistedDoc.blobPath).toMatch(/^conv-abc\/[0-9a-f-]{36}\/agreement\.pdf$/);
        });
    });

    describe('uploadAttachment — Blob Storage failure', () => {
        it('throws AppError 502 when Blob Storage upload fails', async () => {
            mockUploadData.mockRejectedValueOnce(new Error('Network error'));
            await expect(
                service.uploadAttachment(makeBuffer(100), 'file.pdf', 'application/pdf', 100, 'user-1', 'conv-1'),
            ).rejects.toMatchObject({ statusCode: 502, code: 'BLOB_UPLOAD_FAILED' });
        });

        it('does NOT create a MongoDB record when Blob Storage upload fails', async () => {
            mockUploadData.mockRejectedValueOnce(new Error('Storage unavailable'));
            try {
                await service.uploadAttachment(makeBuffer(100), 'file.pdf', 'application/pdf', 100, 'user-1', 'conv-1');
            } catch { /* expected */ }
            expect(mockAttachmentCreate).not.toHaveBeenCalled();
        });
    });

    describe('generateSasUrl', () => {
        const mockAttachment = {
            id: 'att-sas', conversationId: 'conv-sas', messageId: 'msg-1',
            uploaderId: 'user-1', fileName: 'contract.pdf', mimeType: 'application/pdf',
            sizeBytes: 2048, blobPath: 'conv-sas/att-sas/contract.pdf', uploadedAt: new Date().toISOString(),
        };

        it('returns a URL string containing the SAS query parameters', async () => {
            mockAttachmentFindOne.mockReturnValue(lean(mockAttachment));
            const url = await service.generateSasUrl('att-sas', 'conv-sas');
            expect(typeof url).toBe('string');
            expect(url).toContain('sv=2021');
        });

        it('throws AppError 404 when attachment is not found', async () => {
            mockAttachmentFindOne.mockReturnValue(lean(null));
            await expect(service.generateSasUrl('missing-att', 'conv-sas')).rejects.toMatchObject({ statusCode: 404 });
        });
    });
});
