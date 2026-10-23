import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TenantsController } from './tenants.controller';
import { TenantsService } from '../services/tenants.service';
import { TenantInvitationsController } from './tenant-invitations.controller';
import { TenantDashboardController } from './tenant-dashboard.controller';
import * as admin from 'firebase-admin';

describe('Tenant Side Frontend-Backend Mirror Contract Tests', () => {
  let tenantsController: TenantsController;
  let tenantsService: TenantsService;
  let invitationsController: TenantInvitationsController;
  let dashboardController: TenantDashboardController;

  let mockTenantsDocMap: Map<string, any>;
  let mockPropertiesDocMap: Map<string, any>;
  let mockInvitationsDocMap: Map<string, any>;
  let mockUsersDocMap: Map<string, any>;
  let mockSavedSnapMap: Map<string, any>;
  let mockViewingsSnapMap: Map<string, any>;
  let mockReferencingSnapMap: Map<string, any>;

  beforeEach(() => {
    vi.restoreAllMocks();
    mockTenantsDocMap = new Map();
    mockPropertiesDocMap = new Map();
    mockInvitationsDocMap = new Map();
    mockUsersDocMap = new Map();
    mockSavedSnapMap = new Map();
    mockViewingsSnapMap = new Map();
    mockReferencingSnapMap = new Map();

    // Helper for collection mock
    const createMockCollection = (store: Map<string, any>) => {
      const colRef: any = {
        doc: vi.fn((id: string) => ({
          id,
          set: vi.fn(async (data: any, options?: any) => {
            if (options?.merge && store.has(id)) {
              store.set(id, { ...store.get(id), ...data });
            } else {
              store.set(id, data);
            }
          }),
          update: vi.fn(async (data: any) => {
            const current = store.get(id) || {};
            store.set(id, { ...current, ...data });
          }),
          get: vi.fn(async () => {
            const exists = store.has(id);
            return {
              exists,
              id,
              data: () => store.get(id),
            };
          }),
          delete: vi.fn(async () => {
            store.delete(id);
          }),
        })),
        where: vi.fn((field: string, op: string, val: any) => {
          const filterDocs = (docsList: any[]) => {
            return docsList.filter((entry) => {
              const data = entry.data();
              if (op === '==' && data[field] === val) return true;
              if (op === 'in' && Array.isArray(val) && val.includes(data[field])) return true;
              return false;
            });
          };

          const createQuery = (currentDocs: any[]) => {
            const query: any = {
              where: vi.fn((nextField: string, nextOp: string, nextVal: any) => {
                const nextDocs = currentDocs.filter((entry) => {
                  const data = entry.data();
                  if (nextOp === '==' && data[nextField] === nextVal) return true;
                  if (nextOp === 'in' && Array.isArray(nextVal) && nextVal.includes(data[nextField])) return true;
                  return false;
                });
                return createQuery(nextDocs);
              }),
              limit: vi.fn((limitNum: number) => ({
                get: vi.fn(async () => {
                  const sliced = currentDocs.slice(0, limitNum);
                  return {
                    docs: sliced,
                    empty: sliced.length === 0,
                    size: sliced.length,
                  };
                }),
              })),
              get: vi.fn(async () => ({
                docs: currentDocs,
                empty: currentDocs.length === 0,
                size: currentDocs.length,
              })),
            };
            return query;
          };

          const initialDocs: any[] = [];
          for (const [id, data] of store.entries()) {
            if (op === '==' && data[field] === val) {
              initialDocs.push({ id, data: () => data });
            } else if (op === 'in' && Array.isArray(val) && val.includes(data[field])) {
              initialDocs.push({ id, data: () => data });
            }
          }
          return createQuery(initialDocs);
        }),
        get: vi.fn(async () => {
          const docs = Array.from(store.entries()).map(([id, data]) => ({
            id,
            data: () => data,
          }));
          return { docs, empty: docs.length === 0, size: docs.length };
        }),
      };
      return colRef;
    };

    const tenantsCol = createMockCollection(mockTenantsDocMap);
    const propertiesCol = createMockCollection(mockPropertiesDocMap);
    const invitationsCol = createMockCollection(mockInvitationsDocMap);
    const usersCol = createMockCollection(mockUsersDocMap);
    const savedCol = createMockCollection(mockSavedSnapMap);
    const viewingsCol = createMockCollection(mockViewingsSnapMap);
    const referencingCol = createMockCollection(mockReferencingSnapMap);
    const conversationsCol = createMockCollection(new Map());

    const mockDb: any = {
      collection: vi.fn((name: string) => {
        switch (name) {
          case 'tenants': return tenantsCol;
          case 'properties': return propertiesCol;
          case 'tenant_invitations': return invitationsCol;
          case 'users': return usersCol;
          case 'saved_properties': return savedCol;
          case 'viewings': return viewingsCol;
          case 'referencing': return referencingCol;
          case 'conversations': return conversationsCol;
          default: return createMockCollection(new Map());
        }
      }),
      batch: vi.fn(() => ({
        set: vi.fn((ref: any, data: any) => {
          // Commit directly to the store for tests
          ref.set(data);
        }),
        commit: vi.fn(async () => {}),
      })),
    };

    class MockFieldValue {}
    (MockFieldValue as any).serverTimestamp = () => new Date().toISOString();
    (MockFieldValue as any).delete = () => undefined;
    (MockFieldValue as any).arrayUnion = (...items: any[]) => items;

    vi.spyOn(admin, 'apps', 'get').mockReturnValue([{ name: 'test-app' }] as any);
    vi.spyOn(admin, 'firestore').mockImplementation(() => mockDb);
    (admin.firestore as any).FieldValue = MockFieldValue;

    tenantsService = new TenantsService();
    tenantsController = new TenantsController(tenantsService);
    invitationsController = new TenantInvitationsController();
    dashboardController = new TenantDashboardController();
  });

  describe('1. Single Tenant Creation & Contract Shape (POST /tenants)', () => {
    it('creates a tenant with all required and optional fields as sent by AddTenant.tsx', async () => {
      // Setup existing property in store
      mockPropertiesDocMap.set('prop_alpha', { title: 'Flat 4B, River View', status: 'vacant' });

      // Shape sent by AddTenant.tsx / tenantService.createTenant
      const frontendPayload = {
        name: 'Sarah Connor',
        email: 'sarah.connor@example.com',
        phone: '+44 7700 900123',
        propertyId: 'prop_alpha',
        propertyAddress: 'Flat 4B, River View, London',
        rentAmount: 1850,
        paymentFrequency: 'monthly',
        firstPaymentDate: '2026-11-01',
        leaseStart: '2026-11-01',
        leaseEnd: '2027-10-31',
        status: 'active',
        referencingStatus: 'not-started',
        paymentStatus: 'current',
        emergencyContact: {
          name: 'John Connor',
          phone: '+44 7700 900999',
          relationship: 'Son',
        },
        defaultRiskScore: 75,
        employer: 'Cybernetics UK',
        annualIncome: 65000,
        employmentType: 'Full-time Permanent',
        notes: 'Requested parking permit.',
      };

      const req = { user: { uid: 'landlord_101', email: 'landlord@test.com' } };
      const response = await tenantsController.createTenant(req, frontendPayload as any);

      // Verify Response structure expected by tenantService.ts:
      // const data = (response as any).data ?? response;
      // const tenantId: string = data.id;
      expect(response.success).toBe(true);
      expect(response.id).toBeDefined();
      expect(response.tenant).toBeDefined();
      expect(response.tenant.name).toBe('Sarah Connor');
      expect(response.tenant.email).toBe('sarah.connor@example.com');
      expect(response.tenant.propertyId).toBe('prop_alpha');
      expect(response.tenant.rentAmount).toBe(1850);
      expect(response.tenant.userId).toBe('landlord_101');
      expect(response.tenant.status).toBe('active');
      expect(response.tenant.emergencyContact.name).toBe('John Connor');

      // Verify that the property is automatically marked occupied in Firestore
      const updatedProperty = mockPropertiesDocMap.get('prop_alpha');
      expect(updatedProperty).toBeDefined();
      expect(updatedProperty.status).toBe('occupied');
      expect(updatedProperty.tenantId).toBe(response.id);
    });

    it('creates a tenant with minimal required fields (name, email, propertyId) and applies defaults', async () => {
      const minimalPayload = {
        name: 'Alex Mercer',
        email: 'alex.m@example.com',
        propertyId: 'prop_beta',
      };

      const req = { user: { uid: 'agent_202', email: 'agent@proptii.com' } };
      const response = await tenantsController.createTenant(req, minimalPayload as any);

      expect(response.success).toBe(true);
      expect(response.id).toBeDefined();
      expect(response.tenant.name).toBe('Alex Mercer');
      expect(response.tenant.email).toBe('alex.m@example.com');
      expect(response.tenant.status).toBe('active');
      expect(response.tenant.userId).toBe('agent_202');
    });
  });

  describe('2. Tenant Listing & Filtering Contract (GET /tenants)', () => {
    beforeEach(() => {
      // Pre-seed mock tenants
      mockTenantsDocMap.set('t_1', {
        id: 't_1',
        name: 'Sarah Connor',
        email: 'sarah@test.com',
        userId: 'landlord_101',
        propertyId: 'prop_alpha',
        rentAmount: 1850,
        status: 'active',
      });
      mockTenantsDocMap.set('t_2', {
        id: 't_2',
        name: 'Kyle Reese',
        email: 'kyle@test.com',
        userId: 'landlord_101',
        propertyId: 'prop_gamma',
        rentAmount: 1400,
        status: 'active',
      });
      mockTenantsDocMap.set('t_3', {
        id: 't_3',
        name: 'Different Landlord Tenant',
        email: 'other@test.com',
        userId: 'landlord_999',
        propertyId: 'prop_other',
        rentAmount: 2000,
        status: 'active',
      });
    });

    it('returns tenants scoped to landlord JWT uid mirroring frontend getTenants()', async () => {
      const req = { user: { uid: 'landlord_101', email: 'landlord@test.com' } };
      const response = await tenantsController.getTenants(req);

      expect(response.success).toBe(true);
      expect(response.tenants).toHaveLength(2);
      const names = response.tenants.map((t: any) => t.name);
      expect(names).toContain('Sarah Connor');
      expect(names).toContain('Kyle Reese');
      expect(names).not.toContain('Different Landlord Tenant');
    });

    it('filters tenants across ownedPropertyIds query param if provided by frontend', async () => {
      const req = { user: { uid: 'agent_user' } };
      const response = await tenantsController.getTenants(req, 'prop_other');

      expect(response.success).toBe(true);
      expect(response.tenants).toHaveLength(1);
      expect(response.tenants[0].name).toBe('Different Landlord Tenant');
    });
  });

  describe('3. Single Tenant Inspection & Update (GET & PUT /tenants/:id)', () => {
    beforeEach(() => {
      mockTenantsDocMap.set('t_100', {
        id: 't_100',
        name: 'John Doe',
        email: 'john.doe@example.com',
        propertyId: 'prop_100',
        rentAmount: 1500,
        paymentFrequency: 'monthly',
        status: 'active',
      });
    });

    it('fetches a single tenant by id matching frontend getTenant(id)', async () => {
      const response = await tenantsController.getTenant('t_100');

      expect(response.success).toBe(true);
      expect(response.tenant).toBeDefined();
      expect(response.tenant.name).toBe('John Doe');
      expect(response.tenant.rentAmount).toBe(1500);
    });

    it('returns success: false, tenant: null when tenant is not found', async () => {
      const response = await tenantsController.getTenant('non_existent_id');

      expect(response.success).toBe(false);
      expect(response.tenant).toBeNull();
    });

    it('updates tenant fields mirroring frontend updateTenant(id, updates)', async () => {
      const updates = {
        rentAmount: 1650,
        paymentFrequency: 'yearly',
        notes: 'Agreed on rent increase for renewal.',
      };

      const result = await tenantsController.updateTenant('t_100', updates);
      expect(result.success).toBe(true);

      const stored = mockTenantsDocMap.get('t_100');
      expect(stored.rentAmount).toBe(1650);
      expect(stored.paymentFrequency).toBe('yearly');
      expect(stored.notes).toBe('Agreed on rent increase for renewal.');
    });
  });

  describe('4. Tenant Deletion & Property Vacuuming (DELETE /tenants/:id)', () => {
    it('deletes tenant document and resets property status to vacant', async () => {
      mockTenantsDocMap.set('t_to_delete', {
        id: 't_to_delete',
        name: 'Moving Out Tenant',
        email: 'leaving@test.com',
        propertyId: 'prop_vacating',
      });
      mockPropertiesDocMap.set('prop_vacating', {
        id: 'prop_vacating',
        status: 'occupied',
        tenantId: 't_to_delete',
      });

      const response = await tenantsController.deleteTenant('t_to_delete');
      expect(response.success).toBe(true);

      // Verify tenant is deleted from Firestore
      expect(mockTenantsDocMap.has('t_to_delete')).toBe(false);

      // Verify property is updated to vacant
      const property = mockPropertiesDocMap.get('prop_vacating');
      expect(property.status).toBe('vacant');
    });
  });

  describe('5. Bulk Import & Bulk Assignment (POST /tenants/bulk & bulk-assign)', () => {
    it('bulk creates tenants in batch mirroring BulkTenantImport.tsx', async () => {
      const rows = [
        { name: 'Bulk Tenant 1', email: 'bulk1@example.com', propertyId: 'prop_1', rentAmount: 1200 },
        { name: 'Bulk Tenant 2', email: 'bulk2@example.com', propertyId: 'prop_2', rentAmount: 1350 },
        { name: 'Bulk Tenant 3', email: 'bulk3@example.com', propertyId: 'prop_3', rentAmount: 1500 },
      ];

      const req = { user: { uid: 'landlord_bulk', email: 'll@test.com' } };
      const response = await tenantsController.bulkCreateTenants(req, { tenants: rows });

      expect(response.total).toBe(3);
      expect(response.succeeded).toBe(3);
      expect(response.failed).toBe(0);
      expect(response.results).toHaveLength(3);
      expect(mockTenantsDocMap.size).toBe(3);
    });

    it('bulk assigns tenants to properties without failing other rows', async () => {
      mockTenantsDocMap.set('t_a', { id: 't_a', name: 'Assignee A', status: 'pending' });
      mockTenantsDocMap.set('t_b', { id: 't_b', name: 'Assignee B', status: 'pending' });

      const assignments = [
        { tenantId: 't_a', propertyId: 'p_10', rentAmount: 1600, leaseStart: '2026-11-01', leaseEnd: '2027-10-31' },
        { tenantId: 't_b', propertyId: 'p_20', rentAmount: 1750, leaseStart: '2026-11-01', leaseEnd: '2027-10-31' },
      ];

      const req = { user: { uid: 'landlord_assign' } };
      const response = await tenantsController.bulkAssignTenants(req, { assignments });

      expect(response.total).toBe(2);
      expect(response.succeeded).toBe(2);
      expect(response.failed).toBe(0);

      expect(mockTenantsDocMap.get('t_a').propertyId).toBe('p_10');
      expect(mockTenantsDocMap.get('t_b').propertyId).toBe('p_20');
    });
  });

  describe('6. Tenant Invitation Lifecycle (POST, GET validate, POST claim)', () => {
    it('creates an invitation, validates public token, and claims tenancy', async () => {
      // 1. Landlord invites tenant via invitationService.createInvitation
      const inviteData = {
        email: 'prospective.tenant@example.com',
        tenantName: 'Prospective Tenant',
        propertyId: 'prop_inv_1',
        propertyAddress: '10 Downing Gate, London',
        landlordId: 'll_host',
        landlordEmail: 'landlord@host.com',
        landlordName: 'Host Landlord',
        rentAmount: 2100,
        leaseStart: '2026-12-01',
        customMessage: 'Welcome to your new home!',
      };

      const reqLandlord = { user: { uid: 'll_host', email: 'landlord@host.com' } };
      const createRes = await invitationsController.createInvitation(reqLandlord, inviteData);

      expect(createRes.success).toBe(true);
      expect(createRes.id).toBeDefined();
      expect(createRes.token).toBeDefined();

      const invitationToken = createRes.token;

      // 2. Prospective tenant validates token via invitationService.validateInvitation(token)
      const validateRes = await invitationsController.validateToken(invitationToken);
      expect(validateRes.valid).toBe(true);
      expect(validateRes.invitation).toBeDefined();
      expect(validateRes.invitation?.propertyAddress).toBe('10 Downing Gate, London');
      expect(validateRes.invitation?.landlordName).toBe('Host Landlord');
      expect(validateRes.invitation?.rentAmount).toBe(2100);

      // 3. Authenticated tenant claims token via invitationService.claimInvitation(token)
      const reqTenant = {
        user: { uid: 'tenant_claimed_user_1', email: 'prospective.tenant@example.com', displayName: 'Prospective Tenant' },
      };
      const claimRes = await invitationsController.claimInvitation(reqTenant, { token: invitationToken });

      expect(claimRes.success).toBe(true);
      expect(claimRes.propertyId).toBe('prop_inv_1');

      // 4. Verify invitation record status is now 'accepted'
      const storedInvite = mockInvitationsDocMap.get(createRes.id);
      expect(storedInvite.status).toBe('accepted');
      expect(storedInvite.acceptedByUid).toBe('tenant_claimed_user_1');

      // 5. Subsequent validation attempt rejects already-accepted token
      const revalidateRes = await invitationsController.validateToken(invitationToken);
      expect(revalidateRes.valid).toBe(false);
      expect(revalidateRes.reason).toBe('ALREADY_ACCEPTED');
    });

    it('rejects expired invitation tokens during validate and claim', async () => {
      // Seed expired invitation
      const expiredToken = 'expired_tok_999';
      mockInvitationsDocMap.set('inv_expired', {
        id: 'inv_expired',
        token: expiredToken,
        status: 'pending',
        expiresAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        propertyId: 'p_exp',
      });

      const validateRes = await invitationsController.validateToken(expiredToken);
      expect(validateRes.valid).toBe(false);
      expect(validateRes.reason).toBe('EXPIRED');

      const req = { user: { uid: 'tenant_try' } };
      await expect(invitationsController.claimInvitation(req, { token: expiredToken })).rejects.toThrow(
        'This invitation link has expired',
      );
    });
  });

  describe('7. Tenant Dashboard Summary Contract (GET /tenant-dashboard/summary)', () => {
    it('returns dashboard summary counts for tenant matching dashboardService.ts', async () => {
      const tenantUid = 'tenant_user_777';

      // Seed saved properties, viewings, referencing applications for this tenant
      mockSavedSnapMap.set('s1', { userId: tenantUid, propertyId: 'prop_1' });
      mockSavedSnapMap.set('s2', { userId: tenantUid, propertyId: 'prop_2' });
      mockSavedSnapMap.set('s_other', { userId: 'other_user', propertyId: 'prop_3' });

      mockViewingsSnapMap.set('v1', { tenantId: tenantUid, propertyId: 'prop_1' });

      mockReferencingSnapMap.set('ref1', { tenantId: tenantUid, status: 'complete' });

      const req = {
        user: {
          uid: tenantUid,
          email: 'tenant777@example.com',
          role: 'tenant',
        },
      };

      const summary = await dashboardController.getSummary(req);

      expect(summary.savedCount).toBe(2);
      expect(summary.viewingsCount).toBe(1);
      expect(summary.referencingCount).toBe(1);
      expect(summary.user.uid).toBe(tenantUid);
      expect(summary.user.role).toBe('tenant');
    });
  });
});
