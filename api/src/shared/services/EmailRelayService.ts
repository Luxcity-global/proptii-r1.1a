import { validateEnv } from '../config/environment';
import { buildTransporter } from './NotificationService';
import { IEnquiryThread } from '../models/enquiry-thread.model';
import { IThreadMessage } from '../models/thread-message.model';
import { IGhostAccount, GhostAccountModel } from '../models/ghost-account.model';
import { UserModel } from '../models/messaging.models';
import { EnquiryEmailTemplates } from './EnquiryEmailTemplates';
import { GhostAccountService } from './GhostAccountService';
import { EnquiryThreadModel } from '../models/enquiry-thread.model';

export interface SendEnquiryEmailsOpts {
    thread: IEnquiryThread;
    firstMessage: IThreadMessage;
    ghostTenant: IGhostAccount;
    listingSource: 'native' | 'scraped';
    agentEmail: string | null;
    agentName: string | null;
    landlordId: string;
    /** Claim token issued at submission time (Gap 6). May be null for returning ghost tenants. */
    claimToken?: string | null;
}

export class EmailRelayService {
    private ghostAccountService = new GhostAccountService();

    private getFromAddress(): string {
        const env = validateEnv();
        return env.EMAIL_FROM_ADDRESS ?? 'noreply@reply.proptii.co';
    }

    /**
     * Sends the initial emails when an enquiry is created:
     *   - Confirmation email to the ghost tenant
     *   - Notification or forwarded enquiry to the landlord (platform or external)
     */
    async sendEnquiryEmails(opts: SendEnquiryEmailsOpts): Promise<void> {
        const env = validateEnv();
        const transporter = buildTransporter(env);
        if (!transporter) {
            console.warn('EmailRelayService: No email transporter configured.');
            return;
        }

        const fromAddress = this.getFromAddress();

        // 1. Send confirmation to the ghost tenant
        if (opts.ghostTenant.email) {
            const tenantEmailData = EnquiryEmailTemplates.getTenantEnquirySentEmail({
                thread: opts.thread,
                firstMessage: opts.firstMessage,
                ghostTenant: opts.ghostTenant,
                claimToken: opts.claimToken ?? null,  // Gap 6
            });

            await transporter.sendMail({
                from: fromAddress,
                to: opts.ghostTenant.email,
                subject: tenantEmailData.subject,
                text: tenantEmailData.text,
                html: tenantEmailData.html,
            });
        }

        // 2. Send enquiry to the landlord
        if (opts.listingSource === 'scraped') {
            // Scraped listing -> Forward to external agent email if available
            if (opts.agentEmail) {
                let claimToken: string | null = null;
                try {
                    const ghostLandlord = await GhostAccountModel.findOne({ id: opts.landlordId });
                    if (ghostLandlord) {
                        if (ghostLandlord.status === 'ghost') {
                            const updated = await this.ghostAccountService.issueClaimToken(ghostLandlord.id);
                            claimToken = updated.claim_token;
                        } else {
                            claimToken = ghostLandlord.claim_token;
                        }
                    }
                } catch (claimErr) {
                    console.warn('Failed to get/issue claim token for ghost landlord:', claimErr);
                }

                const agentEmailData = EnquiryEmailTemplates.getExternalLandlordForwardedEmail({
                    thread: opts.thread,
                    firstMessage: opts.firstMessage,
                    ghostTenant: opts.ghostTenant,
                    agentEmail: opts.agentEmail,
                    agentName: opts.agentName,
                    claimToken,
                });

                await transporter.sendMail({
                    from: fromAddress,
                    to: opts.agentEmail,
                    subject: agentEmailData.subject,
                    text: agentEmailData.text,
                    html: agentEmailData.html,
                });
            } else {
                // Gap 2: No agent contact email — send a fallback email to the tenant
                // explaining that delivery couldn't be confirmed, instead of silently failing.
                if (opts.ghostTenant.email) {
                    const noDeliveryEmailData = EnquiryEmailTemplates.getTenantNoDeliveryEmail({
                        thread: opts.thread,
                        firstMessage: opts.firstMessage,
                        ghostTenant: opts.ghostTenant,
                    });
                    await transporter.sendMail({
                        from: fromAddress,
                        to: opts.ghostTenant.email,
                        subject: noDeliveryEmailData.subject,
                        text: noDeliveryEmailData.text,
                        html: noDeliveryEmailData.html,
                    });
                }
                console.info(`EmailRelayService: Scraped listing has no contact email. Fallback email sent to tenant. Thread: ${opts.thread.id}`);
            }
        } else {
            // Native listing -> Find registered platform landlord
            const landlord = await UserModel.findOne({ id: opts.landlordId }).lean();
            if (landlord && landlord.email) {
                const landlordName = [landlord.firstName, landlord.lastName].filter(Boolean).join(' ') || 'Landlord';
                const landlordEmailData = EnquiryEmailTemplates.getLandlordNotificationEmail({
                    thread: opts.thread,
                    firstMessage: opts.firstMessage,
                    landlordEmail: landlord.email,
                    landlordName,
                });

                await transporter.sendMail({
                    from: fromAddress,
                    to: landlord.email,
                    subject: landlordEmailData.subject,
                    text: landlordEmailData.text,
                    html: landlordEmailData.html,
                });
            } else {
                console.warn(`EmailRelayService: Platform landlord ${opts.landlordId} not found or has no email.`);
            }
        }
    }

