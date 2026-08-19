import { describe, it, expect, vi, beforeEach } from 'vitest';
import sseService from '../sseService';

describe('sseService frontend event dispatcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registers listener and dispatches matching event', () => {
    const callback = vi.fn();
    const unsub = sseService.on('viewing_updated', callback);

    const eventPayload = {
      type: 'viewing_updated',
      data: { id: 'viewing-123', status: 'confirmed' },
      timestamp: Date.now(),
    };

    sseService.dispatch(eventPayload);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(eventPayload);

    unsub();

    // After unsubscribe, further dispatches should not trigger callback
    sseService.dispatch(eventPayload);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('supports array of event types in single on() call', () => {
    const callback = vi.fn();
    const unsub = sseService.on(['message_new', 'message_read'], callback);

    sseService.dispatch({ type: 'message_new', data: { messageId: 'msg-1' } });
    sseService.dispatch({ type: 'message_read', data: { messageId: 'msg-1' } });
    sseService.dispatch({ type: 'other_event', data: {} });

    expect(callback).toHaveBeenCalledTimes(2);

    unsub();
  });
});
