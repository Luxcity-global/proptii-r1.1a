import apiService from '../../../services/api';

export interface LandlordRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  address?: string;
  notes?: string;
  portfolio?: {
    totalProperties?: number;
    totalValue?: number;
    monthlyIncome?: number;
  };
  createdAt: Date;
}

class LandlordService {
  async createLandlord(landlord: Omit<LandlordRecord, 'id' | 'createdAt'>): Promise<string> {
    const data = await apiService.post('/clients/landlords', landlord);
    return data.id;
  }

  async getLandlords(): Promise<LandlordRecord[]> {
    try {
      const response = await apiService.get('/clients/landlords');
      return (response.data || []).map((d: any) => ({
        ...d,
        createdAt: d.createdAt ? new Date(d.createdAt) : new Date(),
      }));
    } catch {
      return [];
    }
  }

  async getLandlord(id: string): Promise<LandlordRecord | null> {
    try {
      const response = await apiService.get(`/clients/landlords/${id}`);
      return {
        ...response.data,
        createdAt: response.data.createdAt ? new Date(response.data.createdAt) : new Date(),
      };
    } catch {
      return null;
    }
  }

  async updateLandlord(id: string, updates: Partial<LandlordRecord>): Promise<void> {
    await apiService.put(`/clients/landlords/${id}`, updates);
  }

  async deleteLandlord(id: string): Promise<void> {
    await apiService.delete(`/clients/landlords/${id}`);
  }
}

export const landlordService = new LandlordService();
