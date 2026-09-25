import apiService from '../../../services/api';

export interface PendingInvitation {
  id: string;
  email: string;
  propertyId: string;
  propertyAddress: string;
  landlordId: string;
  landlordEmail: string;
  inviteType: 'new-tenant' | 'existing-tenant';
  customMessage?: string;
  sentAt: Date;
  status: 'pending' | 'accepted' | 'expired';
}

class InvitationService {
  /**
   * Record a sent tenant invitation so it can be tracked in the dashboard.
   * Uses PUT /tenants/invitations on the backend which writes to Firestore.
   */
  async createInvitation(
    data: Omit<PendingInvitation, 'id' | 'sentAt' | 'status'>
  ): Promise<string> {
    try {
      const response = await apiService.post('/tenant-invitations', {
        ...data,
        sentAt: new Date().toISOString(),
        status: 'pending',
      });
      return response.id as string;
    } catch (error) {
      // Non-fatal — invitation tracking is best-effort
      console.error('[InvitationService] Failed to record invitation:', error);
      throw error;
    }
  }

  async getInvitations(landlordId: string): Promise<PendingInvitation[]> {
    try {
      const response = await apiService.get(`/tenant-invitations?landlordId=${encodeURIComponent(landlordId)}`);
      const list: any[] = response.invitations || [];
      return list.map((item) => ({
        id: item.id,
        email: item.email,
        propertyId: item.propertyId,
        propertyAddress: item.propertyAddress,
        landlordId: item.landlordId,
        landlordEmail: item.landlordEmail,
        inviteType: item.inviteType || 'new-tenant',
        customMessage: item.customMessage,
        sentAt: item.sentAt ? new Date(item.sentAt) : new Date(),
        status: item.status || 'pending',
      }));
    } catch (error) {
      console.error('[InvitationService] Failed to fetch invitations:', error);
      return [];
    }
  }

  async markAccepted(invitationId: string): Promise<void> {
    await apiService.put(`/tenant-invitations/${invitationId}`, { status: 'accepted' });
  }
}

export const invitationService = new InvitationService();
