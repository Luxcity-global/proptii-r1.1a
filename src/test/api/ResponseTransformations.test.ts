import { describe, it, expect } from 'vitest';
import { setupServer } from 'msw/node';
import { handlers } from '../../mocks/handlers';
import { API_BASE_URL } from '../../config/constants';

const server = setupServer(...handlers);

// Test data transformations and validations
describe('API Response Transformations', () => {
    describe('Data Validation', () => {
        it('should validate application data structure', async () => {
            const response = await fetch(`${API_BASE_URL}/applications/test-app-123`, {
                method: 'GET'
            });

            const data = await response.json();
            expect(data).toMatchObject({
                success: expect.any(Boolean),
                data: {
                    id: expect.any(String),
                    status: expect.any(String),
                    identity: expect.any(Object),
                    employment: expect.any(Object),
                    residential: expect.any(Object),
                    financial: expect.any(Object),
                    guarantor: expect.any(Object),
                    creditCheck: expect.any(Object),
                    documents: expect.any(Object)
                }
            });
        });

        it('should validate document data structure', async () => {
            const response = await fetch(
                `${API_BASE_URL}/applications/test-app-123/documents/identity`,
                {
                    method: 'GET'
                }
            );

            const data = await response.json();
            expect(data).toMatchObject({
                success: expect.any(Boolean),
                data: expect.arrayContaining([
                    expect.objectContaining({
                        fileUrl: expect.any(String),
                        fileName: expect.any(String)
                    })
                ])
            });
        });
    });

    describe('Data Transformations', () => {
        it('should transform dates to ISO format', async () => {
            const response = await fetch(`${API_BASE_URL}/applications/test-app-123`, {
                method: 'GET'
            });

            const data = await response.json();
            const datePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;

            if (data.data.submittedAt) {
                expect(data.data.submittedAt).toMatch(datePattern);
            }

            if (data.data.createdAt) {
                expect(data.data.createdAt).toMatch(datePattern);
            }

            if (data.data.updatedAt) {
                expect(data.data.updatedAt).toMatch(datePattern);
            }
        });

        it('should transform monetary values to numbers', async () => {
            const testData = {
                income: '50000.00',
                rent: '1500.50',
                deposit: '3000'
            };

            const response = await fetch(
                `${API_BASE_URL}/applications/test-app-123/financial`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(testData)
                }
            );

            const data = await response.json();
            expect(typeof data.data.financial.income).toBe('number');
            expect(typeof data.data.financial.rent).toBe('number');
            expect(typeof data.data.financial.deposit).toBe('number');
        });

        it('should handle empty or null values appropriately', async () => {
            const testData = {
                firstName: '',
                middleName: null,
                lastName: undefined,
                email: 'test@example.com'
            };

            const response = await fetch(
                `${API_BASE_URL}/applications/test-app-123/identity`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(testData)
                }
            );

            const data = await response.json();
            expect(data.data.identity).toMatchObject({
                firstName: '',
                middleName: null,
                lastName: null,
                email: 'test@example.com'
            });
        });
    });

    describe('Error Transformations', () => {
        it('should transform validation errors into consistent format', async () => {
            server.use(
                rest.put(
                    `${API_BASE_URL}/applications/:applicationId/identity`,
                    async (req, res, ctx) => {
                        return res(
                            ctx.status(400),
                            ctx.json({
                                success: false,
                                error: 'Validation failed',
                                validationErrors: [
                                    { field: 'email', message: 'Invalid email format' },
                                    { field: 'phoneNumber', message: 'Required field missing' }
                                ]
                            })
                        );
                    }
                )
            );

            const response = await fetch(
                `${API_BASE_URL}/applications/test-app-123/identity`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({})
                }
            );

            const data = await response.json();
            expect(data).toMatchObject({
                success: false,
                error: expect.any(String),
                validationErrors: expect.arrayContaining([
                    expect.objectContaining({
                        field: expect.any(String),
                        message: expect.any(String)
                    })
                ])
            });
        });

        it('should transform network errors into user-friendly messages', async () => {
            server.use(
                rest.get(
                    `${API_BASE_URL}/applications/:applicationId`,
                    async (req, res, ctx) => {
                        return res(
                            ctx.status(503),
                            ctx.json({
                                success: false,
                                error: 'Service temporarily unavailable',
                                retryAfter: 30
                            })
                        );
                    }
                )
            );

            const response = await fetch(
                `${API_BASE_URL}/applications/test-app-123`,
                {
                    method: 'GET'
                }
            );

            const data = await response.json();
            expect(data).toMatchObject({
                success: false,
                error: expect.any(String),
                retryAfter: expect.any(Number)
            });
        });
    });
}); 