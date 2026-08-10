import { Injectable, NotFoundException, BadRequestException, Inject, Logger, forwardRef } from '@nestjs/common';
import { CosmosClient, Container } from '@azure/cosmos';
import { Firestore } from 'firebase-admin/firestore';
import { EmailService } from './email.service';
import { NativePropertiesService } from './native-properties.service';

@Injectable()
export class ReferencingService {
  private container: Container | null = null;
  private firestore: Firestore | null = null;
  private readonly logger = new Logger(ReferencingService.name);

  constructor(
    @Inject('COSMOS_CLIENT') private readonly cosmosClient: CosmosClient | null,
    @Inject('FIRESTORE') private readonly firestoreClient: Firestore | null,
    private readonly emailService: EmailService,
    private readonly nativePropertiesService: NativePropertiesService
  ) {
    // Initialize Cosmos DB (legacy support)
    if (this.cosmosClient) {
      try {
        const database = this.cosmosClient.database(process.env.COSMOS_DB_DATABASE_NAME || 'proptii-db');
        this.container = database.container('References');
        this.logger.log('✅ Cosmos DB container initialized');
      } catch (error) {
        this.logger.warn('Failed to initialize Cosmos DB container:', error);
        this.container = null;
      }
    } else {
      this.logger.warn('Cosmos DB client not available.');
    }

    // Initialize Firestore (preferred)
    if (this.firestoreClient) {
      this.firestore = this.firestoreClient;
      this.logger.log('✅ Firestore initialized in referencing service');
    } else {
      this.logger.warn('Firestore client not available.');
    }
  }

