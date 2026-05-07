/**
 * Property-based tests for AttachmentService.
 *
 * Feature: proptii-communication
 * Properties 12, 13, 14 — Attachment MIME type validation, file size validation,
 * and upload round-trip metadata persistence.
 */

// ---------------------------------------------------------------------------
// Mock @azure/storage-blob before importing the service under test
// ---------------------------------------------------------------------------
const mockUploadData = jest.fn();
const mockGetBlockBlobClient = jest.fn(() => ({
    uploadData: mockUploadData,
    url: 'https://mockaccount.blob.core.windows.net/message-attachments/conv1/att1/file.pdf',
}));
const mockGetContainerClient = jest.fn(() => ({
    getBlockBlobClient: mockGetBlockBlobClient,
}));
const mockFromConnectionString = jest.fn(() => ({
    getContainerClient: mockGetContainerClient,
}));

jest.mock('@azure/storage-blob', () => ({
    BlobServiceClient: {
        fromConnectionString: mockFromConnectionString,
    },
    StorageSharedKeyCredential: jest.fn().mockImplementation(() => ({})),
    generateBlobSASQueryParameters: jest.fn(() => ({
        toString: () => 'sv=2021&se=...&sig=abc',
    })),
    BlobSASPermissions: {
        parse: jest.fn(() => ({})),
    },
}));

// ---------------------------------------------------------------------------
// Mock environment config
// ---------------------------------------------------------------------------
jest.mock('../../../config/environment', () => ({
    validateEnv: jest.fn(() => ({
        NODE_ENV: 'test',
        FUNCTIONS_WORKER_RUNTIME: 'node',
        AzureWebJobsStorage: 'UseDevelopmentStorage=true',
        COSMOS_DB_CONNECTION_STRING: 'https://localhost:8081',
        COSMOS_DB_KEY: 'test-key',
        COSMOS_DB_DATABASE_NAME: 'proptii',
        AZURE_AD_B2C_TENANT_NAME: 'test',
        AZURE_AD_B2C_CLIENT_ID: 'test',
        AZURE_AD_B2C_POLICY_NAME: 'test',
        AZURE_AD_B2C_ISSUER: 'https://test.b2clogin.com/test',
        APPINSIGHTS_INSTRUMENTATIONKEY: 'test',
        API_PREFIX: '/api',
        ALLOWED_ORIGINS: 'http://localhost:3000',
        BLOB_STORAGE_CONNECTION_STRING:
            'DefaultEndpointsProtocol=https;AccountName=mockaccount;AccountKey=bW9ja2tleQ==;EndpointSuffix=core.windows.net',
        BLOB_STORAGE_CONTAINER_NAME: 'message-attachments',
        ATTACHMENT_SAS_EXPIRY_SECONDS: 3600,
        EMAIL_FROM_ADDRESS: 'noreply@proptii.co.uk',
        ACTIVE_USER_THRESHOLD_SECONDS: 300,
        EMAIL_DEDUP_WINDOW_SECONDS: 900,
    })),
}));

// ---------------------------------------------------------------------------
// Mock Cosmos DB (via BaseService internals)
// ---------------------------------------------------------------------------
const mockCosmosCreate = jest.fn();

jest.mock('@azure/cosmos', () => ({
    CosmosClient: jest.fn().mockImplementation(() => ({
        database: jest.fn(() => ({
            container: jest.fn(() => ({
                items: {
                    create: mockCosmosCreate,
                    query: jest.fn(() => ({
                        fetchAll: jest.fn().mockResolvedValue({ resources: [] }),
                    })),
                },
                item: jest.fn(() => ({
                    read: jest.fn(),
                    replace: jest.fn(),
                    delete: jest.fn(),
                })),
            })),
        })),
    })),
}));

// ---------------------------------------------------------------------------
// Import service and fast-check after mocks
// ---------------------------------------------------------------------------
import * as fc from 'fast-check';
import { AttachmentService } from '../../AttachmentService';
import { AppError } from '../../../middleware/error-handling';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
] as const;

const MAX_FILE_SIZE_BYTES = 10_485_760;

// ---------------------------------------------------------------------------
// Property 12: Attachment MIME type validation
// Validates: Requirements 7.2
// ---------------------------------------------------------------------------
describe('Property 12: Attachment MIME type validation', () => {
    let service: AttachmentService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new AttachmentService();
    });

    it('returns HTTP 415 for every disallowed MIME type', async () => {
        // Arbitrary string that is not one of the four allowed MIME types
        const disallowedMimeType = fc.string().filter(
            (s) => !ALLOWED_MIME_TYPES.includes(s as (typeof ALLOWED_MIME_TYPES)[number]),
        );

        await fc.assert(
            fc.asyncProperty(disallowedMimeType, async (mimeType) => {
                let thrownError: unknown;
                try {
                    await service.uploadAttachment(
                        Buffer.alloc(100, 'a'),
                        'file.bin',
                        mimeType,
                        100,
                        'user-1',
                        'conv-1',
                    );
                } catch (err) {
                    thrownError = err;
                }

                expect(thrownError).toBeInstanceOf(AppError);
                expect((thrownError as AppError).statusCode).toBe(415);
                expect((thrownError as AppError).code).toBe('UNSUPPORTED_MEDIA_TYPE');
            }),
            { numRuns: 25 },
        );
    });
});

