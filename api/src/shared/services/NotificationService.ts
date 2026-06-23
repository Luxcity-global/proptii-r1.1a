import * as nodemailer from 'nodemailer';
import { BaseService } from './BaseService';
import { validateEnv } from '../config/environment';
import { NotificationLog } from '../types/messaging';
import { NotificationLogModel, UserModel } from '../models/messaging.models';

export function buildTransporter(env: ReturnType<typeof validateEnv>): nodemailer.Transporter | null {
    if (env.RESEND_API_KEY) {
        return nodemailer.createTransport({
            host: 'smtp.resend.com',
            port: 465,
            secure: true,
            auth: { user: 'resend', pass: env.RESEND_API_KEY },
        });
    }
    if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
        return nodemailer.createTransport({
            host: env.SMTP_HOST,
            port: env.SMTP_PORT ?? 465,
            secure: (env.SMTP_PORT ?? 465) === 465,
            auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
        });
    }
    return null;
}

export class NotificationService extends BaseService {
    constructor() {
        super(NotificationLogModel);
    }

    async notify(recipientId: string, conversationId: string, senderName: string): Promise<void> {
        const env = validateEnv();

        // Step 1: Check if recipient is active
        const userRecord = await UserModel.findOne({ id: recipientId }).lean();

        if (userRecord?.lastSeenAt) {
            const secondsAgo = (Date.now() - new Date(userRecord.lastSeenAt).getTime()) / 1000;
            if (secondsAgo < env.ACTIVE_USER_THRESHOLD_SECONDS) {
                return;
            }
        }

        // Step 2: Check dedup window
        const dedupKey = `${recipientId}:${conversationId}`;
        const windowStart = new Date(Date.now() - env.EMAIL_DEDUP_WINDOW_SECONDS * 1000).toISOString();

        const existingLog = await NotificationLogModel.findOne({
            dedupKey,
            sentAt: { $gte: windowStart },
        }).lean();

        if (existingLog) {
            return;
        }

        // Step 3: Send email
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
        }

        // Step 4: Create notification_log entry
        const sentAt = new Date().toISOString();
        const logEntry: NotificationLog = {
            id: crypto.randomUUID(),
            recipientId,
            conversationId,
            channel: 'email',
            sentAt,
            dedupKey,
        };

        await NotificationLogModel.create(logEntry);
    }

    async updateLastSeen(userId: string): Promise<void> {
        await UserModel.findOneAndUpdate(
            { id: userId },
            { $set: { lastSeenAt: new Date().toISOString() } },
        );
    }
}
