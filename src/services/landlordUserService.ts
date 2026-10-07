import apiService from './api';

export interface LandlordUser {
  id: string;
  email: string;
  name: string;
  role: 'landlord' | 'agent';
  phone?: string;
  companyName?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

class LandlordUserService {
  async isLandlordOrAgent(email: string): Promise<{ 
    isLandlord: boolean; 
    user?: LandlordUser;
    error?: string 
  }> {
    try {
      const response = await apiService.get(`/landlords/check?email=${encodeURIComponent(email.toLowerCase())}`);
      const payload = response?.data && typeof response.data === 'object' && 'exists' in (response.data as object)
        ? response.data as { exists?: boolean; user?: LandlordUser }
        : response as { exists?: boolean; user?: LandlordUser };
      if (payload.exists && payload.user) {
        return { 
          isLandlord: true, 
          user: {
            ...payload.user,
            createdAt: payload.user.createdAt ? new Date(payload.user.createdAt) : undefined,
            updatedAt: payload.user.updatedAt ? new Date(payload.user.updatedAt) : undefined
          } 
        };
      }
      return { isLandlord: false };
    } catch (error: any) {
      console.error('❌ Error checking landlord/agent status:', error);
      return { isLandlord: false, error: error.message };
    }
  }

  async registerLandlordUser(userData: Omit<LandlordUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<{
    success: boolean;
    userId?: string;
    error?: string;
  }> {
    try {
      const response = await apiService.post('/landlords/register', userData);
      return { success: true, userId: response.id };
    } catch (error: any) {
      console.error('❌ Error registering landlord/agent user:', error);
      return { success: false, error: error.message };
    }
  }

  async getLandlordUserByEmail(email: string): Promise<{
    success: boolean;
    user?: LandlordUser;
    error?: string;
  }> {
    try {
      const result = await this.isLandlordOrAgent(email);
      if (result.isLandlord && result.user) {
        return { success: true, user: result.user };
      } else {
        return { success: false, error: result.error || 'User not found' };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getAllLandlordUsers(): Promise<{
    success: boolean;
    users?: LandlordUser[];
    error?: string;
  }> {
    try {
      const response = await apiService.get('/landlords');
      const users = (response.users || []).map((u: any) => ({
        ...u,
        createdAt: u.createdAt ? new Date(u.createdAt) : undefined,
        updatedAt: u.updatedAt ? new Date(u.updatedAt) : undefined
      }));
      return { success: true, users };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

export default new LandlordUserService();
