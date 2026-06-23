/**
 * Property-based tests for NotificationService — MongoDB version.
 */

const mockSendMail = jest.fn();
jest.mock('nodemailer', () => ({ createTransport: jest.fn(() => ({ sendMail: mockSendMail })) }));

const mockNotificationLogFindOne = jest.fn();
const mockNotificationLogCreate = jest.fn();
const mockUserFindOne = jest.fn();
const mockUserFindOneAndUpdate = jest.fn();

jest.mock('../../../models/messaging.models', () => ({
    NotificationLogModel: { findOne: mockNotificationLogFindOne, create: mockNotificationLogCreate },
    UserModel: { findOne: mockUserFindOne, findOneAndUpdate: mockUserFindOneAndUpdate },
    ConversationModel: { findOne: jest.fn(), find: jest.fn(), create: jest.fn(), findOneAndUpdate: jest.fn() },
    MessageModel: { find: jest.fn(), create: jest.fn(), findOneAndUpdate: jest.fn(), countDocuments: jest.fn() },
    ConversationParticipantModel: { find: jest.fn(), create: jest.fn() },
    AuditLogModel: { create: jest.fn() },
    MessageAttachmentModel: { findOne: jest.fn(), create: jest.fn() },
}));

jest.mock('../../../config/mongodb', () => ({ getMongoConnection: jest.fn().mockResolvedValue({}) }));
jest.mock('../../../config/environment', () => ({
    validateEnv: jest.fn(() => ({
        MONGODB_URI: 'mongodb://localhost:27017', MONGODB_DB_NAME: 'test',
        EMAIL_FROM_ADDRESS: 'noreply@proptii.co.uk',
        ACTIVE_USER_THRESHOLD_SECONDS: 300, EMAIL_DEDUP_WINDOW_SECONDS: 900,
        RESEND_API_KEY: 'test-resend-key',
    })),
}));

import * as fc from 'fast-check';
import { NotificationService } from '../../NotificationService';

function lean<T>(v: T) { return { lean: () => v }; }

const ACTIVE_THRESHOLD_SECONDS = 300;
const DEDUP_WINDOW_SECONDS = 900;

describe('Property 17: Email suppressed when recipient is active (lastSeenAt within 5 minutes)', () => {
    let service: NotificationService;
    beforeEach(() => { jest.clearAllMocks(); service = new NotificationService(); mockSendMail.mockResolvedValue({}); mockNotificationLogCreate.mockResolvedValue({}); mockNotificationLogFindOne.mockReturnValue(lean(null)); mockUserFindOneAndUpdate.mockReturnValue(lean({})); });

    it('does not send email and does not create notification_log when lastSeenAt is within 5 minutes', async () => {
        await fc.assert(fc.asyncProperty(
            fc.integer({ min: 0, max: 299 }), fc.uuid(), fc.uuid(),
            async (secondsAgo, recipientId, conversationId) => {
                jest.clearAllMocks(); mockSendMail.mockResolvedValue({}); mockNotificationLogCreate.mockResolvedValue({}); mockNotificationLogFindOne.mockReturnValue(lean(null)); mockUserFindOneAndUpdate.mockReturnValue(lean({}));
                const lastSeenAt = new Date(Date.now() - secondsAgo * 1000).toISOString();
                mockUserFindOne.mockReturnValue(lean({ id: recipientId, email: 'user@example.com', lastSeenAt }));
                await service.notify(recipientId, conversationId, 'Sender');
                expect(mockSendMail).not.toHaveBeenCalled();
                expect(mockNotificationLogCreate).not.toHaveBeenCalled();
            },
        ), { numRuns: 25 });
    });
});

