import apiService from './api';

export interface ViewingBooking {
  id: string;
  userId: string;
  propertyId?: string | null;
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
  viewingDetails: {
    date: string;
    time: string;
    preference: string;
    userDetails: {
      fullName: string;
      email: string;
      phoneNumber: string;
    };
    whatsappNumber?: string;
  };
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled';
  createdAt: any;
  updatedAt: any;
  confirmedAt?: any;
  completedAt?: any;
  cancelledAt?: any;
  rescheduledAt?: any;
  notes?: string;
  agentNotes?: string;
}

export interface ViewingStats {
  upcoming: number;
  completed: number;
  rescheduled: number;
  total: number;
}

class ViewingService {
  async saveViewingBooking(
    userId: string,
    property: ViewingBooking['property'],
    viewingDetails: ViewingBooking['viewingDetails'],
    propertyId?: string,
    managerInfo?: {
      landlordId?: string | null;
      agentId?: string | null;
    }
  ): Promise<{ success: boolean; bookingId?: string; error?: string }> {
    try {
      const payload = {
        userId,
        propertyId: propertyId || null,
        landlordId: managerInfo?.landlordId ?? property.agent?.id ?? null,
        agentId: managerInfo?.agentId ?? property.agent?.id ?? null,
        agentEmail: property.agent?.email?.toLowerCase().trim() || null,
        property,
        viewingDetails,
        status: 'pending'
      };
      const response = await apiService.post('/viewing-requests', payload);
      return { success: true, bookingId: response.id || response.data?.id };
    } catch (error: any) {
      console.error('Error saving viewing booking:', error);
      return { success: false, error: error?.message || 'Unknown error' };
    }
  }

  async getUserViewingBookings(userId: string): Promise<{ success: boolean; bookings?: ViewingBooking[]; error?: string }> {
    try {
      const response = await apiService.get('/viewing-requests');
      const bookings = Array.isArray(response) ? response : (response.data || []);
      return { success: true, bookings };
    } catch (error: any) {
      console.error('Error getting user viewing bookings:', error);
      return { success: false, error: error?.message || 'Unknown error' };
    }
  }

  async getViewingBookingsByStatus(
    userId: string,
    status: ViewingBooking['status']
  ): Promise<{ success: boolean; bookings?: ViewingBooking[]; error?: string }> {
    try {
      const response = await apiService.get('/viewing-requests');
      const all = Array.isArray(response) ? response : (response.data || []);
      return { success: true, bookings: all.filter((b: any) => b.status === status) };
    } catch (error: any) {
      console.error('Error getting viewing bookings by status:', error);
      return { success: false, error: error?.message || 'Unknown error' };
    }
  }

  async getManagerViewingBookings(managerId: string): Promise<{ success: boolean; bookings?: ViewingBooking[]; error?: string }> {
    try {
      const response = await apiService.get('/viewing-requests');
      const bookings = Array.isArray(response) ? response : (response.data || []);
      return { success: true, bookings };
    } catch (error: any) {
      console.error('Error getting manager viewing bookings:', error);
      return { success: false, error: error?.message || 'Unknown error' };
    }
  }

  async getManagerViewingBookingsByStatus(
    managerId: string,
    status: ViewingBooking['status']
  ): Promise<{ success: boolean; bookings?: ViewingBooking[]; error?: string }> {
    try {
      const { success, bookings, error } = await this.getManagerViewingBookings(managerId);
      if (!success) return { success, error };
      return { success: true, bookings: (bookings || []).filter(b => b.status === status) };
    } catch (error: any) {
      console.error('Error getting manager viewing bookings by status:', error);
      return { success: false, error: error?.message || 'Unknown error' };
    }
  }

  private calculateStatsFromBookings(bookings: ViewingBooking[]): ViewingStats {
    return bookings.reduce<ViewingStats>((stats, booking) => {
      stats.total++;
      switch (booking.status) {
        case 'pending':
        case 'confirmed':
          stats.upcoming++;
          break;
        case 'completed':
          stats.completed++;
          break;
        case 'rescheduled':
          stats.rescheduled++;
          break;
      }
      return stats;
    }, {
      upcoming: 0,
      completed: 0,
      rescheduled: 0,
      total: 0
    });
  }

  async getManagerViewingStats(managerId: string): Promise<{ success: boolean; stats?: ViewingStats; error?: string }> {
    try {
      const { success, bookings, error } = await this.getManagerViewingBookings(managerId);
      if (!success || !bookings) return { success: false, error };
      return { success: true, stats: this.calculateStatsFromBookings(bookings) };
    } catch (error: any) {
      console.error('Error getting manager viewing stats:', error);
      return { success: false, error: error?.message || 'Unknown error' };
    }
  }

  async getViewingBookingsByEmail(agentEmail: string): Promise<{ success: boolean; bookings?: ViewingBooking[]; error?: string }> {
    try {
      const response = await apiService.get('/viewing-requests');
      const bookings = Array.isArray(response) ? response : (response.data || []);
      return { success: true, bookings };
    } catch (error: any) {
      console.error('Error getting viewing bookings by email:', error);
      return { success: false, error: error?.message || 'Unknown error' };
    }
  }

