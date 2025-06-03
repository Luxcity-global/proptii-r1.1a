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

      // Generate a unique ID for the document
      const documentId = `identity_${data.userId}`;

      try {
        // Try to read the existing document
        const { resource: existingDoc } = await this.container.item(documentId).read();

        if (existingDoc) {
          // Update existing document
          const updatedData = {
            ...existingDoc,
            ...data,
            type: 'identity',
            updatedAt: new Date().toISOString()
          };
          const { resource } = await this.container.item(documentId).replace(updatedData);
          return { success: true, message: 'Identity data updated successfully', data: resource };
        }
      } catch (readError) {
        // Document doesn't exist, create new one
        const newData = {
          id: documentId,
          ...data,
          type: 'identity',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        const { resource } = await this.container.items.create(newData);
        return { success: true, message: 'Identity data saved successfully', data: resource };
      }
    } catch (error) {
      console.error('Error saving identity data:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new Error('Error saving identity data: ' + error.message);
    }
  }

  async saveEmploymentData(data: any): Promise<any> {
    try {
      const { resources: existingData } = await this.container.items
        .query({
          query: 'SELECT * FROM c WHERE c.type = "employment" AND c.userId = @userId',
          parameters: [{ name: '@userId', value: data.userId }]
        })
        .fetchAll();

      if (existingData.length > 0) {
        const updatedData = {
          ...existingData[0],
          ...data,
          type: 'employment',
          updatedAt: new Date().toISOString()
        };
        const { resource } = await this.container.item(existingData[0].id).replace(updatedData);
        return { success: true, message: 'Employment data updated successfully', data: resource };
      } else {
        const newData = {
          ...data,
          type: 'employment',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        const { resource } = await this.container.items.create(newData);
        return { success: true, message: 'Employment data saved successfully', data: resource };
      }
    } catch (error) {
      throw new Error('Error saving employment data: ' + error.message);
    }
  }

  async saveResidentialData(data: any): Promise<any> {
    try {
      const { resources: existingData } = await this.container.items
        .query({
          query: 'SELECT * FROM c WHERE c.type = "residential" AND c.userId = @userId',
          parameters: [{ name: '@userId', value: data.userId }]
        })
        .fetchAll();

      if (existingData.length > 0) {
        const updatedData = {
          ...existingData[0],
          ...data,
          type: 'residential',
          updatedAt: new Date().toISOString()
        };
        const { resource } = await this.container.item(existingData[0].id).replace(updatedData);
        return { success: true, message: 'Residential data updated successfully', data: resource };
      } else {
        const newData = {
          ...data,
          type: 'residential',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        const { resource } = await this.container.items.create(newData);
        return { success: true, message: 'Residential data saved successfully', data: resource };
      }
    } catch (error) {
      throw new Error('Error saving residential data: ' + error.message);
    }
  }

  async saveFinancialData(data: any): Promise<any> {
    try {
      const { resources: existingData } = await this.container.items
        .query({
          query: 'SELECT * FROM c WHERE c.type = "financial" AND c.userId = @userId',
          parameters: [{ name: '@userId', value: data.userId }]
        })
        .fetchAll();

      if (existingData.length > 0) {
        const updatedData = {
          ...existingData[0],
          ...data,
          type: 'financial',
          updatedAt: new Date().toISOString()
        };
        const { resource } = await this.container.item(existingData[0].id).replace(updatedData);
        return { success: true, message: 'Financial data updated successfully', data: resource };
      } else {
        const newData = {
          ...data,
          type: 'financial',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        const { resource } = await this.container.items.create(newData);
        return { success: true, message: 'Financial data saved successfully', data: resource };
      }
    } catch (error) {
      throw new Error('Error saving financial data: ' + error.message);
    }
  }

  async saveGuarantorData(data: any): Promise<any> {
    try {
      const { resources: existingData } = await this.container.items
        .query({
          query: 'SELECT * FROM c WHERE c.type = "guarantor" AND c.userId = @userId',
          parameters: [{ name: '@userId', value: data.userId }]
        })
        .fetchAll();

      if (existingData.length > 0) {
        const updatedData = {
          ...existingData[0],
          ...data,
          type: 'guarantor',
          updatedAt: new Date().toISOString()
        };
        const { resource } = await this.container.item(existingData[0].id).replace(updatedData);
        return { success: true, message: 'Guarantor data updated successfully', data: resource };
      } else {
        const newData = {
          ...data,
          type: 'guarantor',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        const { resource } = await this.container.items.create(newData);
        return { success: true, message: 'Guarantor data saved successfully', data: resource };
      }
    } catch (error) {
      throw new Error('Error saving guarantor data: ' + error.message);
    }
  }

  async saveAgentDetailsData(data: any): Promise<any> {
    try {
      console.log('Received agent details data:', JSON.stringify(data, null, 2));

      if (!data.userId) {
        throw new Error('userId is required for saving agent details');
      }

      const { resources: existingData } = await this.container.items
        .query({
          query: 'SELECT * FROM c WHERE c.type = "agent_details" AND c.userId = @userId',
          parameters: [{ name: '@userId', value: data.userId }]
        })
        .fetchAll();

      console.log('Existing agent details data:', JSON.stringify(existingData, null, 2));

      const newData = {
        ...data,
        type: 'agent_details',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (existingData.length > 0) {
        // Update existing item
        try {
          const updatedData = {
            ...existingData[0],
            ...data,
            type: 'agent_details',
            updatedAt: new Date().toISOString()
          };
          console.log('Updating agent details with:', JSON.stringify(updatedData, null, 2));
          const { resource } = await this.container.item(existingData[0].id).replace(updatedData);
          return { success: true, message: 'Agent details data updated successfully', data: resource };
        } catch (updateError) {
          console.error('Error updating existing agent details:', updateError);
          // If update fails, try creating a new item
          console.log('Falling back to creating new agent details');
          const { resource } = await this.container.items.create(newData);
          return { success: true, message: 'Agent details data saved successfully', data: resource };
        }
      } else {
        // Create new item
        console.log('Creating new agent details with:', JSON.stringify(newData, null, 2));
        const { resource } = await this.container.items.create(newData);
        return { success: true, message: 'Agent details data saved successfully', data: resource };
      }
    } catch (error) {
      console.error('Detailed error in saveAgentDetailsData:', error);
      throw new Error('Error saving agent details data: ' + error.message);
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