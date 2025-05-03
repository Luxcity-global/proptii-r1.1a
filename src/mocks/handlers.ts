import { rest } from 'msw';
import { API_BASE_URL } from '../config/constants';
import { ApiResponse } from '../services/api';
import {
    mockSaveSectionData,
    mockUploadDocument,
    mockSubmitApplication,
    mockGetApplicationById,
    mockGetDocuments,
    mockDeleteDocument
} from './api';

export const handlers = [
    // Application endpoints
    rest.post(`${API_BASE_URL}/applications`, async (req, res, ctx) => {
        const { propertyId } = await req.json();
        const applicationId = `test-${Date.now()}`;
        return res(
            ctx.delay(500),
            ctx.json<ApiResponse<{ applicationId: string }>>({
                success: true,
                data: { applicationId }
            })
        );
    }),

    // Section data endpoints
    rest.put(`${API_BASE_URL}/applications/:applicationId/:section`, async (req, res, ctx) => {
        const { applicationId, section } = req.params;
        const data = await req.json();
        const response = await mockSaveSectionData(applicationId as string, section as string, data);
        return res(
            ctx.delay(500),
            ctx.json(response)
        );
    }),

    // Document upload endpoint
    rest.post(`${API_BASE_URL}/applications/:applicationId/documents/:section`, async (req, res, ctx) => {
        const { applicationId, section } = req.params;
        const file = req.body as File;
        const response = await mockUploadDocument(applicationId as string, section as string, file);
        return res(
            ctx.delay(1000),
            ctx.json(response)
        );
    }),

    // Application submission endpoint
    rest.post(`${API_BASE_URL}/applications/:applicationId/submit`, async (req, res, ctx) => {
        const { applicationId } = req.params;
        const response = await mockSubmitApplication(applicationId as string);
        return res(
            ctx.delay(1000),
            ctx.json(response)
        );
    }),

    // Get application endpoint
    rest.get(`${API_BASE_URL}/applications/:applicationId`, async (req, res, ctx) => {
        const { applicationId } = req.params;
        const response = await mockGetApplicationById(applicationId as string);
        return res(
            ctx.delay(300),
            ctx.json(response)
        );
    }),

    // Get documents endpoint
    rest.get(`${API_BASE_URL}/applications/:applicationId/documents/:section?`, async (req, res, ctx) => {
        const { applicationId, section } = req.params;
        const response = await mockGetDocuments(applicationId as string, section as string);
        return res(
            ctx.delay(300),
            ctx.json(response)
        );
    }),

    // Delete document endpoint
    rest.delete(`${API_BASE_URL}/applications/documents/:documentId`, async (req, res, ctx) => {
        const { documentId } = req.params;
        const response = await mockDeleteDocument(documentId as string);
        return res(
            ctx.delay(500),
            ctx.json(response)
        );
    }),
]; 