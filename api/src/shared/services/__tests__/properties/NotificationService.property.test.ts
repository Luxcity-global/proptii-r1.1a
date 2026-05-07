/**
 * Property-based tests for NotificationService.
 *
 * Feature: proptii-communication
 * Properties 17, 18, 19, 20 — Email suppression, dedup, notification_log creation,
 * and lastSeenAt update.
 */

// Feature: proptii-communication, Property 17: Email suppressed when recipient is active (lastSeenAt within 5 minutes)
// Feature: proptii-communication, Property 18: Email dedup suppresses duplicate notifications within 15-minute window
// Feature: proptii-communication, Property 19: Email notification creates notification_log entry with correct fields
// Feature: proptii-communication, Property 20: lastSeenAt is updated on every authenticated /api/communication request

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
                item: jest.fn(() => ({
                    read: mockCosmosRead,
                    replace: mockCosmosReplace,
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
import { NotificationService } from '../../NotificationService';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const ACTIVE_THRESHOLD_SECONDS = 300;
const DEDUP_WINDOW_SECONDS = 900;

// ---------------------------------------------------------------------------
// Property 17: Email suppressed when recipient is active (lastSeenAt within 5 minutes)
// Validates: Requirements 9.2
// ---------------------------------------------------------------------------
describe('Property 17: Email suppressed when recipient is active (lastSeenAt within 5 minutes)', () => {
    let service: NotificationService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new NotificationService();
        mockSendMail.mockResolvedValue({ messageId: 'test-id' });
        mockCosmosCreate.mockResolvedValue({ resource: { id: 'log-1' } });
        mockCosmosQuery.mockResolvedValue({ resources: [] });
    });

    it('does not send email and does not create notification_log when lastSeenAt is within 5 minutes', async () => {
        // Use seconds-ago values in [0, 299] — all within the 300-second threshold
        await fc.assert(
            fc.asyncProperty(
                fc.integer({ min: 0, max: 299 }),
                fc.uuid(),
                fc.uuid(),
                async (secondsAgo, recipientId, conversationId) => {
                    jest.clearAllMocks();
                    mockSendMail.mockResolvedValue({ messageId: 'test-id' });
                    mockCosmosCreate.mockResolvedValue({ resource: { id: 'log-1' } });
                    mockCosmosQuery.mockResolvedValue({ resources: [] });

                    const lastSeenAt = new Date(Date.now() - secondsAgo * 1000).toISOString();
                    mockCosmosRead.mockResolvedValue({
                        resource: {
                            id: recipientId,
                            email: 'user@example.com',
                            lastSeenAt,
                        },
                    });

                    await service.notify(recipientId, conversationId, 'Sender');

                    // No email should be sent
                    expect(mockSendMail).not.toHaveBeenCalled();
                    // No notification_log entry should be created
                    expect(mockCosmosCreate).not.toHaveBeenCalled();
                },
            ),
            { numRuns: 25 },
        );
    });
});

// ---------------------------------------------------------------------------
// Property 18: Email dedup suppresses duplicate notifications within 15-minute window
// Validates: Requirements 9.5
// ---------------------------------------------------------------------------
describe('Property 18: Email dedup suppresses duplicate notifications within 15-minute window', () => {
    let service: NotificationService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new NotificationService();
        mockSendMail.mockResolvedValue({ messageId: 'test-id' });
        mockCosmosCreate.mockResolvedValue({ resource: { id: 'log-1' } });
    });

    it('does not send email and does not create duplicate log entry when dedup entry exists within window', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.record({ recipientId: fc.uuid(), conversationId: fc.uuid() }),
                async ({ recipientId, conversationId }) => {
                    jest.clearAllMocks();
                    mockSendMail.mockResolvedValue({ messageId: 'test-id' });
                    mockCosmosCreate.mockResolvedValue({ resource: { id: 'log-1' } });

                    // Recipient is inactive (last seen > 5 minutes ago)
                    const oldLastSeen = new Date(
                        Date.now() - (ACTIVE_THRESHOLD_SECONDS + 60) * 1000,
                    ).toISOString();
                    mockCosmosRead.mockResolvedValue({
                        resource: {
                            id: recipientId,
                            email: 'user@example.com',
                            lastSeenAt: oldLastSeen,
                        },
                    });

                    // Existing dedup entry within the 900-second window
                    const existingEntryTime = new Date(
                        Date.now() - (DEDUP_WINDOW_SECONDS - 60) * 1000,
                    ).toISOString();
                    mockCosmosQuery.mockResolvedValue({
                        resources: [
                            {
                                id: 'existing-log',
                                recipientId,
                                conversationId,
                                channel: 'email',
                                sentAt: existingEntryTime,
                                dedupKey: `${recipientId}:${conversationId}`,
                            },
                        ],
                    });

                    await service.notify(recipientId, conversationId, 'Sender');

                    // No email should be sent
                    expect(mockSendMail).not.toHaveBeenCalled();
                    // No duplicate notification_log entry should be created
                    expect(mockCosmosCreate).not.toHaveBeenCalled();
                },
            ),
            { numRuns: 25 },
        );
    });
});

