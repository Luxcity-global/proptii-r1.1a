import apiService from './api';
import { getResolvedApiBaseUrl } from '../config/apiBaseUrl';

/**
 * Path segment for referencing routes, aligned with apiService baseURL (VITE_API_URL).
 * If the env URL already ends with `/api`, paths are `/referencing/...`; otherwise `/api/referencing/...`.
 */
function referencingPath(suffix: string): string {
  const raw = getResolvedApiBaseUrl().replace(/\/$/, '');
  const baseHasApi = raw.endsWith('/api');
  const prefix = baseHasApi ? '' : '/api';
  return `${prefix}/referencing/${suffix}`;
}

class ReferencingService {
  async saveIdentityData(data: any) {
    try {
      const response = await apiService.post(referencingPath('identity'), data);
      return response.data;
    } catch (error) {
      console.error('Error saving identity data:', error);
      throw error;
    }
  }

  async saveEmploymentData(data: any) {
    try {
      const response = await apiService.post(referencingPath('employment'), data);
      return response.data;
    } catch (error) {
      console.error('Error saving employment data:', error);
      throw error;
    }
  }

  async saveResidentialData(data: any) {
    try {
      const response = await apiService.post(referencingPath('residential'), data);
      return response.data;
    } catch (error) {
      console.error('Error saving residential data:', error);
      throw error;
    }
  }

  async saveFinancialData(data: any) {
    try {
      const response = await apiService.post(referencingPath('financial'), data);
      return response.data;
    } catch (error) {
      console.error('Error saving financial data:', error);
      throw error;
    }
  }

  async saveGuarantorData(data: any) {
    try {
      const response = await apiService.post(referencingPath('guarantor'), data);
      return response.data;
    } catch (error) {
      console.error('Error saving guarantor data:', error);
      throw error;
    }
  }

  async saveAgentDetailsData(data: any) {
    try {
      const response = await apiService.post(referencingPath('agentDetails'), data);
      return response.data;
    } catch (error) {
      console.error('Error saving agent details:', error);
      throw error;
    }
  }

  /** Submit waits on Cosmos writes + multi-email send — allow longer than default 30s axios timeout. */
  private static readonly SUBMIT_TIMEOUT_MS = 120_000;

  async submitApplication(userId: string, data: any) {
    try {
      const response = await apiService.post(
        referencingPath(`${userId}/submit`),
        data,
        { timeout: ReferencingService.SUBMIT_TIMEOUT_MS },
      );
      return response.data;
    } catch (error) {
      console.error('Error submitting application:', error);
      throw error;
    }
  }
}

export default new ReferencingService();