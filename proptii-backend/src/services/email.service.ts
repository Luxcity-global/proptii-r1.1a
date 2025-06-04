import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

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

    async sendEmail({ to, subject, formData, attachments, submissionId, emailType = 'agent' }) {
        try {
            console.log('Preparing email with attachments:', {
                to,
                subject,
                attachmentsCount: attachments?.length || 0,
                submissionId,
                emailType
            });

            // Parse formData if it's a string
            const parsedFormData = typeof formData === 'string' ? JSON.parse(formData) : formData;

            // Generate HTML content based on email type
            let html;
            switch (emailType) {
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

            // Create zip file of attachments if needed (only for agent emails)
            const emailAttachments = [];
            if (emailType === 'agent' && attachments?.length > 0) {
                // For agent emails, we expect a single zip file containing all documents
                const zipAttachment = attachments[0];
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
                to,
                subject,
                html,
                attachments: emailAttachments
            });

            console.log('Email sent successfully:', {
                messageId: result.messageId,
                to,
                subject,
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

            // 1. Send email to agent (original functionality)
            try {
                const agentResult = await this.sendEmail({
                    to: agentDetails.email,
                    subject: `New Referencing Application from ${identity.firstName} ${identity.lastName}`,
                    formData: parsedFormData,
                    attachments,
                    submissionId,
                    emailType: 'agent'
                });
                results.agent = agentResult.success;
            } catch (error) {
                console.error('Error sending email to agent:', error);
            }

            // 2. Send email to referee
            if (employment.referenceEmail) {
                try {
                    const refereeResult = await this.sendEmail({
                        to: employment.referenceEmail,
                        subject: `Reference Request for ${identity.firstName} ${identity.lastName}`,
                        formData: parsedFormData,
                        submissionId,
                        emailType: 'referee'
                    });
                    results.referee = true;
                    console.log('Referee email sent:', refereeResult.messageId);
                } catch (error) {
                    console.error('Error sending email to referee:', error);
                }
            }

            // 3. Send email to guarantor
            if (guarantor.email) {
                try {
                    const guarantorResult = await this.sendEmail({
                        to: guarantor.email,
                        subject: `You've Been Chosen as a Guarantor by ${identity.firstName} ${identity.lastName}`,
                        formData: parsedFormData,
                        submissionId,
                        emailType: 'guarantor'
                    });
                    results.guarantor = true;
                    console.log('Guarantor email sent:', guarantorResult.messageId);
                } catch (error) {
                    console.error('Error sending email to guarantor:', error);
                }
            }

            // 4. Send summary email to user
            if (identity.email) {
                try {
                    const userResult = await this.sendEmail({
                        to: identity.email,
                        subject: 'Summary of Referencing Details Submitted',
                        formData: parsedFormData,
                        submissionId,
                        emailType: 'user'
                    });
                    results.user = true;
                    console.log('User summary email sent:', userResult.messageId);
                } catch (error) {
                    console.error('Error sending email to user:', error);
                }
            }

            return {
                success: results.agent, // Consider main success based on agent email
                allEmailsSent: results,
                messageId: submissionId
            };
        } catch (error) {
            console.error('Error in sendMultipleEmails:', error);
            throw error;
        }
    }

    private generateAgentEmailTemplate(formData: any): string {
        const { identity, employment, residential, financial, guarantor } = formData;
        return `
      <h1>New Referencing Application</h1>
      <h2>Applicant Details</h2>
      <p>Name: ${identity.firstName} ${identity.lastName}</p>
      <p>Email: ${identity.email}</p>
      <p>Phone: ${identity.phoneNumber}</p>

      <h2>Employment Details</h2>
      <p>Employer: ${employment.employerName}</p>
      <p>Position: ${employment.position}</p>
      <p>Annual Income: £${employment.annualIncome}</p>

      <h2>Residential History</h2>
      <p>Current Address: ${residential.currentAddress}</p>
      <p>Time at Address: ${residential.yearsAtAddress} years</p>

      <h2>Financial Information</h2>
      <p>Monthly Income: £${financial.monthlyIncome}</p>
      <p>Credit Score: ${financial.creditScore}</p>

      <h2>Guarantor Information</h2>
      <p>Name: ${guarantor.firstName} ${guarantor.lastName}</p>
      <p>Email: ${guarantor.email}</p>
      <p>Phone: ${guarantor.phoneNumber}</p>
    `;
    }

    private generateRefereeEmailTemplate(formData: any): string {
        const { identity, employment } = formData;
        return `
      <h1>Reference Request</h1>
      <p>Dear ${employment.referenceName},</p>
      <p>${identity.firstName} ${identity.lastName} has listed you as a reference for their rental application.</p>
      <p>Please provide a reference by responding to this email with information about:</p>
      <ul>
        <li>Length of employment</li>
        <li>Position held</li>
        <li>Salary confirmation</li>
        <li>Performance and reliability</li>
      </ul>
    `;
    }

    private generateGuarantorEmailTemplate(formData: any): string {
        const { identity, guarantor } = formData;
        return `
      <h1>Guarantor Request</h1>
      <p>Dear ${guarantor.firstName} ${guarantor.lastName},</p>
      <p>${identity.firstName} ${identity.lastName} has listed you as a guarantor for their rental application.</p>
      <p>As a guarantor, you would be responsible for:</p>
      <ul>
        <li>Ensuring rent payments are made on time</li>
        <li>Covering any unpaid rent or damages</li>
        <li>Being legally bound to the tenancy agreement</li>
      </ul>
      <p>Please respond to this email to confirm your agreement to act as a guarantor.</p>
    `;
    }

    private generateUserEmailTemplate(formData: any): string {
        const { identity, employment, residential, financial, guarantor } = formData;
        return `
      <h1>Your Referencing Application Summary</h1>
      <p>Dear ${identity.firstName} ${identity.lastName},</p>
      <p>Your referencing application has been submitted successfully. Here's a summary of your application:</p>

      <h2>Personal Details</h2>
      <p>Name: ${identity.firstName} ${identity.lastName}</p>
      <p>Email: ${identity.email}</p>
      <p>Phone: ${identity.phoneNumber}</p>

      <h2>Employment Information</h2>
      <p>Employer: ${employment.employerName}</p>
      <p>Position: ${employment.position}</p>
      <p>Annual Income: £${employment.annualIncome}</p>

      <h2>Residential History</h2>
      <p>Current Address: ${residential.currentAddress}</p>
      <p>Time at Address: ${residential.yearsAtAddress} years</p>

      <h2>Financial Details</h2>
      <p>Monthly Income: £${financial.monthlyIncome}</p>
      <p>Credit Score: ${financial.creditScore}</p>

      <h2>Guarantor Details</h2>
      <p>Name: ${guarantor.firstName} ${guarantor.lastName}</p>
      <p>Email: ${guarantor.email}</p>
      <p>Phone: ${guarantor.phoneNumber}</p>

      <p>We will process your application and contact you shortly.</p>
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