// ---------------------------------------------------------------------------
// Property 19: Email notification creates notification_log entry with correct fields
// Validates: Requirements 9.6
// ---------------------------------------------------------------------------
describe('Property 19: Email notification creates notification_log entry with correct fields', () => {
    let service: NotificationService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new NotificationService();
        mockSendMail.mockResolvedValue({ messageId: 'test-id' });
        mockCosmosCreate.mockResolvedValue({ resource: { id: 'log-1' } });
    });

    it('creates notification_log with channel=email, correct dedupKey, and sentAt within 1 second', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.record({ recipientId: fc.uuid(), conversationId: fc.uuid() }),
                async ({ recipientId, conversationId }) => {
                    jest.clearAllMocks();
                    mockSendMail.mockResolvedValue({ messageId: 'test-id' });
                    mockCosmosCreate.mockResolvedValue({ resource: { id: 'log-1' } });

                    // Recipient is inactive
                    const oldLastSeen = new Date(
                        Date.now() - (ACTIVE_THRESHOLD_SECONDS + 60) * 1000,
                    ).toISOString();
                    mockCosmosRead.mockResolvedValue({
                        resource: {
                            id: recipientId,
                            email: 'user@example.com',
                            lastSeenAt: oldLastSeen,
                        },
                    });

                    // No dedup entry
                    mockCosmosQuery.mockResolvedValue({ resources: [] });

                    const beforeSend = Date.now();
                    await service.notify(recipientId, conversationId, 'Sender');
                    const afterSend = Date.now();

                    expect(mockCosmosCreate).toHaveBeenCalledTimes(1);
                    const logEntry = mockCosmosCreate.mock.calls[0][0];

                    // channel must be 'email'
                    expect(logEntry.channel).toBe('email');

                    // dedupKey must be "{recipientId}:{conversationId}"
                    expect(logEntry.dedupKey).toBe(`${recipientId}:${conversationId}`);

                    // sentAt must be within 1 second of the send time
                    const sentAtMs = new Date(logEntry.sentAt).getTime();
                    expect(sentAtMs).toBeGreaterThanOrEqual(beforeSend);
                    expect(sentAtMs).toBeLessThanOrEqual(afterSend + 1000);
                },
            ),
            { numRuns: 25 },
        );
    });
});

// ---------------------------------------------------------------------------
// Property 20: lastSeenAt is updated on every authenticated /api/communication request
// Validates: Requirements 9.7
// ---------------------------------------------------------------------------
describe('Property 20: lastSeenAt is updated on every authenticated /api/communication request', () => {
    let service: NotificationService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new NotificationService();
        mockCosmosReplace.mockResolvedValue({ resource: {} });
    });

    it('stores a lastSeenAt within 1 second of the updateLastSeen call time', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.record({ userId: fc.uuid() }),
                async ({ userId }) => {
                    jest.clearAllMocks();
                    mockCosmosReplace.mockResolvedValue({ resource: {} });

                    const existingUser = {
                        id: userId,
                        email: 'user@example.com',
                        lastSeenAt: new Date(Date.now() - 3600 * 1000).toISOString(),
                    };
                    mockCosmosRead.mockResolvedValue({ resource: existingUser });

                    const beforeCall = Date.now();
                    await service.updateLastSeen(userId);
                    const afterCall = Date.now();

                    expect(mockCosmosReplace).toHaveBeenCalledTimes(1);
                    const updatedRecord = mockCosmosReplace.mock.calls[0][0];

                    const lastSeenMs = new Date(updatedRecord.lastSeenAt).getTime();
                    expect(lastSeenMs).toBeGreaterThanOrEqual(beforeCall);
                    expect(lastSeenMs).toBeLessThanOrEqual(afterCall + 1000);
                },
            ),
            { numRuns: 25 },
        );
    });
});
