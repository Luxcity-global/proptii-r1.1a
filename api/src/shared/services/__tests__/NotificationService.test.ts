/**
 * Unit tests for NotificationService — MongoDB version.
 */

const mockSendMail = jest.fn();
jest.mock('nodemailer', () => ({
    createTransport: jest.fn(() => ({ sendMail: mockSendMail })),
}));

const mockNotificationLogFindOne = jest.fn();
const mockNotificationLogCreate = jest.fn();
const mockUserFindOne = jest.fn();
const mockUserFindOneAndUpdate = jest.fn();

jest.mock('../../models/messaging.models', () => ({
    NotificationLogModel: {
        findOne: mockNotificationLogFindOne,
        create: mockNotificationLogCreate,
    },
    UserModel: {
        findOne: mockUserFindOne,
        findOneAndUpdate: mockUserFindOneAndUpdate,
    },
    ConversationModel: { findOne: jest.fn(), find: jest.fn(), create: jest.fn(), findOneAndUpdate: jest.fn() },
    MessageModel: { find: jest.fn(), create: jest.fn(), findOneAndUpdate: jest.fn(), countDocuments: jest.fn() },
    ConversationParticipantModel: { find: jest.fn(), create: jest.fn() },
    AuditLogModel: { create: jest.fn() },
    MessageAttachmentModel: { findOne: jest.fn(), create: jest.fn() },
}));

jest.mock('../../config/mongodb', () => ({
    getMongoConnection: jest.fn().mockResolvedValue({}),
}));

jest.mock('../../config/environment', () => ({
    validateEnv: jest.fn(() => ({
        MONGODB_URI: 'mongodb://localhost:27017',
        MONGODB_DB_NAME: 'test',
        EMAIL_FROM_ADDRESS: 'noreply@proptii.co.uk',
        ACTIVE_USER_THRESHOLD_SECONDS: 300,
        EMAIL_DEDUP_WINDOW_SECONDS: 900,
        RESEND_API_KEY: 'test-resend-key',
    })),
}));

import { NotificationService } from '../NotificationService';

const ACTIVE_THRESHOLD_SECONDS = 300;
const DEDUP_WINDOW_SECONDS = 900;

function lean<T>(value: T) { return { lean: () => value }; }

const makeUser = (overrides: Partial<{ lastSeenAt: string; email: string }> = {}) => ({
    id: 'user-1', email: 'recipient@example.com', ...overrides,
});

