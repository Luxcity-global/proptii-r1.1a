import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { CosmosClient, Container } from '@azure/cosmos';
import { EmailService } from './email.service';

@Injectable()
export class ReferencingService {
  private container: Container;

  constructor(
    @Inject('COSMOS_CLIENT') private readonly cosmosClient: CosmosClient,
    private readonly emailService: EmailService
  ) {
    const database = this.cosmosClient.database(process.env.COSMOS_DB_DATABASE_NAME);
    this.container = database.container('References');
  }

  private async saveFormSection(section: string, data: any): Promise<any> {
    try {
      if (!data.userId) {
        throw new BadRequestException('User ID is required');
      }

      const documentId = `${section}_${data.userId}`;
      const newData = {
        id: documentId,
        ...data,
        type: section,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const { resource } = await this.container.items.upsert(newData);
      console.log(`${section} data saved:`, {
        id: resource.id,
        userId: data.userId,
        type: section
      });
      return resource;
    } catch (error) {
      console.error(`Error saving ${section} data:`, error);
      throw error;
    }
  }

  async saveIdentityData(data: any): Promise<any> {
    return this.saveFormSection('identity', data);
  }

  async saveEmploymentData(data: any): Promise<any> {
    return this.saveFormSection('employment', data);
  }

  async saveResidentialData(data: any): Promise<any> {
    return this.saveFormSection('residential', data);
  }

  async saveFinancialData(data: any): Promise<any> {
    return this.saveFormSection('financial', data);
  }

  async saveGuarantorData(data: any): Promise<any> {
    return this.saveFormSection('guarantor', data);
  }

  async saveAgentDetailsData(data: any): Promise<any> {
    console.log('Received agent details data:', data);
    return this.saveFormSection('agent_details', data);
  }

  async getFormData(userId: string): Promise<any> {
    try {
      const { resources } = await this.container.items
        .query({
          query: 'SELECT * FROM c WHERE c.userId = @userId',
          parameters: [{ name: '@userId', value: userId }]
        })
        .fetchAll();

      const formData = {
        identity: resources.find(r => r.type === 'identity') || {},
        employment: resources.find(r => r.type === 'employment') || {},
        residential: resources.find(r => r.type === 'residential') || {},
        financial: resources.find(r => r.type === 'financial') || {},
        guarantor: resources.find(r => r.type === 'guarantor') || {},
        agentDetails: resources.find(r => r.type === 'agent_details') || {}
      };

      return formData;
    } catch (error) {
      console.error('Error getting form data:', error);
      throw error;
    }
  }

  async submitApplication(userId: string, formData: any): Promise<any> {
    try {
      // Save all sections first
      const sections = ['identity', 'employment', 'residential', 'financial', 'guarantor', 'agentDetails'];
      const savedSections = await Promise.all(
        sections.map(section => {
          const sectionData = {
            ...formData[section],
            userId
          };
          return this.saveFormSection(section === 'agentDetails' ? 'agent_details' : section, sectionData);
        })
      );

      // Create application status
      const statusDocumentId = `application_status_${userId}`;
      const statusData = {
        id: statusDocumentId,
        userId,
        type: 'application_status',
        status: 'Submitted',
        submittedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sections: savedSections.map(section => section.id)
      };

      await this.container.items.upsert(statusData);
      console.log('Application status saved:', {
        id: statusDocumentId,
        userId,
        status: 'Submitted'
      });

      // Prepare attachments from form data
      const attachments = [];
      if (formData.identity?.identityProof) {
        attachments.push({
          filename: `identity_proof_${formData.identity.firstName}_${formData.identity.lastName}`,
          content: formData.identity.identityProof
        });
      }
      if (formData.employment?.proofDocument) {
        attachments.push({
          filename: `employment_proof_${formData.identity.firstName}_${formData.identity.lastName}`,
          content: formData.employment.proofDocument
        });
      }
      if (formData.residential?.proofDocument) {
        attachments.push({
          filename: `residential_proof_${formData.identity.firstName}_${formData.identity.lastName}`,
          content: formData.residential.proofDocument
        });
      }
      if (formData.financial?.proofOfIncomeDocument) {
        attachments.push({
          filename: `financial_proof_${formData.identity.firstName}_${formData.identity.lastName}`,
          content: formData.financial.proofOfIncomeDocument
        });
      }
      if (formData.guarantor?.identityDocument) {
        attachments.push({
          filename: `guarantor_proof_${formData.identity.firstName}_${formData.identity.lastName}`,
          content: formData.guarantor.identityDocument
        });
      }

      // Send emails with attachments
      const emailResults = await this.emailService.sendMultipleEmails({
        formData,
        attachments,
        submissionId: statusDocumentId
      });

      return {
        success: true,
        message: 'Application submitted successfully',
        sections: savedSections,
        emailResults
      };
    } catch (error) {
      console.error('Error submitting application:', error);
      throw error;
    }
  }

  async sendEmail(emailData: any) {
    try {
      return await this.emailService.sendEmail(emailData);
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  async sendMultipleEmails(emailData: any) {
    try {
      return await this.emailService.sendMultipleEmails(emailData);
    } catch (error) {
      console.error('Error sending multiple emails:', error);
      throw error;
    }
  }

  async testEmailConfig() {
    try {
      const config = {
        endpoint: process.env.EMAIL_SERVICE_ENDPOINT,
        key: process.env.EMAIL_SERVICE_KEY,
        from: process.env.EMAIL_FROM_ADDRESS
      };

      if (!config.endpoint || !config.key || !config.from) {
        return {
          success: false,
          message: 'Email configuration is incomplete',
          missingFields: Object.entries(config)
            .filter(([_, value]) => !value)
            .map(([key]) => key)
        };
      }

      return {
        success: true,
        message: 'Email configuration is complete',
        config: {
          endpoint: config.endpoint.substring(0, 10) + '...',
          key: '***********',
          from: config.from
        }
      };
    } catch (error) {
      console.error('Error checking email config:', error);
      throw error;
    }
  }

  async testEmail(email: string) {
    try {
      const testHtml = `
        <h1>Email Service Test</h1>
        <p>This is a test email from Proptii Referencing System.</p>
        <p>If you're receiving this, the email service is working correctly!</p>
        <br>
        <p>Time sent: ${new Date().toLocaleString()}</p>
      `;

      const result = await this.emailService.sendEmail({
        to: email,
        subject: 'Proptii Email Service Test',
        html: testHtml,
        attachments: []
      });

      return {
        success: true,
        message: 'Test email sent successfully',
        messageId: result.messageId,
        sentTo: email
      };
    } catch (error) {
      console.error('Error sending test email:', error);
      throw error;
    }
  }
} 