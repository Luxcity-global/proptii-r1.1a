import apiService from './api';

export interface PropertySelection {
  id: string;
  userId: string;
  propertyId: string;
  property: {
    title: string;
    address: string;
    price: string;
    bedrooms: number;
    bathrooms: number;
    propertyType: string;
    description: string;
    images: string[];
    agent: {
      id: string;
      name: string;
      email: string;
      phone: string;
      company: string;
    };
    location: {
      street: string;
      town: string;
      city: string;
      postcode: string;
    };
  };
  status: 'interested' | 'viewing_requested' | 'viewing_scheduled' | 'viewing_completed' | 'rejected';
  source: 'search_results' | 'direct_booking' | 'agent_recommendation';
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
  viewingRequestedAt?: Date;
  viewingScheduledAt?: Date;
  viewingCompletedAt?: Date;
}

export interface PropertySelectionStats {
  total: number;
  interested: number;
  viewingRequested: number;
  viewingScheduled: number;
  viewingCompleted: number;
  rejected: number;
}

class PropertySelectionService {
  async savePropertySelection(
    userId: string,
    propertyData: PropertySelection['property'],
    propertyId: string,
    source: PropertySelection['source'] = 'search_results'
  ): Promise<{ success: boolean; selectionId?: string; error?: string }> {
    try {
      if (!navigator.onLine) {
        return { success: false, error: 'Device is offline.' };
      }
      const response = await apiService.post('/property-selections', {
        propertyData,
        propertyId,
        source
      });
      return { success: true, selectionId: response.id };
    } catch (error: any) {
      console.error('❌ Error saving property selection:', error);
      return { success: false, error: error.message };
    }
  }

  async getUserPropertySelections(userId: string): Promise<{ success: boolean; selections?: PropertySelection[]; error?: string }> {
    try {
      const response = await apiService.get(`/property-selections`);
      const selections = (response.selections || []).map((s: any) => ({
        ...s,
        createdAt: new Date(s.createdAt),
        updatedAt: new Date(s.updatedAt),
        viewingRequestedAt: s.viewingRequestedAt ? new Date(s.viewingRequestedAt) : undefined,
        viewingScheduledAt: s.viewingScheduledAt ? new Date(s.viewingScheduledAt) : undefined,
        viewingCompletedAt: s.viewingCompletedAt ? new Date(s.viewingCompletedAt) : undefined,
      }));
      return { success: true, selections };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getPropertySelectionsByStatus(
    userId: string, 
    status: PropertySelection['status']
  ): Promise<{ success: boolean; selections?: PropertySelection[]; error?: string }> {
    try {
      const response = await apiService.get(`/property-selections?status=${status}`);
      const selections = (response.selections || []).map((s: any) => ({
        ...s,
        createdAt: new Date(s.createdAt),
        updatedAt: new Date(s.updatedAt),
      }));
      return { success: true, selections };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async updatePropertySelectionStatus(
    selectionId: string,
    status: PropertySelection['status'],
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await apiService.put(`/property-selections/${selectionId}/status`, { status, notes });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getPropertySelectionStats(userId: string): Promise<{ success: boolean; stats?: PropertySelectionStats; error?: string }> {
    try {
      const response = await apiService.get(`/property-selections/stats`);
      return { success: true, stats: response.stats };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async deletePropertySelection(selectionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await apiService.delete(`/property-selections/${selectionId}`);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  subscribeToUserPropertySelections(
    userId: string,
    callback: (selections: PropertySelection[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    let isActive = true;
    let timer: any;

    const poll = async () => {
      if (!isActive) return;
      try {
        const { success, selections } = await this.getUserPropertySelections(userId);
        if (isActive && success && selections) callback(selections);
      } catch (err: any) {
        if (onError) onError(err);
      }
      if (isActive) timer = setTimeout(poll, 15000);
    };

    poll();
    return () => {
      isActive = false;
      if (timer) clearTimeout(timer);
    };
  }

  subscribeToPropertySelectionStats(
    userId: string,
    callback: (stats: PropertySelectionStats) => void,
    onError?: (error: Error) => void
  ): () => void {
    let isActive = true;
    let timer: any;

    const poll = async () => {
      if (!isActive) return;
      try {
        const { success, stats } = await this.getPropertySelectionStats(userId);
        if (isActive && success && stats) callback(stats);
      } catch (err: any) {
        if (onError) onError(err);
      }
      if (isActive) timer = setTimeout(poll, 15000);
    };

    poll();
    return () => {
      isActive = false;
      if (timer) clearTimeout(timer);
    };
  }
}

export const propertySelectionService = new PropertySelectionService();
export default propertySelectionService;
