import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EmailService } from './email.service';
import { GhostAccountService } from './ghost-account.service';
import { EnquiryEmailTemplates } from './enquiry-email-templates';
import { GhostAccount, GhostAccountDocument, GhostAccountStatus } from '../schemas/ghost-account.schema';
import { MongoUser, MongoUserDocument } from '../schemas/mongo-user.schema';
import { EnquiryThread, EnquiryThreadDocument } from '../schemas/enquiry-thread.schema';
import { ThreadMessage } from '../schemas/thread-message.schema';

export interface SendEnquiryEmailsOpts {
  thread: EnquiryThread;
  firstMessage: ThreadMessage;
  ghostTenant: GhostAccount;
  listingSource: 'native' | 'scraped';
  agentEmail: string | null;
  agentName: string | null;
  landlordId: string;
  /** Claim token issued at submission time. May be null for returning ghost tenants. */
  claimToken?: string | null;
}

@Injectable()
export class EmailRelayService {
  private readonly logger = new Logger(EmailRelayService.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly ghostAccountService: GhostAccountService,
    @InjectModel(GhostAccount.name)
    private readonly ghostAccountModel: Model<GhostAccountDocument>,
    @InjectModel(MongoUser.name)
    private readonly mongoUserModel: Model<MongoUserDocument>,
    @InjectModel(EnquiryThread.name)
    private readonly enquiryThreadModel: Model<EnquiryThreadDocument>,
  ) {}

  /**
   * Sends the initial emails when an enquiry is created:
   *   - Confirmation email to the ghost tenant
   *   - Notification or forwarded enquiry to the landlord (platform or external)
   */
  async sendEnquiryEmails(opts: SendEnquiryEmailsOpts): Promise<void> {
    // 1. Send confirmation to the ghost tenant
    if (opts.ghostTenant.email) {
      const tenantEmailData = EnquiryEmailTemplates.getTenantEnquirySentEmail({
        thread: opts.thread,
        firstMessage: opts.firstMessage,
        ghostTenant: opts.ghostTenant,
        claimToken: opts.claimToken ?? null,
      });

      try {
        await this.emailService.sendEmail({
          to: opts.ghostTenant.email,
          subject: tenantEmailData.subject,
          text: tenantEmailData.text,
          html: tenantEmailData.html,
        });
      } catch (err) {
        this.logger.error(`Failed to send confirmation email to tenant: ${opts.ghostTenant.email}`, err);
      }
    }

    // 2. Send enquiry to the landlord
    if (opts.listingSource === 'scraped') {
      // Scraped listing -> Forward to external agent email if available
      if (opts.agentEmail) {
        let claimToken: string | null = null;
        let isClaimedLandlord = false;
        let landlordUser: any = null;

        try {
          const ghostLandlord = await this.ghostAccountModel.findOne({ id: opts.landlordId });
          if (ghostLandlord) {
            if (ghostLandlord.status === 'claimed' && ghostLandlord.linked_user_id) {
              isClaimedLandlord = true;
              landlordUser = await this.mongoUserModel.findOne({ id: ghostLandlord.linked_user_id }).lean();
            } else {
              // Issue/regenerate claim token if not claimed
              const updated = await this.ghostAccountService.issueClaimToken(ghostLandlord.id);
              claimToken = updated.claim_token;
            }
          }
        } catch (claimErr) {
          this.logger.warn(`Failed to get/issue claim token for ghost landlord: ${opts.landlordId}`, claimErr);
        }

        if (isClaimedLandlord && landlordUser && landlordUser.email) {
          const landlordName = [landlordUser.firstName, landlordUser.lastName].filter(Boolean).join(' ') || 'Landlord';
          const landlordEmailData = EnquiryEmailTemplates.getLandlordNotificationEmail({
            thread: opts.thread,
            firstMessage: opts.firstMessage,
            landlordEmail: landlordUser.email,
            landlordName,
          });

          try {
            await this.emailService.sendEmail({
              to: landlordUser.email,
              subject: landlordEmailData.subject,
              text: landlordEmailData.text,
              html: landlordEmailData.html,
            });
          } catch (err) {
            this.logger.error(`Failed to send notification email to claimed platform landlord: ${landlordUser.email}`, err);
          }
        } else {
          const agentEmailData = EnquiryEmailTemplates.getExternalLandlordForwardedEmail({
            thread: opts.thread,
            firstMessage: opts.firstMessage,
            ghostTenant: opts.ghostTenant,
            agentEmail: opts.agentEmail,
            agentName: opts.agentName,
            claimToken,
          });

          try {
            await this.emailService.sendEmail({
              to: opts.agentEmail,
              subject: agentEmailData.subject,
              text: agentEmailData.text,
              html: agentEmailData.html,
            });
          } catch (err) {
            this.logger.error(`Failed to forward enquiry to scraped landlord/agent: ${opts.agentEmail}`, err);
          }
        }
      } else {
        // No agent contact email — send a fallback email to the tenant
        // explaining that delivery couldn't be confirmed, instead of silently failing.
        if (opts.ghostTenant.email) {
          const noDeliveryEmailData = EnquiryEmailTemplates.getTenantNoDeliveryEmail({
            thread: opts.thread,
            firstMessage: opts.firstMessage,
            ghostTenant: opts.ghostTenant,
          });
          try {
            await this.emailService.sendEmail({
              to: opts.ghostTenant.email,
              subject: noDeliveryEmailData.subject,
              text: noDeliveryEmailData.text,
              html: noDeliveryEmailData.html,
            });
          } catch (err) {
            this.logger.error(`Failed to send no-delivery fallback email to tenant: ${opts.ghostTenant.email}`, err);
          }
        }
        this.logger.log(`Scraped listing has no contact email. Fallback email sent to tenant. Thread: ${opts.thread.id}`);
      }
    } else {
      // Native listing -> Find registered platform landlord
      const landlord = await this.mongoUserModel.findOne({ id: opts.landlordId }).lean();
      if (landlord && landlord.email) {
        const landlordName = [landlord.firstName, landlord.lastName].filter(Boolean).join(' ') || 'Landlord';
        const landlordEmailData = EnquiryEmailTemplates.getLandlordNotificationEmail({
          thread: opts.thread,
          firstMessage: opts.firstMessage,
          landlordEmail: landlord.email,
          landlordName,
        });

        try {
          await this.emailService.sendEmail({
            to: landlord.email,
            subject: landlordEmailData.subject,
            text: landlordEmailData.text,
            html: landlordEmailData.html,
          });
        } catch (err) {
          this.logger.error(`Failed to send notification email to platform landlord: ${landlord.email}`, err);
        }
      } else {
        this.logger.warn(`Platform landlord ${opts.landlordId} not found or has no email.`);
      }
    }
  }