describe('Property 18: Email dedup suppresses duplicate notifications within 15-minute window', () => {
    let service: NotificationService;
    beforeEach(() => { jest.clearAllMocks(); service = new NotificationService(); mockSendMail.mockResolvedValue({}); mockNotificationLogCreate.mockResolvedValue({}); mockUserFindOneAndUpdate.mockReturnValue(lean({})); });

    it('does not send email and does not create duplicate log entry when dedup entry exists within window', async () => {
        await fc.assert(fc.asyncProperty(
            fc.record({ recipientId: fc.uuid(), conversationId: fc.uuid() }),
            async ({ recipientId, conversationId }) => {
                jest.clearAllMocks(); mockSendMail.mockResolvedValue({}); mockNotificationLogCreate.mockResolvedValue({}); mockUserFindOneAndUpdate.mockReturnValue(lean({}));
                const oldLastSeen = new Date(Date.now() - (ACTIVE_THRESHOLD_SECONDS + 60) * 1000).toISOString();
                mockUserFindOne.mockReturnValue(lean({ id: recipientId, email: 'user@example.com', lastSeenAt: oldLastSeen }));
                mockNotificationLogFindOne.mockReturnValue(lean({ id: 'existing-log', dedupKey: `${recipientId}:${conversationId}` }));
                await service.notify(recipientId, conversationId, 'Sender');
                expect(mockSendMail).not.toHaveBeenCalled();
                expect(mockNotificationLogCreate).not.toHaveBeenCalled();
            },
        ), { numRuns: 25 });
    });
});

describe('Property 19: Email notification creates notification_log entry with correct fields', () => {
    let service: NotificationService;
    beforeEach(() => { jest.clearAllMocks(); service = new NotificationService(); mockSendMail.mockResolvedValue({}); mockNotificationLogCreate.mockResolvedValue({}); mockUserFindOneAndUpdate.mockReturnValue(lean({})); });

    it('creates notification_log with channel=email, correct dedupKey, and sentAt within 1 second', async () => {
        await fc.assert(fc.asyncProperty(
            fc.record({ recipientId: fc.uuid(), conversationId: fc.uuid() }),
            async ({ recipientId, conversationId }) => {
                jest.clearAllMocks(); mockSendMail.mockResolvedValue({}); mockNotificationLogCreate.mockResolvedValue({}); mockUserFindOneAndUpdate.mockReturnValue(lean({}));
                const oldLastSeen = new Date(Date.now() - (ACTIVE_THRESHOLD_SECONDS + 60) * 1000).toISOString();
                mockUserFindOne.mockReturnValue(lean({ id: recipientId, email: 'user@example.com', lastSeenAt: oldLastSeen }));
                mockNotificationLogFindOne.mockReturnValue(lean(null));

                const beforeSend = Date.now();
                await service.notify(recipientId, conversationId, 'Sender');
                const afterSend = Date.now();

                expect(mockNotificationLogCreate).toHaveBeenCalledTimes(1);
                const logEntry = mockNotificationLogCreate.mock.calls[0][0];
                expect(logEntry.channel).toBe('email');
                expect(logEntry.dedupKey).toBe(`${recipientId}:${conversationId}`);
                const sentAtMs = new Date(logEntry.sentAt).getTime();
                expect(sentAtMs).toBeGreaterThanOrEqual(beforeSend);
                expect(sentAtMs).toBeLessThanOrEqual(afterSend + 1000);
            },
        ), { numRuns: 25 });
    });
});

describe('Property 20: lastSeenAt is updated on every authenticated /api/communication request', () => {
    let service: NotificationService;
    beforeEach(() => { jest.clearAllMocks(); service = new NotificationService(); mockUserFindOneAndUpdate.mockReturnValue(lean({})); });

    it('stores a lastSeenAt within 1 second of the updateLastSeen call time', async () => {
        await fc.assert(fc.asyncProperty(
            fc.record({ userId: fc.uuid() }),
            async ({ userId }) => {
                jest.clearAllMocks(); mockUserFindOneAndUpdate.mockReturnValue(lean({}));
                const beforeCall = Date.now();
                await service.updateLastSeen(userId);
                const afterCall = Date.now();
                expect(mockUserFindOneAndUpdate).toHaveBeenCalledTimes(1);
                const [, update] = mockUserFindOneAndUpdate.mock.calls[0];
                const lastSeenMs = new Date(update.$set.lastSeenAt).getTime();
                expect(lastSeenMs).toBeGreaterThanOrEqual(beforeCall);
                expect(lastSeenMs).toBeLessThanOrEqual(afterCall + 1000);
            },
        ), { numRuns: 25 });
    });
});