    /**
     * Sends a notification email when a reply is posted to a thread.
     * Also checks if this is the first reply on a thread involving ghost accounts,
     * and triggers the claim email sequence if so.
     */
    async sendReplyNotification(threadToken: string, message: IThreadMessage): Promise<void> {
        const env = validateEnv();
        const transporter = buildTransporter(env);
        if (!transporter) {
            console.warn('EmailRelayService: No email transporter configured.');
            return;
        }

        // Load thread
        const thread = await EnquiryThreadModel.findOne({ thread_token: threadToken }).lean<IEnquiryThread>();
        if (!thread) return;

        const fromAddress = this.getFromAddress();

        // Load the sender and recipient details
        const isTenantSender = message.sender_type === 'ghost_tenant';
        
        let recipientEmail: string | null = null;
        let recipientName: string | null = null;
        let isRecipientGhostLandlord = false;
        let recipientClaimToken: string | null = null;

        if (isTenantSender) {
            // Tenant is sender -> Recipient is landlord
            if (thread.listing_source === 'scraped') {
                const ghostLandlord = await GhostAccountModel.findOne({ id: thread.landlord_id }).lean<IGhostAccount>();
                recipientEmail = ghostLandlord?.email ?? null;
                recipientName = ghostLandlord?.name ?? 'Landlord';
                isRecipientGhostLandlord = true;
                if (ghostLandlord) {
                    try {
                        if (ghostLandlord.status === 'ghost') {
                            const updated = await this.ghostAccountService.issueClaimToken(ghostLandlord.id);
                            recipientClaimToken = updated.claim_token;
                        } else {
                            recipientClaimToken = ghostLandlord.claim_token;
                        }
                    } catch (claimErr) {
                        console.warn('Failed to get/issue claim token for ghost landlord in reply notification:', claimErr);
                    }
                }
            } else {
                const landlord = await UserModel.findOne({ id: thread.landlord_id }).lean();
                recipientEmail = landlord?.email ?? null;
                recipientName = [landlord?.firstName, landlord?.lastName].filter(Boolean).join(' ') || 'Landlord';
            }
        } else {
            // Landlord is sender -> Recipient is tenant
            const ghostTenant = await GhostAccountModel.findOne({ id: thread.ghost_tenant_id }).lean<IGhostAccount>();
            recipientEmail = ghostTenant?.email ?? null;
            recipientName = ghostTenant?.name ?? 'Guest';
        }

        // Send reply notification
        if (recipientEmail) {
            const senderName = message.sender_name ?? (isTenantSender ? 'Tenant' : 'Landlord');
            const threadUrl = `${process.env.FRONTEND_URL ?? 'https://proptii.co'}/thread/${threadToken}`;

            const emailData = EnquiryEmailTemplates.getReplyNotificationEmail({
                recipientName,
                senderName,
                listingTitle: thread.listing_title ?? 'property',
                messageBody: message.body,
                threadUrl,
                isRecipientLandlord: isTenantSender,
                isRecipientGhostLandlord,
                claimToken: recipientClaimToken,
            });

            await transporter.sendMail({
                from: fromAddress,
                to: recipientEmail,
                replyTo: isTenantSender ? undefined : thread.relay_email,
                subject: emailData.subject,
                text: emailData.text,
                html: emailData.html,
            });
        }

        // Trigger Claim Flow B if message_count is exactly 2 (the first reply)
        if (thread.message_count === 2) {
            // Check ghost tenant claim state
            const ghostTenant = await GhostAccountModel.findOne({ id: thread.ghost_tenant_id }).lean<IGhostAccount>();
            if (ghostTenant && ghostTenant.status === 'ghost') {
                const updatedTenant = await this.ghostAccountService.issueClaimToken(ghostTenant.id);
                await this.sendClaimEmail(updatedTenant, thread);
            }

            // Check ghost landlord claim state (if listing is scraped)
            if (thread.listing_source === 'scraped') {
                const ghostLandlord = await GhostAccountModel.findOne({ id: thread.landlord_id }).lean<IGhostAccount>();
                if (ghostLandlord && ghostLandlord.status === 'ghost') {
                    const updatedLandlord = await this.ghostAccountService.issueClaimToken(ghostLandlord.id);
                    await this.sendClaimEmail(updatedLandlord, thread);
                }
            }
        }
    }