describe('NotificationService', () => {
    let service: NotificationService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new NotificationService();
        mockNotificationLogFindOne.mockReturnValue(lean(null));
        mockNotificationLogCreate.mockResolvedValue({});
        mockSendMail.mockResolvedValue({ messageId: 'test-id' });
        mockUserFindOneAndUpdate.mockReturnValue(lean({}));
    });

    describe('notify — active user suppression', () => {
        it('does NOT send email when lastSeenAt is within the active threshold', async () => {
            const recentLastSeen = new Date(Date.now() - 60 * 1000).toISOString();
            mockUserFindOne.mockReturnValue(lean(makeUser({ lastSeenAt: recentLastSeen })));

            await service.notify('user-1', 'conv-1', 'Bob');

            expect(mockSendMail).not.toHaveBeenCalled();
        });

        it('does NOT create a notification_log entry when recipient is active', async () => {
            const recentLastSeen = new Date(Date.now() - 60 * 1000).toISOString();
            mockUserFindOne.mockReturnValue(lean(makeUser({ lastSeenAt: recentLastSeen })));

            await service.notify('user-1', 'conv-1', 'Bob');

            expect(mockNotificationLogCreate).not.toHaveBeenCalled();
        });

        it('sends email when lastSeenAt is older than the active threshold', async () => {
            const oldLastSeen = new Date(Date.now() - (ACTIVE_THRESHOLD_SECONDS + 60) * 1000).toISOString();
            mockUserFindOne.mockReturnValue(lean(makeUser({ lastSeenAt: oldLastSeen })));

            await service.notify('user-1', 'conv-1', 'Bob');

            expect(mockSendMail).toHaveBeenCalledTimes(1);
        });

        it('sends email when lastSeenAt is undefined (user never seen)', async () => {
            mockUserFindOne.mockReturnValue(lean(makeUser({ lastSeenAt: undefined })));

            await service.notify('user-1', 'conv-1', 'Bob');

            expect(mockSendMail).toHaveBeenCalledTimes(1);
        });
    });

    describe('notify — dedup window suppression', () => {
        it('does NOT send email when a dedup entry exists within the window', async () => {
            const oldLastSeen = new Date(Date.now() - (ACTIVE_THRESHOLD_SECONDS + 60) * 1000).toISOString();
            mockUserFindOne.mockReturnValue(lean(makeUser({ lastSeenAt: oldLastSeen })));
            mockNotificationLogFindOne.mockReturnValue(lean({ id: 'existing-log', dedupKey: 'user-1:conv-1' }));

            await service.notify('user-1', 'conv-1', 'Bob');

            expect(mockSendMail).not.toHaveBeenCalled();
        });

        it('does NOT create a duplicate notification_log entry when dedup entry exists', async () => {
            const oldLastSeen = new Date(Date.now() - (ACTIVE_THRESHOLD_SECONDS + 60) * 1000).toISOString();
            mockUserFindOne.mockReturnValue(lean(makeUser({ lastSeenAt: oldLastSeen })));
            mockNotificationLogFindOne.mockReturnValue(lean({ id: 'existing-log' }));

            await service.notify('user-1', 'conv-1', 'Bob');

            expect(mockNotificationLogCreate).not.toHaveBeenCalled();
        });

        it('sends email when no dedup entry exists', async () => {
            const oldLastSeen = new Date(Date.now() - (ACTIVE_THRESHOLD_SECONDS + 60) * 1000).toISOString();
            mockUserFindOne.mockReturnValue(lean(makeUser({ lastSeenAt: oldLastSeen })));
            mockNotificationLogFindOne.mockReturnValue(lean(null));

            await service.notify('user-1', 'conv-1', 'Bob');

            expect(mockSendMail).toHaveBeenCalledTimes(1);
        });
    });

    describe('notify — notification_log entry creation', () => {
        it('creates a notification_log entry with correct fields when email is sent', async () => {
            const oldLastSeen = new Date(Date.now() - (ACTIVE_THRESHOLD_SECONDS + 60) * 1000).toISOString();
            mockUserFindOne.mockReturnValue(lean(makeUser({ lastSeenAt: oldLastSeen })));
            mockNotificationLogFindOne.mockReturnValue(lean(null));

            const beforeSend = Date.now();
            await service.notify('user-1', 'conv-1', 'Bob');
            const afterSend = Date.now();

            expect(mockNotificationLogCreate).toHaveBeenCalledTimes(1);
            const logEntry = mockNotificationLogCreate.mock.calls[0][0];

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
            mockUserFindOne.mockReturnValue(lean(makeUser({ lastSeenAt: oldLastSeen })));
            mockNotificationLogFindOne.mockReturnValue(lean(null));

            await service.notify('recipient-abc', 'conversation-xyz', 'Charlie');

            const logEntry = mockNotificationLogCreate.mock.calls[0][0];
            expect(logEntry.dedupKey).toBe('recipient-abc:conversation-xyz');
        });
    });

    describe('updateLastSeen', () => {
        it('updates the user record lastSeenAt to the current time', async () => {
            const beforeCall = Date.now();
            await service.updateLastSeen('user-1');
            const afterCall = Date.now();

            expect(mockUserFindOneAndUpdate).toHaveBeenCalledTimes(1);
            const [filter, update] = mockUserFindOneAndUpdate.mock.calls[0];
            expect(filter).toEqual({ id: 'user-1' });

            const lastSeenMs = new Date(update.$set.lastSeenAt).getTime();
            expect(lastSeenMs).toBeGreaterThanOrEqual(beforeCall);
            expect(lastSeenMs).toBeLessThanOrEqual(afterCall + 1000);
        });
    });
});
