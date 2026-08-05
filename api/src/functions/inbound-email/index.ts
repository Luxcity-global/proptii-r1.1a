import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { EnquiryThreadService } from '../../shared/services/EnquiryThreadService';
import { GhostAccountModel } from '../../shared/models/ghost-account.model';
import { EnquiryThreadModel, IEnquiryThread } from '../../shared/models/enquiry-thread.model';
import { UserModel } from '../../shared/models/messaging.models';
import { EmailRelayService } from '../../shared/services/EmailRelayService';

/**
 * Parses email reply body and strips quoted email threads/signatures.
 */
export function stripQuotedText(text: string): string {
    if (!text) return '';
    
    const lines = text.split(/\r?\n/);
    const resultLines: string[] = [];

    // Common separators marking the start of quoted email history
    const separators = [
        /^\s*On\s+.*,\s+.*wrote:\s*$/i,
        /^\s*On\s+.*wrote:\s*$/i,
        /^\s*-+\s*Original Message\s*-+\s*$/i,
        /^\s*-+\s*Forwarded Message\s*-+\s*$/i,
        /^\s*From:\s*/i,
        /^\s*To:\s*/i,
        /^\s*Date:\s*/i,
        /^\s*Subject:\s*/i,
        /^\s*Sent\s+from\s+my\s+/i, // e.g. Sent from my iPhone
        /^\s*Sent\s+from\s+Yahoo\s+Mail/i,
        /^\s*--\s*$/ // standard signature separator
    ];

    for (const line of lines) {
        // Stop parsing if we match any separator
        if (separators.some(regex => regex.test(line))) {
            break;
        }
        // Stop if the line starts with a blockquote character '>'
        if (line.trim().startsWith('>')) {
            break;
        }
        resultLines.push(line);
    }

    return resultLines.join('\n').trim();
}

/**
 * Extracts thread token from the 'to' address.
 * Matches: reply+{token}@reply.proptii.co
 */
export function extractThreadToken(toAddress: string): string | null {
    if (!toAddress) return null;
    const match = toAddress.match(/reply\+([a-f0-9]{32})/i);
    return match ? match[1] : null;
}

/**
 * Extracts email address from a From header (which may include names).
 * e.g., "John Doe <john@example.com>" -> "john@example.com"
 */
export function extractEmailAddress(fromHeader: string): string {
    if (!fromHeader) return '';
    const match = fromHeader.match(/<([^>]+)>/);
    return (match ? match[1] : fromHeader).trim().toLowerCase();
}

