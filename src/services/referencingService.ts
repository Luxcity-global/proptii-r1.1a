import axios from 'axios';

// Get the API URL from environment variables
const API_BASE_URL = process.env.VITE_API_URL || 'https://proptii-r1-1a.onrender.com/api';

console.log('Using API URL:', API_BASE_URL);

class ReferencingService {
  async saveIdentityData(data: any) {
    try {
      const response = await axios.post(`${API_BASE_URL}/referencing/identity`, data);
      return response.data;
    } catch (error) {
      console.error('Error saving identity data:', error);
      throw error;
    }
  }

  async saveEmploymentData(data: any) {
    try {
      const response = await axios.post(`${API_BASE_URL}/referencing/employment`, data);
      return response.data;
    } catch (error) {
      console.error('Error saving employment data:', error);
      throw error;
    }
  }

  async saveResidentialData(data: any) {
    try {
      const response = await axios.post(`${API_BASE_URL}/referencing/residential`, data);
      return response.data;
    } catch (error) {
      console.error('Error saving residential data:', error);
      throw error;
    }
  }

  async saveFinancialData(data: any) {
    try {
      const response = await axios.post(`${API_BASE_URL}/referencing/financial`, data);
      return response.data;
    } catch (error) {
      console.error('Error saving financial data:', error);
      throw error;
    }
  }

  async saveGuarantorData(data: any) {
    try {
      const response = await axios.post(`${API_BASE_URL}/referencing/guarantor`, data);
      return response.data;
    } catch (error) {
      console.error('Error saving guarantor data:', error);
      throw error;
    }
  }

  async saveAgentDetailsData(data: any) {
    try {
      const response = await axios.post(`${API_BASE_URL}/referencing/agentDetails`, data);
      return response.data;
    } catch (error) {
      console.error('Error saving agent details:', error);
      throw error;
    }
  }

  async submitApplication(userId: string, data: any) {
    try {
      const response = await axios.post(`${API_BASE_URL}/referencing/${userId}/submit`, data);
      return response.data;
    } catch (error) {
      console.error('Error submitting application:', error);
      throw error;
    }
  }
}

export default new ReferencingService();