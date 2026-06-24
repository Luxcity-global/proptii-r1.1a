import { EnquiryThread } from '../schemas/enquiry-thread.schema';
import { ThreadMessage } from '../schemas/thread-message.schema';
import { GhostAccount } from '../schemas/ghost-account.schema';

export interface EmailTemplateResult {
  subject: string;
  text: string;
  html: string;
}

export class EnquiryEmailTemplates {
  private static getFrontendUrl(): string {
    return process.env.FRONTEND_URL ?? 'https://proptii.co';
  }

  private static escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/\r?\n/g, '<br />');
  }

  private static cleanTitle(title: string | null | undefined): string {
    if (!title) return 'property';
    const trimmed = title.trim();
    if (trimmed.length <= 60) return trimmed;
    return trimmed.substring(0, 57) + '...';
  }

  private static buildHtmlLayout(opts: {
    title: string;
    greeting: string;
    introHtml: string;
    detailsHtml?: string;
    supportingHtml?: string;
    actionUrl?: string | null;
    actionLabel?: string | null;
    footerHtml?: string;
  }): string {
    const frontendUrl = this.getFrontendUrl();
    const actionButtonHtml = opts.actionUrl && opts.actionLabel
      ? `<div class="cta">
           <a href="${opts.actionUrl}" class="button">${opts.actionLabel}</a>
         </div>`
      : '';

    const footerContent = opts.footerHtml
      ? `${opts.footerHtml}
         <hr />
         <em>Proptii is a one-stop AI platform created for tenants, agents, and landlords to conduct and fulfill property transactions. Try it <a href="${frontendUrl}">here</a>.</em>`
      : `<p>Best regards,<br>The Proptii Team</p>
         <hr />
         <em>Proptii is a one-stop AI platform created for tenants, agents, and landlords to conduct and fulfill property transactions. Try it <a href="${frontendUrl}">here</a>.</em>`;

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f7fa; padding: 24px 0; margin: 0; }
    .container { max-width: 640px; margin: 0 auto; padding: 32px 24px; background: #ffffff; box-shadow: 0 8px 24px rgba(19, 108, 158, 0.12); border-radius: 12px; }
    .header { color: #136C9E; font-size: 24px; font-weight: 700; margin-bottom: 24px; }
    .details { background: #f5f8fb; padding: 20px; border-radius: 10px; margin: 20px 0; border: 1px solid rgba(19, 108, 158, 0.08); }
    .details h3 { margin-top: 0; color: #136C9E; font-size: 16px; }
    .details p { margin: 8px 0; }
    .footer { margin-top: 40px; font-size: 14px; color: #666; text-align: left; }
    .footer hr { border: none; border-top: 1px solid #e2e8f0; margin: 24px 0; }
    a { color: #136C9E; }
    .cta { text-align: center; margin: 28px 0; }
    .button { display: inline-block; background: linear-gradient(135deg, #DC5F12 0%, #FF6B1A 100%); color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(220, 95, 18, 0.25); }
    .muted { color: #4b5563; }
    .list { margin: 0; padding-left: 18px; }
    .list li { margin: 6px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">${opts.title}</div>
    <p>${opts.greeting}</p>
    ${opts.introHtml}
    
    ${opts.detailsHtml ?? ''}
    
    ${opts.supportingHtml ?? ''}
    
    ${actionButtonHtml}
    
    <div class="footer">
      ${footerContent}
    </div>
  </div>
</body>
</html>`;
  }

  // 1. Ghost Tenant Confirmation Email
  static getTenantEnquirySentEmail(opts: {
    thread: EnquiryThread;
    firstMessage: ThreadMessage;
    ghostTenant: GhostAccount;
    claimToken?: string | null;
  }): EmailTemplateResult {
    const frontendUrl = this.getFrontendUrl();
    const threadUrl = `${frontendUrl}/thread/${opts.thread.thread_token}`;
    const upgradeUrl = opts.claimToken
      ? `${frontendUrl}/claim?token=${opts.claimToken}`
      : `${frontendUrl}/register?email=${encodeURIComponent(opts.ghostTenant.email ?? '')}`;
    const address = this.cleanTitle(opts.thread.listing_title);

    const subject = `Your enquiry about ${address} has been sent`;
    const text = `Hi ${opts.ghostTenant.name ?? 'User'}\n\nYour enquiry has been sent to the landlord/agent for ${address}.\n\nMessage sent:\n"${opts.firstMessage.body}"\n\nYou can view and reply to this conversation here: ${threadUrl}\n\nCreate a free Proptii account to manage all your property enquiries in one place: ${upgradeUrl}\n\nBest,\nThe Proptii Team`;

    const html = this.buildHtmlLayout({
      title: 'Enquiry Sent 🎉',
      greeting: `Hi ${opts.ghostTenant.name ?? 'there'},`,
      introHtml: `<p>Your enquiry has been successfully sent to the landlord/agent for this property.</p>`,
      detailsHtml: `
        <div class="details">
          <h3>Enquiry Details</h3>
          <p><strong>Property:</strong> ${address}</p>
          <p><strong>Your Message:</strong> ${this.escapeHtml(opts.firstMessage.body)}</p>
        </div>
      `,
      supportingHtml: `
        <p>Want to keep track of all your enquiries, save properties, and book viewings easily?<br/>
        <a href="${upgradeUrl}">Create a free Proptii account today</a>.</p>
      `,
      actionUrl: threadUrl,
      actionLabel: '👉 View Conversation on Proptii'
    });

    return { subject, text, html };
  }

  // 1b. Ghost Tenant No-Delivery Email (scraped listing with no agent email)
  static getTenantNoDeliveryEmail(opts: {
    thread: EnquiryThread;
    firstMessage: ThreadMessage;
    ghostTenant: GhostAccount;
  }): EmailTemplateResult {
    const frontendUrl = this.getFrontendUrl();
    const threadUrl = `${frontendUrl}/thread/${opts.thread.thread_token}`;
    const address = this.cleanTitle(opts.thread.listing_title);

    const subject = `Your enquiry about ${address} — delivery note`;
    const text = `Hi ${opts.ghostTenant.name ?? 'User'},\n\nThanks for your enquiry about ${address}.\n\nUnfortunately, we couldn't find a contact email address for this agent on their listing, so we were unable to forward your enquiry to them directly.\n\nYour message has been saved on our platform. If the agent joins Proptii, they will receive it automatically.\n\nIn the meantime, you may want to contact the agent directly through the original listing portal.\n\nYou can still view your saved enquiry here: ${threadUrl}\n\nBest,\nThe Proptii Team`;

    const html = this.buildHtmlLayout({
      title: 'Delivery Note: Enquiry Received',
      greeting: `Hi ${opts.ghostTenant.name ?? 'there'},`,
      introHtml: `
        <p>Thanks for your enquiry about <strong>${address}</strong>.</p>
        <p class="muted">
          We couldn't find a contact email for this agent on their listing, so your enquiry couldn't be forwarded to them directly.
          Your message has been saved and will be delivered automatically if the agent registers on Proptii.
          We recommend also contacting them via the original listing portal.
        </p>
      `,
      detailsHtml: `
        <div class="details">
          <h3>Saved Enquiry Details</h3>
          <p><strong>Property:</strong> ${address}</p>
          <p><strong>Your Message:</strong> ${this.escapeHtml(opts.firstMessage.body)}</p>
        </div>
      `,
      actionUrl: threadUrl,
      actionLabel: '👉 View Saved Enquiry on Proptii'
    });

    return { subject, text, html };
  }

  // 2. Platform Landlord Notification Email (registered)
  static getLandlordNotificationEmail(opts: {
    thread: EnquiryThread;
    firstMessage: ThreadMessage;
    landlordEmail: string;
    landlordName: string;
  }): EmailTemplateResult {
    const frontendUrl = this.getFrontendUrl();
    const replyUrl = `${frontendUrl}/thread/${opts.thread.thread_token}`;
    const address = this.cleanTitle(opts.thread.listing_title);
    
    const messagePreview = opts.firstMessage.body.length > 80
      ? `${opts.firstMessage.body.substring(0, 80)}...`
      : opts.firstMessage.body;

    const subject = 'New enquiry on Proptii';
    const text = `Hi ${opts.landlordName},\n\nYou have received a new enquiry for ${address}.\n\nMessage preview:\n"${messagePreview}" (please log in to read the full message)\n\nPlease log in to your Proptii account to read the message and start chatting.\n\nLog in here: ${replyUrl}\n\nBest,\nThe Proptii Team`;

    const html = this.buildHtmlLayout({
      title: 'New Enquiry Received 🎉',
      greeting: `Hi ${opts.landlordName},`,
      introHtml: `<p>You have received a new enquiry for your property at <strong>${address}</strong>.</p>`,
      detailsHtml: `
        <div class="details">
          <h3>Enquiry Status</h3>
          <p><strong>Property:</strong> ${address}</p>
          <p><strong>Message preview:</strong> "${this.escapeHtml(messagePreview)}" <span class="muted">(please log in to read the full message)</span></p>
        </div>
      `,
      supportingHtml: `<p>To view the message details and start chatting with the tenant, please log in to your Proptii dashboard.</p>`,
      actionUrl: replyUrl,
      actionLabel: '👉 Log In to Proptii'
    });

    return { subject, text, html };
  }

  // 3. External Landlord Forwarded Email (Scraped)
  static getExternalLandlordForwardedEmail(opts: {
    thread: EnquiryThread;
    firstMessage: ThreadMessage;
    ghostTenant: GhostAccount;
    agentEmail: string;
    agentName: string | null;
    claimToken?: string | null;
  }): EmailTemplateResult {
    const frontendUrl = this.getFrontendUrl();
    const address = this.cleanTitle(opts.thread.listing_title);
    const optOutUrl = `${frontendUrl}/opt-out?email=${encodeURIComponent(opts.agentEmail)}`;
    const claimUrl = opts.claimToken
      ? `${frontendUrl}/claim?token=${opts.claimToken}&role=landlord`
      : `${frontendUrl}/register?email=${encodeURIComponent(opts.agentEmail)}&role=landlord`;

    const messagePreview = opts.firstMessage.body.length > 80
      ? `${opts.firstMessage.body.substring(0, 80)}...`
      : opts.firstMessage.body;

    const subject = 'New Lead from Proptii';
    const text = `Hi ${opts.agentName ?? 'there'},\n\nA prospective tenant is interested in your property listing at ${address}.\n\nMessage preview:\n"${messagePreview}" (please claim your account to read the full message)\n\nPlease create a Proptii account to claim this lead, read their message, and start chatting.\n\nClaim your account here: ${claimUrl}\n\nNote: This listing was found on public sources. If you wish to opt-out or unsubscribe from these leads, click here: ${optOutUrl}\n\nBest,\nThe Proptii Team`;

    const html = this.buildHtmlLayout({
      title: 'New Lead via Proptii ✉️',
      greeting: `Hi ${opts.agentName ?? 'there'},`,
      introHtml: `<p>A prospective tenant is interested in your property listing at <strong>${address}</strong>.</p>`,
      detailsHtml: `
        <div class="details">
          <h3>Lead Status</h3>
          <p><strong>Property:</strong> ${address}</p>
          <p><strong>Message preview:</strong> "${this.escapeHtml(messagePreview)}" <span class="muted">(please claim your account to view the full message)</span></p>
        </div>
      `,
      supportingHtml: `<p>To read their message, manage leads, and start chatting, please claim your free Proptii landlord account.</p>`,
      actionUrl: claimUrl,
      actionLabel: '👉 Claim My Landlord Account on Proptii',
      footerHtml: `
        <p>Best regards,<br>The Proptii Team</p>
        <hr />
        <p style="font-size: 0.8em; color: #888;">
          This email was sent on behalf of a tenant using Proptii. This listing was scraped from public portals.
          If you do not want to receive leads or wish to remove your listing from our platform,
          <a href="${optOutUrl}">click here to opt-out</a>.
        </p>
      `
    });

    return { subject, text, html };
  }

  // 4. Claim Email Template (Tenant)
  static getTenantClaimEmail(opts: {
    ghostTenant: GhostAccount;
    thread: EnquiryThread;
  }): EmailTemplateResult {
    const frontendUrl = this.getFrontendUrl();
    const claimUrl = `${frontendUrl}/claim?token=${opts.ghostTenant.claim_token}`;
    const threadUrl = `${frontendUrl}/thread/${opts.thread.thread_token}`;
    const address = this.cleanTitle(opts.thread.listing_title);

    const subject = 'You have a reply — claim your account to keep the conversation';
    const text = `Someone replied to your property enquiry!\n\nYou sent an enquiry about ${address}. The landlord/agent has replied.\n\nClaim your free account to view the full conversation, save properties, and manage your viewings:\n${claimUrl}\n\nAlternatively, view the reply without signing up here:\n${threadUrl}\n\nNote: This claim link expires in 30 days.\n\nBest,\nThe Proptii Team`;

    const html = this.buildHtmlLayout({
      title: 'Someone Replied! 🎉',
      greeting: `Hi ${opts.ghostTenant.name ?? 'there'},`,
      introHtml: `<p>You sent an enquiry about <strong>${address}</strong> and the landlord/agent has replied.</p>`,
      detailsHtml: `
        <div class="details">
          <h3>Enquiry Thread</h3>
          <p><strong>Property:</strong> ${address}</p>
          <p><strong>Status:</strong> New reply received</p>
        </div>
      `,
      supportingHtml: `
        <p>Claiming your account allows you to view the full conversation, save properties, and manage your viewings.<br/>
        Alternatively, you can <a href="${threadUrl}">view the reply without signing up</a>.</p>
      `,
      actionUrl: claimUrl,
      actionLabel: '👉 Claim My Account on Proptii',
      footerHtml: `
        <p>Best regards,<br>The Proptii Team</p>
        <hr />
        <p style="font-size: 0.8em; color: #888;">
          This claim link expires in 30 days. If you did not make this request, you can safely ignore this email or
          <a href="${frontendUrl}/unsubscribe">unsubscribe</a>.
        </p>
      `
    });

    return { subject, text, html };
  }

  // 5. Claim Email Template (Landlord — External / Ghost)
  static getLandlordClaimEmail(opts: {
    ghostLandlord: GhostAccount;
    thread: EnquiryThread;
    sourcePlatform: string;
  }): EmailTemplateResult {
    const frontendUrl = this.getFrontendUrl();
    const claimUrl = `${frontendUrl}/claim?token=${opts.ghostLandlord.claim_token}&role=landlord`;
    const address = this.cleanTitle(opts.thread.listing_title);
    const optOutUrl = `${frontendUrl}/opt-out?token=${opts.ghostLandlord.claim_token}&action=remove`;

    const subject = `A tenant enquired about your property — list it free on Proptii`;
    const text = `Someone is interested in your property!\n\nA prospective tenant has sent an enquiry about your listing at ${address} which we found on ${opts.sourcePlatform}.\n\nClaim your free landlord account to view the message, manage enquiries, respond directly, and list more properties:\n${claimUrl}\n\nIf you want to remove your listing from Proptii, click here: ${optOutUrl}\n\nBest,\nThe Proptii Team`;

    const html = this.buildHtmlLayout({
      title: 'Tenant Lead Available ✉️',
      greeting: `Hi ${opts.ghostLandlord.name ?? 'Landlord'},`,
      introHtml: `<p>A prospective tenant has sent an enquiry about your listing at <strong>${address}</strong> which we found on <strong>${opts.sourcePlatform}</strong>.</p>`,
      detailsHtml: `
        <div class="details">
          <h3>Lead Details</h3>
          <p><strong>Property:</strong> ${address}</p>
          <p><strong>Source:</strong> ${opts.sourcePlatform}</p>
        </div>
      `,
      supportingHtml: `
        <p>Claim your free landlord account to read their message, respond directly, and list more properties.</p>
      `,
      actionUrl: claimUrl,
      actionLabel: '👉 Claim My Landlord Account on Proptii',
      footerHtml: `
        <p>Best regards,<br>The Proptii Team</p>
        <hr />
        <p style="font-size: 0.8em; color: #888;">
          This listing was found on public portal ${opts.sourcePlatform}.
          If you would like to remove this listing and opt-out from future leads,
          <a href="${optOutUrl}">click here to remove your listing</a>.
        </p>
      `
    });

    return { subject, text, html };
  }

  // 6. Messaging Exchange Reply Notification Email
  static getReplyNotificationEmail(opts: {
    recipientName: string;
    senderName: string;
    listingTitle: string;
    messageBody: string;
    threadUrl: string;
    isRecipientLandlord?: boolean;
    isRecipientGhostLandlord?: boolean;
    claimToken?: string | null;
  }): EmailTemplateResult {
    const frontendUrl = this.getFrontendUrl();
    const senderName = opts.senderName;
    const listingTitle = this.cleanTitle(opts.listingTitle);
    
    const subject = opts.isRecipientLandlord
      ? `New message from ${senderName} on Proptii`
      : `New message from ${senderName} regarding ${listingTitle}`;

    const messagePreview = opts.messageBody.length > 80
      ? `${opts.messageBody.substring(0, 80)}...`
      : opts.messageBody;

    if (opts.isRecipientLandlord) {
      if (opts.isRecipientGhostLandlord) {
        const claimUrl = opts.claimToken
          ? `${frontendUrl}/claim?token=${opts.claimToken}&role=landlord`
          : `${frontendUrl}/register?role=landlord`;

        const text = `Hi ${opts.recipientName},\n\nYou have received a new reply from ${senderName} regarding the listing ${listingTitle}.\n\nMessage preview:\n"${messagePreview}" (please claim your account to read the full message)\n\nPlease claim your landlord account to read their message and start chatting.\n\nClaim your account here: ${claimUrl}\n\nBest,\nThe Proptii Team`;

        const html = this.buildHtmlLayout({
          title: 'New Reply Received ✉️',
          greeting: `Hi ${opts.recipientName},`,
          introHtml: `<p>You have received a new reply from <strong>${senderName}</strong> regarding the listing <strong>${listingTitle}</strong>.</p>`,
          detailsHtml: `
            <div class="details">
              <h3>New Message Status</h3>
              <p><strong>From:</strong> ${senderName}</p>
              <p><strong>Message preview:</strong> "${this.escapeHtml(messagePreview)}" <span class="muted">(please claim your account to view the full message)</span></p>
            </div>
          `,
          supportingHtml: `<p>To read their message and start chatting, please claim your free Proptii landlord account.</p>`,
          actionUrl: claimUrl,
          actionLabel: '👉 Claim My Landlord Account on Proptii'
        });

        return { subject, text, html };
      } else {
        const text = `Hi ${opts.recipientName},\n\nYou have received a new reply from ${senderName} regarding the listing ${listingTitle}.\n\nMessage preview:\n"${messagePreview}" (please log in to read the full message)\n\nPlease log in to your Proptii account to read their message and start chatting.\n\nLog in here: ${opts.threadUrl}\n\nBest,\nThe Proptii Team`;

        const html = this.buildHtmlLayout({
          title: 'New Reply Received ✉️',
          greeting: `Hi ${opts.recipientName},`,
          introHtml: `<p>You have received a new reply from <strong>${senderName}</strong> regarding the listing <strong>${listingTitle}</strong>.</p>`,
          detailsHtml: `
            <div class="details">
              <h3>New Message Status</h3>
              <p><strong>From:</strong> ${senderName}</p>
              <p><strong>Message preview:</strong> "${this.escapeHtml(messagePreview)}" <span class="muted">(please log in to view the full message)</span></p>
            </div>
          `,
          supportingHtml: `<p>To read their message and start chatting, please log in to your Proptii dashboard.</p>`,
          actionUrl: opts.threadUrl,
          actionLabel: '👉 Log In to Proptii'
        });

        return { subject, text, html };
      }
    } else {
      const text = `Hi ${opts.recipientName},\n\nYou have received a new reply from ${senderName} regarding the listing ${listingTitle}:\n\n"${opts.messageBody}"\n\nReply to this email directly or view the conversation here: ${opts.threadUrl}\n\nBest,\nThe Proptii Team`;

      const html = this.buildHtmlLayout({
        title: 'New Reply Received ✉️',
        greeting: `Hi ${opts.recipientName},`,
        introHtml: `<p>You have received a new reply from <strong>${senderName}</strong> regarding the listing <strong>${listingTitle}</strong>:</p>`,
        detailsHtml: `
          <div class="details">
            <h3>New Message</h3>
            <p><strong>From:</strong> ${senderName}</p>
            <p><strong>Message:</strong> ${this.escapeHtml(opts.messageBody)}</p>
          </div>
        `,
        supportingHtml: `<p class="muted">Or simply reply directly to this email to respond.</p>`,
        actionUrl: opts.threadUrl,
        actionLabel: '👉 View &amp; Reply on Proptii'
      });

      return { subject, text, html };
    }
  }
}
