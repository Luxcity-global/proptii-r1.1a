import apiService from './api';
import { viewingPollingCoordinator } from './viewingService';
import { publishViewingCopy } from './viewingInboxService';

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
  private onlyRequests(items: any[]): BookViewingRequest[] {
    return (items || []).filter((item) => item?.status === 'requested');
  }

  async saveRequest(
    userId: string,
    propertyId: string,
    property: BookViewingRequest['property'],
    managerInfo?: {
      landlordId?: string | null;
      agentId?: string | null;
    },
    viewingDetails?: { date?: string; time?: string; preference?: string; userDetails?: { fullName?: string; email?: string; phoneNumber?: string } }
  ): Promise<{ success: boolean; requestId?: string; error?: string }> {
    try {
      const propertyTitle = [property?.street, property?.town, property?.postcode].filter(Boolean).join(', ')
        || property?.street
        || '';
      const payload = {
        userId,
        propertyId,
        landlordId: managerInfo?.landlordId ?? property.agent?.id ?? null,
        agentId: managerInfo?.agentId ?? property.agent?.id ?? null,
        agentEmail: property.agent?.email?.toLowerCase().trim() || null,
        property,
        propertyTitle,
        requestedDate: viewingDetails?.date || '',
        requestedTime: viewingDetails?.time || '',
        ...(viewingDetails ? { viewingDetails } : {}),
        status: 'requested'
      };

      const response = await apiService.post('/viewing-requests', payload);
      const requestId = response.id || response.data?.id;
      publishViewingCopy({ ...payload, id: requestId, status: 'requested' }).catch(() => {});
      viewingPollingCoordinator.invalidateAndRefresh().catch(() => {});
      return { success: true, requestId };
    } catch (error: any) {
      console.error('Error saving book viewing request:', error);
      return { success: false, error: error?.message || 'Unknown error' };
    }
  }

  async getUserRequests(userId: string): Promise<{ success: boolean; requests?: BookViewingRequest[]; error?: string }> {
    try {
      const requests = this.onlyRequests(await viewingPollingCoordinator.fetchAll());
      return { success: true, requests };
    } catch (error: any) {
      console.error('Error getting book viewing requests:', error);
      return { success: false, error: error?.message || 'Unknown error' };
    }
  }

  async getManagerRequests(managerId: string): Promise<{ success: boolean; requests?: BookViewingRequest[]; error?: string }> {
    try {
      const requests = this.onlyRequests(await viewingPollingCoordinator.fetchAll());
      return { success: true, requests };
    } catch (error: any) {
      console.error('Error getting manager viewing requests:', error);
      return { success: false, error: error?.message || 'Unknown error' };
    }
  }

  async getRequestsByEmail(agentEmail: string): Promise<{ success: boolean; requests?: BookViewingRequest[]; error?: string }> {
    try {
      const requests = this.onlyRequests(await viewingPollingCoordinator.fetchAll());
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
    return viewingPollingCoordinator.subscribe(
      (items) => this.onlyRequests(items),
      callback,
      onError
    );
  }

  subscribeToManagerRequests(
    managerId: string,
    callback: (requests: BookViewingRequest[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    return viewingPollingCoordinator.subscribe(
      (items) => this.onlyRequests(items),
      callback,
      onError
    );
  }

  subscribeToRequestsByEmail(
    agentEmail: string,
    callback: (requests: BookViewingRequest[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    return viewingPollingCoordinator.subscribe(
      (items) => this.onlyRequests(items),
      callback,
      onError
    );
  }

  async deleteRequest(requestId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await apiService.delete(`/viewing-requests/${requestId}`);
      viewingPollingCoordinator.invalidateAndRefresh().catch(() => {});
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting viewing request:', error);
      return { success: false, error: error?.message || 'Unknown error' };
    }
  }
}

export const bookViewingRequestService = new BookViewingRequestService();
export default bookViewingRequestService;
