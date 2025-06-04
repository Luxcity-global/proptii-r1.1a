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

  async saveIdentityData(data: any): Promise<any> {
    try {
      if (!data.userId) {
        throw new BadRequestException('User ID is required');
      }

      const documentId = `identity_${data.userId}`;
      const newData = {
        id: documentId,
        ...data,
        type: 'identity',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const { resource } = await this.container.items.upsert(newData);
      return resource;

    } catch (error) {
      console.error('Error saving identity data:', error);
      throw error;
    }
  }

  async saveEmploymentData(data: any): Promise<any> {
    try {
      if (!data.userId) {
        throw new BadRequestException('User ID is required');
      }

      const documentId = `employment_${data.userId}`;
      const newData = {
        id: documentId,
        ...data,
        type: 'employment',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const { resource } = await this.container.items.upsert(newData);
      return resource;

    } catch (error) {
      console.error('Error saving employment data:', error);
      throw error;
    }
  }

  async saveResidentialData(data: any): Promise<any> {
    try {
      if (!data.userId) {
        throw new BadRequestException('User ID is required');
      }

      const documentId = `residential_${data.userId}`;
      const newData = {
        id: documentId,
        ...data,
        type: 'residential',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const { resource } = await this.container.items.upsert(newData);
      return resource;

    } catch (error) {
      console.error('Error saving residential data:', error);
      throw error;
    }
  }

  async saveFinancialData(data: any): Promise<any> {
    try {
      if (!data.userId) {
        throw new BadRequestException('User ID is required');
      }

      const documentId = `financial_${data.userId}`;
      const newData = {
        id: documentId,
        ...data,
        type: 'financial',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const { resource } = await this.container.items.upsert(newData);
      return resource;

    } catch (error) {
      console.error('Error saving financial data:', error);
      throw error;
    }
  }

  async saveGuarantorData(data: any): Promise<any> {
    try {
      if (!data.userId) {
        throw new BadRequestException('User ID is required');
      }

      const documentId = `guarantor_${data.userId}`;
      const newData = {
        id: documentId,
        ...data,
        type: 'guarantor',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const { resource } = await this.container.items.upsert(newData);
      return resource;

    } catch (error) {
      console.error('Error saving guarantor data:', error);
      throw error;
    }
  }

  async saveAgentDetailsData(data: any): Promise<any> {
    try {
      if (!data.userId) {
        throw new BadRequestException('User ID is required');
      }

      console.log('Received agent details data:', data);

      const documentId = `agent_details_${data.userId}`;
      const newData = {
        id: documentId,
        ...data,
        type: 'agent_details',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Use upsert instead of replace
      const { resource } = await this.container.items.upsert(newData);
      return resource;

    } catch (error) {
      console.error('Error saving agent details:', error);
      throw error;
    }
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
      throw new Error('Error getting form data: ' + error.message);
    }
  }

  async submitApplication(userId: string, formData: any): Promise<any> {
    try {
      // Helper function to save section data
      const saveSectionData = async (section: string, data: any) => {
        try {
          const documentId = `${section}_${userId}`;
          const sectionData = {
            id: documentId,
            ...data,
            userId,
            type: section,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          // Use upsert instead of replace/create
          const { resource } = await this.container.items.upsert(sectionData);
          return resource;
        } catch (error) {
          throw new Error(`Error saving ${section} data: ${error.message}`);
        }
      };

      // Save all sections of the form
      const sections = ['identity', 'employment', 'residential', 'financial', 'guarantor', 'agentDetails'];
      const savedSections = await Promise.all(
        sections.map(section => saveSectionData(section, formData[section]))
      );

      // Create or update application status using upsert
      const statusDocumentId = `application_status_${userId}`;
      const statusData = {
        id: statusDocumentId,
        userId,
        type: 'application_status',
        status: 'Submitted',
        submittedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await this.container.items.upsert(statusData);

      return {
        success: true,
        message: 'Application submitted successfully',
        sections: savedSections
      };
    } catch (error) {
      console.error('Error submitting application:', error);
      throw new Error('Error submitting application: ' + error.message);
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