import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { CosmosClient, Container } from '@azure/cosmos';
import { EmailService } from './email.service';

@Injectable()
export class ReferencingService {
  private container: Container | null = null;

  constructor(
    @Inject('COSMOS_CLIENT') private readonly cosmosClient: CosmosClient | null,
    private readonly emailService: EmailService
  ) {
    if (this.cosmosClient) {
      try {
        const database = this.cosmosClient.database(process.env.COSMOS_DB_DATABASE_NAME || 'proptii-db');
        this.container = database.container('References');
      } catch (error) {
        console.warn('Failed to initialize Cosmos DB container:', error);
        this.container = null;
      }
    } else {
      console.warn('Cosmos DB client not available. Data will not be persisted to Cosmos DB.');
    }
  }

  async saveIdentityData(data: any): Promise<any> {
    try {
      if (!data.userId) {
        throw new BadRequestException('User ID is required');
      }

      if (!this.container) {
        console.warn('Cosmos DB not available. Skipping identity data save.');
        return { success: true, data: { id: `identity_${data.userId}`, ...data } };
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

      if (!this.container) {
        console.warn('Cosmos DB not available. Skipping employment data save.');
        return { success: true, data: { id: `employment_${data.userId}`, ...data } };
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

      if (!this.container) {
        console.warn('Cosmos DB not available. Skipping residential data save.');
        return { success: true, data: { id: `residential_${data.userId}`, ...data } };
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

      if (!this.container) {
        console.warn('Cosmos DB not available. Skipping financial data save.');
        return { success: true, data: { id: `financial_${data.userId}`, ...data } };
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

      if (!this.container) {
        console.warn('Cosmos DB not available. Skipping guarantor data save.');
        return { success: true, data: { id: `guarantor_${data.userId}`, ...data } };
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

      if (!this.container) {
        console.warn('Cosmos DB not available. Skipping agent details data save.');
        return { success: true, data: { id: `agent_details_${data.userId}`, ...data } };
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

      // If Cosmos DB is not available, return empty data structure
      // The frontend uses Firestore, so this is fine
      if (!this.container) {
        console.log('Cosmos DB not available. Returning empty form data (frontend uses Firestore).');
        return {
          success: true,
          data: {
            identity: null,
            employment: null,
            residential: null,
            financial: null,
            guarantor: null,
            agentDetails: null
          }
        };
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
      // Return empty data structure instead of throwing error
      // Frontend uses Firestore anyway
      return {
        success: true,
        data: {
          identity: null,
          employment: null,
          residential: null,
          financial: null,
          guarantor: null,
          agentDetails: null
        }
      };
    }
  }

  async submitApplication(userId: string, data: any): Promise<any> {
    try {
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }

      console.log('Submitting application for user:', userId);

      // Extract formData from the request
      const formData = data.formData || data;

      // Save all sections first (only if Cosmos DB is available)
      let savedSections: any[] = [];
      if (this.container) {
        try {
          const sections = ['identity', 'employment', 'residential', 'financial', 'guarantor', 'agentDetails'];
          savedSections = await Promise.all(
            sections.map(async (section) => {
              const sectionData = formData[section];
              if (!sectionData) {
                console.warn(`Missing ${section} data in submission`);
                return null;
              }
              try {
                return await this[`save${section.charAt(0).toUpperCase() + section.slice(1)}Data`]({
                  ...sectionData,
                  userId
                });
              } catch (error) {
                console.error(`Error saving ${section} data:`, error);
                return null;
              }
            })
          );
        } catch (error) {
          console.warn('Failed to save sections to Cosmos DB:', error);
        }
      } else {
        console.warn('Skipping Cosmos DB save - Cosmos DB not configured');
      }

      // Create submission record (only if Cosmos DB is available)
      let submissionId = `submission_${userId}_${Date.now()}`;
      let submission = null;
      
      if (this.container) {
        try {
          const submissionData = {
            id: submissionId,
            userId,
            type: 'submission',
            status: 'submitted',
            formData,
            sections: savedSections.filter(s => s).map(s => s.data?.id || s.id),
            submittedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          const { resource } = await this.container.items.upsert(submissionData);
          submission = resource;
          submissionId = resource.id;
          console.log('Application submitted successfully to Cosmos DB:', submission.id);
        } catch (error) {
          console.warn('Failed to save submission to Cosmos DB:', error);
        }
      }

      // Prepare attachments from form data
      const attachments = [];
      if (formData.identity?.identityProof) attachments.push(formData.identity.identityProof);
      if (formData.employment?.proofDocument) attachments.push(formData.employment.proofDocument);
      if (formData.residential?.proofDocument) attachments.push(formData.residential.proofDocument);
      if (formData.financial?.proofOfIncomeDocument) attachments.push(formData.financial.proofOfIncomeDocument);
      if (formData.guarantor?.identityDocument) attachments.push(formData.guarantor.identityDocument);

      // Send emails with attachments (this is the critical part)
      let emailResults = null;
      try {
        emailResults = await this.emailService.sendMultipleEmails({
          formData,
          attachments,
          submissionId: submissionId
        });
        console.log('Emails sent successfully:', emailResults);
      } catch (emailError) {
        console.error('Error sending emails:', emailError);
        // Don't throw - allow submission to succeed even if email fails
        emailResults = {
          success: false,
          error: emailError instanceof Error ? emailError.message : 'Failed to send emails'
        };
      }

      return {
        success: true,
        savedToCosmosDB: !!submission,
        emailSent: emailResults?.success !== false,
        emailResults: emailResults,
        data: submission || { id: submissionId, userId, formData }
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