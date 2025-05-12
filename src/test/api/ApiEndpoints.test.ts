import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { handlers } from '../../mocks/handlers';
import { API_BASE_URL } from '../../config/constants';

const server = setupServer(...handlers);

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

//  Close server after all tests
afterAll(() => server.close());

// Reset handlers after each test
afterEach(() => server.resetHandlers());

describe('API Endpoints', () => {
    describe('Application Creation', () => {
        it('should create a new application successfully', async () => {
            const response = await fetch(`${API_BASE_URL}/applications`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ propertyId: 'test-property-123' })
            });

            const data = await response.json();
            expect(response.ok).toBe(true);
            expect(data.success).toBe(true);
            expect(data.data.applicationId).toBeDefined();
        });

        it('should handle application creation errors', async () => {
            // Override handler to simulate error
            server.use(
                rest.post(`${API_BASE_URL}/applications`, async (req, res, ctx) => {
                    return res(
                        ctx.status(500),
                        ctx.json({
                            success: false,
                            error: 'Failed to create application'
                        })
                    );
                })
            );

            const response = await fetch(`${API_BASE_URL}/applications`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ propertyId: 'test-property-123' })
            });

            const data = await response.json();
            expect(response.ok).toBe(false);
            expect(data.success).toBe(false);
            expect(data.error).toBeDefined();
        });
    });

    describe('Section Data Management', () => {
        const testApplicationId = 'test-app-123';
        const testSection = 'identity';
        const testData = {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com'
        };

        it('should save section data successfully', async () => {
            const response = await fetch(
                `${API_BASE_URL}/applications/${testApplicationId}/${testSection}`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(testData)
                }
            );

            const data = await response.json();
            expect(response.ok).toBe(true);
            expect(data.success).toBe(true);
            expect(data.data[testSection]).toMatchObject(testData);
        });

        it('should handle section data save errors', async () => {
            server.use(
                rest.put(
                    `${API_BASE_URL}/applications/:applicationId/:section`,
                    async (req, res, ctx) => {
                        return res(
                            ctx.status(400),
                            ctx.json({
                                success: false,
                                error: 'Invalid section data'
                            })
                        );
                    }
                )
            );

            const response = await fetch(
                `${API_BASE_URL}/applications/${testApplicationId}/${testSection}`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(testData)
                }
            );

            const data = await response.json();
            expect(response.ok).toBe(false);
            expect(data.success).toBe(false);
            expect(data.error).toBeDefined();
        });
    });

    describe('Document Management', () => {
        const testApplicationId = 'test-app-123';
        const testSection = 'identity';
        const testFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });

        it('should upload document successfully', async () => {
            const formData = new FormData();
            formData.append('file', testFile);

            const response = await fetch(
                `${API_BASE_URL}/applications/${testApplicationId}/documents/${testSection}`,
                {
                    method: 'POST',
                    body: formData
                }
            );

            const data = await response.json();
            expect(response.ok).toBe(true);
            expect(data.success).toBe(true);
            expect(data.data.fileUrl).toBeDefined();
            expect(data.data.fileName).toBe('test.pdf');
        });

        it('should handle document upload errors', async () => {
            server.use(
                rest.post(
                    `${API_BASE_URL}/applications/:applicationId/documents/:section`,
                    async (req, res, ctx) => {
                        return res(
                            ctx.status(413),
                            ctx.json({
                                success: false,
                                error: 'File too large'
                            })
                        );
                    }
                )
            );

            const formData = new FormData();
            formData.append('file', testFile);

            const response = await fetch(
                `${API_BASE_URL}/applications/${testApplicationId}/documents/${testSection}`,
                {
                    method: 'POST',
                    body: formData
                }
            );

            const data = await response.json();
            expect(response.ok).toBe(false);
            expect(data.success).toBe(false);
            expect(data.error).toBeDefined();
        });

        it('should delete document successfully', async () => {
            const testDocumentId = 'test-doc-123';

            const response = await fetch(
                `${API_BASE_URL}/applications/documents/${testDocumentId}`,
                {
                    method: 'DELETE'
                }
            );

            const data = await response.json();
            expect(response.ok).toBe(true);
            expect(data.success).toBe(true);
            expect(data.data.deleted).toBe(true);
        });
    });

    describe('Application Submission', () => {
        const testApplicationId = 'test-app-123';

        it('should submit application successfully', async () => {
            const response = await fetch(
                `${API_BASE_URL}/applications/${testApplicationId}/submit`,
                {
                    method: 'POST'
                }
            );

            const data = await response.json();
            expect(response.ok).toBe(true);
            expect(data.success).toBe(true);
            expect(data.data.status).toBe('submitted');
            expect(data.data.submittedAt).toBeDefined();
        });

        it('should handle submission errors', async () => {
            server.use(
                rest.post(
                    `${API_BASE_URL}/applications/:applicationId/submit`,
                    async (req, res, ctx) => {
                        return res(
                            ctx.status(400),
                            ctx.json({
                                success: false,
                                error: 'Missing required information'
                            })
                        );
                    }
                )
            );

            const response = await fetch(
                `${API_BASE_URL}/applications/${testApplicationId}/submit`,
                {
                    method: 'POST'
                }
            );

            const data = await response.json();
            expect(response.ok).toBe(false);
            expect(data.success).toBe(false);
            expect(data.error).toBeDefined();
        });
    });
}); 