  async getViewingBookingsByEmailAndStatus(
    agentEmail: string,
    status: ViewingBooking['status']
  ): Promise<{ success: boolean; bookings?: ViewingBooking[]; error?: string }> {
    try {
      const { success, bookings, error } = await this.getViewingBookingsByEmail(agentEmail);
      if (!success) return { success, error };
      return { success: true, bookings: (bookings || []).filter(b => b.status === status) };
    } catch (error: any) {
      console.error('Error getting viewing bookings by email and status:', error);
      return { success: false, error: error?.message || 'Unknown error' };
    }
  }

  async getViewingStatsByEmail(agentEmail: string): Promise<{ success: boolean; stats?: ViewingStats; error?: string }> {
    try {
      const { success, bookings, error } = await this.getViewingBookingsByEmail(agentEmail);
      if (!success || !bookings) return { success: false, error };
      return { success: true, stats: this.calculateStatsFromBookings(bookings) };
    } catch (error: any) {
      console.error('Error getting viewing stats by email:', error);
      return { success: false, error: error?.message || 'Unknown error' };
    }
  }

  async updateViewingStatus(
    bookingId: string,
    status: ViewingBooking['status'],
    notes?: string,
    agentNotes?: string,
    updates?: {
      viewingDetails?: ViewingBooking['viewingDetails'];
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const payload: any = { status };
      if (notes) payload.notes = notes;
      if (agentNotes) payload.agentNotes = agentNotes;
      if (updates?.viewingDetails) payload.viewingDetails = updates.viewingDetails;

      await apiService.put(`/viewing-requests/${bookingId}`, payload);
      return { success: true };
    } catch (error: any) {
      console.error('Error updating viewing status:', error);
      return { success: false, error: error?.message || 'Unknown error' };
    }
  }

  async getViewingStats(userId: string): Promise<{ success: boolean; stats?: ViewingStats; error?: string }> {
    try {
      const { success, bookings, error } = await this.getUserViewingBookings(userId);
      if (!success || !bookings) return { success: false, error };
      return { success: true, stats: this.calculateStatsFromBookings(bookings) };
    } catch (error: any) {
      console.error('Error getting viewing stats:', error);
      return { success: false, error: error?.message || 'Unknown error' };
    }
  }

  async deleteViewingBooking(bookingId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await apiService.delete(`/viewing-requests/${bookingId}`);
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting viewing booking:', error);
      return { success: false, error: error?.message || 'Unknown error' };
    }
  }

  subscribeToUserViewingBookings(
    userId: string,
    callback: (bookings: ViewingBooking[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    let active = true;
    const fetch = async () => {
      const res = await this.getUserViewingBookings(userId);
      if (active && res.success && res.bookings) callback(res.bookings);
    };
    fetch();
    const interval = setInterval(fetch, 5000);
    return () => { active = false; clearInterval(interval); };
  }

  subscribeToManagerViewingBookings(
    managerId: string,
    callback: (bookings: ViewingBooking[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    let active = true;
    const fetch = async () => {
      const res = await this.getManagerViewingBookings(managerId);
      if (active && res.success && res.bookings) callback(res.bookings);
    };
    fetch();
    const interval = setInterval(fetch, 5000);
    return () => { active = false; clearInterval(interval); };
  }

  subscribeToViewingStats(
    userId: string,
    callback: (stats: ViewingStats) => void,
    onError?: (error: Error) => void
  ): () => void {
    let active = true;
    const fetch = async () => {
      const res = await this.getViewingStats(userId);
      if (active && res.success && res.stats) callback(res.stats);
    };
    fetch();
    const interval = setInterval(fetch, 5000);
    return () => { active = false; clearInterval(interval); };
  }

  subscribeToManagerViewingStats(
    managerId: string,
    callback: (stats: ViewingStats) => void,
    onError?: (error: Error) => void
  ): () => void {
    let active = true;
    const fetch = async () => {
      const res = await this.getManagerViewingStats(managerId);
      if (active && res.success && res.stats) callback(res.stats);
    };
    fetch();
    const interval = setInterval(fetch, 5000);
    return () => { active = false; clearInterval(interval); };
  }

  subscribeToViewingBookingsByEmail(
    agentEmail: string,
    callback: (bookings: ViewingBooking[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    let active = true;
    const fetch = async () => {
      const res = await this.getViewingBookingsByEmail(agentEmail);
      if (active && res.success && res.bookings) callback(res.bookings);
    };
    fetch();
    const interval = setInterval(fetch, 5000);
    return () => { active = false; clearInterval(interval); };
  }

  subscribeToViewingStatsByEmail(
    agentEmail: string,
    callback: (stats: ViewingStats) => void,
    onError?: (error: Error) => void
  ): () => void {
    let active = true;
    const fetch = async () => {
      const res = await this.getViewingStatsByEmail(agentEmail);
      if (active && res.success && res.stats) callback(res.stats);
    };
    fetch();
    const interval = setInterval(fetch, 5000);
    return () => { active = false; clearInterval(interval); };
  }
}

export const viewingService = new ViewingService();
export default viewingService;
