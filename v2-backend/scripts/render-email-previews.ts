/**
 * Writes one HTML file per outgoing Proptii email so the shared layout can be reviewed.
 * Sample names and addresses are fictional. Run from v2-backend:
 *   npx ts-node --transpile-only scripts/render-email-previews.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import { proptiiButton, renderProptiiEmail } from '../src/utils/emailLayout';

const outDir = path.resolve(__dirname, '../../docs/features/email-templates/standardised');

const pages: Array<{ file: string; title: string; when: string; html: string }> = [
  {
    file: '01-new-message.html',
    title: 'New message',
    when: 'A user receives a new conversation message. Guests get a claim link; registered users get a login link.',
    html: renderProptiiEmail({
      title: 'New Message on Proptii',
      buttonLabel: 'View and Reply',
      buttonHref: 'https://proptii.co/login',
      bodyHtml: `
        <p>Hello Alex,</p>
        <p>You have received a new message from <strong>Jordan Lee</strong> regarding <strong>10 High Street</strong>.</p>
        <p style="font-size:0.85em;color:#666;">If the button doesn't work, copy and paste this link:<br><a href="https://proptii.co/login">https://proptii.co/login</a></p>
      `,
    }),
  },
  {
    file: '02-claim-account.html',
    title: 'Claim account',
    when: 'A guest is invited to claim a Proptii account after receiving messages.',
    html: renderProptiiEmail({
      title: 'Claim your Proptii account',
      buttonLabel: 'Claim Account',
      buttonHref: 'https://proptii.co/claim?token=sample',
      bodyHtml: `
        <p>Click the link below to claim your account and view your messages securely.</p>
        <p style="font-size:0.85em;color:#666;">If the button doesn't work, copy and paste this link:<br><a href="https://proptii.co/claim?token=sample">https://proptii.co/claim?token=sample</a></p>
      `,
    }),
  },
  {
    file: '03-referencing-share-existing-account.html',
    title: 'Referencing passport shared (existing account)',
    when: 'A tenant shares a referencing passport with a landlord or agent who already has an account.',
    html: renderProptiiEmail({
      title: 'Referencing Passport Received',
      bodyHtml: `
        <p>Hello Sam,</p>
        <p><strong>Alex Tenant</strong> has shared their referencing passport with you on Proptii. They are interested in the property at <strong>10 High Street</strong>.</p>
        <div class="details"><p><strong>Message from Alex Tenant:</strong><br/>Please review my completed referencing.</p></div>
        <p>Open the passport to review their referencing details and documents.</p>
        ${proptiiButton('View Referencing Passport', 'https://proptii.co/view-passport?token=sample')}
        <p style="font-size:13px;color:#6b7280;text-align:center;"><a href="https://proptii.co/login?redirect=%2Freferencing%2Fview%2Fsample">Log in</a> to message Alex Tenant from your dashboard.</p>
        <p style="font-size:12px;color:#9ca3af;">This link expires on <strong>8 November 2026</strong>. If you did not expect this email, you can safely ignore it.</p>
      `,
    }),
  },
  {
    file: '04-referencing-share-new-recipient.html',
    title: 'Referencing passport shared (no account)',
    when: 'A tenant shares a referencing passport with someone who does not have an account yet.',
    html: renderProptiiEmail({
      title: "You've Received a Referencing Passport",
      bodyHtml: `
        <p>Hello,</p>
        <p><strong>Alex Tenant</strong> has shared their referencing passport with you via Proptii. They are applying for the property at <strong>10 High Street</strong>.</p>
        ${proptiiButton('View Referencing Passport', 'https://proptii.co/view-passport?token=sample')}
        <p style="font-size:13px;color:#6b7280;text-align:center;">No account needed to view. <a href="https://proptii.co/claim-referencing?token=sample">Create a free account</a> to message Alex Tenant and manage their application.</p>
        <p style="font-size:12px;color:#9ca3af;">This link expires on <strong>1 November 2026</strong>. If you did not expect this email, you can safely ignore it.</p>
      `,
    }),
  },
  {
    file: '05-referencing-request.html',
    title: 'Referencing request',
    when: 'A landlord asks a tenant to complete referencing.',
    html: renderProptiiEmail({
      title: 'Referencing Request',
      buttonLabel: 'Complete My Referencing',
      buttonHref: 'https://proptii.co/referencing',
      bodyHtml: `
        <p>Hello Alex,</p>
        <p><strong>Sam Agent</strong> has asked you to complete your referencing on Proptii.</p>
        <p>They are requesting your referencing details in connection with the property at <strong>10 High Street</strong>.</p>
        <p>Proptii referencing is quick to complete. Fill it in once and share it with as many landlords or agents as you need — no re-filling required.</p>
        <p style="font-size:13px;color:#6b7280;">If the button doesn't work, copy this link into your browser:<br><a href="https://proptii.co/referencing">https://proptii.co/referencing</a></p>
      `,
    }),
  },
  {
    file: '06-referencing-application-to-agent.html',
    title: 'Referencing application to the agent',
    when: 'The referencing application summary prepared for the agent. This is the layout the other emails now follow.',
    html: renderProptiiEmail({
      title: 'Referencing Application',
      buttonLabel: 'Review Documents in Proptii',
      buttonHref: 'https://proptii.co/landlord/clients',
      bodyHtml: `
        <p>Hi Sam,</p>
        <p>Alex Tenant has uploaded their verification documents. 10 High Street</p>
        <p>The documents include:</p>
        <div class="section">
          <div class="section-title">Tenant Information</div>
          <div class="info-item">First Name: Alex</div>
          <div class="info-item">Last Name: Tenant</div>
          <div class="info-item">Email Address: alex@tenant.test</div>
        </div>
        <div class="section">
          <div class="section-title">Employment Details</div>
          <div class="info-item">Employment Status: Employed</div>
          <div class="info-item">Company Details: Example Ltd</div>
        </div>
        <p>Once completed, you will receive the confirmation forms from the Referee and Guarantor. Please review all submissions and verify the documents. Once confirmed, you may proceed to accept the user as a tenant.</p>
        <p>If you need any assistance during the verification process, please contact our support team through your Proptii dashboard.</p>
      `,
    }),
  },
  {
    file: '07-referee-questionnaire.html',
    title: 'Referee questionnaire',
    when: 'A referee is asked to complete a reference form.',
    html: renderProptiiEmail({
      title: 'Proptii Referencing Request',
      buttonLabel: 'Complete Reference Form',
      buttonHref: 'https://proptii.co/reference/sample',
      bodyHtml: `
        <p>Hi,</p>
        <p>You have been asked to provide a <strong>reference</strong> for <strong>Alex Tenant</strong> as part of their rental application.</p>
        <p>Please click the link below to complete the form.</p>
        <p>If you have any questions, please contact us at <a href="mailto:contactus@theluxcity.co.uk">contactus@theluxcity.co.uk</a>.</p>
      `,
    }),
  },
  {
    file: '08-guarantor-questionnaire.html',
    title: 'Guarantor questionnaire',
    when: 'A guarantor is asked to complete a confirmation form from the referencing email endpoint.',
    html: renderProptiiEmail({
      title: 'Proptii Referencing Request',
      buttonLabel: 'Complete Guarantor Form',
      buttonHref: 'https://proptii.co/guarantor/sample',
      bodyHtml: `
        <p>Hi,</p>
        <p>You have been asked to provide a <strong>guarantor confirmation</strong> for <strong>Alex Tenant</strong> as part of their rental application.</p>
        <p>Please click the link below to complete the form.</p>
        <p>If you have any questions, please contact us at <a href="mailto:contactus@theluxcity.co.uk">contactus@theluxcity.co.uk</a>.</p>
      `,
    }),
  },
  {
    file: '09-guarantor-invitation.html',
    title: 'Guarantor invitation',
    when: 'A tenant invites a guarantor with a secure form link.',
    html: renderProptiiEmail({
      title: 'Guarantor Request',
      buttonLabel: 'Complete Guarantor Form',
      buttonHref: 'https://proptii.co/guarantor-form/sample',
      bodyHtml: `
        <p>Hi Riley,</p>
        <p><strong>Alex Tenant</strong> has listed you as their guarantor for their rental application on Proptii.</p>
        <div class="details"><p style="font-style: italic;">"Please complete this when you can."</p></div>
        <p>Please click the button below to review the request, enter your details, and securely upload your ID document.</p>
        <p style="font-size: 13px; color: #64748b;">If the button above does not work, copy and paste this link into your browser:<br><a href="https://proptii.co/guarantor-form/sample">https://proptii.co/guarantor-form/sample</a></p>
      `,
    }),
  },
  {
    file: '10-guarantor-invitation-tenant.html',
    title: 'Guarantor invitation sent (tenant copy)',
    when: 'The tenant is told that the guarantor invitation went out.',
    html: renderProptiiEmail({
      title: 'Guarantor Invitation Dispatched',
      buttonLabel: 'Open Proptii',
      buttonHref: 'https://proptii.co',
      bodyHtml: `
        <p>Hi Alex,</p>
        <p>We've sent an invitation email to your guarantor, <strong>Riley Cole</strong> (<em>riley@guarantor.test</em>), with instructions to complete their guarantor section.</p>
        <p>You can also share this direct link with them if needed:</p>
        <div class="details" style="word-break: break-all;">https://proptii.co/guarantor-form/sample</div>
        <p>We will notify you via email as soon as Riley Cole completes their submission.</p>
      `,
    }),
  },
  {
    file: '11-guarantor-completed-tenant.html',
    title: 'Guarantor form completed (tenant)',
    when: 'The tenant is told their guarantor submitted the form.',
    html: renderProptiiEmail({
      title: 'Guarantor Verification Received',
      buttonLabel: 'View Referencing Passport',
      buttonHref: 'https://proptii.co/dashboard/tenant-referencing',
      bodyHtml: `
        <p>Hi Alex,</p>
        <p>Your guarantor, <strong>Riley Cole</strong> (<em>riley@guarantor.test</em>), has successfully submitted their guarantor details and verification on Proptii.</p>
        <div class="details">
          <p style="margin:0;font-weight:bold;">Status: Guarantor Section Complete</p>
          <p>Your referencing passport has been automatically updated with their submitted details.</p>
        </div>
      `,
    }),
  },
  {
    file: '12-guarantor-completed-guarantor.html',
    title: 'Guarantor form completed (guarantor receipt)',
    when: 'The guarantor receives a receipt after submitting.',
    html: renderProptiiEmail({
      title: 'Thank You for Your Submission',
      buttonLabel: 'Open Proptii',
      buttonHref: 'https://proptii.co',
      bodyHtml: `
        <p>Hi Riley,</p>
        <p>Thank you for submitting your guarantor verification and information for <strong>Alex Tenant</strong>'s rental application.</p>
        <p>Your details have been securely recorded and attached to the application.</p>
        <p>If you have any questions or did not authorize this, please contact <a href="mailto:contactus@theluxcity.co.uk">contactus@theluxcity.co.uk</a>.</p>
      `,
    }),
  },
  {
    file: '13-viewing-request-agent.html',
    title: 'Viewing request (agent)',
    when: 'A tenant requests a viewing. The agent receives this email.',
    html: renderProptiiEmail({
      title: 'New viewing request',
      bodyHtml: `
        <p>Hi Sam Agent,</p>
        <p>You've received a new viewing request for 10 High Street.</p>
        <div class="details">
          <h3>Here are the details</h3>
          <p>Requested by: Alex Tenant</p>
          <p>Preferred date/time: Wednesday, 15 October 2026 at 2:00 PM</p>
          <p>Contact email: alex@tenant.test</p>
          <p>Phone number: 07123 456789</p>
        </div>
        <p>If the property is available, please review the request and confirm the appointment at your earliest convenience.</p>
        <p>Please send your response to alex@tenant.test.</p>
        ${proptiiButton('Manage Viewing Requests on Proptii', 'https://proptii.co/landlord/viewings')}
        <p>New to Proptii? If you don't have an account yet, <a href="https://proptii.co/landlord/register">register here</a> to manage viewing requests, track confirmed viewings, message tenants, and open your landlord dashboard.</p>
      `,
    }),
  },
  {
    file: '14-viewing-request-tenant.html',
    title: 'Viewing request (tenant confirmation)',
    when: 'A tenant requests a viewing and receives a copy of what they submitted.',
    html: renderProptiiEmail({
      title: 'Your viewing request',
      buttonLabel: 'View My Viewing Requests on Proptii',
      buttonHref: 'https://proptii.co/dashboard/viewings',
      bodyHtml: `
        <p>Hi Alex,</p>
        <p>Your viewing request for 10 High Street has been sent to the agent.</p>
        <div class="details">
          <h3>Here's a summary of what you submitted</h3>
          <p>Date/time requested: Wednesday, 15 October 2026 at 2:00 PM</p>
          <p>Agent: Sam Agent</p>
          <p>Address: 10 High Street</p>
        </div>
        <p>The agent will contact you shortly to confirm the appointment.</p>
        <p>Thanks for using Proptii.</p>
      `,
    }),
  },
  {
    file: '15-viewing-scheduled-by-landlord.html',
    title: 'Viewing scheduled by landlord',
    when: 'A landlord or agent schedules a viewing from Request Viewing and emails the applicant.',
    html: renderProptiiEmail({
      title: 'Your viewing is scheduled',
      buttonLabel: 'View My Viewings on Proptii',
      buttonHref: 'https://proptii.co/dashboard/viewings',
      bodyHtml: `
        <p>Hi Alex,</p>
        <p>Sam Agent has scheduled a property viewing for you.</p>
        <div class="details">
          <p><strong>Property:</strong> 10 High Street</p>
          <p><strong>When:</strong> 2026-10-15 at 14:00</p>
          <p><strong>Type:</strong> in-person</p>
        </div>
        <p>Sign in to Proptii to see it under Viewings.</p>
      `,
    }),
  },
  {
    file: '16-viewing-confirmed.html',
    title: 'Viewing confirmed',
    when: 'A landlord confirms a viewing, or schedules one from a pending request. The tenant is notified.',
    html: renderProptiiEmail({
      title: 'Viewing Confirmed - 10 High Street',
      buttonLabel: 'Open Proptii',
      buttonHref: 'https://proptii.co',
      bodyHtml: `
        <div class="details">
          <p><strong>Property:</strong> 10 High Street, London</p>
          <p><strong>Date:</strong> 2026-10-15</p>
          <p><strong>Time:</strong> 14:00</p>
          <p><strong>Type:</strong> in-person</p>
          <p><strong>From:</strong> Sam Agent</p>
        </div>
      `,
    }),
  },
  {
    file: '17-viewing-reschedule.html',
    title: 'Viewing reschedule',
    when: 'Either side asks to move a viewing. The other party receives this notice.',
    html: renderProptiiEmail({
      title: 'Viewing Reschedule Request - 10 High Street',
      buttonLabel: 'Open Proptii',
      buttonHref: 'https://proptii.co',
      bodyHtml: `
        <div class="details">
          <p><strong>Property:</strong> 10 High Street, London</p>
          <p><strong>Date:</strong> 2026-10-20</p>
          <p><strong>Time:</strong> 11:00</p>
          <p><strong>Type:</strong> in-person</p>
          <p><strong>From:</strong> Alex Tenant (alex@tenant.test)</p>
          <p><strong>Message:</strong> Could we move this to the morning?</p>
        </div>
      `,
    }),
  },
  {
    file: '18-viewing-cancellation.html',
    title: 'Viewing cancellation',
    when: 'Either side cancels a viewing and the other party is notified.',
    html: renderProptiiEmail({
      title: 'Viewing Cancellation - 10 High Street',
      buttonLabel: 'Open Proptii',
      buttonHref: 'https://proptii.co',
      bodyHtml: `
        <div class="details">
          <p><strong>Property:</strong> 10 High Street, London</p>
          <p><strong>Date:</strong> 2026-10-15</p>
          <p><strong>Time:</strong> 14:00</p>
          <p><strong>From:</strong> Alex Tenant (alex@tenant.test)</p>
          <p><strong>Message:</strong> I can no longer attend.</p>
        </div>
      `,
    }),
  },
  {
    file: '19-contract-for-review.html',
    title: 'Contract for review',
    when: 'A landlord sends a contract document for the recipient to review. The PDF is attached.',
    html: renderProptiiEmail({
      title: 'Contract for Review',
      buttonLabel: 'View Contracts',
      buttonHref: 'https://proptii.co/contracts',
      bodyHtml: `
        <p>Hello Alex!</p>
        <p>Please find attached your contract for review.</p>
        <div class="details">
          <h3>Assured shorthold tenancy — 10 High Street</h3>
          <p><strong>Expiry Date:</strong> 1 November 2026</p>
          <p><strong>Additional Information:</strong><br>Please sign by Friday.</p>
        </div>
        <p>The contract document is attached to this email. Please review it and follow the instructions provided.</p>
      `,
    }),
  },
  {
    file: '20-contract-test-email.html',
    title: 'Contract test email',
    when: 'The contracts page sends a test email with no attachment.',
    html: renderProptiiEmail({
      title: 'Test Email from Proptii',
      buttonLabel: 'View Contracts',
      buttonHref: 'https://proptii.co/contracts',
      bodyHtml: `
        <p>Hello Alex!</p>
        <p>This is a test email from Proptii Property Management System.</p>
      `,
    }),
  },
  {
    file: '21-signed-contract.html',
    title: 'Signed contract',
    when: 'A signed contract PDF is emailed. The server sends this copy; the attachment is unchanged.',
    html: renderProptiiEmail({
      title: 'Signed Document Available',
      buttonLabel: 'Open Proptii',
      buttonHref: 'https://proptii.co',
      bodyHtml: `
        <p>Hello Alex,</p>
        <p>Please find attached the signed contract document: <strong>Assured shorthold tenancy</strong>.</p>
        <p style="margin-top: 16px; font-size: 14px; color: #6b7280;">Sent by: Sam Agent</p>
        <p style="font-size: 12px; color: #9ca3af;">This email was sent via Proptii on behalf of Sam Agent. If you were not expecting this document, please contact support.</p>
      `,
    }),
  },
  {
    file: '22-tenant-invitation.html',
    title: 'Tenant invitation',
    when: 'A landlord invites someone to create a tenant profile for a property.',
    html: renderProptiiEmail({
      title: 'Tenant Invitation',
      buttonLabel: 'Create Account & Complete Profile',
      buttonHref: 'https://proptii.co/tenant-onboarding?invite=true',
      bodyHtml: `
        <p>Hello,</p>
        <p>You have been invited to create your tenant profile on Proptii.</p>
        <div class="details"><h3>Property</h3><p>10 High Street</p></div>
        <div class="details"><p><strong>Message from your landlord:</strong><br/>Welcome to the building.</p></div>
        <p>Click the button below to create your account and complete your tenant profile.</p>
        <p>If you have any questions, please contact your landlord directly.</p>
      `,
    }),
  },
];

fs.mkdirSync(outDir, { recursive: true });

const items = pages.map((page) => {
  const filePath = path.join(outDir, page.file);
  fs.writeFileSync(filePath, page.html, 'utf8');
  const ok = page.html.includes('data-proptii-email-layout')
    && page.html.includes('Proptii Logo')
    && page.html.includes('one-stop AI platform')
    && page.html.includes('linear-gradient(135deg, #DC5F12');
  if (!ok) {
    throw new Error(`Preview is missing the standard layout: ${page.file}`);
  }
  return `<li><a href="./${page.file}">${page.title}</a><br><span>${page.when}</span></li>`;
});

const index = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Proptii email previews</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f5f7fa; color: #333; margin: 0; padding: 32px; }
    main { max-width: 760px; margin: 0 auto; background: #fff; padding: 32px; border-radius: 12px; }
    h1 { color: #136C9E; }
    li { margin: 16px 0; }
    a { color: #136C9E; font-weight: 700; }
    span { color: #555; }
  </style>
</head>
<body>
  <main>
    <h1>Proptii email previews</h1>
    <p>Each file uses the referencing email layout: logo, orange button, sign-off, and footer. Names and addresses are samples.</p>
    <ol>
      ${items.join('\n      ')}
    </ol>
  </main>
</body>
</html>`;

fs.writeFileSync(path.join(outDir, 'index.html'), index, 'utf8');
console.log(`Wrote ${pages.length} previews to ${outDir}`);
