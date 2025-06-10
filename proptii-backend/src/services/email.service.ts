import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

interface SendEmailParams {
    to: string;
    subject: string;
    formData?: any;
    attachments?: any[];
    submissionId?: string;
    emailType?: string;
    html?: string;
}

@Injectable()
export class EmailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        // Verify required environment variables
        const requiredEnvVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM_EMAIL'];
        const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

        if (missingVars.length > 0) {
            console.error('Missing required environment variables:', missingVars);
            throw new Error('Missing required SMTP configuration');
        }

        // Create nodemailer transporter
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: process.env.SMTP_PORT === '465',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }

    async verifyConnection() {
        try {
            await this.transporter.verify();
            console.log('SMTP connection verified successfully');
            return true;
        } catch (error) {
            console.error('SMTP connection verification failed:', error);
            return false;
        }
    }

    async sendEmail(params: SendEmailParams) {
        try {
            console.log('Preparing email:', {
                to: params.to,
                subject: params.subject,
                attachmentsCount: params.attachments?.length || 0,
                submissionId: params.submissionId,
                emailType: params.emailType
            });

            // Generate HTML content based on email type and formData
            let html = params.html;
            if (params.formData) {
                const parsedFormData = typeof params.formData === 'string' ? JSON.parse(params.formData) : params.formData;
                switch (params.emailType) {
                    case 'referee':
                        html = this.generateRefereeEmailTemplate(parsedFormData);
                        break;
                    case 'guarantor':
                        html = this.generateGuarantorEmailTemplate(parsedFormData);
                        break;
                    case 'user':
                        html = this.generateUserEmailTemplate(parsedFormData);
                        break;
                    case 'viewing-agent':
                        html = this.generateViewingAgentEmailTemplate(parsedFormData);
                        break;
                    case 'viewing-user':
                        html = this.generateViewingUserEmailTemplate(parsedFormData);
                        break;
                    default:
                        html = this.generateAgentEmailTemplate(parsedFormData);
                }
            }

            // Create zip file of attachments if needed (only for agent emails)
            const emailAttachments = [];
            if (params.emailType === 'agent' && params.attachments?.length > 0) {
                // For agent emails, we expect a single zip file containing all documents
                const zipAttachment = params.attachments[0];
                if (zipAttachment) {
                    emailAttachments.push({
                        filename: zipAttachment.filename,
                        content: zipAttachment.content,
                        contentType: 'application/zip'
                    });
                }
            }

            // Send email
            const result = await this.transporter.sendMail({
                from: process.env.SMTP_FROM_EMAIL,
                to: params.to,
                subject: params.subject,
                html,
                attachments: emailAttachments
            });

            console.log('Email sent successfully:', {
                messageId: result.messageId,
                to: params.to,
                subject: params.subject,
                attachmentsIncluded: emailAttachments.length > 0
            });

            return {
                success: true,
                messageId: result.messageId
            };
        } catch (error) {
            console.error('Failed to send email:', error);
            throw error;
        }
    }

    async sendMultipleEmails({ formData, attachments, submissionId }) {
        try {
            const results = {
                agent: false,
                referee: false,
                guarantor: false,
                user: false
            };

            // Parse formData if it's a string
            const parsedFormData = typeof formData === 'string' ? JSON.parse(formData) : formData;
            const { identity, employment, guarantor, agentDetails } = parsedFormData;

            // 1. Send email to agent with all attachments
            if (agentDetails?.email) {
                try {
                    const agentResult = await this.sendEmail({
                        to: agentDetails.email,
                        subject: `New Referencing Application from ${identity.firstName} ${identity.lastName}`,
                        formData: parsedFormData,
                        attachments, // Only agent gets all attachments
                        submissionId,
                        emailType: 'agent'
                    });
                    results.agent = agentResult.success;
                } catch (error) {
                    console.error('Error sending email to agent:', error);
                }
            }

            // 2. Send email to referee (no attachments)
            if (employment?.referenceEmail) {
                try {
                    const refereeResult = await this.sendEmail({
                        to: employment.referenceEmail,
                        subject: `Reference Request for ${identity.firstName} ${identity.lastName}`,
                        formData: parsedFormData,
                        attachments: [], // No attachments for referee
                        submissionId,
                        emailType: 'referee'
                    });
                    results.referee = refereeResult.success;
                    console.log('Referee email sent:', refereeResult.messageId);
                } catch (error) {
                    console.error('Error sending email to referee:', error);
                }
            }

            // 3. Send email to guarantor (no attachments)
            if (guarantor?.email) {
                try {
                    const guarantorResult = await this.sendEmail({
                        to: guarantor.email,
                        subject: `You've Been Chosen as a Guarantor by ${identity.firstName} ${identity.lastName}`,
                        formData: parsedFormData,
                        attachments: [], // No attachments for guarantor
                        submissionId,
                        emailType: 'guarantor'
                    });
                    results.guarantor = guarantorResult.success;
                    console.log('Guarantor email sent:', guarantorResult.messageId);
                } catch (error) {
                    console.error('Error sending email to guarantor:', error);
                }
            }

            // 4. Send summary email to user (no attachments)
            if (identity?.email) {
                try {
                    const userResult = await this.sendEmail({
                        to: identity.email,
                        subject: 'Summary of Your Referencing Application',
                        formData: parsedFormData,
                        attachments: [], // No attachments for user
                        submissionId,
                        emailType: 'user'
                    });
                    results.user = userResult.success;
                    console.log('User summary email sent:', userResult.messageId);
                } catch (error) {
                    console.error('Error sending email to user:', error);
                }
            }

            return {
                success: Object.values(results).some(result => result), // Success if at least one email sent
                allEmailsSent: results,
                messageId: submissionId
            };

        } catch (error) {
            console.error('Error in sendMultipleEmails:', error);
            throw error;
        }
    }

    private generateAgentEmailTemplate(formData: any): string {
        const { identity, employment, residential, financial, guarantor, agentDetails } = formData;
        return `
      <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .section { margin-bottom: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 5px; }
                .section-title { color: #136C9E; margin-bottom: 10px; font-weight: bold; }
                .info-item { margin: 5px 0; }
                .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 0.9em; color: #666; }
                .footer-logo { display: flex; align-items: center; margin-top: 16px; }
                .footer-logo img { height: 40px; margin-right: 10px; }
                .footer-desc { font-style: italic; color: #555; margin-top: 10px; }
                .footer-link { color: #136C9E; text-decoration: underline; }
                hr { border: none; border-top: 1px solid #bbb; margin: 24px 0 16px 0; }
              </style>
            </head>
            <body>
              <h2>Referencing Application</h2>
                
              <p>Hi ${agentDetails.firstName || ''},</p>
              <p>${identity.firstName || ''} ${identity.lastName || ''} has uploaded their verification documents.</p>
              <p>The documents include:</p>
                
              <div class="section">
                <div class="section-title">Tenant Information</div>
                <div class="info-item">First Name: ${identity.firstName || 'N/A'}</div>
                <div class="info-item">Last Name: ${identity.lastName || 'N/A'}</div>
                <div class="info-item">Email Address: ${identity.email || 'N/A'}</div>
                <div class="info-item">Phone Number: ${identity.phoneNumber || 'N/A'}</div>
                <div class="info-item">Date of Birth: ${identity.dateOfBirth || 'N/A'}</div>
                <div class="info-item">Nationality: ${identity.nationality || 'N/A'}</div>
              </div>
                
              <div class="section">
                <div class="section-title">Employment Details</div>
                <div class="info-item">Employment Status: ${employment.employmentStatus || 'N/A'}</div>
                <div class="info-item">Company Details: ${employment.companyDetails || 'N/A'}</div>
                <div class="info-item">Job Position: ${employment.jobPosition || 'N/A'}</div>
                <div class="info-item">Length of Employment (Years): ${employment.lengthOfEmployment || 'N/A'}</div>
                <div class="info-item">Proof of Employment: ${employment.proofType || 'N/A'}</div>
                <div class="info-item">Refree - Full Name: ${employment.referenceFullName || 'N/A'}</div>
                <div class="info-item">Refree - Email: ${employment.referenceEmail || 'N/A'}</div>
                <div class="info-item">Refree - Phone: ${employment.referencePhone || 'N/A'}</div>
              </div>
                
              <div class="section">
                <div class="section-title">Residential History</div>
                <div class="info-item">Reason for leaving Previous Address: ${residential.reasonForLeaving || 'N/A'}</div>
                <div class="info-item">Current Address: ${residential.currentAddress || 'N/A'}</div>
                <div class="info-item">Previous Address (If less than 3 yrs at current): ${residential.previousAddress || 'N/A'}</div>
                <div class="info-item">How long have you lived at this current Address?: ${residential.durationAtCurrentAddress || 'N/A'}</div>
                <div class="info-item">Proof of Address: ${residential.proofType || 'N/A'}</div>
                <div class="info-item">exact duration at previous address: ${residential.durationAtPreviousAddress || 'N/A'}</div>
              </div>
                
              <div class="section">
                <div class="section-title">Financial Information</div>
                <div class="info-item">Monthly Income: ${financial.monthlyIncome ? `£${financial.monthlyIncome}` : 'N/A'}</div>
                <div class="info-item">Proof of Income Type: ${financial.proofOfIncomeType || 'N/A'}</div>
              </div>
                
              <div class="section">
                <div class="section-title">Guarantor Details</div>
                <div class="info-item">Guarantor's First Name: ${guarantor.firstName || 'N/A'}</div>
                <div class="info-item">Guarantor's Last Name: ${guarantor.lastName || 'N/A'}</div>
                <div class="info-item">Guarantor's Email Address: ${guarantor.email || 'N/A'}</div>
                <div class="info-item">Guarantor's Phone Number: ${guarantor.phoneNumber || 'N/A'}</div>
                <div class="info-item">Guarantor's Address: ${guarantor.address || 'N/A'}</div>
              </div>
                
              <p>Once completed, you will receive the confirmation forms from the Referee and Guarantor. Please review all submissions and verify the documents. Once confirmed, you may proceed to accept the user as a tenant.</p>
                
              <p>Please contact ${identity.firstName || ''} on ${identity.email || ''} if you need more documents. Let us know if you need support during the verification process.</p>
                
              <div style="margin-top: 32px;">
                Best regards,<br>
                The Proptii Team
              </div>
              <hr />
              <div class="footer-desc">
                <em>Proptii is a one-stop AI platform created for tenants, agents, and landlords to conduct and fulfill property transactions. Try it <a href="https://proptii.com" class="footer-link">here</a>.</em>
              </div>
              <div class="footer-logo">
                <img src="https://ci3.googleusercontent.com/meips/ADKq_NY8hEqCfpvIsclrL2Y7Bh5rbsplzRLKZCSdpIpnfd0yj3UbdHYRghh_jcqBeTVksaYGkXybNBH7dR78-7qrgfVu81YmwI4tHtHb3B7ILEq32SZW1Rf1WYXK=s0-d-e1-ft#https://framerusercontent.com/images/tjOUqAPA6VZNlXVDj9tqwYJ7BE.png" alt="Proptii Logo" />
              </div>
            </body>
            </html>
    `;
    }

    private generateRefereeEmailTemplate(formData: any): string {
        const { identity, employment, agentDetails } = formData;
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .section { margin-bottom: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 5px; }
          .section-title { color: #136C9E; margin-bottom: 10px; font-weight: bold; }
          .info-item { margin: 5px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 0.9em; color: #666; }
          .footer-logo { display: flex; align-items: center; margin-top: 16px; }
          .footer-logo img { height: 40px; margin-right: 10px; }
          .footer-desc { font-style: italic; color: #555; margin-top: 10px; }
          .footer-link { color: #136C9E; text-decoration: underline; }
          hr { border: none; border-top: 1px solid #bbb; margin: 24px 0 16px 0; }
          .form-link { color: #136C9E; text-decoration: none; font-weight: bold; }
          .agent-section { margin-top: 20px; padding: 15px; background-color: #f5f5f5; border-radius: 5px; }
        </style>
      </head>
      <body>
        <p>Hi ${employment.referenceFullName || ''},</p>
        
        <p>${identity.firstName} ${identity.lastName} has listed you as a referee in their tenancy application on Proptii.</p>
        
        <p>We kindly ask you to confirm the following:</p>
        <ul>
          <li>Their current employment status</li>
          <li>A brief note on their character and reliability</li>
        </ul>
        
        <p>Please complete the short reference form using the link below:</p>
        <p>👉 <a href="https://docs.google.com/forms/d/e/1FAIpQLScPCYOvh4O-RuceRjFc5BTmghho1QmhHlGu9jkEA5uSSGaZ3g/viewform?usp=preview" class="form-link">Reference Form Link</a></p>
        
        <p>Once submitted, your response will be shared directly with the letting agent handling the application.</p>
        
        <div class="agent-section">
          <strong>Agent Contact for Reference Only:</strong><br>
          Name: ${agentDetails.firstName || ''} ${agentDetails.lastName || ''}<br>
          Email: ${agentDetails.email || ''}<br>
          Phone: ${agentDetails.phoneNumber || ''}
        </div>
        
        <p>Thank you for taking the time to assist in this process. Your input helps support a smooth and fair tenancy journey.</p>
        
        <p>Best regards,<br>
        The Proptii Team</p>
        
        <hr />
        <div class="footer-desc">
          <em>Proptii is a one-stop AI platform created for tenants, agents, and landlords to conduct and fulfill property transactions. Try it <a href="https://proptii.com" class="footer-link">here</a>.</em>
        </div>
        <div class="footer-logo">
          <img src="https://ci3.googleusercontent.com/meips/ADKq_NY8hEqCfpvIsclrL2Y7Bh5rbsplzRLKZCSdpIpnfd0yj3UbdHYRghh_jcqBeTVksaYGkXybNBH7dR78-7qrgfVu81YmwI4tHtHb3B7ILEq32SZW1Rf1WYXK=s0-d-e1-ft#https://framerusercontent.com/images/tjOUqAPA6VZNlXVDj9tqwYJ7BE.png" alt="Proptii Logo" />
        </div>
      </body>
      </html>
    `;
    }

    private generateGuarantorEmailTemplate(formData: any): string {
        const { identity, guarantor, agentDetails } = formData;
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .section { margin-bottom: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 5px; }
          .section-title { color: #136C9E; margin-bottom: 10px; font-weight: bold; }
          .info-item { margin: 5px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 0.9em; color: #666; }
          .footer-logo { display: flex; align-items: center; margin-top: 16px; }
          .footer-logo img { height: 40px; margin-right: 10px; }
          .footer-desc { font-style: italic; color: #555; margin-top: 10px; }
          .footer-link { color: #136C9E; text-decoration: underline; }
          hr { border: none; border-top: 1px solid #bbb; margin: 24px 0 16px 0; }
          .form-link { color: #136C9E; text-decoration: none; font-weight: bold; }
          .agent-section { margin-top: 20px; padding: 15px; background-color: #f5f5f5; border-radius: 5px; }
        </style>
      </head>
      <body>
        <p>Hi ${guarantor.firstName || ''},</p>
        
        <p>${identity.firstName} ${identity.lastName} has selected you as their guarantor for a rental application on Proptii.</p>
        
        <p>Please review the guarantor terms and let us know if you accept this responsibility.</p>
        
        <p>If you agree, simply sign the form below to confirm your acceptance:</p>
        <p>👉 <a href="https://docs.google.com/forms/d/e/1FAIpQLScZAljnM4q5IcBDmsK3E32MprXfXxgHn62zYUGDyQ8GJFXlNQ/viewform?usp=header" class="form-link">Guarantor Form Link</a></p>
        
        <p>Your signed form will be securely shared with the letting agent managing the application.</p>
        
        <div class="agent-section">
          <strong>Agent Contact for Reference Only:</strong><br>
          Name: ${agentDetails.firstName || ''} ${agentDetails.lastName || ''}<br>
          Email: ${agentDetails.email || ''}<br>
          Phone: ${agentDetails.phoneNumber || ''}
        </div>
        
        <p>Thank you for supporting ${identity.firstName} in this process.</p>
        
        <p>Warm regards,<br>
        The Proptii Team</p>
        
        <hr />
        <div class="footer-desc">
          <em>Proptii is a one-stop AI platform created for tenants, agents, and landlords to conduct and fulfill property transactions. Try it <a href="https://proptii.com" class="footer-link">here</a>.</em>
        </div>
        <div class="footer-logo">
          <img src="https://ci3.googleusercontent.com/meips/ADKq_NY8hEqCfpvIsclrL2Y7Bh5rbsplzRLKZCSdpIpnfd0yj3UbdHYRghh_jcqBeTVksaYGkXybNBH7dR78-7qrgfVu81YmwI4tHtHb3B7ILEq32SZW1Rf1WYXK=s0-d-e1-ft#https://framerusercontent.com/images/tjOUqAPA6VZNlXVDj9tqwYJ7BE.png" alt="Proptii Logo" />
        </div>
      </body>
      </html>
    `;
    }

    private generateUserEmailTemplate(formData: any): string {
        const { identity, employment, residential, financial, guarantor } = formData;

        // Helper function to check if a document exists
        const hasDocument = (section: any, docField: string) => {
            return section && section[docField] && (section[docField] instanceof File || section[docField].name);
        };

        // Build documents list
        const documents = [];
        if (identity.proofType && hasDocument(identity, 'identityProof')) {
            documents.push(`Proof of ID (${identity.proofType})`);
        }
        if (residential.proofType && hasDocument(residential, 'proofDocument')) {
            documents.push(`Proof of Address (${residential.proofType})`);
        }
        if (employment.proofType && hasDocument(employment, 'proofDocument')) {
            documents.push(`Employment Document (${employment.proofType})`);
        }
        if (financial.proofOfIncomeType && hasDocument(financial, 'proofOfIncomeDocument')) {
            documents.push(`Financial Document (${financial.proofOfIncomeType})`);
        }
        if (hasDocument(guarantor, 'identityDocument')) {
            documents.push('Guarantor Document');
        }

        return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .section { margin-bottom: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 5px; }
          .section-title { color: #136C9E; margin-bottom: 10px; font-weight: bold; }
          .info-item { margin: 5px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 0.9em; color: #666; }
          .footer-logo { display: flex; align-items: center; margin-top: 16px; }
          .footer-logo img { height: 40px; margin-right: 10px; }
          .footer-desc { font-style: italic; color: #555; margin-top: 10px; }
          .footer-link { color: #136C9E; text-decoration: underline; }
          hr { border: none; border-top: 1px solid #bbb; margin: 24px 0 16px 0; }
          .next-steps { background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .next-steps li { margin-bottom: 10px; }
          .document-list { list-style-type: none; padding-left: 0; }
          .document-list li { margin-bottom: 8px; }
          .document-list li:before { content: "📎"; margin-right: 8px; }
        </style>
      </head>
      <body>
        <h2>Summary of Referencing Details Submitted</h2>
        
        <p>Hi ${identity.firstName || ''},</p>
        <p>Thank you for completing your referencing forms and uploading your documents on Proptii. We've successfully received the following:</p>
        
        <div class="section">
          <div class="section-title">Referencing Details You Provided</div>
          <div class="info-item">Current Employer: ${employment.companyDetails || 'Not provided'}</div>
          <div class="info-item">Job Title: ${employment.jobPosition || 'Not provided'}</div>
          <div class="info-item">Monthly Income: ${financial.monthlyIncome ? `£${financial.monthlyIncome}` : 'Not provided'}</div>
          
          <div class="info-item">
            <strong>Referees Listed:</strong><br/>
            ${employment.referenceFullName ? `${employment.referenceFullName} (${employment.referenceEmail})` : 'No referee provided'}
          </div>
          
          <div class="info-item">
            <strong>Guarantor:</strong><br/>
            ${guarantor.firstName ? `${guarantor.firstName} ${guarantor.lastName} (${guarantor.email})` : 'No guarantor provided'}
          </div>
        </div>
        
        <hr/>
        
        <div class="section">
          <div class="section-title">📎 Documents Uploaded</div>
          <ul class="document-list">
            ${documents.map(doc => `<li>${doc}</li>`).join('\n')}
          </ul>
        </div>
        
        <hr/>
        
        <div class="next-steps">
          <div class="section-title">✅ What Happens Next?</div>
          <ul>
            <li>Your referees and guarantor (if listed) will be contacted to provide their responses.</li>
            <li>The letting agent will review your submission and verify the documents.</li>
            <li>We'll notify you once your application has been reviewed and accepted.</li>
          </ul>
          <p>If you need to update anything or have questions, feel free to reply to this email.</p>
        </div>
        
        <p>Thanks for choosing Proptii — we're here to make renting easy!</p>
        
        <div style="margin-top: 32px;">
          Best regards,<br>
          The Proptii Team
        </div>
        <hr />
        <div class="footer-desc">
          <em>Proptii is a one-stop AI platform created for tenants, agents, and landlords to conduct and fulfill property transactions. Try it <a href="https://proptii.com" class="footer-link">here</a>.</em>
        </div>
        <div class="footer-logo">
          <img src="https://ci3.googleusercontent.com/meips/ADKq_NY8hEqCfpvIsclrL2Y7Bh5rbsplzRLKZCSdpIpnfd0yj3UbdHYRghh_jcqBeTVksaYGkXybNBH7dR78-7qrgfVu81YmwI4tHtHb3B7ILEq32SZW1Rf1WYXK=s0-d-e1-ft#https://framerusercontent.com/images/tjOUqAPA6VZNlXVDj9tqwYJ7BE.png" alt="Proptii Logo" />
        </div>
      </body>
      </html>
    `;
    }

    private generateViewingAgentEmailTemplate(formData: any): string {
        const { property, user, viewingTime } = formData;
        return `
      <h1>New Viewing Request</h1>
      <h2>Property Details</h2>
      <p>Address: ${property.street}</p>
      <p>Price: £${property.price}</p>

      <h2>Viewing Details</h2>
      <p>Requested Time: ${new Date(viewingTime).toLocaleString()}</p>

      <h2>Applicant Details</h2>
      <p>Name: ${user.firstName} ${user.lastName}</p>
      <p>Email: ${user.email}</p>
      <p>Phone: ${user.phoneNumber}</p>
    `;
    }

    private generateViewingUserEmailTemplate(formData: any): string {
        const { property, viewingTime } = formData;
        return `
      <h1>Viewing Request Confirmation</h1>
      <p>Your viewing request has been received for:</p>
      
      <h2>Property Details</h2>
      <p>Address: ${property.street}</p>
      <p>Price: £${property.price}</p>

      <h2>Viewing Details</h2>
      <p>Requested Time: ${new Date(viewingTime).toLocaleString()}</p>

      <p>The agent will contact you shortly to confirm the viewing.</p>
    `;
    }
} 