// ---------------------------------------------------------------------------
// Property 13: Attachment file size validation
// Validates: Requirements 7.3
// ---------------------------------------------------------------------------
describe('Property 13: Attachment file size validation', () => {
    let service: AttachmentService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new AttachmentService();
    });

    it('returns HTTP 413 for every file size exceeding 10 MB', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.integer({ min: MAX_FILE_SIZE_BYTES + 1, max: 100_000_000 }),
                async (sizeBytes) => {
                    let thrownError: unknown;
                    try {
                        await service.uploadAttachment(
                            Buffer.alloc(1, 'a'),
                            'big.pdf',
                            'application/pdf',
                            sizeBytes,
                            'user-1',
                            'conv-1',
                        );
                    } catch (err) {
                        thrownError = err;
                    }

                    expect(thrownError).toBeInstanceOf(AppError);
                    expect((thrownError as AppError).statusCode).toBe(413);
                    expect((thrownError as AppError).code).toBe('FILE_TOO_LARGE');
                },
            ),
            { numRuns: 25 },
        );
    });

    it('proceeds past size validation for every valid file size (1 to 10 MB)', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.integer({ min: 1, max: MAX_FILE_SIZE_BYTES }),
                async (sizeBytes) => {
                    jest.clearAllMocks();
                    // Allow blob upload to succeed
                    mockUploadData.mockResolvedValueOnce(undefined);
                    // Return a valid Cosmos DB document
                    mockCosmosCreate.mockResolvedValueOnce({
                        resource: {
                            id: 'att-valid',
                            conversationId: 'conv-1',
                            messageId: '',
                            uploaderId: 'user-1',
                            fileName: 'file.pdf',
                            mimeType: 'application/pdf',
                            sizeBytes,
                            blobPath: `conv-1/att-valid/file.pdf`,
                            uploadedAt: new Date().toISOString(),
                        },
                    });

                    // Should not throw a FILE_TOO_LARGE error
                    let caughtError: unknown;
                    try {
                        await service.uploadAttachment(
                            Buffer.alloc(1, 'a'),
                            'file.pdf',
                            'application/pdf',
                            sizeBytes,
                            'user-1',
                            'conv-1',
                        );
                    } catch (err) {
                        caughtError = err;
                    }

                    // If an error was thrown, it must NOT be FILE_TOO_LARGE
                    if (caughtError instanceof AppError) {
                        expect((caughtError as AppError).code).not.toBe('FILE_TOO_LARGE');
                    }
                },
            ),
            { numRuns: 25 },
        );
    });
});

// ---------------------------------------------------------------------------
// Property 14: Attachment upload round-trip persists metadata
// Validates: Requirements 7.6
// ---------------------------------------------------------------------------
describe('Property 14: Attachment upload round-trip persists metadata', () => {
    let service: AttachmentService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new AttachmentService();
    });

    it('stores metadata matching the upload inputs exactly', async () => {
        const validMimeType = fc.constantFrom(...ALLOWED_MIME_TYPES);
        const validSizeBytes = fc.integer({ min: 1, max: MAX_FILE_SIZE_BYTES });
        const nonEmptyString = fc.string({ minLength: 1, maxLength: 100 });
        const uuidArb = fc.uuid();

        await fc.assert(
            fc.asyncProperty(
                fc.record({
                    fileName: nonEmptyString,
                    mimeType: validMimeType,
                    sizeBytes: validSizeBytes,
                    uploaderId: uuidArb,
                    conversationId: uuidArb,
                }),
                async ({ fileName, mimeType, sizeBytes, uploaderId, conversationId }) => {
                    jest.clearAllMocks();
                    mockUploadData.mockResolvedValueOnce(undefined);

                    // Cosmos DB returns the document that was passed to create()
                    mockCosmosCreate.mockImplementationOnce((doc: unknown) => ({
                        resource: { ...(doc as object) },
                    }));

                    await service.uploadAttachment(
                        Buffer.alloc(1, 'a'),
                        fileName,
                        mimeType,
                        sizeBytes,
                        uploaderId,
                        conversationId,
                    );

                    // Verify the document passed to Cosmos DB has the correct metadata
                    expect(mockCosmosCreate).toHaveBeenCalledTimes(1);
                    const persistedDoc = mockCosmosCreate.mock.calls[0][0];

                    expect(persistedDoc.fileName).toBe(fileName);
                    expect(persistedDoc.mimeType).toBe(mimeType);
                    expect(persistedDoc.sizeBytes).toBe(sizeBytes);
                    expect(persistedDoc.uploaderId).toBe(uploaderId);
                    expect(persistedDoc.conversationId).toBe(conversationId);
                },
            ),
            { numRuns: 25 },
        );
    });
});
