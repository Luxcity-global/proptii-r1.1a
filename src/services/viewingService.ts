import apiService from './api';
import sseService from './sseService';

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

type SubscriberCallback<T> = (data: T) => void;
type SubscriberErrorCallback = (error: Error) => void;

interface ViewingSubscription<T = any> {
  id: string;
  selector: (items: any[]) => T;
  callback: SubscriberCallback<T>;
  onError?: SubscriberErrorCallback;
}

export class ViewingPollingCoordinator {
  private subscribers = new Map<string, ViewingSubscription>();
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private inFlightPromise: Promise<any[]> | null = null;
  private cachedData: any[] | null = null;
  private lastFetchTime = 0;
  private pollIntervalMs = 30000; // 30s background safety poll (SSE is primary)
  private sseUnsubscribe: (() => void) | null = null;

  constructor() {
    this.initSse();
  }

  private initSse(): void {
    if (typeof window !== 'undefined' && !this.sseUnsubscribe) {
      this.sseUnsubscribe = sseService.on(
        ['viewing_created', 'viewing_updated', 'viewing_deleted'],
        (event) => {
          console.debug('[ViewingPollingCoordinator] Received SSE event:', event.type);
          this.invalidateAndRefresh().catch(() => {});
        }
      );
    }
  }

  async fetchAll(force: boolean = false): Promise<any[]> {
    if (this.inFlightPromise) {
      return this.inFlightPromise;
    }

    const now = Date.now();
    if (!force && this.cachedData && now - this.lastFetchTime < 1000) {
      return this.cachedData;
    }

    this.inFlightPromise = (async () => {
      try {
        const response = await apiService.get('/viewing-requests');
        const items = Array.isArray(response) ? response : (response?.data || []);
        this.cachedData = items;
        this.lastFetchTime = Date.now();
        this.notifyAll(items);
        return items;
      } catch (err: any) {
        const error = err instanceof Error ? err : new Error(err?.message || 'Unknown error');
        this.notifyError(error);
        throw error;
      } finally {
        this.inFlightPromise = null;
      }
    })();

    return this.inFlightPromise;
  }

  subscribe<T>(
    selector: (items: any[]) => T,
    callback: SubscriberCallback<T>,
    onError?: SubscriberErrorCallback
  ): () => void {
    const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const sub: ViewingSubscription<T> = { id, selector, callback, onError };
    this.subscribers.set(id, sub);

    // If cached data is available, notify subscriber immediately with current data
    if (this.cachedData) {
      try {
        callback(selector(this.cachedData));
      } catch (e) {
        console.error('Error invoking viewing subscriber callback with cached data:', e);
      }
    }

    // Always fetch fresh data on new subscriber
    this.fetchAll().catch(err => {
      if (onError) onError(err instanceof Error ? err : new Error(err?.message || 'Failed to fetch'));
    });

    return () => {
      this.subscribers.delete(id);
    };
  }

  private notifyAll(items: any[]) {
    this.subscribers.forEach(sub => {
      try {
        const result = sub.selector(items);
        sub.callback(result);
      } catch (err: any) {
        console.error('Error in viewing subscriber callback:', err);
        if (sub.onError) sub.onError(err instanceof Error ? err : new Error(err?.message || 'Error processing viewing data'));
      }
    });
  }

  private notifyError(error: Error) {
    this.subscribers.forEach(sub => {
      if (sub.onError) {
        try {
          sub.onError(error);
        } catch (e) {
          console.error('Error in viewing subscriber onError:', e);
        }
      }
    });
  }

  async invalidateAndRefresh(): Promise<any[]> {
    return this.fetchAll(true);
  }

  getCachedData(): any[] | null {
    return this.cachedData;
  }

  clearCache(): void {
    this.cachedData = null;
    this.lastFetchTime = 0;
  }

  getActiveSubscriberCount(): number {
    return this.subscribers.size;
  }
}

export const viewingPollingCoordinator = new ViewingPollingCoordinator();

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
      viewingPollingCoordinator.invalidateAndRefresh().catch(() => {});
      return { success: true, bookingId: response.id || response.data?.id };
    } catch (error: any) {
      console.error('Error saving viewing booking:', error);
      return { success: false, error: error?.message || 'Unknown error' };
    }
  }

  async getUserViewingBookings(userId: string): Promise<{ success: boolean; bookings?: ViewingBooking[]; error?: string }> {
    try {
      const bookings = await viewingPollingCoordinator.fetchAll();
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
      const bookings = await viewingPollingCoordinator.fetchAll();
      return { success: true, bookings: bookings.filter((b: any) => b.status === status) };
    } catch (error: any) {
      console.error('Error getting viewing bookings by status:', error);
      return { success: false, error: error?.message || 'Unknown error' };
    }
  }

  async getManagerViewingBookings(managerId: string): Promise<{ success: boolean; bookings?: ViewingBooking[]; error?: string }> {
    try {
      const bookings = await viewingPollingCoordinator.fetchAll();
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

  public calculateStatsFromBookings(bookings: ViewingBooking[]): ViewingStats {
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
      const bookings = await viewingPollingCoordinator.fetchAll();
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
      viewingPollingCoordinator.invalidateAndRefresh().catch(() => {});
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
      viewingPollingCoordinator.invalidateAndRefresh().catch(() => {});
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
    return viewingPollingCoordinator.subscribe(
      (items) => items as ViewingBooking[],
      callback,
      onError
    );
  }

  subscribeToManagerViewingBookings(
    managerId: string,
    callback: (bookings: ViewingBooking[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    return viewingPollingCoordinator.subscribe(
      (items) => items as ViewingBooking[],
      callback,
      onError
    );
  }

  subscribeToViewingStats(
    userId: string,
    callback: (stats: ViewingStats) => void,
    onError?: (error: Error) => void
  ): () => void {
    return viewingPollingCoordinator.subscribe(
      (items) => this.calculateStatsFromBookings(items as ViewingBooking[]),
      callback,
      onError
    );
  }

  subscribeToManagerViewingStats(
    managerId: string,
    callback: (stats: ViewingStats) => void,
    onError?: (error: Error) => void
  ): () => void {
    return viewingPollingCoordinator.subscribe(
      (items) => this.calculateStatsFromBookings(items as ViewingBooking[]),
      callback,
      onError
    );
  }

  subscribeToViewingBookingsByEmail(
    agentEmail: string,
    callback: (bookings: ViewingBooking[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    return viewingPollingCoordinator.subscribe(
      (items) => items as ViewingBooking[],
      callback,
      onError
    );
  }

  subscribeToViewingStatsByEmail(
    agentEmail: string,
    callback: (stats: ViewingStats) => void,
    onError?: (error: Error) => void
  ): () => void {
    return viewingPollingCoordinator.subscribe(
      (items) => this.calculateStatsFromBookings(items as ViewingBooking[]),
      callback,
      onError
    );
  }
}

export const viewingService = new ViewingService();
export default viewingService;