  /**
   * Sends a notification email when a reply is posted to a thread.
   * Also checks if this is the first reply on a thread involving ghost accounts,
   * and triggers the claim email sequence if so.
   */
  async sendReplyNotification(threadToken: string, message: ThreadMessage): Promise<void> {
    // Load thread
    const thread = await this.enquiryThreadModel.findOne({ thread_token: threadToken }).lean<EnquiryThread>();
    if (!thread) return;

    // Load the sender and recipient details
    const isTenantSender = message.sender_type === 'ghost_tenant';
    
    let recipientEmail: string | null = null;
    let recipientName: string | null = null;
    let isRecipientGhostLandlord = false;
    let recipientClaimToken: string | null = null;

    if (isTenantSender) {
      // Tenant is sender -> Recipient is landlord
      if (thread.listing_source === 'scraped') {
        const ghostLandlord = await this.ghostAccountModel.findOne({ id: thread.landlord_id }).lean<GhostAccount>();
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
            this.logger.warn(`Failed to get/issue claim token for ghost landlord in reply notification: ${ghostLandlord.id}`, claimErr);
          }
        }
      } else {
        const landlord = await this.mongoUserModel.findOne({ id: thread.landlord_id }).lean();
        recipientEmail = landlord?.email ?? null;
        recipientName = [landlord?.firstName, landlord?.lastName].filter(Boolean).join(' ') || 'Landlord';
      }
    } else {
      // Landlord is sender -> Recipient is tenant
      const ghostTenant = await this.ghostAccountModel.findOne({ id: thread.ghost_tenant_id }).lean<GhostAccount>();
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

      try {
        await this.emailService.sendEmail({
          to: recipientEmail,
          replyTo: isTenantSender ? undefined : thread.relay_email,
          subject: emailData.subject,
          text: emailData.text,
          html: emailData.html,
        });
      } catch (err) {
        this.logger.error(`Failed to send reply notification email to: ${recipientEmail}`, err);
      }
    }

    // Trigger Claim Flow B if message_count is exactly 2 (the first reply)
    if (thread.message_count === 2) {
      // Check ghost tenant claim state
      const ghostTenant = await this.ghostAccountModel.findOne({ id: thread.ghost_tenant_id }).lean<GhostAccount>();
      if (ghostTenant && ghostTenant.status === 'ghost') {
        const updatedTenant = await this.ghostAccountService.issueClaimToken(ghostTenant.id);
        await this.sendClaimEmail(updatedTenant, thread);
      }

      // Check ghost landlord claim state (if listing is scraped)
      if (thread.listing_source === 'scraped') {
        const ghostLandlord = await this.ghostAccountModel.findOne({ id: thread.landlord_id }).lean<GhostAccount>();
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
  async sendClaimEmail(ghostAccount: GhostAccount, thread?: EnquiryThread): Promise<void> {
    if (!ghostAccount.email) return;

    let finalThread = thread;
    if (!finalThread) {
      finalThread = await this.enquiryThreadModel.findOne({
        $or: [
          { ghost_tenant_id: ghostAccount.id },
          { landlord_id: ghostAccount.id }
        ]
      }).sort({ created_at: -1 }).lean<EnquiryThread>() || undefined;
    }

    if (!finalThread) {
      this.logger.warn(`No thread found for ghost account ${ghostAccount.id} to send claim email.`);
      return;
    }

    if (ghostAccount.role === 'ghost_tenant') {
      const emailData = EnquiryEmailTemplates.getTenantClaimEmail({
        ghostTenant: ghostAccount,
        thread: finalThread,
      });

      try {
        await this.emailService.sendEmail({
          to: ghostAccount.email,
          subject: emailData.subject,
          text: emailData.text,
          html: emailData.html,
        });
      } catch (err) {
        this.logger.error(`Failed to send tenant claim email to: ${ghostAccount.email}`, err);
      }
    } else if (ghostAccount.role === 'ghost_landlord') {
      const source = ghostAccount.source_platform === 'onthemove' 
        ? 'OnTheMove' 
        : (ghostAccount.source_platform === 'rightmarket' ? 'RightMarket' : 'external sources');
      
      const emailData = EnquiryEmailTemplates.getLandlordClaimEmail({
        ghostLandlord: ghostAccount,
        thread: finalThread,
        sourcePlatform: source,
      });

      try {
        await this.emailService.sendEmail({
          to: ghostAccount.email,
          subject: emailData.subject,
          text: emailData.text,
          html: emailData.html,
        });
      } catch (err) {
        this.logger.error(`Failed to send landlord claim email to: ${ghostAccount.email}`, err);
      }
    }
  }
}
