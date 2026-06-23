import { validateEnv } from '../config/environment';
import { buildTransporter } from './NotificationService';

export class LeadService {
    async sendLeadEmail(
        agentEmail: string,
        tenantName: string,
        propertyTitle: string,
        messageBody: string,
        propertyId: string,
    ): Promise<void> {
        const env = validateEnv();
        const transporter = buildTransporter(env);

        if (!transporter) {
            console.warn('LeadService: No email transporter configured. Proxy email not sent.');
            return;
        }

        const fromAddress = env.EMAIL_FROM_ADDRESS ?? 'leads@reply.proptii.co';
        const frontendUrl = process.env.FRONTEND_URL ?? 'https://proptii.co';
        const claimUrl = `${frontendUrl}/claim-listing?propertyId=${encodeURIComponent(propertyId)}`;
        const optOutUrl = `${frontendUrl}/opt-out?email=${encodeURIComponent(agentEmail)}`;

        const messagePreview = messageBody.length > 80
            ? `${messageBody.substring(0, 80)}...`
            : messageBody;

        await transporter.sendMail({
            from: fromAddress,
            to: agentEmail,
            subject: 'New Lead from Proptii',
            text: `Hi,\n\n${tenantName} is interested in your property at ${propertyTitle}.\n\nMessage preview:\n"${messagePreview}" (please claim your listing on Proptii to read the full message)\n\nClaim this listing on Proptii to reply directly: ${claimUrl}\n\nNote: If you do not want to receive these leads or want to remove your listing from Proptii, click here: ${optOutUrl}\n\nThe Proptii Team`,
            html: `
                <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                    <h2 style="color: #D95B00;">New Lead via Proptii</h2>
                    <p>Hi,</p>
                    <p><strong>${tenantName}</strong> is interested in your property at <strong>${propertyTitle}</strong>.</p>
                    <blockquote style="border-left: 4px solid #ccc; padding-left: 10px; color: #555; margin: 20px 0; font-style: italic;">
                        "${messagePreview}" <span style="color: #888;">(please claim your listing to read the full message)</span>
                    </blockquote>
                    <p><strong><a href="${claimUrl}" style="color: #D95B00; font-weight: bold; text-decoration: underline;">Claim this listing on Proptii</a></strong> to reply directly and manage your leads.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
                    <p style="font-size: 0.8em; color: #888;">
                        This email was sent on behalf of a user on Proptii. If you wish to opt-out or unsubscribe from these leads, 
                        <a href="${optOutUrl}" style="color: #D95B00;">click here to opt-out</a>.
                    </p>
                </div>
            `,
        });
    }
}
