import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBatchedPropertyFacts } from '../useBatchedPropertyFacts';
import type { Property } from '../../types/property';
import * as govDataService from '../../services/govDataService';

vi.mock('../../services/govDataService', () => ({
  fetchBatchedPropertyFacts: vi.fn(),
}));

const mockProp1: Property = {
  listingId: 'prop-1',
  title: '1 Bed Flat',
  price: '£1,500 pcm',
  location: 'London',
  imageUrls: [],
  url: 'https://example.com/prop1',
};

const mockProp2: Property = {
  listingId: 'prop-2',
  title: '2 Bed Flat',
  price: '£2,000 pcm',
  location: 'London',
  imageUrls: [],
  url: 'https://example.com/prop2',
};

const mockProp3: Property = {
  listingId: 'prop-3',
  title: '3 Bed House',
  price: '£3,000 pcm',
  location: 'London',
  imageUrls: [],
  url: 'https://example.com/prop3',
};

describe('useBatchedPropertyFacts', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('requests facts only for newly discovered listings (delta-only batching)', async () => {
    const fetchMock = vi.mocked(govDataService.fetchBatchedPropertyFacts);
    fetchMock.mockResolvedValueOnce({
      [mockProp1.url!]: [{ code: 'epc_good', label: 'EPC B', severity: 'positive' } as any],
    });

    let currentResults = [mockProp1];
    const { result, rerender } = renderHook(() =>
      useBatchedPropertyFacts(true, currentResults)
    );

    // Fast-forward debounce timer
    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0].listingIds).toContain(mockProp1.listingId);

    // Second chunk arrives from SSE stream with mockProp1 AND mockProp2
    fetchMock.mockResolvedValueOnce({
      [mockProp2.listingId!]: [{ code: 'flood_low', label: 'Low Flood Risk', severity: 'positive' } as any],
    });

    currentResults = [mockProp1, mockProp2];
    rerender();

    // Fast-forward debounce timer
    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    // Should only have called with mockProp2 (delta), NOT mockProp1 again!
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0].listingIds).toEqual([mockProp2.listingId]);
    expect(fetchMock.mock.calls[1][0].listingIds).not.toContain(mockProp1.listingId);
  });
});
