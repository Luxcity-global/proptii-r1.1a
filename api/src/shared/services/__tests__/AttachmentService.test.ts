/**
 * Unit tests for AttachmentService.
 *
 * The Azure Blob Storage SDK and Cosmos DB are fully mocked so these tests
 * run without any external infrastructure.
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
jest.mock('../../config/environment', () => ({
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
const mockCosmosRead = jest.fn();

jest.mock('@azure/cosmos', () => ({
    CosmosClient: jest.fn().mockImplementation(() => ({
        database: jest.fn(() => ({
            container: jest.fn(() => ({
                items: {
                    create: mockCosmosCreate,
                    query: jest.fn(() => ({ fetchAll: jest.fn().mockResolvedValue({ resources: [] }) })),
                },
                item: jest.fn(() => ({
                    read: mockCosmosRead,
                    replace: jest.fn(),
                    delete: jest.fn(),
                })),
            })),
        })),
    })),
}));

// ---------------------------------------------------------------------------
// Import service under test (after mocks are set up)
// ---------------------------------------------------------------------------
import { AttachmentService } from '../AttachmentService';
import { AppError } from '../../middleware/error-handling';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const makeBuffer = (size: number): Buffer => Buffer.alloc(size, 'a');

const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
] as const;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('AttachmentService', () => {
    let service: AttachmentService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new AttachmentService();
    });

    // -----------------------------------------------------------------------
    // uploadAttachment — MIME type validation (Requirement 7.2)
    // -----------------------------------------------------------------------
    describe('uploadAttachment — MIME type validation', () => {
        it('throws AppError 415 for an unsupported MIME type', async () => {
            await expect(
                service.uploadAttachment(
                    makeBuffer(100),
                    'file.exe',
                    'application/octet-stream',
                    100,
                    'user-1',
                    'conv-1',
                ),
            ).rejects.toMatchObject({
                statusCode: 415,
                code: 'UNSUPPORTED_MEDIA_TYPE',
            });
        });

        it('throws AppError 415 for image/png', async () => {
            await expect(
                service.uploadAttachment(
                    makeBuffer(100),
                    'photo.png',
                    'image/png',
                    100,
                    'user-1',
                    'conv-1',
                ),
            ).rejects.toMatchObject({
                statusCode: 415,
                code: 'UNSUPPORTED_MEDIA_TYPE',
            });
        });

        it('throws AppError 415 for an empty MIME type string', async () => {
            await expect(
                service.uploadAttachment(makeBuffer(100), 'file', '', 100, 'user-1', 'conv-1'),
            ).rejects.toMatchObject({
                statusCode: 415,
                code: 'UNSUPPORTED_MEDIA_TYPE',
            });
        });

        it.each(ALLOWED_MIME_TYPES)(
            'does NOT throw 415 for allowed MIME type: %s',
            async (mimeType) => {
                // Allow the upload to proceed (mock blob upload succeeds)
                mockUploadData.mockResolvedValueOnce(undefined);
                mockCosmosCreate.mockResolvedValueOnce({
                    resource: {
                        id: 'att-1',
                        conversationId: 'conv-1',
                        messageId: '',
                        uploaderId: 'user-1',
                        fileName: 'file',
                        mimeType,
                        sizeBytes: 100,
                        blobPath: 'conv-1/att-1/file',
                        uploadedAt: new Date().toISOString(),
                    },
                });

                await expect(
                    service.uploadAttachment(makeBuffer(100), 'file', mimeType, 100, 'user-1', 'conv-1'),
                ).resolves.not.toThrow();
            },
        );
    });

    // -----------------------------------------------------------------------
    // uploadAttachment — file size validation (Requirement 7.3)
    // -----------------------------------------------------------------------
    describe('uploadAttachment — file size validation', () => {
        it('throws AppError 413 when sizeBytes exceeds 10 MB', async () => {
            await expect(
                service.uploadAttachment(
                    makeBuffer(1),
                    'big.pdf',
                    'application/pdf',
                    10_485_761,
                    'user-1',
                    'conv-1',
                ),
            ).rejects.toMatchObject({
                statusCode: 413,
                code: 'FILE_TOO_LARGE',
            });
        });

        it('throws AppError 413 for a very large file', async () => {
            await expect(
                service.uploadAttachment(
                    makeBuffer(1),
                    'huge.pdf',
                    'application/pdf',
                    100_000_000,
                    'user-1',
                    'conv-1',
                ),
            ).rejects.toMatchObject({
                statusCode: 413,
                code: 'FILE_TOO_LARGE',
            });
        });

        it('does NOT throw 413 for exactly 10 MB', async () => {
            mockUploadData.mockResolvedValueOnce(undefined);
            mockCosmosCreate.mockResolvedValueOnce({
                resource: {
                    id: 'att-2',
                    conversationId: 'conv-1',
                    messageId: '',
                    uploaderId: 'user-1',
                    fileName: 'exact.pdf',
                    mimeType: 'application/pdf',
                    sizeBytes: 10_485_760,
                    blobPath: 'conv-1/att-2/exact.pdf',
                    uploadedAt: new Date().toISOString(),
                },
            });

            await expect(
                service.uploadAttachment(
                    makeBuffer(10_485_760),
                    'exact.pdf',
                    'application/pdf',
                    10_485_760,
                    'user-1',
                    'conv-1',
                ),
            ).resolves.not.toThrow();
        });
    });

    // -----------------------------------------------------------------------
    // uploadAttachment — successful upload persists metadata (Requirements 7.1, 7.6)
    // -----------------------------------------------------------------------
    describe('uploadAttachment — successful upload', () => {
        it('calls BlobServiceClient.fromConnectionString and uploads the buffer', async () => {
            mockUploadData.mockResolvedValueOnce(undefined);
            const now = new Date().toISOString();
            mockCosmosCreate.mockResolvedValueOnce({
                resource: {
                    id: 'att-3',
                    conversationId: 'conv-2',
                    messageId: '',
                    uploaderId: 'uploader-1',
                    fileName: 'doc.pdf',
                    mimeType: 'application/pdf',
                    sizeBytes: 1024,
                    blobPath: 'conv-2/att-3/doc.pdf',
                    uploadedAt: now,
                },
            });

            const result = await service.uploadAttachment(
                makeBuffer(1024),
                'doc.pdf',
                'application/pdf',
                1024,
                'uploader-1',
                'conv-2',
            );

            expect(mockFromConnectionString).toHaveBeenCalledTimes(1);
            expect(mockUploadData).toHaveBeenCalledTimes(1);
            expect(mockCosmosCreate).toHaveBeenCalledTimes(1);

            // Verify the persisted metadata matches the upload inputs
            const persistedDoc = mockCosmosCreate.mock.calls[0][0];
            expect(persistedDoc.fileName).toBe('doc.pdf');
            expect(persistedDoc.mimeType).toBe('application/pdf');
            expect(persistedDoc.sizeBytes).toBe(1024);
            expect(persistedDoc.uploaderId).toBe('uploader-1');
            expect(persistedDoc.conversationId).toBe('conv-2');

            // The returned document should match what Cosmos DB returned
            expect(result.id).toBe('att-3');
            expect(result.mimeType).toBe('application/pdf');
        });

        it('sets blobPath to {conversationId}/{attachmentId}/{fileName}', async () => {
            mockUploadData.mockResolvedValueOnce(undefined);
            mockCosmosCreate.mockImplementationOnce((doc: any) => ({
                resource: { ...doc },
            }));

            await service.uploadAttachment(
                makeBuffer(512),
                'agreement.pdf',
                'application/pdf',
                512,
                'user-x',
                'conv-abc',
            );

            const persistedDoc = mockCosmosCreate.mock.calls[0][0];
            // blobPath format: {conversationId}/{attachmentId}/{fileName}
            expect(persistedDoc.blobPath).toMatch(
                /^conv-abc\/[0-9a-f-]{36}\/agreement\.pdf$/,
            );
        });
    });

    // -----------------------------------------------------------------------
    // uploadAttachment — Blob Storage failure returns 502 without Cosmos DB record (Requirement 7.7)
    // -----------------------------------------------------------------------
    describe('uploadAttachment — Blob Storage failure', () => {
        it('throws AppError 502 when Blob Storage upload fails', async () => {
            mockUploadData.mockRejectedValueOnce(new Error('Network error'));

            await expect(
                service.uploadAttachment(
                    makeBuffer(100),
                    'file.pdf',
                    'application/pdf',
                    100,
                    'user-1',
                    'conv-1',
                ),
            ).rejects.toMatchObject({
                statusCode: 502,
                code: 'BLOB_UPLOAD_FAILED',
            });
        });

        it('does NOT create a Cosmos DB record when Blob Storage upload fails', async () => {
            mockUploadData.mockRejectedValueOnce(new Error('Storage unavailable'));

            try {
                await service.uploadAttachment(
                    makeBuffer(100),
                    'file.pdf',
                    'application/pdf',
                    100,
                    'user-1',
                    'conv-1',
                );
            } catch {
                // Expected to throw
            }

            expect(mockCosmosCreate).not.toHaveBeenCalled();
        });
    });

    // -----------------------------------------------------------------------
    // generateSasUrl (Requirements 7.4, 7.5)
    // -----------------------------------------------------------------------
    describe('generateSasUrl', () => {
        const mockAttachment = {
            id: 'att-sas',
            conversationId: 'conv-sas',
            messageId: 'msg-1',
            uploaderId: 'user-1',
            fileName: 'contract.pdf',
            mimeType: 'application/pdf',
            sizeBytes: 2048,
            blobPath: 'conv-sas/att-sas/contract.pdf',
            uploadedAt: new Date().toISOString(),
        };

        it('returns a URL string containing the SAS query parameters', async () => {
            mockCosmosRead.mockResolvedValueOnce({ resource: mockAttachment });

            const url = await service.generateSasUrl('att-sas', 'conv-sas');

            expect(typeof url).toBe('string');
            expect(url).toContain('sv=2021');
        });

        it('calls generateBlobSASQueryParameters with read permission and correct expiry', async () => {
            mockCosmosRead.mockResolvedValueOnce({ resource: mockAttachment });

            const { generateBlobSASQueryParameters, BlobSASPermissions } =
                jest.requireMock('@azure/storage-blob');

            await service.generateSasUrl('att-sas', 'conv-sas');

            expect(generateBlobSASQueryParameters).toHaveBeenCalledTimes(1);
            expect(BlobSASPermissions.parse).toHaveBeenCalledWith('r');

            const [sasParams] = generateBlobSASQueryParameters.mock.calls[0];
            expect(sasParams.blobName).toBe(mockAttachment.blobPath);
            expect(sasParams.containerName).toBe('message-attachments');
            // Expiry should be approximately now + 3600 seconds
            const expectedExpiry = Date.now() + 3600 * 1000;
            expect(Math.abs(sasParams.expiresOn.getTime() - expectedExpiry)).toBeLessThan(5000);
        });

        it('throws AppError 404 when attachment is not found', async () => {
            mockCosmosRead.mockResolvedValueOnce({ resource: undefined });

            await expect(service.generateSasUrl('missing-att', 'conv-sas')).rejects.toMatchObject({
                statusCode: 404,
            });
        });
    });
});
