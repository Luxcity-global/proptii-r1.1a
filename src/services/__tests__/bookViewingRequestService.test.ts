import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import bookViewingRequestService from '../bookViewingRequestService';
import { viewingPollingCoordinator } from '../viewingService';
import apiService from '../api';

vi.mock('../api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('bookViewingRequestService with shared polling coordinator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    viewingPollingCoordinator.clearCache();
  });

  afterEach(() => {
    viewingPollingCoordinator.clearCache();
  });

  const mockRequests = [
    {
      id: 'req-1',
      userId: 'user-1',
      propertyId: 'prop-1',
      landlordId: 'landlord-1',
      agentId: 'agent-1',
      agentEmail: 'agent@example.com',
      status: 'requested' as const,
      property: {
        street: '123 Test St',
        agent: { id: 'agent-1', name: 'Agent', email: 'agent@example.com', phone: '123', company: 'Co' },
      },
      createdAt: '2026-08-19',
      updatedAt: '2026-08-19',
    },
  ];

  it('shares the polling coordinator and fetches viewing requests', async () => {
    vi.mocked(apiService.get).mockResolvedValue(mockRequests);

    const cb1 = vi.fn();
    const unsub = bookViewingRequestService.subscribeToUserRequests('user-1', cb1);

    await vi.waitFor(() => {
      expect(cb1).toHaveBeenCalledWith(mockRequests);
    });

    expect(apiService.get).toHaveBeenCalledTimes(1);
    expect(apiService.get).toHaveBeenCalledWith('/viewing-requests');

    unsub();
    expect(viewingPollingCoordinator.getActiveSubscriberCount()).toBe(0);
  });

  it('triggers immediate refresh on request deletion', async () => {
    vi.mocked(apiService.get).mockResolvedValue(mockRequests);
    vi.mocked(apiService.delete).mockResolvedValue({ success: true });

    const callback = vi.fn();
    const unsub = bookViewingRequestService.subscribeToManagerRequests('landlord-1', callback);

    await vi.waitFor(() => {
      expect(callback).toHaveBeenCalledWith(mockRequests);
    });

    expect(apiService.get).toHaveBeenCalledTimes(1);

    await bookViewingRequestService.deleteRequest('req-1');
    expect(apiService.delete).toHaveBeenCalledWith('/viewing-requests/req-1');

    await vi.waitFor(() => {
      expect(apiService.get).toHaveBeenCalledTimes(2);
    });

    unsub();
  });
});
