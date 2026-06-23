import { HttpRequest, InvocationContext } from '@azure/functions';
import { healthCheckHandler } from '../index';

describe('Health Check Function', () => {
    let mockContext: InvocationContext;

    beforeEach(() => {
        mockContext = {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
            trace: jest.fn(),
            executionContext: {
                invocationId: 'test-id',
                functionName: 'healthCheck',
                traceContext: {
                    traceparent: '',
                    tracestate: '',
                    attributes: {}
                }
            }
        } as unknown as InvocationContext;
    });

    it('should return 200 with a healthy status body', async () => {
        const mockRequest = new Request('http://localhost:7071/api/health') as unknown as HttpRequest;
        const response = await healthCheckHandler(mockRequest, mockContext);

        expect(response.status).toBe(200);

        // Handler uses body: JSON.stringify(...) not jsonBody
        const parsed = JSON.parse(response.body as string);
        expect(parsed).toEqual({
            status: 'healthy',
            timestamp: expect.any(String),
            version: '1.0.0',
            environment: 'test',
        });
    });

    it('should set Content-Type header to application/json', async () => {
        const mockRequest = new Request('http://localhost:7071/api/health') as unknown as HttpRequest;
        const response = await healthCheckHandler(mockRequest, mockContext);

        const headers = response.headers as Record<string, string>;
        expect(headers['Content-Type']).toBe('application/json');
    });

    it('should return a valid ISO 8601 timestamp', async () => {
        const mockRequest = new Request('http://localhost:7071/api/health') as unknown as HttpRequest;
        const response = await healthCheckHandler(mockRequest, mockContext);

        const parsed = JSON.parse(response.body as string);
        expect(new Date(parsed.timestamp).toISOString()).toBe(parsed.timestamp);
    });
});
