/**
 * Tests for GET /api/properties/search
 *
 * Verifies that after the save-on-message migration:
 * - The search endpoint returns only native_properties
 * - Scraped properties are NOT queried from MongoDB
 * - Empty query returns empty results
 * - Errors in the native query are handled gracefully
 *
 * jest.mock('jose') prevents the ESM-only jose package from
 * breaking the CJS test runner.
 */

// ---- ESM/CJS compatibility mocks (must be before all imports) ----
jest.mock('jose', () => ({
    createRemoteJWKSet: jest.fn(),
    jwtVerify: jest.fn(),
}));
jest.mock('../shared/middleware/auth', () => ({
    withAuth: (_handler: any) => _handler,
}));
jest.mock('../shared/models/property.model', () => ({
    ScrapedPropertyModel: { find: jest.fn() },
    NativePropertyModel: {},
}));
jest.mock('../shared/services/BaseService', () => ({
    BaseService: class { constructor() {} },
}));
jest.mock('../shared/services/ConversationService', () => ({
    ConversationService: class { constructor() {} },
}));

// ---- Actual test imports ----
import { PropertiesController } from '../functions/properties/index';
import { NativePropertyService } from '../shared/services/NativePropertyService';

jest.mock('../shared/services/NativePropertyService');

const mockNativeSearch = jest.fn();
(NativePropertyService as jest.MockedClass<typeof NativePropertyService>).mockImplementation(() => ({
    searchNativeProperties: mockNativeSearch,
} as any));

const mockContext = { log: jest.fn(), error: jest.fn() } as any;

function makeRequest(q: string, limit?: string): any {
    return {
        query: { get: (k: string) => (k === 'q' ? q : k === 'limit' ? (limit ?? null) : null) },
        params: {},
        headers: { get: () => null },
    };
}

// --------------------------------------------------------------------------
describe('PropertiesController — searchProperties (native only)', () => {
    let controller: PropertiesController;

    beforeEach(() => {
        jest.clearAllMocks();
        controller = new PropertiesController();
    });

    it('returns native results tagged with source: native', async () => {
        mockNativeSearch.mockResolvedValue([
            { id: 'n1', title: 'Nice flat', address: 'London', price: '£1,500 pcm' },
        ]);

        const res = await controller.searchProperties(makeRequest('london'), mockContext);
        const body = JSON.parse(res.body as string);

        expect(body.results).toHaveLength(1);
        expect(body.results[0].source).toBe('native');
        expect(body.total).toBe(1);
    });

    it('returns empty results for blank query without hitting the DB', async () => {
        const res = await controller.searchProperties(makeRequest('  '), mockContext);
        const body = JSON.parse(res.body as string);

        expect(body.results).toEqual([]);
        expect(body.total).toBe(0);
        expect(mockNativeSearch).not.toHaveBeenCalled();
    });

    it('does NOT call ScrapedPropertyModel.find', async () => {
        const { ScrapedPropertyModel } = require('../shared/models/property.model');
        mockNativeSearch.mockResolvedValue([]);

        await controller.searchProperties(makeRequest('london'), mockContext);

        expect(ScrapedPropertyModel.find).not.toHaveBeenCalled();
    });

    it('returns empty results and 200 if native search throws', async () => {
        mockNativeSearch.mockRejectedValue(new Error('DB timeout'));

        const res = await controller.searchProperties(makeRequest('london'), mockContext);
        const body = JSON.parse(res.body as string);

        expect(body.results).toEqual([]);
        expect(res.status).toBe(200);
    });

    it('passes the requested limit to the service', async () => {
        mockNativeSearch.mockResolvedValue([]);

        await controller.searchProperties(makeRequest('london', '20'), mockContext);

        expect(mockNativeSearch).toHaveBeenCalledWith('london', 20);
    });

    it('caps limit at 100 even if a larger value is requested', async () => {
        mockNativeSearch.mockResolvedValue([]);

        await controller.searchProperties(makeRequest('london', '999'), mockContext);

        expect(mockNativeSearch).toHaveBeenCalledWith('london', 100);
    });

    it('returns multiple native results all tagged source: native', async () => {
        mockNativeSearch.mockResolvedValue([
            { id: 'n1', title: 'Flat A' },
            { id: 'n2', title: 'Flat B' },
            { id: 'n3', title: 'House C' },
        ]);

        const res = await controller.searchProperties(makeRequest('london'), mockContext);
        const body = JSON.parse(res.body as string);

        expect(body.total).toBe(3);
        expect(body.results.every((r: any) => r.source === 'native')).toBe(true);
    });
});
