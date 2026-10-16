import apiService from '../../../services/api';

export interface PendingInvitation {
  id: string;
  email: string;
  propertyId: string;
  propertyAddress: string;
  landlordId: string;
  landlordEmail: string;
  landlordName?: string;
  inviteType: 'new-tenant' | 'existing-tenant';
  customMessage?: string;
  sentAt: Date;
  status: 'pending' | 'accepted' | 'expired';
}

export interface ValidatedInvitation {
  id: string;
  token: string;
  propertyId: string;
  propertyAddress: string;
  landlordName?: string;
  landlordEmail?: string;
  tenantEmail?: string;
  tenantName?: string;
  rentAmount?: number | null;
  leaseStart?: string | null;
  customMessage?: string | null;
  expiresAt?: string;
}

export interface ValidateTokenResponse {
  valid: boolean;
  reason?: string;
  message?: string;
  invitation?: ValidatedInvitation;
}

export interface ClaimInvitationResponse {
  success: boolean;
  message?: string;
  propertyId?: string;
  propertyAddress?: string;
  tenantId?: string;
  conversationId?: string;
}

class InvitationService {
  /**
   * Record a sent tenant invitation so it can be tracked in the dashboard.
   * Generates and returns a secure invitation token and document ID.
   */
  async createInvitation(
    data: Omit<PendingInvitation, 'id' | 'sentAt' | 'status'>
  ): Promise<{ id: string; token: string }> {
    try {
      const response: any = await apiService.post('/tenant-invitations', {
        ...data,
        sentAt: new Date().toISOString(),
        status: 'pending',
      });
      const id = response?.id || (response as any)?.data?.id || '';
      const token = response?.token || (response as any)?.data?.token || id;
      return { id, token };
    } catch (error) {
      console.error('[InvitationService] Failed to record invitation:', error);
      throw error;
    }
  }

  /**
   * Public validation of an invitation token.
   * GET /api/tenant-invitations/validate?token=...
   */
  async validateInvitation(token: string): Promise<ValidateTokenResponse> {
    try {
      const response: any = await apiService.get(`/tenant-invitations/validate?token=${encodeURIComponent(token)}`);
      return (response as any)?.data ?? response;
    } catch (error: any) {
      return {
        valid: false,
        reason: 'ERROR',
        message: error?.response?.data?.message || error?.message || 'Failed to validate invitation.',
      };
    }
  }

  /**
   * Authenticated claim of an invitation token by the logged in tenant.
   * POST /api/tenant-invitations/claim
   */
  async claimInvitation(token: string): Promise<ClaimInvitationResponse> {
    try {
      const response: any = await apiService.post('/tenant-invitations/claim', { token });
      return (response as any)?.data ?? response;
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || error?.message || 'Failed to claim invitation.');
    }
  }

  async getInvitations(landlordId: string): Promise<PendingInvitation[]> {
    try {
      const response = await apiService.get(`/tenant-invitations?landlordId=${encodeURIComponent(landlordId)}`);
      const list: any[] = response.invitations || [];
      return list.map((item) => ({
        id: item.id,
        email: item.email || item.tenantEmail,
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

