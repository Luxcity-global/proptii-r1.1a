import apiService from './api';

export interface QuickRequestPayload {
  email: string;
  name?: string;
  message: string;
  categories: string[];
  listingId: string;
  listingTitle?: string;
  listingSource: 'native' | 'scraped';
  landlordId?: string;
  agentEmail?: string;
  agentName?: string;
  sourcePlatform?: string;
  gdprConsent: boolean;
}

export interface QuickRequestResponse {
  threadToken: string;
  ghostTenantId: string;
  confirmationSent: boolean;
  agentDelivery?: 'sent' | 'no_contact_email';
}

export interface ThreadMessage {
  id: string;
  sender_type: 'ghost_tenant' | 'ghost_landlord' | 'platform_landlord' | 'platform_tenant';
  sender_name: string;
  body: string;
  sent_at: string;
  read_at?: string;
}

export interface ThreadDetails {
  id: string;
  listing_title: string;
  categories: string[];
  status: string;
  message_count: number;
  created_at: string;
  last_reply_at: string;
  limit_reached: boolean;
  ghost_tenant_id?: string;
  ghost_tenant_name?: string | null;
  landlord_id?: string;
}

export interface ThreadResponse {
  thread: ThreadDetails;
  messages: ThreadMessage[];
}

export interface ValidateClaimResponse {
  email: string;
  name: string | null;
  role: 'ghost_tenant' | 'ghost_landlord';
  expires_at: string;
}

class QuickRequestService {
  /**
   * Submit a new Quick Request guest enquiry
   */
  async submitEnquiry(payload: QuickRequestPayload): Promise<QuickRequestResponse> {
    const response = await apiService.post<any>('/guest/enquiry', payload);
    return response.data.data;
  }

  /**
   * Fetch thread message history by token
   */
  async getThread(token: string): Promise<ThreadResponse> {
    const response = await apiService.get<any>(`/guest/thread/${token}`);
    return response.data.data;
  }

  /**
   * Post a reply to an existing thread
   */
  async addReply(
    token: string,
    payload: { message: string; senderType: string; senderId: string; senderName?: string }
  ): Promise<{ id: string; sent_at: string }> {
    const response = await apiService.post<any>(`/guest/thread/${token}/reply`, payload);
    return response.data.data;
  }

  /**
   * Validate a claim token
   */
  async validateClaimToken(token: string): Promise<ValidateClaimResponse> {
    const response = await apiService.post<any>('/guest/claim/validate', { token });
    return response.data.data;
  }

  /**
   * Request resending a claim token
   */
  async resendClaimToken(email: string): Promise<{ sent: boolean }> {
    const response = await apiService.post<any>('/guest/claim/resend', { email });
    return response.data.data;
  }

  /**
   * Confirm claim for the authenticated user using B2C token
   */
  async confirmClaim(token: string): Promise<{ success: boolean; migratedCount: number }> {
    const response = await apiService.post<any>('/guest/claim/confirm', { token });
    return response.data.data;
  }

  /**
   * Trigger automatic merging of ghost accounts matching email
   */
  async autoMerge(email: string): Promise<{ success: boolean; migratedCount: number }> {
    const response = await apiService.post<any>('/guest/claim/auto-merge', { email });
    return response.data.data;
  }
}

export default new QuickRequestService();
