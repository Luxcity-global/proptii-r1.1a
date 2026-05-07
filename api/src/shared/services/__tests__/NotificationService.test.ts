/**
 * Unit tests for NotificationService.
 *
 * nodemailer and Cosmos DB are fully mocked so these tests run without
 * any external infrastructure.
 */

// ---------------------------------------------------------------------------
// Mock nodemailer before importing the service under test
// ---------------------------------------------------------------------------
const mockSendMail = jest.fn();
const mockCreateTransport = jest.fn(() => ({
    sendMail: mockSendMail,
}));

jest.mock('nodemailer', () => ({
    createTransport: mockCreateTransport,
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
        BLOB_STORAGE_CONNECTION_STRING: 'DefaultEndpointsProtocol=https;AccountName=mock;AccountKey=bW9jaw==;EndpointSuffix=core.windows.net',
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
const mockCosmosReplace = jest.fn();
const mockCosmosQuery = jest.fn();

const mockItemFn = jest.fn(() => ({
    read: mockCosmosRead,
    replace: mockCosmosReplace,
    delete: jest.fn(),
}));

jest.mock('@azure/cosmos', () => ({
    CosmosClient: jest.fn().mockImplementation(() => ({
        database: jest.fn(() => ({
            container: jest.fn(() => ({
                items: {
                    create: mockCosmosCreate,
                    query: jest.fn(() => ({
                        fetchAll: mockCosmosQuery,
                    })),
                },
                item: mockItemFn,
            })),
        })),
    })),
}));

// ---------------------------------------------------------------------------
// Import service under test (after mocks are set up)
// ---------------------------------------------------------------------------
import { NotificationService } from '../NotificationService';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const makeUser = (overrides: Partial<{ lastSeenAt: string; email: string }> = {}) => ({
    id: 'user-1',
    email: 'recipient@example.com',
    firstName: 'Alice',
    lastName: 'Smith',
    ...overrides,
});

const ACTIVE_THRESHOLD_SECONDS = 300;
const DEDUP_WINDOW_SECONDS = 900;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('NotificationService', () => {
    let service: NotificationService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new NotificationService();
        // Default: no dedup entries found
        mockCosmosQuery.mockResolvedValue({ resources: [] });
        // Default: sendMail succeeds
        mockSendMail.mockResolvedValue({ messageId: 'test-id' });
        // Default: Cosmos create succeeds
        mockCosmosCreate.mockResolvedValue({ resource: { id: 'log-1' } });
    });

    // -----------------------------------------------------------------------
    // notify — active user suppression (Requirement 9.2)
    // -----------------------------------------------------------------------
    describe('notify — active user suppression', () => {
        it('does NOT send email when lastSeenAt is within the active threshold', async () => {
            const recentLastSeen = new Date(Date.now() - 60 * 1000).toISOString(); // 60 seconds ago
            mockCosmosRead.mockResolvedValue({ resource: makeUser({ lastSeenAt: recentLastSeen }) });

            await service.notify('user-1', 'conv-1', 'Bob');

            expect(mockSendMail).not.toHaveBeenCalled();
        });

        it('does NOT create a notification_log entry when recipient is active', async () => {
            const recentLastSeen = new Date(Date.now() - 60 * 1000).toISOString();
            mockCosmosRead.mockResolvedValue({ resource: makeUser({ lastSeenAt: recentLastSeen }) });

            await service.notify('user-1', 'conv-1', 'Bob');

            expect(mockCosmosCreate).not.toHaveBeenCalled();
        });

        it('sends email when lastSeenAt is older than the active threshold', async () => {
            const oldLastSeen = new Date(Date.now() - (ACTIVE_THRESHOLD_SECONDS + 60) * 1000).toISOString();
            mockCosmosRead.mockResolvedValue({ resource: makeUser({ lastSeenAt: oldLastSeen }) });

            await service.notify('user-1', 'conv-1', 'Bob');

            expect(mockSendMail).toHaveBeenCalledTimes(1);
        });

        it('sends email when lastSeenAt is undefined (user never seen)', async () => {
            mockCosmosRead.mockResolvedValue({ resource: makeUser({ lastSeenAt: undefined }) });

            await service.notify('user-1', 'conv-1', 'Bob');

            expect(mockSendMail).toHaveBeenCalledTimes(1);
        });
    });

    // -----------------------------------------------------------------------
    // notify — dedup window suppression (Requirement 9.5)
    // -----------------------------------------------------------------------
    describe('notify — dedup window suppression', () => {
        it('does NOT send email when a dedup entry exists within the window', async () => {
            const oldLastSeen = new Date(Date.now() - (ACTIVE_THRESHOLD_SECONDS + 60) * 1000).toISOString();
            mockCosmosRead.mockResolvedValue({ resource: makeUser({ lastSeenAt: oldLastSeen }) });

            // Simulate an existing dedup entry
            mockCosmosQuery.mockResolvedValue({
                resources: [
                    {
                        id: 'existing-log',
                        recipientId: 'user-1',
                        conversationId: 'conv-1',
                        channel: 'email',
                        sentAt: new Date(Date.now() - 60 * 1000).toISOString(),
                        dedupKey: 'user-1:conv-1',
                    },
                ],
            });

            await service.notify('user-1', 'conv-1', 'Bob');

            expect(mockSendMail).not.toHaveBeenCalled();
        });

        it('does NOT create a duplicate notification_log entry when dedup entry exists', async () => {
            const oldLastSeen = new Date(Date.now() - (ACTIVE_THRESHOLD_SECONDS + 60) * 1000).toISOString();
            mockCosmosRead.mockResolvedValue({ resource: makeUser({ lastSeenAt: oldLastSeen }) });

            mockCosmosQuery.mockResolvedValue({
                resources: [{ id: 'existing-log', dedupKey: 'user-1:conv-1' }],
            });

            await service.notify('user-1', 'conv-1', 'Bob');

            expect(mockCosmosCreate).not.toHaveBeenCalled();
        });

        it('sends email when no dedup entry exists', async () => {
            const oldLastSeen = new Date(Date.now() - (ACTIVE_THRESHOLD_SECONDS + 60) * 1000).toISOString();
            mockCosmosRead.mockResolvedValue({ resource: makeUser({ lastSeenAt: oldLastSeen }) });
            mockCosmosQuery.mockResolvedValue({ resources: [] });

            await service.notify('user-1', 'conv-1', 'Bob');

            expect(mockSendMail).toHaveBeenCalledTimes(1);
        });
    });

    // -----------------------------------------------------------------------
    // notify — notification_log entry creation (Requirement 9.6)
    // -----------------------------------------------------------------------
    describe('notify — notification_log entry creation', () => {
        it('creates a notification_log entry with correct fields when email is sent', async () => {
            const oldLastSeen = new Date(Date.now() - (ACTIVE_THRESHOLD_SECONDS + 60) * 1000).toISOString();
            mockCosmosRead.mockResolvedValue({ resource: makeUser({ lastSeenAt: oldLastSeen }) });
            mockCosmosQuery.mockResolvedValue({ resources: [] });

            const beforeSend = Date.now();
            await service.notify('user-1', 'conv-1', 'Bob');
            const afterSend = Date.now();

            expect(mockCosmosCreate).toHaveBeenCalledTimes(1);
            const logEntry = mockCosmosCreate.mock.calls[0][0];

            expect(logEntry.channel).toBe('email');
            expect(logEntry.dedupKey).toBe('user-1:conv-1');
            expect(logEntry.recipientId).toBe('user-1');
            expect(logEntry.conversationId).toBe('conv-1');

            const sentAtMs = new Date(logEntry.sentAt).getTime();
            expect(sentAtMs).toBeGreaterThanOrEqual(beforeSend);
            expect(sentAtMs).toBeLessThanOrEqual(afterSend + 1000);
        });

        it('uses the correct dedupKey format {recipientId}:{conversationId}', async () => {
            const oldLastSeen = new Date(Date.now() - (ACTIVE_THRESHOLD_SECONDS + 60) * 1000).toISOString();
            mockCosmosRead.mockResolvedValue({ resource: makeUser({ lastSeenAt: oldLastSeen }) });
            mockCosmosQuery.mockResolvedValue({ resources: [] });

            await service.notify('recipient-abc', 'conversation-xyz', 'Charlie');

            const logEntry = mockCosmosCreate.mock.calls[0][0];
            expect(logEntry.dedupKey).toBe('recipient-abc:conversation-xyz');
        });
    });

    // -----------------------------------------------------------------------
    // updateLastSeen (Requirement 9.7)
    // -----------------------------------------------------------------------
    describe('updateLastSeen', () => {
        it('updates the user record lastSeenAt to the current time', async () => {
            const existingUser = makeUser({ lastSeenAt: new Date(Date.now() - 3600 * 1000).toISOString() });
            mockCosmosRead.mockResolvedValue({ resource: existingUser });
            mockCosmosReplace.mockResolvedValue({ resource: { ...existingUser } });

            const beforeCall = Date.now();
            await service.updateLastSeen('user-1');
            const afterCall = Date.now();

            expect(mockCosmosReplace).toHaveBeenCalledTimes(1);
            const updatedRecord = mockCosmosReplace.mock.calls[0][0];
            const lastSeenMs = new Date(updatedRecord.lastSeenAt).getTime();

            expect(lastSeenMs).toBeGreaterThanOrEqual(beforeCall);
            expect(lastSeenMs).toBeLessThanOrEqual(afterCall + 1000);
        });

        it('does nothing when user record is not found', async () => {
            mockCosmosRead.mockResolvedValue({ resource: undefined });

            await expect(service.updateLastSeen('nonexistent-user')).resolves.not.toThrow();
            expect(mockCosmosReplace).not.toHaveBeenCalled();
        });
    });
});
