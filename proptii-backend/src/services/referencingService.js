import { CosmosClient } from '@azure/cosmos';
import * as dotenv from 'dotenv';

dotenv.config();

class ReferencingService {
  constructor() {
    // Verify required environment variables
    const requiredEnvVars = ['COSMOS_DB_ENDPOINT', 'COSMOS_DB_KEY', 'COSMOS_DB_NAME', 'COSMOS_DB_CONTAINER'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      console.error('Missing required environment variables:', missingVars);
      throw new Error('Missing required CosmosDB configuration');
    }

    // Initialize CosmosDB client
    this.client = new CosmosClient({
      endpoint: process.env.COSMOS_DB_ENDPOINT,
      key: process.env.COSMOS_DB_KEY
    });

    this.database = this.client.database(process.env.COSMOS_DB_NAME);
    this.container = this.database.container(process.env.COSMOS_DB_CONTAINER);
  }

  async submitApplication(data) {
    try {
      console.log('Processing application submission:', {
        userId: data.userId,
        type: data.type
      });

      // Save all form sections
      const sections = ['identity', 'employment', 'residential', 'financial', 'guarantor', 'agentDetails'];
      const savedSections = await Promise.all(
        sections.map(section =>
          this.saveFormSection(data.userId, section, data.formData[section])
        )
      );

      // Create submission record
      const submissionRecord = {
        id: `submission_${data.userId}_${Date.now()}`,
        userId: data.userId,
        type: 'submission',
        status: 'submitted',
        timestamp: new Date().toISOString(),
        formData: data.formData,
        sections: savedSections.map(section => section.id)
      };

      const { resource: submission } = await this.container.items.create(submissionRecord);

      console.log('Application submitted successfully:', {
        submissionId: submission.id,
        userId: data.userId
      });

      return {
        success: true,
        id: submission.id,
        message: 'Application submitted successfully'
      };
    } catch (error) {
      console.error('Error submitting application:', error);
      throw error;
    }
  }

  async saveFormSection(userId, section, data) {
    try {
      if (!userId || !section || !data) {
        throw new Error('Missing required parameters');
      }

      const record = {
        id: `${section}_${userId}_${Date.now()}`,
        userId,
        type: section,
        data,
        timestamp: new Date().toISOString()
      };

      const { resource } = await this.container.items.create(record);

      console.log(`Saved ${section} data:`, {
        id: resource.id,
        userId,
        type: section
      });

      return resource;
    } catch (error) {
      console.error(`Error saving ${section} data:`, error);
      throw error;
    }
  }

  async getFormData(userId) {
    try {
      const querySpec = {
        query: 'SELECT * FROM c WHERE c.userId = @userId',
        parameters: [{ name: '@userId', value: userId }]
      };

      const { resources } = await this.container.items.query(querySpec).fetchAll();

      // Group data by section type
      const formData = resources.reduce((acc, item) => {
        if (item.type !== 'submission') {
          acc[item.type] = item.data;
        }
        return acc;
      }, {});

      return formData;
    } catch (error) {
      console.error('Error getting form data:', error);
      throw error;
    }
  }
}

export const referencingService = new ReferencingService();