    /**
     * Helper method to send the claim email to a ghost account (tenant or landlord).
     */
    async sendClaimEmail(ghostAccount: IGhostAccount, thread?: IEnquiryThread): Promise<void> {
        const env = validateEnv();
        const transporter = buildTransporter(env);
        if (!transporter) return;

        if (!ghostAccount.email) return;

        let finalThread = thread;
        if (!finalThread) {
            finalThread = await EnquiryThreadModel.findOne({
                $or: [
                    { ghost_tenant_id: ghostAccount.id },
                    { landlord_id: ghostAccount.id }
                ]
            }).sort({ created_at: -1 }).lean<IEnquiryThread>() || undefined;
        }

        if (!finalThread) {
            console.warn(`EmailRelayService: No thread found for ghost account ${ghostAccount.id} to send claim email.`);
            return;
        }

        const fromAddress = this.getFromAddress();

        if (ghostAccount.role === 'ghost_tenant') {
            const emailData = EnquiryEmailTemplates.getTenantClaimEmail({
                ghostTenant: ghostAccount,
                thread: finalThread,
            });

            await transporter.sendMail({
                from: fromAddress,
                to: ghostAccount.email,
                subject: emailData.subject,
                text: emailData.text,
                html: emailData.html,
            });
        } else if (ghostAccount.role === 'ghost_landlord') {
            const source = ghostAccount.source_platform === 'onthemove' 
                ? 'OnTheMove' 
                : (ghostAccount.source_platform === 'rightmarket' ? 'RightMarket' : 'external sources');
            
            const emailData = EnquiryEmailTemplates.getLandlordClaimEmail({
                ghostLandlord: ghostAccount,
                thread: finalThread,
                sourcePlatform: source,
            });

            await transporter.sendMail({
                from: fromAddress,
                to: ghostAccount.email,
                subject: emailData.subject,
                text: emailData.text,
                html: emailData.html,
            });
        }
    }
}
