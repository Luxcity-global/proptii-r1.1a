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

    it('should return healthy status', async () => {
        const mockRequest = new Request('http://localhost:7071/api/health') as unknown as HttpRequest;
        const response = await healthCheckHandler(mockRequest, mockContext);

        expect(response.jsonBody).toEqual({
            status: 'healthy',
            timestamp: expect.any(String),
            environment: 'test'
        });
    });

    it('should log the request', async () => {
        const mockRequest = new Request('http://localhost:7071/api/health') as unknown as HttpRequest;
        await healthCheckHandler(mockRequest, mockContext);

        expect(mockContext.log).toHaveBeenCalledWith(
            'Health check request received'
        );
    });
}); 