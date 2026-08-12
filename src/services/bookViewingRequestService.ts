import apiService from './api';

export interface BookViewingRequest {
  id: string;
  userId: string;
  propertyId: string;
  landlordId?: string | null;
  agentId?: string | null;
  agentEmail?: string | null;
  property: {
    street: string;
    town?: string;
    city?: string;
    postcode?: string;
    agent: {
      id: string;
      name: string;
      email: string;
      phone: string;
      company: string;
    };
  };
  status: 'requested';
  createdAt: any;
  updatedAt: any;
}

class BookViewingRequestService {
  async saveRequest(
    userId: string,
    propertyId: string,
    property: BookViewingRequest['property'],
    managerInfo?: {
      landlordId?: string | null;
      agentId?: string | null;
    }
  ): Promise<{ success: boolean; requestId?: string; error?: string }> {
    try {
      const payload = {
        userId,
        propertyId,
        landlordId: managerInfo?.landlordId ?? property.agent?.id ?? null,
        agentId: managerInfo?.agentId ?? property.agent?.id ?? null,
        agentEmail: property.agent?.email?.toLowerCase().trim() || null,
        property,
        status: 'requested'
      };

      const response = await apiService.post('/viewing-requests', payload);
      return { success: true, requestId: response.id || response.data?.id };
    } catch (error: any) {
      console.error('Error saving book viewing request:', error);
      return { success: false, error: error?.message || 'Unknown error' };
    }
  }

  async getUserRequests(userId: string): Promise<{ success: boolean; requests?: BookViewingRequest[]; error?: string }> {
    try {
      const response = await apiService.get('/viewing-requests');
      const requests = Array.isArray(response) ? response : (response.data || []);
      return { success: true, requests };
    } catch (error: any) {
      console.error('Error getting book viewing requests:', error);
      return { success: false, error: error?.message || 'Unknown error' };
    }
  }

  async getManagerRequests(managerId: string): Promise<{ success: boolean; requests?: BookViewingRequest[]; error?: string }> {
    try {
      const response = await apiService.get('/viewing-requests');
      const requests = Array.isArray(response) ? response : (response.data || []);
      return { success: true, requests };
    } catch (error: any) {
      console.error('Error getting manager viewing requests:', error);
      return { success: false, error: error?.message || 'Unknown error' };
    }
  }

  async getRequestsByEmail(agentEmail: string): Promise<{ success: boolean; requests?: BookViewingRequest[]; error?: string }> {
    try {
      const response = await apiService.get('/viewing-requests');
      const requests = Array.isArray(response) ? response : (response.data || []);
      return { success: true, requests };
    } catch (error: any) {
      console.error('Error getting viewing requests by email:', error);
      return { success: false, error: error?.message || 'Unknown error' };
    }
  }

  subscribeToUserRequests(
    userId: string,
    callback: (requests: BookViewingRequest[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    let active = true;
    const fetchInterval = setInterval(async () => {
      if (!active) return;
      const res = await this.getUserRequests(userId);
      if (res.success && res.requests) {
        callback(res.requests);
      } else if (res.error && onError) {
        onError(new Error(res.error));
      }
    }, 5000); // poll every 5s

    // Initial fetch
    this.getUserRequests(userId).then(res => {
      if (active && res.success && res.requests) {
        callback(res.requests);
      }
    });

    return () => {
      active = false;
      clearInterval(fetchInterval);
    };
  }

  subscribeToManagerRequests(
    managerId: string,
    callback: (requests: BookViewingRequest[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    let active = true;
    const fetchInterval = setInterval(async () => {
      if (!active) return;
      const res = await this.getManagerRequests(managerId);
      if (res.success && res.requests) {
        callback(res.requests);
      } else if (res.error && onError) {
        onError(new Error(res.error));
      }
    }, 5000);

    this.getManagerRequests(managerId).then(res => {
      if (active && res.success && res.requests) {
        callback(res.requests);
      }
    });

    return () => {
      active = false;
      clearInterval(fetchInterval);
    };
  }

  subscribeToRequestsByEmail(
    agentEmail: string,
    callback: (requests: BookViewingRequest[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    let active = true;
    const fetchInterval = setInterval(async () => {
      if (!active) return;
      const res = await this.getRequestsByEmail(agentEmail);
      if (res.success && res.requests) {
        callback(res.requests);
      } else if (res.error && onError) {
        onError(new Error(res.error));
      }
    }, 5000);

    this.getRequestsByEmail(agentEmail).then(res => {
      if (active && res.success && res.requests) {
        callback(res.requests);
      }
    });

    return () => {
      active = false;
      clearInterval(fetchInterval);
    };
  }

  async deleteRequest(requestId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await apiService.delete(`/viewing-requests/${requestId}`);
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting viewing request:', error);
      return { success: false, error: error?.message || 'Unknown error' };
    }
  }
}

export const bookViewingRequestService = new BookViewingRequestService();
export default bookViewingRequestService;
