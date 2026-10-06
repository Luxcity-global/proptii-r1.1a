import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from '../services/documents.service';
import { StorageService } from '../services/storage.service';

describe('DocumentsController & DocumentsService End-to-End Functionality', () => {
  let controller: DocumentsController;
  let service: DocumentsService;
  let mockStorageService: StorageService;

  // In-memory Firestore store for testing
  let landlordDocsMap: Map<string, any>;
  let propertiesMap: Map<string, any>;

  beforeEach(() => {
    vi.restoreAllMocks();

    landlordDocsMap = new Map();
    propertiesMap = new Map();

    mockStorageService = {
      uploadFile: vi.fn(),
      deleteFile: vi.fn().mockResolvedValue(undefined),
      getFileUrl: vi.fn(),
    } as unknown as StorageService;

    service = new DocumentsService(mockStorageService);

    // Mock Firestore db implementation
    const mockDb = {
      collection: (colName: string) => {
        if (colName === 'landlord_documents') {
          return {
            doc: (docId?: string) => {
              const id = docId || `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
              return {
                id,
                set: vi.fn().mockImplementation(async (data: any) => {
                  landlordDocsMap.set(id, { id, ...data });
                }),
                get: vi.fn().mockImplementation(async () => {
                  const data = landlordDocsMap.get(id);
                  return {
                    exists: !!data,
                    data: () => data,
                  };
                }),
                update: vi.fn().mockImplementation(async (patch: any) => {
                  const existing = landlordDocsMap.get(id) || {};
                  landlordDocsMap.set(id, { ...existing, ...patch });
                }),
                delete: vi.fn().mockImplementation(async () => {
                  landlordDocsMap.delete(id);
                }),
              };
            },
            where: (field: string, op: string, val: any) => {
              return {
                get: vi.fn().mockImplementation(async () => {
                  const matching: any[] = [];
                  for (const [id, data] of landlordDocsMap.entries()) {
                    if (data[field] === val) {
                      matching.push({
                        id,
                        data: () => data,
                      });
                    }
                  }
                  return { docs: matching };
                }),
              };
            },
          };
        }

        if (colName === 'properties') {
          return {
            doc: (propId: string) => {
              return {
                id: propId,
                get: vi.fn().mockImplementation(async () => {
                  const data = propertiesMap.get(propId);
                  return {
                    exists: !!data,
                    data: () => data,
                  };
                }),
                update: vi.fn().mockImplementation(async (patch: any) => {
                  const existing = propertiesMap.get(propId) || {};
                  propertiesMap.set(propId, { ...existing, ...patch });
                }),
              };
            },
          };
        }

        throw new Error(`Unexpected collection: ${colName}`);
      },
    };

    vi.spyOn(service as any, 'db').mockReturnValue(mockDb);

    controller = new DocumentsController(service);
  });

  describe('POST /api/documents (Create Document)', () => {
    it('creates an unassigned document with valid status when expiry is far', async () => {
      const futureDate = new Date(Date.now() + 180 * 86400000).toISOString();
      const req = { user: { uid: 'landlord_123', email: 'landlord@test.com' } };
      const body = {
        name: 'Gas Safety Certificate 2026',
        type: 'application/pdf',
        url: 'https://storage.googleapis.com/test-bucket/o/documents%2Fgas_safety.pdf',
        issueDate: '2026-01-01',
        expiryDate: futureDate,
        propertyId: null,
      };

      const result = await controller.create(req, body);

      expect(result.id).toBeDefined();
      expect(result.landlordId).toBe('landlord_123');
      expect(result.propertyId).toBeNull();
      expect(result.name).toBe('Gas Safety Certificate 2026');
      expect(result.status).toBe('valid');
      expect(landlordDocsMap.has(result.id)).toBe(true);
    });

    it('computes "expiring_soon" status when expiry is within 30 days', async () => {
      const expiringDate = new Date(Date.now() + 15 * 86400000).toISOString();
      const req = { user: { uid: 'landlord_123' } };
      const body = {
        name: 'EPC Certificate',
        type: 'application/pdf',
        url: 'https://storage.googleapis.com/test-bucket/o/documents%2Fepc.pdf',
        issueDate: '2025-01-01',
        expiryDate: expiringDate,
      };

      const result = await controller.create(req, body);
      expect(result.status).toBe('expiring-soon');
    });

    it('computes "expired" status when expiry is in the past', async () => {
      const pastDate = new Date(Date.now() - 5 * 86400000).toISOString();
      const req = { user: { uid: 'landlord_123' } };
      const body = {
        name: 'Old EICR',
        type: 'application/pdf',
        url: 'https://storage.googleapis.com/test-bucket/o/documents%2Feicr.pdf',
        issueDate: '2020-01-01',
        expiryDate: pastDate,
      };

      const result = await controller.create(req, body);
      expect(result.status).toBe('expired');
    });
  });

  describe('GET /api/documents (List Documents)', () => {
    beforeEach(async () => {
      // Seed initial documents
      landlordDocsMap.set('doc_unassigned_1', {
        id: 'doc_unassigned_1',
        landlordId: 'landlord_123',
        propertyId: null,
        name: 'Unassigned Doc 1',
        type: 'application/pdf',
        url: 'https://test.com/1.pdf',
        createdAt: '2026-01-01T00:00:00Z',
      });
      landlordDocsMap.set('doc_prop_1', {
        id: 'doc_prop_1',
        landlordId: 'landlord_123',
        propertyId: 'prop_A',
        name: 'Property A Doc',
        type: 'application/pdf',
        url: 'https://test.com/2.pdf',
        createdAt: '2026-01-02T00:00:00Z',
      });
      landlordDocsMap.set('doc_email_owner', {
        id: 'doc_email_owner',
        landlordId: 'landlord@test.com', // Stored with email instead of UID
        propertyId: null,
        name: 'Email Owned Doc',
        type: 'application/pdf',
        url: 'https://test.com/3.pdf',
        createdAt: '2026-01-03T00:00:00Z',
      });
    });

    it('lists all documents including those matching email fallback', async () => {
      const req = { user: { uid: 'landlord_123', email: 'landlord@test.com' } };
      const res = await controller.list(req);

      expect(res.success).toBe(true);
      expect(res.documents.length).toBe(3);
      const names = res.documents.map(d => d.name);
      expect(names).toContain('Unassigned Doc 1');
      expect(names).toContain('Property A Doc');
      expect(names).toContain('Email Owned Doc');
    });

    it('filters documents by propertyId="unassigned"', async () => {
      const req = { user: { uid: 'landlord_123', email: 'landlord@test.com' } };
      const res = await controller.list(req, 'unassigned');

      expect(res.success).toBe(true);
      expect(res.documents.length).toBe(2);
      expect(res.documents.every(d => !d.propertyId)).toBe(true);
    });

    it('filters documents by specific propertyId', async () => {
      const req = { user: { uid: 'landlord_123', email: 'landlord@test.com' } };
      const res = await controller.list(req, 'prop_A');

      expect(res.success).toBe(true);
      expect(res.documents.length).toBe(1);
      expect(res.documents[0].id).toBe('doc_prop_1');
    });
  });

  describe('PATCH /api/documents/:id/assign (Assign to Property)', () => {
    beforeEach(() => {
      landlordDocsMap.set('doc_to_assign', {
        id: 'doc_to_assign',
        landlordId: 'landlord_123',
        propertyId: null,
        name: 'Compliance Report',
        type: 'application/pdf',
        url: 'https://test.com/report.pdf',
        issueDate: '2026-01-01',
        expiryDate: '2027-01-01',
        status: 'valid',
      });

      propertiesMap.set('prop_target', {
        id: 'prop_target',
        title: 'Flat 4B High Street',
        documents: [],
      });
    });

    it('successfully assigns document and syncs to property in Firestore', async () => {
      const req = { user: { uid: 'landlord_123', email: 'landlord@test.com' } };
      const res = await controller.assign(req, 'doc_to_assign', { propertyId: 'prop_target' });

      expect(res.success).toBe(true);
      expect(res.document.propertyId).toBe('prop_target');

      // Check document updated in map
      expect(landlordDocsMap.get('doc_to_assign').propertyId).toBe('prop_target');

      // Check property was synchronized
      const prop = propertiesMap.get('prop_target');
      expect(prop.documents.length).toBe(1);
      expect(prop.documents[0].id).toBe('doc_to_assign');
      expect(prop.documents[0].name).toBe('Compliance Report');
    });

    it('rejects unauthorized assignment with Forbidden error', async () => {
      const req = { user: { uid: 'attacker_999', email: 'attacker@evil.com' } };

      await expect(
        controller.assign(req, 'doc_to_assign', { propertyId: 'prop_target' })
      ).rejects.toThrow('Forbidden');
    });
  });

  describe('DELETE /api/documents/:id (Delete Document & Cleanup)', () => {
    beforeEach(() => {
      landlordDocsMap.set('doc_to_delete', {
        id: 'doc_to_delete',
        landlordId: 'landlord_123',
        propertyId: 'prop_with_doc',
        name: 'Old Certificate',
        type: 'application/pdf',
        url: 'https://firebasestorage.googleapis.com/v0/b/bucket/o/documents%2Fold_cert.pdf?alt=media',
      });

      propertiesMap.set('prop_with_doc', {
        id: 'prop_with_doc',
        documents: [{ id: 'doc_to_delete', name: 'Old Certificate' }],
      });
    });

    it('deletes document via UID and cleans up property documents and storage', async () => {
      const req = { user: { uid: 'landlord_123', email: 'landlord@test.com' } };
      const res = await controller.remove(req, 'doc_to_delete');

      expect(res.success).toBe(true);
      expect(landlordDocsMap.has('doc_to_delete')).toBe(false);

      // Property documents array cleaned up
      const prop = propertiesMap.get('prop_with_doc');
      expect(prop.documents).toEqual([]);

      // Storage cleaned up
      expect(mockStorageService.deleteFile).toHaveBeenCalledWith('documents/old_cert.pdf');
    });

    it('deletes document via user email fallback (dual identity support)', async () => {
      // Document stored with email ownership
      landlordDocsMap.set('doc_email_only', {
        id: 'doc_email_only',
        landlordId: 'landlord@test.com',
        propertyId: null,
        name: 'Email Only Doc',
      });

      // Request comes in with Firebase UID, but matching email in token
      const req = { user: { uid: 'random_uid_456', email: 'landlord@test.com' } };
      const res = await controller.remove(req, 'doc_email_only');

      expect(res.success).toBe(true);
      expect(landlordDocsMap.has('doc_email_only')).toBe(false);
    });

    it('rejects unauthorized deletion with Forbidden error', async () => {
      const req = { user: { uid: 'unauthorized_uid', email: 'intruder@other.com' } };

      await expect(
        controller.remove(req, 'doc_to_delete')
      ).rejects.toThrow('Forbidden');

      expect(landlordDocsMap.has('doc_to_delete')).toBe(true);
    });

    it('handles idempotent deletion gracefully when document does not exist', async () => {
      const req = { user: { uid: 'landlord_123', email: 'landlord@test.com' } };
      const res = await controller.remove(req, 'non_existent_doc');

      expect(res.success).toBe(true);
    });
  });
});
