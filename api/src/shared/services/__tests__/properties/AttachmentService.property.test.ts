/**
 * Property-based tests for AttachmentService — MongoDB version.
 */

const mockUploadData = jest.fn();
const mockGetBlockBlobClient = jest.fn(() => ({ uploadData: mockUploadData, url: 'https://mockaccount.blob.core.windows.net/message-attachments/conv1/att1/file.pdf' }));
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

jest.mock('../../../models/messaging.models', () => ({
    MessageAttachmentModel: { create: mockAttachmentCreate, findOne: jest.fn() },
    ConversationModel: { findOne: jest.fn(), find: jest.fn(), create: jest.fn(), findOneAndUpdate: jest.fn() },
    MessageModel: { find: jest.fn(), create: jest.fn(), findOneAndUpdate: jest.fn(), countDocuments: jest.fn() },
    ConversationParticipantModel: { find: jest.fn(), create: jest.fn() },
    AuditLogModel: { create: jest.fn() },
    NotificationLogModel: { findOne: jest.fn(), create: jest.fn() },
    UserModel: { findOne: jest.fn(), findOneAndUpdate: jest.fn() },
}));

jest.mock('../../../config/mongodb', () => ({ getMongoConnection: jest.fn().mockResolvedValue({}) }));
jest.mock('../../../config/environment', () => ({
    validateEnv: jest.fn(() => ({
        MONGODB_URI: 'mongodb://localhost:27017', MONGODB_DB_NAME: 'test',
        BLOB_STORAGE_CONNECTION_STRING: 'DefaultEndpointsProtocol=https;AccountName=mockaccount;AccountKey=bW9ja2tleQ==;EndpointSuffix=core.windows.net',
        BLOB_STORAGE_CONTAINER_NAME: 'message-attachments',
        ATTACHMENT_SAS_EXPIRY_SECONDS: 3600,
    })),
}));

import * as fc from 'fast-check';
import { AttachmentService } from '../../AttachmentService';
import { AppError } from '../../../middleware/error-handling';

const ALLOWED_MIME_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'] as const;
const MAX_FILE_SIZE_BYTES = 10_485_760;

describe('Property 12: Attachment MIME type validation', () => {
    let service: AttachmentService;
    beforeEach(() => { jest.clearAllMocks(); service = new AttachmentService(); });

    it('returns HTTP 415 for every disallowed MIME type', async () => {
        await fc.assert(fc.asyncProperty(
            fc.string().filter(s => !ALLOWED_MIME_TYPES.includes(s as any)),
            async (mimeType) => {
                let thrownError: unknown;
                try { await service.uploadAttachment(Buffer.alloc(100, 'a'), 'file.bin', mimeType, 100, 'user-1', 'conv-1'); }
                catch (err) { thrownError = err; }
                expect(thrownError).toBeInstanceOf(AppError);
                expect((thrownError as AppError).statusCode).toBe(415);
                expect((thrownError as AppError).code).toBe('UNSUPPORTED_MEDIA_TYPE');
            },
        ), { numRuns: 25 });
    });
});

describe('Property 13: Attachment file size validation', () => {
    let service: AttachmentService;
    beforeEach(() => { jest.clearAllMocks(); service = new AttachmentService(); });

    it('returns HTTP 413 for every file size exceeding 10 MB', async () => {
        await fc.assert(fc.asyncProperty(
            fc.integer({ min: MAX_FILE_SIZE_BYTES + 1, max: 100_000_000 }),
            async (sizeBytes) => {
                let thrownError: unknown;
                try { await service.uploadAttachment(Buffer.alloc(1, 'a'), 'big.pdf', 'application/pdf', sizeBytes, 'user-1', 'conv-1'); }
                catch (err) { thrownError = err; }
                expect(thrownError).toBeInstanceOf(AppError);
                expect((thrownError as AppError).statusCode).toBe(413);
                expect((thrownError as AppError).code).toBe('FILE_TOO_LARGE');
            },
        ), { numRuns: 25 });
    });

    it('proceeds past size validation for every valid file size (1 to 10 MB)', async () => {
        await fc.assert(fc.asyncProperty(
            fc.integer({ min: 1, max: MAX_FILE_SIZE_BYTES }),
            async (sizeBytes) => {
                jest.clearAllMocks();
                mockUploadData.mockResolvedValueOnce(undefined);
                mockAttachmentCreate.mockResolvedValueOnce({});
                let caughtError: unknown;
                try { await service.uploadAttachment(Buffer.alloc(1, 'a'), 'file.pdf', 'application/pdf', sizeBytes, 'user-1', 'conv-1'); }
                catch (err) { caughtError = err; }
                if (caughtError instanceof AppError) { expect((caughtError as AppError).code).not.toBe('FILE_TOO_LARGE'); }
            },
        ), { numRuns: 25 });
    });
});

describe('Property 14: Attachment upload round-trip persists metadata', () => {
    let service: AttachmentService;
    beforeEach(() => { jest.clearAllMocks(); service = new AttachmentService(); });

    it('stores metadata matching the upload inputs exactly', async () => {
        await fc.assert(fc.asyncProperty(
            fc.record({ fileName: fc.string({ minLength: 1, maxLength: 100 }), mimeType: fc.constantFrom(...ALLOWED_MIME_TYPES), sizeBytes: fc.integer({ min: 1, max: MAX_FILE_SIZE_BYTES }), uploaderId: fc.uuid(), conversationId: fc.uuid() }),
            async ({ fileName, mimeType, sizeBytes, uploaderId, conversationId }) => {
                jest.clearAllMocks();
                mockUploadData.mockResolvedValueOnce(undefined);
                mockAttachmentCreate.mockResolvedValueOnce({});

                await service.uploadAttachment(Buffer.alloc(1, 'a'), fileName, mimeType, sizeBytes, uploaderId, conversationId);

                expect(mockAttachmentCreate).toHaveBeenCalledTimes(1);
                const persistedDoc = mockAttachmentCreate.mock.calls[0][0];
                expect(persistedDoc.fileName).toBe(fileName);
                expect(persistedDoc.mimeType).toBe(mimeType);
                expect(persistedDoc.sizeBytes).toBe(sizeBytes);
                expect(persistedDoc.uploaderId).toBe(uploaderId);
                expect(persistedDoc.conversationId).toBe(conversationId);
            },
        ), { numRuns: 25 });
    });
});
