export interface ContractReviewEmailData {
  recipientName: string;
  contractTitle: string;
  additionalInfo?: string;
  expiryDate?: Date;
  attachmentError?: string;
}

const getBaseUrl = (): string => {
  const viteAppUrl = (import.meta as { env?: { VITE_APP_URL?: string; DEV?: boolean } })?.env?.VITE_APP_URL;
  if (viteAppUrl?.trim()) return viteAppUrl.trim();
  if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin;
  const isDev = (import.meta as { env?: { DEV?: boolean } })?.env?.DEV ?? false;
  return isDev ? 'http://localhost:5173' : 'https://proptii.co';
};

const contractEmailBaseStyles = `
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
  .attachment-notice { background: #e0f2fe; padding: 16px; border-radius: 10px; margin: 20px 0; text-align: center; border: 1px solid #bae6fd; }
  .attachment-notice strong { color: #DC5F12; }
  .warning-notice { background: #fff3cd; padding: 16px; border-radius: 10px; margin: 20px 0; border: 1px solid #ffc107; }
  .list { margin: 0; padding-left: 18px; }
  .list li { margin: 6px 0; }
`;

export function generateContractReviewEmailTemplate(data: ContractReviewEmailData): string {
  const baseUrl = getBaseUrl();
  const firstName = data.recipientName?.trim().split(/\s+/)[0] || 'there';
  const expiryText = data.expiryDate
    ? `<p><strong>Review by:</strong> ${data.expiryDate.toLocaleDateString('en-GB', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}</p>`
    : '';

  const attachmentBlock = data.attachmentError
    ? `<div class="warning-notice"><p><strong>Notice:</strong> ${data.attachmentError}</p></div>`
    : `<div class="attachment-notice">
         <strong>Contract attached</strong><br>
         The contract document is attached to this email. You can also open it in Proptii.
       </div>`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>${contractEmailBaseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">Contract for Review</div>

    <p>Hi ${firstName},</p>

    <p>You have received a contract document for your review. Please read it carefully and take any action required.</p>

    <div class="details">
      <h3>Contract Details</h3>
      <p><strong>Document:</strong> ${data.contractTitle}</p>
      ${expiryText}
      ${data.additionalInfo ? `<p><strong>Message from sender:</strong><br>${data.additionalInfo}</p>` : ''}
    </div>

    ${attachmentBlock}

    <div class="details">
      <h3>Next Steps</h3>
      <ul class="list">
        <li>Review the attached contract document</li>
        <li>Open it in Proptii to sign or respond</li>
        <li>Contact your landlord or agent if you have questions</li>
      </ul>
    </div>

    <div class="cta">
      <a href="${baseUrl}/contracts?tab=received" class="button">View Contract on Proptii</a>
    </div>

    <div class="footer">
      <p>Best regards,<br>Proptii Team</p>
      <hr />
      <em>Proptii is a one-stop AI platform created for tenants, agents, and landlords to conduct and fulfill property transactions. Try it <a href="https://proptii.co">here</a>.</em>
    </div>
  </div>
</body>
</html>`;
}
