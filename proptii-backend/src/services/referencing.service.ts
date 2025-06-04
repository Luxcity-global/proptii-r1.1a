import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { CosmosClient, Container } from '@azure/cosmos';

@Injectable()
export class ReferencingService {
  private container: Container;

  constructor(
    @Inject('COSMOS_CLIENT') private readonly cosmosClient: CosmosClient
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
          const { resources: existingData } = await this.container.items
            .query({
              query: 'SELECT * FROM c WHERE c.type = @type AND c.userId = @userId',
              parameters: [
                { name: '@type', value: section },
                { name: '@userId', value: userId }
              ]
            })
            .fetchAll();

          const sectionData = {
            ...data,
            userId,
            type: section,
            updatedAt: new Date().toISOString()
          };

          if (existingData.length > 0) {
            // Update existing record
            const { resource } = await this.container.item(existingData[0].id).replace({
              ...existingData[0],
              ...sectionData
            });
            return resource;
          } else {
            // Create new record
            const { resource } = await this.container.items.create({
              ...sectionData,
              createdAt: new Date().toISOString()
            });
            return resource;
          }
        } catch (error) {
          throw new Error(`Error saving ${section} data: ${error.message}`);
        }
      };

      // Save all sections of the form
      const sections = ['identity', 'employment', 'residential', 'financial', 'guarantor', 'agentDetails'];
      const savedSections = await Promise.all(
        sections.map(section => saveSectionData(section, formData[section]))
      );

      // Create or update application status
      const { resources: existingStatus } = await this.container.items
        .query({
          query: 'SELECT * FROM c WHERE c.type = "application_status" AND c.userId = @userId',
          parameters: [{ name: '@userId', value: userId }]
        })
        .fetchAll();

      if (existingStatus.length > 0) {
        const updatedStatus = {
          ...existingStatus[0],
          status: 'Submitted',
          updatedAt: new Date().toISOString()
        };
        await this.container.item(existingStatus[0].id).replace(updatedStatus);
      } else {
        const newStatus = {
          userId,
          type: 'application_status',
          status: 'Submitted',
          submittedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await this.container.items.create(newStatus);
      }

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
} 