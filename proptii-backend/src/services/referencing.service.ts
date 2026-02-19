import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { CosmosClient, Container } from '@azure/cosmos';
import { Firestore } from 'firebase-admin/firestore';
import { EmailService } from './email.service';

@Injectable()
export class ReferencingService {
  private container: Container | null = null;
  private firestore: Firestore | null = null;

  constructor(
    @Inject('COSMOS_CLIENT') private readonly cosmosClient: CosmosClient | null,
    @Inject('FIRESTORE') private readonly firestoreClient: Firestore | null,
    private readonly emailService: EmailService
  ) {
    // Initialize Cosmos DB (legacy support)
    if (this.cosmosClient) {
      try {
        const database = this.cosmosClient.database(process.env.COSMOS_DB_DATABASE_NAME || 'proptii-db');
        this.container = database.container('References');
        console.log('✅ Cosmos DB container initialized');
      } catch (error) {
        console.warn('Failed to initialize Cosmos DB container:', error);
        this.container = null;
      }
    } else {
      console.warn('Cosmos DB client not available.');
    }

    // Initialize Firestore (preferred)
    if (this.firestoreClient) {
      this.firestore = this.firestoreClient;
      console.log('✅ Firestore initialized in referencing service');
    } else {
      console.warn('Firestore client not available.');
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

  async saveRefereeGuarantorResponse(data: any): Promise<any> {
    try {
      if (!data.responseType || !data.email) {
        throw new BadRequestException('Response type and email are required');
      }

      const documentId = `${data.responseType}_response_${data.email}_${Date.now()}`;
      const responseData = {
        id: documentId,
        ...data,
        type: `${data.responseType}_response`,
        tenantEmail: data.applicantEmail || '', // Store tenant's email for lookup
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('💾 Preparing to save response with data:', {
        documentId,
        type: responseData.type,
        tenantEmail: responseData.tenantEmail,
        applicantEmail: data.applicantEmail,
        responseType: data.responseType,
        firestoreAvailable: !!this.firestore
      });

      // Save to Firestore if available (preferred)
      if (this.firestore) {
        try {
          const collectionRef = this.firestore.collection('referee_guarantor_responses');
          await collectionRef.doc(documentId).set(responseData);
          console.log(`✅ ${data.responseType} response saved to Firestore:`, documentId);
          console.log(`📧 Stored with tenantEmail: ${responseData.tenantEmail}`);
          
          // Send notification email to agent about the response
          await this.sendResponseNotificationEmail(data);
          
          return { success: true, data: responseData };
        } catch (error) {
          console.error(`❌ Error saving ${data.responseType} response to Firestore:`, error);
          console.error('Full error:', error);
          // Continue even if Firestore save fails
        }
      }

      // Fallback to Cosmos DB if Firestore is not available
      if (this.container) {
        try {
          const { resource } = await this.container.items.upsert(responseData);
          console.log(`${data.responseType} response saved to Cosmos DB:`, resource.id);
          
          // Send notification email to agent about the response
          await this.sendResponseNotificationEmail(data);
          
          return { success: true, data: resource };
        } catch (error) {
          console.error(`Error saving ${data.responseType} response to Cosmos DB:`, error);
          // Continue even if Cosmos DB save fails
        }
      }

      console.warn('⚠️ No database available. Response logged but not persisted.');
      
      // Send notification email even if DB save fails
      await this.sendResponseNotificationEmail(data);

      return { 
        success: true, 
        data: responseData,
        message: 'Response submitted successfully (not persisted to database)'
      };

    } catch (error) {
      console.error('Error saving referee/guarantor response:', error);
      throw error;
    }
  }

  private async sendResponseNotificationEmail(data: any): Promise<void> {
    try {
      const responseTypeLabel = data.responseType === 'referee' ? 'Reference' : 'Guarantor';
      const consentStatus = data.consent === 'agree' ? '✅ Agreed' : '❌ Declined';
      
      const notificationHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f7fa; padding: 24px 0; margin: 0; }
            .container { max-width: 640px; margin: 0 auto; padding: 32px 24px; background: #ffffff; box-shadow: 0 8px 24px rgba(19, 108, 158, 0.12); border-radius: 12px; }
            .header { color: #136C9E; font-size: 24px; font-weight: 700; margin-bottom: 24px; }
            .details { background: #f5f8fb; padding: 20px; border-radius: 10px; margin: 20px 0; border: 1px solid rgba(19, 108, 158, 0.08); }
            .details h3 { margin-top: 0; color: #136C9E; font-size: 16px; }
            .details p { margin: 8px 0; }
            .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: 600; }
            .status-agree { background: #d4edda; color: #155724; }
            .status-disagree { background: #f8d7da; color: #721c24; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">${responseTypeLabel} Response Received</div>
            <p>A ${data.responseType} has responded to your referencing request for <strong>${data.applicantName}</strong>.</p>
            
            <div class="details">
              <h3>Response Details</h3>
              <p><strong>Name:</strong> ${data.firstName} ${data.lastName}</p>
              <p><strong>Email:</strong> ${data.email}</p>
              <p><strong>Status:</strong> <span class="status-badge ${data.consent === 'agree' ? 'status-agree' : 'status-disagree'}">${consentStatus}</span></p>
              <p><strong>Comments:</strong></p>
              <p style="background: #fff; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0;">${data.reason}</p>
              <p><strong>Submitted:</strong> ${new Date(data.submittedAt).toLocaleString()}</p>
            </div>

            <p>You can review this response in your Proptii dashboard.</p>
            
            <div style="margin-top: 40px; font-size: 14px; color: #666;">
              <p>Best regards,<br>The Proptii Team</p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
              <em>Proptii is a one-stop AI platform created for tenants, agents, and landlords to conduct and fulfill property transactions.</em>
            </div>
          </div>
        </body>
        </html>
      `;

      // In a production environment, you would get the agent's email from the application data
      // For now, we'll log it. You may need to query the database for the agent's email
      console.log(`Would send ${responseTypeLabel} response notification email`);
      console.log('Notification email HTML:', notificationHtml);
      
      // TODO: Get agent email from application data and send notification
      // await this.emailService.sendEmail({
      //   to: agentEmail,
      //   subject: `${responseTypeLabel} Response Received - ${data.applicantName}`,
      //   html: notificationHtml,
      //   attachments: []
      // });

    } catch (error) {
      console.error('Error sending response notification email:', error);
      // Don't throw - this is a non-critical operation
    }
  }

  async getRefereeGuarantorResponses(tenantEmail: string): Promise<any> {
    try {
      if (!tenantEmail) {
        throw new BadRequestException('Tenant email is required');
      }

      console.log('Fetching referee/guarantor responses for tenant:', tenantEmail);

      // Try Firestore first (preferred)
      if (this.firestore) {
        try {
          console.log(`🔍 Querying Firestore for responses (tenantEmail: ${tenantEmail})...`);
          const collectionRef = this.firestore.collection('referee_guarantor_responses');
          
          // Get all responses and filter in memory to avoid index requirement
          console.log('📥 Fetching all referee_guarantor_responses from Firestore...');
          const allSnapshot = await collectionRef.get();
          console.log(`📊 Total responses in collection: ${allSnapshot.size}`);
          
          // Log some sample data for debugging
          if (allSnapshot.size > 0) {
            const firstDoc = allSnapshot.docs[0].data();
            console.log('📄 Sample response structure:', {
              id: firstDoc.id,
              type: firstDoc.type,
              tenantEmail: firstDoc.tenantEmail,
              responseType: firstDoc.responseType,
              applicantEmail: firstDoc.applicantEmail
            });
          }
          
          // Filter and sort in memory
          const allResponses = allSnapshot.docs.map(doc => doc.data());
          
          const refereeResponses = allResponses
            .filter(r => r.type === 'referee_response' && r.tenantEmail === tenantEmail)
            .sort((a, b) => {
              const dateA = new Date(a.createdAt || 0).getTime();
              const dateB = new Date(b.createdAt || 0).getTime();
              return dateB - dateA; // Descending order
            });
          
          const guarantorResponses = allResponses
            .filter(r => r.type === 'guarantor_response' && r.tenantEmail === tenantEmail)
            .sort((a, b) => {
              const dateA = new Date(a.createdAt || 0).getTime();
              const dateB = new Date(b.createdAt || 0).getTime();
              return dateB - dateA; // Descending order
            });
          
          console.log(`✅ Found ${refereeResponses.length} referee and ${guarantorResponses.length} guarantor responses from Firestore`);
          
          // Log the found responses for debugging
          if (refereeResponses.length > 0 || guarantorResponses.length > 0) {
            console.log('📋 Found responses:', {
              referees: refereeResponses.map(r => ({ email: r.email, consent: r.consent })),
              guarantors: guarantorResponses.map(r => ({ email: r.email, consent: r.consent }))
            });
          }
          
          return {
            success: true,
            data: {
              refereeResponses: refereeResponses || [],
              guarantorResponses: guarantorResponses || []
            }
          };
        } catch (error) {
          console.error('❌ Error querying Firestore for responses:', error);
          console.error('Error details:', error.message || error);
          // Continue to Cosmos DB fallback
        }
      }

      // Fallback to Cosmos DB if Firestore is not available
      if (!this.container) {
        console.warn('Neither Firestore nor Cosmos DB available. Returning empty responses.');
        return {
          success: true,
          data: {
            refereeResponses: [],
            guarantorResponses: []
          }
        };
      }

      console.log('Querying Cosmos DB for responses...');

      // Query for referee responses
      const refereeQuery = {
        query: 'SELECT * FROM c WHERE c.type = @type AND c.tenantEmail = @tenantEmail ORDER BY c.createdAt DESC',
        parameters: [
          { name: '@type', value: 'referee_response' },
          { name: '@tenantEmail', value: tenantEmail }
        ]
      };

      // Query for guarantor responses
      const guarantorQuery = {
        query: 'SELECT * FROM c WHERE c.type = @type AND c.tenantEmail = @tenantEmail ORDER BY c.createdAt DESC',
        parameters: [
          { name: '@type', value: 'guarantor_response' },
          { name: '@tenantEmail', value: tenantEmail }
        ]
      };

      const { resources: refereeResponses } = await this.container.items.query(refereeQuery).fetchAll();
      const { resources: guarantorResponses } = await this.container.items.query(guarantorQuery).fetchAll();

      console.log(`Found ${refereeResponses.length} referee and ${guarantorResponses.length} guarantor responses from Cosmos DB`);

      return {
        success: true,
        data: {
          refereeResponses: refereeResponses || [],
          guarantorResponses: guarantorResponses || []
        }
      };

    } catch (error) {
      console.error('Error fetching referee/guarantor responses:', error);
      // Return empty responses instead of throwing error
      return {
        success: true,
        data: {
          refereeResponses: [],
          guarantorResponses: []
        }
      };
    }
  }
}
