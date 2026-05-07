import * as nodemailer from 'nodemailer';
import { BaseService } from './BaseService';
import { validateEnv } from '../config/environment';
import { NotificationLog } from '../types/messaging';

// User record shape (minimal — only the fields we need)
interface UserRecord {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    lastSeenAt?: string;
}

/**
 * Builds a nodemailer transporter using the best available transport:
 *   1. Resend API  — if RESEND_API_KEY is set (recommended for Azure Functions)
 *   2. Gmail SMTP  — if SMTP_HOST / SMTP_USER / SMTP_PASS are set (fallback)
 *
 * Returns null when neither is configured so the caller can skip sending
 * without throwing.
 */
function buildTransporter(env: ReturnType<typeof validateEnv>): nodemailer.Transporter | null {
    // --- Option 1: Resend (SMTP relay on port 465) ---
    if (env.RESEND_API_KEY) {
        return nodemailer.createTransport({
            host: 'smtp.resend.com',
            port: 465,
            secure: true,
            auth: {
                user: 'resend',
                pass: env.RESEND_API_KEY,
            },
        });
    }

    // --- Option 2: Gmail / custom SMTP ---
    if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
        return nodemailer.createTransport({
            host: env.SMTP_HOST,
            port: env.SMTP_PORT ?? 465,
            secure: (env.SMTP_PORT ?? 465) === 465,
            auth: {
                user: env.SMTP_USER,
                pass: env.SMTP_PASS,
            },
        });
    }

    return null;
}

export class NotificationService extends BaseService {
    constructor() {
        super('notification_log');
    }

    /**
     * Sends an email notification to the recipient if:
     *  1. The recipient is not currently active (lastSeenAt older than ACTIVE_USER_THRESHOLD_SECONDS).
     *  2. No notification has been sent for this (recipientId, conversationId) pair within
     *     EMAIL_DEDUP_WINDOW_SECONDS.
     *
     * On send, creates a notification_log document.
     */
    async notify(recipientId: string, conversationId: string, senderName: string): Promise<void> {
        const env = validateEnv();

        // -----------------------------------------------------------------------
        // Step 1: Check if recipient is active (lastSeenAt within threshold)
        // -----------------------------------------------------------------------
        const usersContainer = this.client
            .database(env.COSMOS_DB_DATABASE_NAME)
            .container('Users');

        const { resource: userRecord } = await usersContainer.item(recipientId, recipientId).read<UserRecord>();

        if (userRecord?.lastSeenAt) {
            const lastSeenMs = new Date(userRecord.lastSeenAt).getTime();
            const nowMs = Date.now();
            const secondsAgo = (nowMs - lastSeenMs) / 1000;

            if (secondsAgo < env.ACTIVE_USER_THRESHOLD_SECONDS) {
                // Recipient is active — suppress email and do not create a log entry
                return;
            }
        }

        // -----------------------------------------------------------------------
        // Step 2: Check dedup window
        // -----------------------------------------------------------------------
        const dedupKey = `${recipientId}:${conversationId}`;
        const windowStart = new Date(Date.now() - env.EMAIL_DEDUP_WINDOW_SECONDS * 1000).toISOString();

        const existingLogs = await this.query<NotificationLog>(
            'SELECT * FROM c WHERE c.dedupKey = @dedupKey AND c.sentAt >= @windowStart',
            [
                { name: '@dedupKey', value: dedupKey },
                { name: '@windowStart', value: windowStart },
            ],
        );

        if (existingLogs.length > 0) {
            // Duplicate within dedup window — suppress
            return;
        }

        // -----------------------------------------------------------------------
        // Step 3: Send email via nodemailer (Resend → SMTP fallback)
        // -----------------------------------------------------------------------
        const fromAddress = env.EMAIL_FROM_ADDRESS ?? 'noreply@mail.proptii.co';
        const recipientEmail = userRecord?.email;

        if (recipientEmail) {
            const transporter = buildTransporter(env);

            if (transporter) {
                await transporter.sendMail({
                    from: fromAddress,
                    to: recipientEmail,
                    subject: `New message from ${senderName} on Proptii`,
                    text: `You have a new message from ${senderName}. Log in to Proptii to view it.`,
                    html: `
                        <p>Hi,</p>
                        <p>You have a new message from <strong>${senderName}</strong> on Proptii.</p>
                        <p><a href="https://proptii.co/dashboard/messages">Click here to view it</a></p>
                        <p>The Proptii Team</p>
                    `,
                });
            }
            // If no transporter is configured, skip silently — notification_log
            // is still created so the dedup window is respected.
        }

        // -----------------------------------------------------------------------
        // Step 4: Create notification_log entry
        // -----------------------------------------------------------------------
        const sentAt = new Date().toISOString();
        const logEntry: NotificationLog = {
            id: crypto.randomUUID(),
            recipientId,
            conversationId,
            channel: 'email',
            sentAt,
            dedupKey,
        };

        await this.create<NotificationLog>(logEntry);
    }

    /**
     * Updates the user record's lastSeenAt to the current UTC ISO string.
     * Called on every authenticated /api/communication request.
     */
    async updateLastSeen(userId: string): Promise<void> {
        const env = validateEnv();

        const usersContainer = this.client
            .database(env.COSMOS_DB_DATABASE_NAME)
            .container('Users');

        const { resource: userRecord } = await usersContainer.item(userId, userId).read<UserRecord>();

        if (!userRecord) {
            return;
        }

        const updatedRecord: UserRecord = {
            ...userRecord,
            lastSeenAt: new Date().toISOString(),
        };

        await usersContainer.item(userId, userId).replace(updatedRecord);
    }
}