  async saveIdentityData(data: any): Promise<any> {
    try {
      if (!data.userId) {
        throw new BadRequestException('User ID is required');
      }

      if (!this.container) {
        this.logger.warn('Cosmos DB not available. Skipping identity data save.');
        return { success: true, data: { id: `identity_${data.userId}`, ...data } };
      }

      this.logger.log('Saving identity data:', data);

      const documentId = `identity_${data.userId}`;
      const newData = {
        id: documentId,
        ...data,
        type: 'identity',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const { resource } = await this.container.items.upsert(newData);
      this.logger.log('Identity data saved successfully:', resource.id);
      return { success: true, data: resource };

    } catch (error) {
      this.logger.error('Error saving identity data:', error);
      throw error;
    }
  }

  async saveEmploymentData(data: any): Promise<any> {
    try {
      if (!data.userId) {
        throw new BadRequestException('User ID is required');
      }

      if (!this.container) {
        this.logger.warn('Cosmos DB not available. Skipping employment data save.');
        return { success: true, data: { id: `employment_${data.userId}`, ...data } };
      }

      this.logger.log('Saving employment data:', data);

      const documentId = `employment_${data.userId}`;
      const newData = {
        id: documentId,
        ...data,
        type: 'employment',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const { resource } = await this.container.items.upsert(newData);
      this.logger.log('Employment data saved successfully:', resource.id);
      return { success: true, data: resource };

    } catch (error) {
      this.logger.error('Error saving employment data:', error);
      throw error;
    }
  }

  async saveResidentialData(data: any): Promise<any> {
    try {
      if (!data.userId) {
        throw new BadRequestException('User ID is required');
      }

      if (!this.container) {
        this.logger.warn('Cosmos DB not available. Skipping residential data save.');
        return { success: true, data: { id: `residential_${data.userId}`, ...data } };
      }

      this.logger.log('Saving residential data:', data);

      const documentId = `residential_${data.userId}`;
      const newData = {
        id: documentId,
        ...data,
        type: 'residential',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const { resource } = await this.container.items.upsert(newData);
      this.logger.log('Residential data saved successfully:', resource.id);
      return { success: true, data: resource };

    } catch (error) {
      this.logger.error('Error saving residential data:', error);
      throw error;
    }
  }

  async saveFinancialData(data: any): Promise<any> {
    try {
      if (!data.userId) {
        throw new BadRequestException('User ID is required');
      }

      if (!this.container) {
        this.logger.warn('Cosmos DB not available. Skipping financial data save.');
        return { success: true, data: { id: `financial_${data.userId}`, ...data } };
      }

      this.logger.log('Saving financial data:', data);

      const documentId = `financial_${data.userId}`;
      const newData = {
        id: documentId,
        ...data,
        type: 'financial',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const { resource } = await this.container.items.upsert(newData);
      this.logger.log('Financial data saved successfully:', resource.id);
      return { success: true, data: resource };

    } catch (error) {
      this.logger.error('Error saving financial data:', error);
      throw error;
    }
  }

  async saveGuarantorData(data: any): Promise<any> {
    try {
      if (!data.userId) {
        throw new BadRequestException('User ID is required');
      }

      if (!this.container) {
        this.logger.warn('Cosmos DB not available. Skipping guarantor data save.');
        return { success: true, data: { id: `guarantor_${data.userId}`, ...data } };
      }

      this.logger.log('Saving guarantor data:', data);

      const documentId = `guarantor_${data.userId}`;
      const newData = {
        id: documentId,
        ...data,
        type: 'guarantor',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const { resource } = await this.container.items.upsert(newData);
      this.logger.log('Guarantor data saved successfully:', resource.id);
      return { success: true, data: resource };

    } catch (error) {
      this.logger.error('Error saving guarantor data:', error);
      throw error;
    }
  }

  async saveAgentDetailsData(data: any): Promise<any> {
    try {
      if (!data.userId) {
        throw new BadRequestException('User ID is required');
      }

      if (!this.container) {
        this.logger.warn('Cosmos DB not available. Skipping agent details data save.');
        return { success: true, data: { id: `agent_details_${data.userId}`, ...data } };
      }

      this.logger.log('Saving agent details data:', data);

      const documentId = `agent_details_${data.userId}`;
      const newData = {
        id: documentId,
        ...data,
        type: 'agent_details',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const { resource } = await this.container.items.upsert(newData);
      this.logger.log('Agent details saved successfully:', resource.id);
      return { success: true, data: resource };

    } catch (error) {
      this.logger.error('Error saving agent details:', error);
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
        this.logger.log('Cosmos DB not available. Returning empty form data (frontend uses Firestore).');
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

      this.logger.log('Fetching form data for user:', userId);

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

      this.logger.log('Form data retrieved successfully');
      return { success: true, data: formData };

    } catch (error) {
      this.logger.error('Error getting form data:', error);
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

      this.logger.log('Submitting application for user:', userId);

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
                this.logger.warn(`Missing ${section} data in submission`);
                return null;
              }
              try {
                return await this[`save${section.charAt(0).toUpperCase() + section.slice(1)}Data`]({
                  ...sectionData,
                  userId
                });
              } catch (error) {
                this.logger.error(`Error saving ${section} data:`, error);
                return null;
              }
            })
          );
        } catch (error) {
          this.logger.warn('Failed to save sections to Cosmos DB:', error);
        }
      } else {
        this.logger.warn('Skipping Cosmos DB save - Cosmos DB not configured');
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
          this.logger.log('Application submitted successfully to Cosmos DB:', submission.id);
        } catch (error) {
          this.logger.warn('Failed to save submission to Cosmos DB:', error);
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
        this.logger.log('Emails sent successfully:', emailResults);
      } catch (emailError) {
        this.logger.error('Error sending emails:', emailError);
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
      this.logger.error('Error submitting application:', error);
      throw error;
    }
  }

  async sendEmail(emailData: any) {
    try {
      return await this.emailService.sendEmail(emailData);
    } catch (error) {
      this.logger.error('Error sending email:', error);
      throw error;
    }
  }

  async sendMultipleEmails(emailData: any) {
    try {
      return await this.emailService.sendMultipleEmails(emailData);
    } catch (error) {
      this.logger.error('Error sending multiple emails:', error);
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
      this.logger.error('Error checking email config:', error);
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
      this.logger.error('Error sending test email:', error);
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

      this.logger.log('💾 Preparing to save response with data:', {
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
          this.logger.log(`✅ ${data.responseType} response saved to Firestore:`, documentId);
          this.logger.log(`📧 Stored with tenantEmail: ${responseData.tenantEmail}`);
          
          // Send notification email to agent about the response
          await this.sendResponseNotificationEmail(data);
          
          return { success: true, data: responseData };
        } catch (error) {
          this.logger.error(`❌ Error saving ${data.responseType} response to Firestore:`, error);
          this.logger.error('Full error:', error);
          // Continue even if Firestore save fails
        }
      }

      // Fallback to Cosmos DB if Firestore is not available
      if (this.container) {
        try {
          const { resource } = await this.container.items.upsert(responseData);
          this.logger.log(`${data.responseType} response saved to Cosmos DB:`, resource.id);
          
          // Send notification email to agent about the response
          await this.sendResponseNotificationEmail(data);
          
          return { success: true, data: resource };
        } catch (error) {
          this.logger.error(`Error saving ${data.responseType} response to Cosmos DB:`, error);
          // Continue even if Cosmos DB save fails
        }
      }

      this.logger.warn('⚠️ No database available. Response logged but not persisted.');
      
      // Send notification email even if DB save fails
      await this.sendResponseNotificationEmail(data);

      return { 
        success: true, 
        data: responseData,
        message: 'Response submitted successfully (not persisted to database)'
      };

    } catch (error) {
      this.logger.error('Error saving referee/guarantor response:', error);
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

      let agentEmail: string | undefined;

      if (this.firestore && data.applicantEmail) {
        try {
          const formsSnapshot = await this.firestore.collection('referencingForms').get();
          const userForms = formsSnapshot.docs.map(doc => doc.data())
            .filter(f => f.formData?.identity?.email === data.applicantEmail);
          
          if (userForms.length > 0) {
            const propertyId = userForms[0].propertyId;
            if (propertyId) {
              const property = await this.nativePropertiesService.findById(propertyId);
              if (property) {
                // Determine landlord/agent email
                // Note: The property might have an agent object with an email, or ownerEmail, or we might need to look up the userId.
                // Assuming property.ownerEmail or property.agent.email is set, or we can fetch the user.
                agentEmail = (property as any).ownerEmail || (property as any).agent?.email;
                if (!agentEmail && property.userId) {
                  // Fallback to fetch from Firestore users if needed, but usually ownerEmail is there.
                  const userSnap = await this.firestore.collection('users').doc(property.userId).get();
                  if (userSnap.exists) {
                    agentEmail = userSnap.data()?.email;
                  }
                }
              }
            }
          }
        } catch (err) {
          this.logger.error('Failed to lookup agent email for notification:', err);
        }
      }

      this.logger.log(`Would send ${responseTypeLabel} response notification email`);
      this.logger.log('Notification email HTML:', notificationHtml);
      
      if (agentEmail) {
        await this.emailService.sendEmail({
          to: agentEmail,
          subject: `${responseTypeLabel} Response Received - ${data.applicantName}`,
          html: notificationHtml,
          attachments: []
        });
        this.logger.log(`✅ Sent notification email to agent/landlord: ${agentEmail}`);
      } else {
        this.logger.warn('Could not determine agent/landlord email to send notification.');
      }

    } catch (error) {
      this.logger.error('Error sending response notification email:', error);
      // Don't throw - this is a non-critical operation
    }
  }

  async getRefereeGuarantorResponses(tenantEmail: string): Promise<any> {
    try {
      if (!tenantEmail) {
        throw new BadRequestException('Tenant email is required');
      }

      this.logger.log('Fetching referee/guarantor responses for tenant:', tenantEmail);

      // Try Firestore first (preferred)
      if (this.firestore) {
        try {
          this.logger.log(`🔍 Querying Firestore for responses (tenantEmail: ${tenantEmail})...`);
          const collectionRef = this.firestore.collection('referee_guarantor_responses');
          
          // Get all responses and filter in memory to avoid index requirement
          this.logger.log('📥 Fetching all referee_guarantor_responses from Firestore...');
          const allSnapshot = await collectionRef.get();
          this.logger.log(`📊 Total responses in collection: ${allSnapshot.size}`);
          
          // Filter and sort in memory
          const allResponses = allSnapshot.docs.map(doc => {
            return { ...(doc.data() as any), id: doc.id } as any;
          });
          
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
          
          this.logger.log(`✅ Found ${refereeResponses.length} referee and ${guarantorResponses.length} guarantor responses from Firestore`);
          
          return {
            success: true,
            data: {
              refereeResponses: refereeResponses || [],
              guarantorResponses: guarantorResponses || []
            }
          };
        } catch (error: any) {
          this.logger.error('❌ Error querying Firestore for responses:', error);
          this.logger.error('Error details:', error.message || error);
          // Continue to Cosmos DB fallback
        }
      }

      // Fallback to Cosmos DB if Firestore is not available
      if (!this.container) {
        this.logger.warn('Neither Firestore nor Cosmos DB available. Returning empty responses.');
        return {
          success: true,
          data: {
            refereeResponses: [],
            guarantorResponses: []
          }
        };
      }

      this.logger.log('Querying Cosmos DB for responses...');

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

      this.logger.log(`Found ${refereeResponses.length} referee and ${guarantorResponses.length} guarantor responses from Cosmos DB`);

      return {
        success: true,
        data: {
          refereeResponses: refereeResponses || [],
          guarantorResponses: guarantorResponses || []
        }
      };

    } catch (error) {
      this.logger.error('Error fetching referee/guarantor responses:', error);
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

  async getReferencingStatusByEmail(email: string): Promise<any> {
    try {
      this.logger.log(`Checking referencing status for email: ${email}`);
      
      if (!this.firestore) {
        this.logger.warn('Firestore not available, returning not-started');
        return { status: 'not-started' };
      }
      
      const collectionRef = this.firestore.collection('referencingForms');
      const allSnapshot = await collectionRef.get();
      const allForms = allSnapshot.docs.map(doc => doc.data());
      
      const userForms = allForms
        .filter(f => f.formData?.identity?.email === email)
        .sort((a, b) => {
          const dateA = new Date(a.updatedAt || 0).getTime();
          const dateB = new Date(b.updatedAt || 0).getTime();
          return dateB - dateA;
        });
        
      if (userForms.length === 0) {
        return { status: 'not-started' };
      }
      
      const data = userForms[0];
      if (data.isSubmitted) {
        return { status: 'complete', data };
      } else if (data.currentStep > 0) {
        return { status: 'in-progress', data };
      } else {
        return { status: 'not-started', data };
      }
    } catch (error: any) {
      this.logger.error('Error getting referencing status:', error);
      return { status: 'not-started', error: error.message };
    }
  }

  async deleteResponse(responseId: string): Promise<any> {
    try {
      this.logger.log(`Deleting response: ${responseId}`);
      if (!this.firestore) {
        throw new Error('Firestore not available');
      }
      
      await this.firestore.collection('referee_guarantor_responses').doc(responseId).delete();
      return { success: true };
    } catch (error: any) {
      this.logger.error('Error deleting response:', error);
      return { success: false, error: error.message };
    }
  }

  // ==========================================
  // Proxy Methods for Tenant Referencing Flow
  // ==========================================

  async saveReferencingForm(userId: string, propertyId: string, formPayload: any): Promise<any> {
    try {
      this.logger.log(`Saving referencing form for user ${userId}, property ${propertyId}`);
      if (!this.firestore) {
        throw new Error('Firestore not available');
      }
      
      const docId = `${userId}_${propertyId}`;
      const docRef = this.firestore.collection('referencingForms').doc(docId);
      const docSnap = await docRef.get();
      
      const serverTimestamp = require('firebase-admin').firestore.FieldValue.serverTimestamp();
      
      const documentData = {
        userId,
        propertyId,
        formData: formPayload.formData,
        currentStep: formPayload.currentStep,
        stepStatus: formPayload.stepStatus,
        lastSaved: serverTimestamp,
        createdAt: docSnap.exists ? docSnap.data().createdAt : serverTimestamp,
        updatedAt: serverTimestamp,
        isSubmitted: docSnap.exists ? docSnap.data().isSubmitted : false
      };

      await docRef.set(documentData, { merge: true });
      return { success: true };
    } catch (error: any) {
      this.logger.error('Error saving referencing form proxy:', error);
      return { success: false, error: error.message };
    }
  }

  async getReferencingForm(userId: string, propertyId: string): Promise<any> {
    try {
      if (!this.firestore) {
        this.logger.warn('Firestore not available for getReferencingForm proxy');
        return { success: true, data: null };
      }
      const docId = `${userId}_${propertyId}`;
      const docSnap = await this.firestore.collection('referencingForms').doc(docId).get();
      if (!docSnap.exists) {
        return { success: true, data: null };
      }
      return { success: true, data: docSnap.data() };
    } catch (error: any) {
      this.logger.error('Error getting referencing form proxy:', error);
      return { success: false, error: error.message };
    }
  }

  async getUserReferencingForms(userId: string): Promise<any> {
    try {
      if (!this.firestore) {
        this.logger.warn('Firestore not available for getUserReferencingForms proxy');
        return { success: true, data: [] };
      }
      const snapshot = await this.firestore.collection('referencingForms')
        .where('userId', '==', userId)
        .get();
      
      const forms = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return { success: true, data: forms };
    } catch (error: any) {
      this.logger.error('Error getting user referencing forms proxy:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteReferencingForm(userId: string, propertyId: string): Promise<any> {
    try {
      if (!this.firestore) {
        throw new Error('Firestore not available');
      }
      const docId = `${userId}_${propertyId}`;
      await this.firestore.collection('referencingForms').doc(docId).delete();
      return { success: true };
    } catch (error: any) {
      this.logger.error('Error deleting referencing form proxy:', error);
      return { success: false, error: error.message };
    }
  }

  async saveUserFile(userId: string, fileData: any): Promise<any> {
    try {
      if (!this.firestore) {
        throw new Error('Firestore not available');
      }
      const serverTimestamp = require('firebase-admin').firestore.FieldValue.serverTimestamp();
      const documentData = {
        ...fileData,
        userId,
        uploadedAt: serverTimestamp
      };
      
      const docRef = await this.firestore.collection('userFiles').add(documentData);
      return { success: true, id: docRef.id };
    } catch (error: any) {
      this.logger.error('Error saving user file proxy:', error);
      return { success: false, error: error.message };
    }
  }

  async getUserFiles(userId: string): Promise<any> {
    try {
      if (!this.firestore) {
        this.logger.warn('Firestore not available for getUserFiles proxy');
        return { success: true, data: [] };
      }
      const snapshot = await this.firestore.collection('userFiles')
        .where('userId', '==', userId)
        .get();
      
      const files = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return { success: true, data: files };
    } catch (error: any) {
      this.logger.error('Error getting user files proxy:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteUserFile(userId: string, fileId: string): Promise<any> {
    try {
      if (!this.firestore) {
        throw new Error('Firestore not available');
      }
      const docRef = this.firestore.collection('userFiles').doc(fileId);
      const docSnap = await docRef.get();
      if (docSnap.exists && docSnap.data().userId !== userId) {
         throw new Error('Unauthorized');
      }
      await docRef.delete();
      return { success: true };
    } catch (error: any) {
      this.logger.error('Error deleting user file proxy:', error);
      return { success: false, error: error.message };
    }
  }
}
