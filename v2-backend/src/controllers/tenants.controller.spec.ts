import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TenantsController } from './tenants.controller';
import { TenantsService } from '../services/tenants.service';

describe('TenantsController & TenantsService', () => {
  let controller: TenantsController;
  let tenantsService: TenantsService;

  beforeEach(() => {
    vi.restoreAllMocks();
    tenantsService = new TenantsService();

    const mockDocRef = {
      set: vi.fn().mockResolvedValue(undefined),
      get: vi.fn().mockResolvedValue({
        exists: true,
        id: 't-123',
        data: () => ({
          name: 'Jane Doe',
          email: 'jane@example.com',
          propertyId: 'p-1',
          rentAmount: 1850,
          userId: 'landlord-1',
        }),
      }),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    const mockCollection = {
      doc: vi.fn().mockReturnValue(mockDocRef),
      where: vi.fn().mockReturnThis(),
      get: vi.fn().mockResolvedValue({
        docs: [
          {
            id: 't-123',
            data: () => ({
              name: 'Jane Doe',
              email: 'jane@example.com',
              propertyId: 'p-1',
              rentAmount: 1850,
              userId: 'landlord-1',
            }),
          },
        ],
      }),
    };

    vi.spyOn(tenantsService as any, 'db', 'get').mockReturnValue({
      collection: vi.fn().mockReturnValue(mockCollection),
      batch: vi.fn().mockReturnValue({
        set: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined),
      }),
    });
    vi.spyOn(tenantsService as any, 'collection', 'get').mockReturnValue(mockCollection);
    vi.spyOn(tenantsService as any, 'paymentsCol', 'get').mockReturnValue(mockCollection);

    controller = new TenantsController(tenantsService);
  });

  it('creates tenant and assigns current landlord userId', async () => {
    const req = { user: { uid: 'll-456', email: 'landlord@test.com' } };
    const body = {
      name: 'John Smith',
      email: 'john@example.com',
      rentAmount: 1500,
      propertyId: 'prop-99',
    };

    const result = await controller.createTenant(req, body);
    expect(result.success).toBe(true);
    expect(result.id).toBeDefined();
    expect(result.tenant.userId).toBe('ll-456');
    expect(result.tenant.name).toBe('John Smith');
  });

  it('lists tenants for landlord userId', async () => {
    const req = { user: { uid: 'landlord-1', email: 'll@test.com' } };
    const result = await controller.getTenants(req);

    expect(result.success).toBe(true);
    expect(result.tenants).toHaveLength(1);
    expect(result.tenants[0].name).toBe('Jane Doe');
  });

  it('fetches tenant by id', async () => {
    const result = await controller.getTenant('t-123');
    expect(result.success).toBe(true);
    expect(result.tenant?.name).toBe('Jane Doe');
  });

  it('updates tenant by id', async () => {
    const result = await controller.updateTenant('t-123', { rentAmount: 1950 });
    expect(result.success).toBe(true);
  });

  it('deletes tenant by id', async () => {
    const result = await controller.deleteTenant('t-123');
    expect(result.success).toBe(true);
  });
});
