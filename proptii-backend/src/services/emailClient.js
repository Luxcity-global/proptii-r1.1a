import nodemailer from 'nodemailer';

export class EmailClient {
  constructor() {
    this.baseUrl = process.env.APP_URL || 'https://proptii.com';
    this.fromAddress = process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER || 'noreply@proptii.com';
    
    // Configure SMTP transport
    const port = parseInt(process.env.SMTP_PORT || '465');
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: port,
      secure: port === 465, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  // Base email template with styling
  getBaseTemplate(content) {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Proptii Email</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f7fa; font-family: Arial, sans-serif; color: #333;">
        <div style="max-width: 640px; margin: 0 auto; padding: 32px 24px;">
          <div style="background: #ffffff; border-radius: 12px; box-shadow: 0 8px 24px rgba(19, 108, 158, 0.12); overflow: hidden;">
            ${content}
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // CTA Button component
  getCtaButton(text, url) {
    return `
      <div style="text-align: center; margin: 32px 0;">
        <a href="${url}" 
           style="display: inline-block; 
                  padding: 14px 32px; 
                  background: linear-gradient(135deg, #DC5F12 0%, #FF6B1A 100%);
                  color: #ffffff;
                  text-decoration: none;
                  border-radius: 50px;
                  font-weight: 600;
                  font-size: 16px;
                  box-shadow: 0 4px 12px rgba(220, 95, 18, 0.3);">
          ${text}
        </a>
      </div>
    `;
  }

  // Details section component
  getDetailsSection(title, items) {
    const itemsHtml = items
      .filter(item => item.value !== undefined && item.value !== null && item.value !== '')
      .map(item => `
        <div style="margin-bottom: 12px;">
          <strong style="color: #136C9E;">${item.label}:</strong>
          <span style="color: #4b5563; margin-left: 8px;">${item.value}</span>
        </div>
      `).join('');

    return `
      <div style="margin: 24px 0;">
        <h3 style="font-size: 16px; font-weight: 600; color: #136C9E; margin-bottom: 16px;">${title}</h3>
        <div style="background: #f5f8fb; padding: 20px; border-radius: 10px;">
          ${itemsHtml}
        </div>
      </div>
    `;
  }

  // Standard footer
  getFooter() {
    return `
      <div style="padding: 32px 24px; background: #f5f7fa; text-align: center;">
        <p style="margin: 0 0 16px 0; font-size: 14px; color: #333;">
          Best regards,<br>
          <strong>The Proptii Team</strong>
        </p>
        <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 16px;">
          <p style="margin: 0; font-size: 14px; color: #666; line-height: 1.6;">
            Proptii is a one-stop AI platform created for tenants, agents, and landlords to conduct and fulfill property transactions.
            <a href="${this.baseUrl}" style="color: #136C9E; text-decoration: none;">Try it here.</a>
          </p>
        </div>
      </div>
    `;
  }

  // 1. Agent Email - "New Referencing Application Received"
  async sendAgentNotificationEmail(agentEmail, agentFirstName, applicationData) {
    const { tenant, employment, residential, financial, guarantor, propertyAddress } = applicationData;

    const content = `
      <div style="padding: 32px 24px;">
        <h1 style="font-size: 24px; font-weight: 700; color: #136C9E; margin: 0 0 24px 0;">
          New Referencing Application Received
        </h1>
        
        <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 24px;">
          Hi ${agentFirstName},
        </p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 24px;">
          ${tenant.firstName} ${tenant.lastName} has uploaded their verification documents for ${propertyAddress}. 
          Please review the submission details below.
        </p>

        ${this.getDetailsSection('Tenant Information', [
          { label: 'First Name', value: tenant.firstName },
          { label: 'Last Name', value: tenant.lastName },
          { label: 'Email', value: tenant.email },
          { label: 'Phone', value: tenant.phone },
          { label: 'Date of Birth', value: tenant.dateOfBirth },
          { label: 'Nationality', value: tenant.nationality }
        ])}

        ${this.getDetailsSection('Employment Details', [
          { label: 'Status', value: employment.status },
          { label: 'Company', value: employment.company },
          { label: 'Job Position', value: employment.jobPosition },
          { label: 'Length of Employment', value: employment.lengthOfEmployment },
          { label: 'Proof Provided', value: employment.proofProvided },
          { label: 'Referee Name', value: employment.refereeName },
          { label: 'Referee Email', value: employment.refereeEmail },
          { label: 'Referee Phone', value: employment.refereePhone }
        ])}

        ${this.getDetailsSection('Residential History', [
          { label: 'Reason for Leaving', value: residential.reasonForLeaving },
          { label: 'Current Address', value: residential.currentAddress },
          { label: 'Duration at Current Address', value: residential.currentDuration },
          { label: 'Previous Address', value: residential.previousAddress },
          { label: 'Duration at Previous Address', value: residential.previousDuration },
          { label: 'Proof of Address', value: residential.proofOfAddress }
        ])}

        ${this.getDetailsSection('Financial Information', [
          { label: 'Monthly Income (£)', value: financial.monthlyIncome },
          { label: 'Proof of Income Type', value: financial.proofOfIncomeType }
        ])}

        ${guarantor ? this.getDetailsSection('Guarantor Details', [
          { label: 'Name', value: guarantor.name },
          { label: 'Email', value: guarantor.email },
          { label: 'Phone', value: guarantor.phone },
          { label: 'Address', value: guarantor.address }
        ]) : ''}

        <p style="font-size: 16px; line-height: 1.6; color: #333; margin: 24px 0;">
          Once completed, you will receive the confirmation forms from the referee and guarantor. 
          Please review all submissions and verify the documents.
        </p>

        ${this.getCtaButton('👉 Review Documents in Proptii', `${this.baseUrl}/landlord/clients`)}

        <p style="font-size: 14px; line-height: 1.6; color: #666; margin-top: 24px;">
          If you need any assistance during the verification process, please contact our support team 
          through your Proptii dashboard.
        </p>
      </div>
      ${this.getFooter()}
    `;

    const mailOptions = {
      from: this.fromAddress,
      to: agentEmail,
      subject: 'New Referencing Application Received',
      html: this.getBaseTemplate(content)
    };

    return await this.transporter.sendMail(mailOptions);
  }

  // 2. User Email - "Application Submitted Successfully!"
  async sendUserConfirmationEmail(userEmail, userFirstName) {
    const content = `
      <div style="padding: 32px 24px;">
        <h1 style="font-size: 24px; font-weight: 700; color: #136C9E; margin: 0 0 24px 0;">
          Application Submitted Successfully!
        </h1>
        
        <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 24px;">
          Hi ${userFirstName},
        </p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 24px;">
          Thank you for submitting your referencing application through Proptii. We have received your 
          documents and information. The agent will review your application and may contact you if any 
          additional details are needed.
        </p>

        <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 24px;">
          You will be notified once your application has been processed.
        </p>

        ${this.getCtaButton('👉 View My Application on Proptii', `${this.baseUrl}/dashboard/tenant-referencing`)}

        <p style="font-size: 16px; line-height: 1.6; color: #333; margin-top: 24px;">
          Thanks for choosing Proptii — we're here to make renting easy!
        </p>
      </div>
      ${this.getFooter()}
    `;

    const mailOptions = {
      from: this.fromAddress,
      to: userEmail,
      subject: 'Application Submitted Successfully!',
      html: this.getBaseTemplate(content)
    };

    return await this.transporter.sendMail(mailOptions);
  }

  // 3. Referee Email - "Reference Request"
  async sendRefereeRequestEmail(refereeEmail, refereeName, tenantFullName, tenantEmail) {
    const queryParams = new URLSearchParams({
      responseType: 'referee',
      applicant: tenantFullName,
      email: refereeEmail,
      tenantEmail: tenantEmail
    });

    const content = `
      <div style="padding: 32px 24px;">
        <h1 style="font-size: 24px; font-weight: 700; color: #136C9E; margin: 0 0 24px 0;">
          Reference Request
        </h1>
        
        <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 24px;">
          Dear ${refereeName},
        </p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 24px;">
          ${tenantFullName} has provided your details as an employment reference for their rental application.
        </p>

        <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 24px;">
          We would appreciate it if you could support their application by completing the reference at 
          your earliest convenience.
        </p>

        ${this.getCtaButton('👉 Provide Reference Response', `${this.baseUrl}?${queryParams.toString()}`)}
      </div>
      ${this.getFooter()}
    `;

    const mailOptions = {
      from: this.fromAddress,
      to: refereeEmail,
      subject: 'Reference Request',
      html: this.getBaseTemplate(content)
    };

    return await this.transporter.sendMail(mailOptions);
  }

  // 4. Guarantor Email - "Guarantor Request"
  async sendGuarantorRequestEmail(guarantorEmail, guarantorFirstName, guarantorLastName, tenantFullName, tenantEmail) {
    const queryParams = new URLSearchParams({
      responseType: 'guarantor',
      applicant: tenantFullName,
      email: guarantorEmail,
      tenantEmail: tenantEmail
    });

    const content = `
      <div style="padding: 32px 24px;">
        <h1 style="font-size: 24px; font-weight: 700; color: #136C9E; margin: 0 0 24px 0;">
          Guarantor Request
        </h1>
        
        <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 24px;">
          Dear ${guarantorFirstName} ${guarantorLastName},
        </p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 24px;">
          ${tenantFullName} has listed you as a guarantor for their rental application.
        </p>

        <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 24px;">
          Please confirm your willingness to support their tenancy and provide any requested documentation.
        </p>

        ${this.getCtaButton('👉 Provide Guarantor Response', `${this.baseUrl}?${queryParams.toString()}`)}
      </div>
      ${this.getFooter()}
    `;

    const mailOptions = {
      from: this.fromAddress,
      to: guarantorEmail,
      subject: 'Guarantor Request',
      html: this.getBaseTemplate(content)
    };

    return await this.transporter.sendMail(mailOptions);
  }

  // Multi-email flow: Send all emails for a referencing application
  async sendReferencingApplicationEmails(data) {
    const results = {
      user: null,
      agent: null,
      referee: null,
      guarantor: null
    };

    try {
      // 1. Send user confirmation email
      results.user = await this.sendUserConfirmationEmail(
        data.tenant.email,
        data.tenant.firstName
      );

      // 2. Send agent notification email
      results.agent = await this.sendAgentNotificationEmail(
        data.agent.email,
        data.agent.firstName,
        data
      );

      // 3. Send referee request email
      if (data.employment?.refereeEmail) {
        results.referee = await this.sendRefereeRequestEmail(
          data.employment.refereeEmail,
          data.employment.refereeName,
          `${data.tenant.firstName} ${data.tenant.lastName}`,
          data.tenant.email
        );
      }

      // 4. Send guarantor request email
      if (data.guarantor?.email) {
        results.guarantor = await this.sendGuarantorRequestEmail(
          data.guarantor.email,
          data.guarantor.firstName || data.guarantor.name?.split(' ')[0] || 'Guarantor',
          data.guarantor.lastName || data.guarantor.name?.split(' ').slice(1).join(' ') || '',
          `${data.tenant.firstName} ${data.tenant.lastName}`,
          data.tenant.email
        );
      }

      return results;
    } catch (error) {
      console.error('Error sending referencing application emails:', error);
      throw error;
    }
  }
} 