app.http('inbound-email-webhook', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'inbound-email',
    handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
        try {
            // Webhook payload structures vary depending on provider (Mailgun, SendGrid, Resend)
            // Let's inspect potential fields:
            const body = await request.json() as {
                to?: string;
                recipient?: string;
                from?: string;
                sender?: string;
                'body-plain'?: string;
                text?: string;
            };

            const rawTo = body.to ?? body.recipient ?? '';
            const rawFrom = body.from ?? body.sender ?? '';
            const rawBody = body.text ?? body['body-plain'] ?? '';

            context.log(`Inbound email received: To: ${rawTo}, From: ${rawFrom}`);

            // 1. Extract thread token
            const token = extractThreadToken(rawTo);
            if (!token) {
                context.warn('Inbound email had no valid thread token in To address');
                return { status: 200, body: 'Ignored: No valid token' };
            }

            // 2. Load thread
            const thread = await EnquiryThreadModel.findOne({ thread_token: token }).lean<IEnquiryThread>();
            if (!thread) {
                context.warn(`No thread found for token: ${token}`);
                return { status: 200, body: 'Ignored: Thread not found' };
            }

            if (thread.status === 'closed' || thread.status === 'archived') {
                context.warn(`Thread ${thread.id} is closed or archived. Ignoring inbound reply.`);
                return { status: 200, body: 'Ignored: Thread closed' };
            }

            // 3. Extract sender email
            const senderEmail = extractEmailAddress(rawFrom);
            if (!senderEmail) {
                context.warn('Inbound email had no sender address');
                return { status: 200, body: 'Ignored: No sender address' };
            }

            // 4. Identify sender and role
            let senderType: 'ghost_tenant' | 'ghost_landlord' | 'platform_landlord' | null = null;
            let senderId: string | null = null;
            let senderName: string | null = null;

            // Load ghost tenant
            const ghostTenant = await GhostAccountModel.findOne({ id: thread.ghost_tenant_id }).lean();
            
            // Load landlord
            let landlordEmail: string | null = null;
            let landlordName: string | null = null;
            let isPlatformLandlord = false;

            if (thread.listing_source === 'scraped') {
                const ghostLandlord = await GhostAccountModel.findOne({ id: thread.landlord_id }).lean();
                landlordEmail = ghostLandlord?.email ?? null;
                landlordName = ghostLandlord?.name ?? 'Landlord';
            } else {
                const landlord = await UserModel.findOne({ id: thread.landlord_id }).lean();
                landlordEmail = landlord?.email ?? null;
                landlordName = [landlord?.firstName, landlord?.lastName].filter(Boolean).join(' ') || 'Landlord';
                isPlatformLandlord = true;
            }

            const tenantEmail = ghostTenant?.email?.toLowerCase().trim();
            const landlordEmailLower = landlordEmail?.toLowerCase().trim();

            if (senderEmail === tenantEmail) {
                senderType = 'ghost_tenant';
                senderId = thread.ghost_tenant_id;
                senderName = ghostTenant?.name ?? 'Tenant';
            } else if (senderEmail === landlordEmailLower) {
                // Landlord email replies are not supported — we reply via the platform.
                // Send a friendly bounce so the landlord knows what happened.
                context.warn(`Email reply from landlord ${senderEmail} blocked — sending bounce.`);
                if (landlordEmail) {
                    try {
                        const env = require('../../../shared/config/environment').validateEnv();
                        const { buildTransporter } = require('../../../shared/services/NotificationService');
                        const transporter = buildTransporter(env);
                        if (transporter) {
                            const fromAddress = env.EMAIL_FROM_ADDRESS ?? 'noreply@reply.proptii.co';
                            const frontendUrl = process.env.FRONTEND_URL ?? 'https://proptii.co';
                            await transporter.sendMail({
                                from: fromAddress,
                                to: landlordEmail,
                                subject: 'Reply not delivered — please use Proptii to respond',
                                text: `Hi ${landlordName},\n\nYour reply to a tenant enquiry could not be delivered via email.\n\nTo keep conversations secure and ensure your reply reaches the tenant, please log in to Proptii and reply directly through the platform:\n${frontendUrl}/thread/${thread.thread_token}\n\nThe Proptii Team`,
                                html: `<p>Hi ${landlordName},</p><p>Your reply to a tenant enquiry could not be delivered via email.</p><p>To keep conversations secure, please <a href="${frontendUrl}/thread/${thread.thread_token}">log in to Proptii</a> and reply directly through the platform.</p><p>The Proptii Team</p>`,
                            });
                        }
                    } catch (bounceErr) {
                        context.warn('Failed to send bounce email to landlord:', bounceErr);
                    }
                }
                return { status: 200, body: 'Landlord reply bounced with notification' };
            }

            if (!senderType || !senderId) {
                context.warn(`Sender ${senderEmail} is not authorized for thread ${thread.id}`);
                return { status: 200, body: 'Ignored: Unauthorized sender' };
            }

            // 5. Clean reply text
            const replyText = stripQuotedText(rawBody);
            if (!replyText) {
                context.warn('Clean reply text was empty. Ignoring message.');
                return { status: 200, body: 'Ignored: Empty message body' };
            }

            // 6. Append message to thread
            const enquiryThreadService = new EnquiryThreadService();
            const message = await enquiryThreadService.addReply({
                threadToken: token,
                senderType,
                senderId,
                senderName,
                body: replyText,
                source: 'email_reply',
            });

            // 7. Send notification to the other party
            const emailRelayService = new EmailRelayService();
            await emailRelayService.sendReplyNotification(token, message);

            return { status: 201, body: 'Reply processed successfully' };
        } catch (error) {
            context.error('Error in inbound-email webhook handler:', error);
            // Always return 200/201 to the email provider webhook to prevent retries of failed hooks
            return { status: 200, body: 'Error processing webhook' };
        }
    }
});
