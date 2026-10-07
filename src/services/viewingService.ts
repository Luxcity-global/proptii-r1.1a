import apiService from './api';
import sseService from './sseService';
import landlordUserService from './landlordUserService';
import { publishViewingCopy, rememberViewings, rememberApplicant, applyRememberedApplicant } from './viewingInboxService';

const CLOSED_VIEWING_STATUSES = new Set(['confirmed', 'completed', 'cancelled', 'rescheduled']);

/** The list page only matches lowercase status. Older saves used PENDING. */
function normalizeViewingStatus(value: unknown): string {
  const raw = String(value ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (!raw || raw === 'submitted' || raw === 'new' || raw === 'awaiting' || raw === 'awaiting_approval') {
    return 'pending';
  }
  if (raw === 'request' || raw === 'requested') return 'requested';
  if (raw === 'canceled') return 'cancelled';
  if (CLOSED_VIEWING_STATUSES.has(raw) || raw === 'pending') return raw;
  return 'pending';
}

function normalizeViewingItem(item: any): any {
  if (!item || typeof item !== 'object') return item;
  const nested = item.data && typeof item.data === 'object' ? item.data : null;
  const source = nested && !item.property && !item.viewingDetails && !item.status
    ? { ...nested, id: item.id || nested.id }
    : item;
  const status = normalizeViewingStatus(source.status);
  const property = source.property && typeof source.property === 'object' ? source.property : null;
  const hasStreet = Boolean(property?.street);
  const details = source.viewingDetails && typeof source.viewingDetails === 'object' ? source.viewingDetails : null;
  const agentEmail = String(
    property?.agent?.email || source.agentEmail || source.landlordEmail || '',
  ).trim();
  const writtenContact = String(details?.userDetails?.email || '').trim();
  const storedTenant = String(source.tenantEmail || '').trim();
  const sameParty = (left: string, right: string) => left.toLowerCase() === right.toLowerCase();
  const tenantEmail = writtenContact && !sameParty(writtenContact, agentEmail)
    ? writtenContact
    : (storedTenant && !sameParty(storedTenant, agentEmail) ? storedTenant : (!agentEmail ? writtenContact || storedTenant : ''));

  const normalized = {
    ...source,
    id: source.id || item.id,
    status,
    agentEmail: agentEmail || source.agentEmail || null,
    property: {
      street: property?.street || source.propertyTitle || source.propertyName || 'Property viewing',
      town: property?.town || '',
      city: property?.city || '',
      postcode: property?.postcode || '',
      agent: {
        id: property?.agent?.id || source.agentId || '',
        name: property?.agent?.name || '',
        email: agentEmail,
        phone: property?.agent?.phone || '',
        company: property?.agent?.company || '',
      },
    },
    viewingDetails: {
      date: details?.date || source.requestedDate || source.viewing_date || '',
      time: details?.time || source.requestedTime || source.viewing_time || '',
      preference: details?.preference || source.preference || 'In-Person Viewing',
      userDetails: {
        fullName: details?.userDetails?.fullName || source.tenantName || '',
        email: tenantEmail,
        phoneNumber: details?.userDetails?.phoneNumber || source.phone || '',
      },
      ...(details?.whatsappNumber ? { whatsappNumber: details.whatsappNumber } : {}),
    },
  };
  return applyRememberedApplicant(normalized);
}

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
        const payload = Array.isArray(response) ? response : (response?.data || []);
        const rows = Array.isArray(payload) ? payload : (payload?.data || []);
        const items = (Array.isArray(rows) ? rows : []).map(normalizeViewingItem);
        this.cachedData = items;
        this.lastFetchTime = Date.now();
        rememberViewings(items);
        items.forEach((item) => {
          publishViewingCopy(item).catch(() => {});
        });
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
  private scheduledBookings(items: any[]): ViewingBooking[] {
    return (items || []).filter((item) => item?.status !== 'requested');
  }

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
      const agentEmail = property.agent?.email?.toLowerCase().trim() || null;
      let landlordId = managerInfo?.landlordId || null;
      let agentId = managerInfo?.agentId || null;
      if (agentEmail) {
        try {
          const lookup = await landlordUserService.getLandlordUserByEmail(agentEmail);
          if (lookup.success && lookup.user?.id) {
            landlordId = lookup.user.id;
            agentId = lookup.user.id;
          }
        } catch {
          /* the email on the viewing is still enough for the landlord list */
        }
      }
      const accountId = (value: string | null) => (
        value && /^[A-Za-z0-9]{20,}$/.test(value) ? value : null
      );
      const listingId = propertyId && propertyId !== property?.street && !/\s/.test(propertyId)
        ? propertyId
        : null;
      const payload = {
        userId,
        propertyId: listingId,
        landlordId: accountId(landlordId),
        agentId: accountId(agentId),
        agentEmail,
        tenantEmail: viewingDetails?.userDetails?.email?.trim().toLowerCase() || null,
        propertyTitle: [property?.street, property?.town, property?.postcode].filter(Boolean).join(', ') || property?.street || '',
        requestedDate: viewingDetails?.date || '',
        requestedTime: viewingDetails?.time || '',
        notes: (viewingDetails as { notes?: string })?.notes || '',
        property,
        viewingDetails,
        status: 'pending'
      };
      const response = await apiService.post('/viewing-requests', payload);
      const body = response?.data;
      const bookingId = body?.id || body?.data?.id || response?.id;
      if (bookingId) {
        rememberApplicant(bookingId, viewingDetails?.userDetails, agentEmail);
      }
      publishViewingCopy({ ...payload, id: bookingId, status: 'pending' }).catch(() => {});
      viewingPollingCoordinator.invalidateAndRefresh().catch(() => {});
      return { success: true, bookingId };
    } catch (error: any) {
      console.error('Error saving viewing booking:', error);
      return { success: false, error: error?.message || 'Unknown error' };
    }
  }

  async getUserViewingBookings(userId: string): Promise<{ success: boolean; bookings?: ViewingBooking[]; error?: string }> {
    try {
      const bookings = this.scheduledBookings(await viewingPollingCoordinator.fetchAll());
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
      const bookings = this.scheduledBookings(await viewingPollingCoordinator.fetchAll());
      return { success: true, bookings: bookings.filter((b: any) => b.status === status) };
    } catch (error: any) {
      console.error('Error getting viewing bookings by status:', error);
      return { success: false, error: error?.message || 'Unknown error' };
    }
  }

  async getManagerViewingBookings(managerId: string): Promise<{ success: boolean; bookings?: ViewingBooking[]; error?: string }> {
    try {
      const bookings = this.scheduledBookings(await viewingPollingCoordinator.fetchAll());
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
      const bookings = this.scheduledBookings(await viewingPollingCoordinator.fetchAll());
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

      const response = await apiService.put(`/viewing-requests/${bookingId}`, payload);
      const body = response?.data;
      const updated = body && typeof body === 'object' && !Array.isArray(body)
        ? (body.status ? body : (body.data && body.data.status ? body.data : body))
        : {};
      const savedStatus = String(updated.status || '').trim().toLowerCase();
      if (savedStatus !== status) {
        return { success: false, error: 'The viewing status did not change.' };
      }
      publishViewingCopy({ ...updated, id: updated.id || bookingId, status: savedStatus }).catch(() => {});
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
      (items) => this.scheduledBookings(items),
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
      (items) => this.scheduledBookings(items),
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
      (items) => this.calculateStatsFromBookings(this.scheduledBookings(items)),
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
      (items) => this.calculateStatsFromBookings(this.scheduledBookings(items)),
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
      (items) => this.scheduledBookings(items),
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
      (items) => this.calculateStatsFromBookings(this.scheduledBookings(items)),
      callback,
      onError
    );
  }
}

export const viewingService = new ViewingService();
export default viewingService;
