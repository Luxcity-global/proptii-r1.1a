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
    // apiService.post() wraps the backend response in { success, data } — unwrap it
    const response = await apiService.post('/clients/landlords', landlord);
    const data = (response as any).data ?? response;
    const id = data.id ?? data._id;
    if (!id) {
      console.error('[landlordService] Backend response missing id field:', response);
      throw new Error('Backend did not return a landlord ID');
    }
    return id;
  }

  async getLandlords(): Promise<LandlordRecord[]> {
    try {
      const response = await apiService.get('/clients/landlords');
      // Backend returns { users: [...] } — unwrap ApiResponse envelope then users array
      const payload = (response as any).data ?? response;
      const list: any[] = payload.users || payload || [];
      return list.map((d: any) => ({
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
      // Backend returns { success, user } — unwrap ApiResponse envelope then user object
      const payload = (response as any).data ?? response;
      const record = payload.user ?? payload;
      if (!record || !record.id) return null;
      return {
        ...record,
        createdAt: record.createdAt ? new Date(record.createdAt) : new Date(),
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
