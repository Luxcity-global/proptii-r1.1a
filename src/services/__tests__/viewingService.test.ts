import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import viewingService, { viewingPollingCoordinator } from '../viewingService';
import apiService from '../api';

vi.mock('../api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('viewingService with shared polling coordinator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    viewingPollingCoordinator.clearCache();
  });

  afterEach(() => {
    viewingPollingCoordinator.clearCache();
  });

function asListed(bookings: typeof mockBookings) {
  return bookings.map((booking) => ({
    ...booking,
    property: {
      ...booking.property,
      town: booking.property.town || '',
      city: booking.property.city || '',
      postcode: booking.property.postcode || '',
    },
  }));
}

  const mockBookings = [
    {
      id: 'viewing-1',
      userId: 'user-1',
      propertyId: 'prop-1',
      landlordId: 'landlord-1',
      agentId: 'agent-1',
      agentEmail: 'agent@example.com',
      status: 'pending',
      property: {
        street: '123 Test St',
        agent: { id: 'agent-1', name: 'Agent', email: 'agent@example.com', phone: '123', company: 'Co' },
      },
      viewingDetails: {
        date: '2026-08-20',
        time: '14:00',
        preference: 'in-person',
        userDetails: { fullName: 'Tenant 1', email: 'tenant@example.com', phoneNumber: '123' },
      },
      createdAt: '2026-08-19',
      updatedAt: '2026-08-19',
    },
    {
      id: 'viewing-2',
      userId: 'user-1',
      propertyId: 'prop-2',
      landlordId: 'landlord-1',
      agentId: 'agent-1',
      agentEmail: 'agent@example.com',
      status: 'completed',
      property: {
        street: '456 Test Ave',
        agent: { id: 'agent-1', name: 'Agent', email: 'agent@example.com', phone: '123', company: 'Co' },
      },
      viewingDetails: {
        date: '2026-08-18',
        time: '11:00',
        preference: 'in-person',
        userDetails: { fullName: 'Tenant 1', email: 'tenant@example.com', phoneNumber: '123' },
      },
      createdAt: '2026-08-17',
      updatedAt: '2026-08-18',
    },
  ];

  it('deduplicates in-flight GET requests when multiple subscriptions are created simultaneously', async () => {
    vi.mocked(apiService.get).mockResolvedValue(mockBookings);

    const cb1 = vi.fn();
    const cb2 = vi.fn();
    const cbStats = vi.fn();

    const unsub1 = viewingService.subscribeToUserViewingBookings('user-1', cb1);
    const unsub2 = viewingService.subscribeToManagerViewingBookings('landlord-1', cb2);
    const unsubStats = viewingService.subscribeToViewingStats('user-1', cbStats);

    // Wait for resolution
    await vi.waitFor(() => {
      expect(cb1).toHaveBeenCalledWith(asListed(mockBookings));
      expect(cb2).toHaveBeenCalledWith(asListed(mockBookings));
      expect(cbStats).toHaveBeenCalledWith({
        upcoming: 1,
        completed: 1,
        rescheduled: 0,
        total: 2,
      });
    });

    // Exactly 1 network request should have been dispatched despite 3 subscriptions
    expect(apiService.get).toHaveBeenCalledTimes(1);
    expect(apiService.get).toHaveBeenCalledWith('/viewing-requests');

    // Clean up
    unsub1();
    unsub2();
    unsubStats();
    expect(viewingPollingCoordinator.getActiveSubscriberCount()).toBe(0);
  });

  it('calculates viewing stats properly from bookings', () => {
    const stats = viewingService.calculateStatsFromBookings(mockBookings as any);
    expect(stats).toEqual({
      upcoming: 1,
      completed: 1,
      rescheduled: 0,
      total: 2,
    });
  });

  it('triggers immediate cache refresh on status update', async () => {
    vi.mocked(apiService.get).mockResolvedValue(mockBookings);
    vi.mocked(apiService.put).mockResolvedValue({ data: { id: 'viewing-1', status: 'confirmed' } });

    const callback = vi.fn();
    const unsub = viewingService.subscribeToUserViewingBookings('user-1', callback);

    await vi.waitFor(() => {
      expect(callback).toHaveBeenCalledWith(asListed(mockBookings));
    });

    expect(apiService.get).toHaveBeenCalledTimes(1);

    // Now update status
    await viewingService.updateViewingStatus('viewing-1', 'confirmed');
    expect(apiService.put).toHaveBeenCalledWith('/viewing-requests/viewing-1', { status: 'confirmed' });

    // Refresh should have triggered a fresh get
    await vi.waitFor(() => {
      expect(apiService.get).toHaveBeenCalledTimes(2);
    });

    unsub();
  });

  it('does not let an in-flight list overwrite a forced refresh', async () => {
    let releaseFirst: (value: unknown) => void = () => {};
    const first = new Promise((resolve) => {
      releaseFirst = resolve;
    });
    const rescheduled = {
      ...mockBookings[0],
      status: 'rescheduled',
      viewingDetails: { ...mockBookings[0].viewingDetails, date: '2026-09-01', time: '16:00' },
    };
    vi.mocked(apiService.get)
      .mockReturnValueOnce(first as any)
      .mockResolvedValueOnce([rescheduled]);

    const stale = viewingPollingCoordinator.fetchAll();
    const fresh = viewingPollingCoordinator.fetchAll(true);
    releaseFirst(mockBookings);
    const [staleRows, freshRows] = await Promise.all([stale, fresh]);

    expect(staleRows[0].status).toBe('pending');
    expect(freshRows[0].status).toBe('rescheduled');
    expect(freshRows[0].viewingDetails.date).toBe('2026-09-01');
    expect(viewingPollingCoordinator.getCachedData()?.[0].status).toBe('rescheduled');
    expect(apiService.get).toHaveBeenCalledTimes(2);
  });
});
