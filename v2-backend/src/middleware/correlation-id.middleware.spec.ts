import { describe, it, expect, vi } from 'vitest';
import { CorrelationIdMiddleware } from './correlation-id.middleware';

describe('CorrelationIdMiddleware', () => {
  it('should generate a new correlation ID if none is supplied in headers', () => {
    const middleware = new CorrelationIdMiddleware();
    const req: any = { headers: {} };
    const res: any = {
      setHeader: vi.fn(),
    };
    const next = vi.fn();

    middleware.use(req, res, next);

    expect(req.correlationId).toBeDefined();
    expect(typeof req.correlationId).toBe('string');
    expect(req.correlationId.length).toBeGreaterThan(10);
    expect(res.setHeader).toHaveBeenCalledWith('X-Correlation-Id', req.correlationId);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should propagate incoming X-Correlation-Id header', () => {
    const middleware = new CorrelationIdMiddleware();
    const req: any = {
      headers: {
        'x-correlation-id': 'client-supplied-uuid-12345',
      },
    };
    const res: any = {
      setHeader: vi.fn(),
    };
    const next = vi.fn();

    middleware.use(req, res, next);

    expect(req.correlationId).toBe('client-supplied-uuid-12345');
    expect(res.setHeader).toHaveBeenCalledWith('X-Correlation-Id', 'client-supplied-uuid-12345');
    expect(next).toHaveBeenCalled();
  });
});
