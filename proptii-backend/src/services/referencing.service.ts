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

      console.log('Saving identity data:', data);

      const documentId = `identity_${data.userId}`;
      const newData = {
        id: documentId,
        ...data,
        type: 'identity',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const { resource } = await this.container.items.upsert(newData);
      console.log('Identity data saved successfully:', resource.id);
      return { success: true, data: resource };

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

      console.log('Saving employment data:', data);

      const documentId = `employment_${data.userId}`;
      const newData = {
        id: documentId,
        ...data,
        type: 'employment',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const { resource } = await this.container.items.upsert(newData);
      console.log('Employment data saved successfully:', resource.id);
      return { success: true, data: resource };

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

      console.log('Saving residential data:', data);

      const documentId = `residential_${data.userId}`;
      const newData = {
        id: documentId,
        ...data,
        type: 'residential',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const { resource } = await this.container.items.upsert(newData);
      console.log('Residential data saved successfully:', resource.id);
      return { success: true, data: resource };

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

      console.log('Saving financial data:', data);

      const documentId = `financial_${data.userId}`;
      const newData = {
        id: documentId,
        ...data,
        type: 'financial',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const { resource } = await this.container.items.upsert(newData);
      console.log('Financial data saved successfully:', resource.id);
      return { success: true, data: resource };

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

      console.log('Saving guarantor data:', data);

      const documentId = `guarantor_${data.userId}`;
      const newData = {
        id: documentId,
        ...data,
        type: 'guarantor',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const { resource } = await this.container.items.upsert(newData);
      console.log('Guarantor data saved successfully:', resource.id);
      return { success: true, data: resource };

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

      console.log('Saving agent details data:', data);

      const documentId = `agent_details_${data.userId}`;
      const newData = {
        id: documentId,
        ...data,
        type: 'agent_details',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const { resource } = await this.container.items.upsert(newData);
      console.log('Agent details saved successfully:', resource.id);
      return { success: true, data: resource };

    } catch (error) {
      console.error('Error saving agent details:', error);
      throw error;
    }
  }

  async getFormData(userId: string): Promise<any> {
    try {
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }

      console.log('Fetching form data for user:', userId);

      // Query all documents for this user
      const querySpec = {
        query: 'SELECT * FROM c WHERE c.userId = @userId',
        parameters: [{ name: '@userId', value: userId }]
      };

      const { resources } = await this.container.items.query(querySpec).fetchAll();

      // Organize data by type
      const formData = {
        identity: resources.find(r => r.type === 'identity'),
        employment: resources.find(r => r.type === 'employment'),
        residential: resources.find(r => r.type === 'residential'),
        financial: resources.find(r => r.type === 'financial'),
        guarantor: resources.find(r => r.type === 'guarantor'),
        agentDetails: resources.find(r => r.type === 'agent_details')
      };

      console.log('Form data retrieved successfully');
      return { success: true, data: formData };

    } catch (error) {
      console.error('Error getting form data:', error);
      throw error;
    }
  }

  async submitApplication(userId: string, data: any): Promise<any> {
    try {
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }

      console.log('Submitting application for user:', userId);

      // Extract formData from the request
      const formData = data.formData;

      // Save all sections first
      const sections = ['identity', 'employment', 'residential', 'financial', 'guarantor', 'agentDetails'];
      const savedSections = await Promise.all(
        sections.map(section => {
          const sectionData = formData[section];
          if (!sectionData) {
            console.warn(`Missing ${section} data in submission`);
            return null;
          }
          return this[`save${section.charAt(0).toUpperCase() + section.slice(1)}Data`]({
            ...sectionData,
            userId
          });
        })
      );

      // Create submission record
      const submissionId = `submission_${userId}_${Date.now()}`;
      const submissionData = {
        id: submissionId,
        userId,
        type: 'submission',
        status: 'submitted',
        formData,
        sections: savedSections.filter(s => s).map(s => s.data.id),
        submittedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const { resource: submission } = await this.container.items.upsert(submissionData);
      console.log('Application submitted successfully:', submission.id);

      // Prepare attachments from form data
      const attachments = [];
      if (formData.identity?.identityProof) attachments.push(formData.identity.identityProof);
      if (formData.employment?.proofDocument) attachments.push(formData.employment.proofDocument);
      if (formData.residential?.proofDocument) attachments.push(formData.residential.proofDocument);
      if (formData.financial?.proofOfIncomeDocument) attachments.push(formData.financial.proofOfIncomeDocument);
      if (formData.guarantor?.identityDocument) attachments.push(formData.guarantor.identityDocument);

      // Send emails with attachments
      const emailResults = await this.emailService.sendMultipleEmails({
        formData,
        attachments,
        submissionId: submission.id
      });

      return {
        success: true,
        savedToCosmosDB: true,
        emailSent: emailResults,
        data: submission
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