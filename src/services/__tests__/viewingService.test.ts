import { describe, it, expect, vi, beforeEach } from 'vitest';
import viewingService from '../viewingService';
import { onSnapshot } from 'firebase/firestore';

vi.mock('firebase/firestore', async (importOriginal) => {
  const original = await importOriginal<typeof import('firebase/firestore')>();
  return {
    ...original,
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    onSnapshot: vi.fn(),
  };
});

vi.mock('../config/firebaseConfig', () => ({
  db: {},
}));

describe('viewingService Firestore subscription fallbacks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('subscribeToUserViewingBookings', () => {
    it('attempts ordered query first, and falls back to unordered query on failed-precondition error', () => {
      let isFirstCall = true;
      const unsubscribeMock = vi.fn();

      vi.mocked(onSnapshot).mockImplementation((q: any, onNext: any, onError?: any) => {
        if (isFirstCall) {
          isFirstCall = false;
          // Simulate missing index error
          const error = new Error('Index required') as any;
          error.code = 'failed-precondition';
          if (onError) onError(error);
        } else {
          // Success callback on fallback query
          const mockSnapshot = {
            forEach: (cb: any) => {
              cb({
                data: () => ({ id: '1', userId: 'user-1', createdAt: { toMillis: () => 1000 } }),
              });
            },
          };
          onNext(mockSnapshot);
        }
        return unsubscribeMock;
      });

      const callback = vi.fn();
      const unsubscribe = viewingService.subscribeToUserViewingBookings('user-1', callback);

      expect(vi.mocked(onSnapshot)).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback.mock.calls[0][0][0].id).toBe('1');
      expect(callback.mock.calls[0][0][0].userId).toBe('user-1');
      
      unsubscribe();
      expect(unsubscribeMock).toHaveBeenCalled();
    });
  });

  describe('subscribeToViewingBookingsByEmail', () => {
    it('falls back sequentially: ordered -> unordered -> nested', () => {
      let stepCalls = 0;
      const unsubscribeMock = vi.fn();

      vi.mocked(onSnapshot).mockImplementation((q: any, onNext: any, onError?: any) => {
        stepCalls++;
        if (stepCalls < 3) {
          // Trigger failed-precondition for the first two attempts
          const error = new Error('Index required') as any;
          error.code = 'failed-precondition';
          if (onError) onError(error);
        } else {
          // Success on the 3rd attempt (nested query fallback)
          const mockSnapshot = {
            forEach: (cb: any) => {
              cb({
                data: () => ({ 
                  id: '1', 
                  agentEmail: 'test@example.com', 
                  property: { agent: { email: 'test@example.com' } }, 
                  createdAt: { toMillis: () => 1000 } 
                }),
              });
            },
          };
          onNext(mockSnapshot);
        }
        return unsubscribeMock;
      });

      const callback = vi.fn();
      viewingService.subscribeToViewingBookingsByEmail('test@example.com', callback);

      // Verify that it went through 3 steps: ordered, unordered, then nested
      expect(stepCalls).toBe(3);
      expect(callback).toHaveBeenCalled();
    });
  });
});
