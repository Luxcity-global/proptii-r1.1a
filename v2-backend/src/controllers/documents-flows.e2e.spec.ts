import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from '../services/documents.service';
import { ContractController } from './contract.controller';
import { ContractService } from '../services/contract.service';
import { ReferencingController } from './referencing.controller';
import { EventsService } from '../services/events.service';
import { StorageService } from '../services/storage.service';

/**
 * Comprehensive End-to-End Test Suite for All Proptii Document Flows
 * Covers both Landlord and Tenant end-to-end workflows:
 *
 * 1. Landlord Document Vault Flow:
 *    - Upload & metadata persistence
 *    - Unassigned vs Property-assigned partitioning
 *    - Property assignment & Firestore two-way synchronization
 *    - Dual-identity delete authorization (UID + email) & storage file cleanup
 *
 * 2. Tenant Document & Referencing Flow:
 *    - Uploading identity, employment, and income proof documents
 *    - Checking referencing status & completed document sections
 *    - Sharing referencing passport with landlord
 *    - Public passport verification
 *
 * 3. Contract & Tenancy Agreement Flow (Landlord + Tenant):
 *    - Landlord creates & dispatches contract with attachment
 *    - Real-time SSE notification emitted to tenant
 *    - Tenant syncs signed agreement back to landlord
 *    - Sending signed PDF via email with attachment
 */
describe('End-to-End Document Flows (Landlord & Tenant)', () => {
  // Landlord Document Vault instances
  let docsController: DocumentsController;
  let docsService: DocumentsService;
  let mockStorageService: StorageService;
  let landlordDocsDb: Map<string, any>;
  let propertiesDb: Map<string, any>;

  // Contract instances
  let contractController: ContractController;
  let contractService: ContractService;
  let eventsService: EventsService;
  let contractsDb: Map<string, any>;
  let templatesDb: Map<string, any>;

  // Referencing instances
  let refController: ReferencingController;
  let mockRefService: any;
  let mockGuarantorService: any;

  beforeEach(() => {
    vi.restoreAllMocks();

    // ──────────────────────────────────────────────────────────────────────────
    // 1. Setup Landlord Document Vault Mocks
    // ──────────────────────────────────────────────────────────────────────────
    landlordDocsDb = new Map();
    propertiesDb = new Map();

    mockStorageService = {
      uploadFile: vi.fn().mockResolvedValue('https://storage.googleapis.com/test-bucket/o/documents%2Ffile.pdf'),
      deleteFile: vi.fn().mockResolvedValue(undefined),
      getFileUrl: vi.fn(),
    } as unknown as StorageService;

    docsService = new DocumentsService(mockStorageService);

    const mockDocsDb = {
      collection: (colName: string) => {
        if (colName === 'landlord_documents') {
          return {
            doc: (docId?: string) => {
              const id = docId || `doc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
              return {
                id,
                set: vi.fn().mockImplementation(async (data: any) => {
                  landlordDocsDb.set(id, { id, ...data });
                }),
                get: vi.fn().mockImplementation(async () => {
                  const data = landlordDocsDb.get(id);
                  return { exists: !!data, data: () => data };
                }),
                update: vi.fn().mockImplementation(async (patch: any) => {
                  const existing = landlordDocsDb.get(id) || {};
                  landlordDocsDb.set(id, { ...existing, ...patch });
                }),
                delete: vi.fn().mockImplementation(async () => {
                  landlordDocsDb.delete(id);
                }),
              };
            },
            where: (field: string, op: string, val: any) => ({
              get: vi.fn().mockImplementation(async () => {
                const docs: any[] = [];
                for (const [id, data] of landlordDocsDb.entries()) {
                  if (data[field] === val) {
                    docs.push({ id, data: () => data });
                  }
                }
                return { docs };
              }),
            }),
          };
        }

        if (colName === 'properties') {
          return {
            doc: (propId: string) => ({
              id: propId,
              get: vi.fn().mockImplementation(async () => {
                const data = propertiesDb.get(propId);
                return { exists: !!data, data: () => data };
              }),
              update: vi.fn().mockImplementation(async (patch: any) => {
                const existing = propertiesDb.get(propId) || {};
                propertiesDb.set(propId, { ...existing, ...patch });
              }),
            }),
          };
        }

        throw new Error(`Unexpected collection in docs mock: ${colName}`);
      },
    };

    vi.spyOn(docsService as any, 'db').mockReturnValue(mockDocsDb);
    docsController = new DocumentsController(docsService);

    // ──────────────────────────────────────────────────────────────────────────
    // 2. Setup Contract Mocks
    // ──────────────────────────────────────────────────────────────────────────
    contractsDb = new Map();
    templatesDb = new Map();

    eventsService = {
      emit: vi.fn(),
      subscribe: vi.fn(),
    } as unknown as EventsService;

    contractService = new ContractService();

    const mockContractsCol = {
      doc: vi.fn().mockImplementation((id?: string) => {
        const docId = id || `contract_${Date.now()}`;
        return {
          id: docId,
          set: vi.fn().mockImplementation(async (data: any) => {
            contractsDb.set(docId, { id: docId, ...data });
          }),
          get: vi.fn().mockImplementation(async () => {
            const data = contractsDb.get(docId);
            return { exists: !!data, data: () => data };
          }),
        };
      }),
      where: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      get: vi.fn().mockResolvedValue({ docs: [], empty: true }),
    };

    const mockTemplatesCol = {
      doc: vi.fn().mockImplementation((id: string) => ({
        id,
        get: vi.fn().mockImplementation(async () => {
          const data = templatesDb.get(id);
          return { exists: !!data, data: () => data };
        }),
        delete: vi.fn().mockImplementation(async () => {
          templatesDb.delete(id);
        }),
      })),
    };

    vi.spyOn(contractService as any, 'contractsCol', 'get').mockReturnValue(mockContractsCol);
    vi.spyOn(contractService as any, 'templatesCol', 'get').mockReturnValue(mockTemplatesCol);
    contractController = new ContractController(contractService, eventsService);

    // ──────────────────────────────────────────────────────────────────────────
    // 3. Setup Referencing Mocks
    // ──────────────────────────────────────────────────────────────────────────
    mockRefService = {
      getReferencingStatusByEmail: vi.fn().mockResolvedValue({
        status: 'in_progress',
        completedSections: ['identity', 'employment'],
        pendingSections: ['financial', 'residential'],
        documents: [
          { name: 'Passport.pdf', category: 'Identity', url: 'https://cdn/passport.pdf' },
          { name: 'Payslip.pdf', category: 'Employment', url: 'https://cdn/payslip.pdf' },
        ],
      }),
      saveSectionData: vi.fn().mockResolvedValue({ success: true, section: 'identity' }),
      shareReferencingPassport: vi.fn().mockResolvedValue({ success: true, shareId: 'share_xyz123' }),
      getPublicPassportByToken: vi.fn().mockResolvedValue({
        verified: true,
        tenant: { name: 'John Doe', email: 'john@example.com' },
        documentsVerified: 2,
      }),
    };
    mockGuarantorService = {};
    refController = new ReferencingController(mockRefService, mockGuarantorService);
  });

  // ════════════════════════════════════════════════════════════════════════════
  // FLOW 1: Landlord Document Vault End-to-End
  // ════════════════════════════════════════════════════════════════════════════
  describe('FLOW 1: Landlord Document Vault Lifecycle', () => {
    const landlordReq = {
      user: {
        uid: 'landlord_uid_001',
        email: 'landlord@luxcity.co',
      },
    };

    it('Step 1: Landlord uploads an unassigned compliance document into the vault', async () => {
      const createBody = {
        name: 'Gas Safety Certificate 2026',
        type: 'application/pdf',
        url: 'https://firebasestorage.googleapis.com/v0/b/bucket/o/documents%2Fgas_safety_2026.pdf?alt=media',
        issueDate: '2026-01-15T00:00:00Z',
        expiryDate: new Date(Date.now() + 180 * 86400000).toISOString(),
        propertyId: null, // "Don't assign to a property yet"
      };

      const doc = await docsController.create(landlordReq, createBody);

      expect(doc.id).toBeDefined();
      expect(doc.propertyId).toBeNull();
      expect(doc.status).toBe('valid');
      expect(doc.landlordId).toBe('landlord_uid_001');

      // Verify unassigned listing returns this document
      const listRes = await docsController.list(landlordReq, 'unassigned');
      expect(listRes.success).toBe(true);
      expect(listRes.documents.some((d: any) => d.id === doc.id)).toBe(true);
    });

    it('Step 2: Landlord assigns the unassigned document to a property with 2-way Firestore sync', async () => {
      // Seed unassigned doc
      const docId = 'vault_doc_compliance_01';
      landlordDocsDb.set(docId, {
        id: docId,
        landlordId: 'landlord_uid_001',
        propertyId: null,
        name: 'Electrical Installation Condition Report',
        type: 'application/pdf',
        url: 'https://firebasestorage.googleapis.com/v0/b/bucket/o/documents%2Feicr_2026.pdf?alt=media',
        issueDate: '2026-02-01T00:00:00Z',
        expiryDate: new Date(Date.now() + 365 * 86400000).toISOString(),
        status: 'valid',
      });

      // Target property in properties collection
      const targetPropertyId = 'prop_luxcity_penthouse';
      propertiesDb.set(targetPropertyId, {
        id: targetPropertyId,
        title: 'Luxcity Penthouse 12B',
        documents: [],
      });

      // Assign doc to property
      const assignRes = await docsController.assign(landlordReq, docId, { propertyId: targetPropertyId });

      expect(assignRes.success).toBe(true);
      expect(assignRes.document.propertyId).toBe(targetPropertyId);

      // Verify doc was updated in landlord_documents
      expect(landlordDocsDb.get(docId).propertyId).toBe(targetPropertyId);

      // Verify doc was synchronized to the property's documents array
      const prop = propertiesDb.get(targetPropertyId);
      expect(prop.documents).toHaveLength(1);
      expect(prop.documents[0].id).toBe(docId);
      expect(prop.documents[0].name).toBe('Electrical Installation Condition Report');

      // Verify property-scoped listing returns this document
      const propList = await docsController.list(landlordReq, targetPropertyId);
      expect(propList.documents.some((d: any) => d.id === docId)).toBe(true);
    });

    it('Step 3: Landlord deletes the document, cleaning up property document references and cloud storage', async () => {
      const docId = 'doc_to_delete_99';
      const storageUrl = 'https://firebasestorage.googleapis.com/v0/b/bucket/o/documents%2Fepc_old.pdf?alt=media';
      const assignedPropId = 'prop_mayfair_mews';

      landlordDocsDb.set(docId, {
        id: docId,
        landlordId: 'landlord_uid_001',
        propertyId: assignedPropId,
        name: 'Expired EPC',
        type: 'application/pdf',
        url: storageUrl,
      });

      propertiesDb.set(assignedPropId, {
        id: assignedPropId,
        documents: [{ id: docId, name: 'Expired EPC', url: storageUrl }],
      });

      const deleteRes = await docsController.remove(landlordReq, docId);
      expect(deleteRes.success).toBe(true);

      // Removed from landlord_documents
      expect(landlordDocsDb.has(docId)).toBe(false);

      // Cleaned up from assigned property documents array
      const prop = propertiesDb.get(assignedPropId);
      expect(prop.documents).toEqual([]);

      // Cleaned up from cloud storage
      expect(mockStorageService.deleteFile).toHaveBeenCalledWith('documents/epc_old.pdf');
    });

    it('Step 4: Dual identity support — allows deletion when created with email but deleted with UID', async () => {
      const docId = 'doc_created_with_email';
      landlordDocsDb.set(docId, {
        id: docId,
        landlordId: 'landlord@luxcity.co', // created with email
        propertyId: null,
        name: 'Insurance Certificate',
        type: 'application/pdf',
        url: 'https://test.com/insurance.pdf',
      });

      // Request comes in with Firebase UID, matching user.email
      const deleteRes = await docsController.remove(
        { user: { uid: 'different_firebase_uid_123', email: 'landlord@luxcity.co' } },
        docId
      );

      expect(deleteRes.success).toBe(true);
      expect(landlordDocsDb.has(docId)).toBe(false);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // FLOW 2: Tenant Referencing & Document Verification End-to-End
  // ════════════════════════════════════════════════════════════════════════════
  describe('FLOW 2: Tenant Referencing Documents Flow', () => {
    const tenantReq = {
      user: {
        uid: 'tenant_uid_777',
        email: 'tenant.alice@example.com',
      },
    };

    it('Step 1: Tenant uploads and saves identity verification document', async () => {
      const identityData = {
        firstName: 'Alice',
        lastName: 'Wonderland',
        passportNumber: 'GB987654321',
        documentUrl: 'https://storage/identity/passport_alice.pdf',
        documentName: 'Alice_Passport.pdf',
      };

      const res = await refController.saveIdentityData(tenantReq, identityData);
      expect(res.success).toBe(true);
      expect(mockRefService.saveSectionData).toHaveBeenCalledWith(
        'tenant_uid_777',
        'identity',
        identityData
      );
    });

    it('Step 2: Tenant checks referencing status and completed document sections', async () => {
      const statusRes = await refController.getReferencingStatus('tenant.alice@example.com');
      expect(statusRes.status).toBe('in_progress');
      expect(statusRes.completedSections).toContain('identity');
      expect(statusRes.completedSections).toContain('employment');
      expect(statusRes.documents).toHaveLength(2);
    });

    it('Step 3: Tenant shares referencing passport with landlord and generates public token', async () => {
      const shareRes = await refController.sharePassport(tenantReq, {
        recipientEmail: 'landlord@luxcity.co',
        permissions: ['identity', 'employment', 'financial'],
      });

      expect(shareRes.success).toBe(true);
      expect(shareRes.shareId).toBe('share_xyz123');

      // Landlord views verified passport via public token
      const publicView = await refController.getPublicPassport('share_xyz123');
      expect(publicView.verified).toBe(true);
      expect(publicView.tenant.name).toBe('John Doe');
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // FLOW 3: Contract & Tenancy Agreement Flow (Landlord + Tenant)
  // ════════════════════════════════════════════════════════════════════════════
  describe('FLOW 3: Contract & Tenancy Agreement Flow', () => {
    it('Step 1: Landlord sends contract document to tenant and emits real-time SSE event', async () => {
      const landlordReq = { user: { uid: 'landlord_001', email: 'landlord@luxcity.co' } };
      const contractPayload = {
        tenantEmail: 'alice@tenant.co',
        tenantName: 'Alice Tenant',
        propertyId: 'prop_penthouse',
        propertyAddress: '12B Sky Gardens, London',
        contractName: 'Assured Shorthold Tenancy Agreement 2026',
        title: 'AST 2026 - 12B Sky Gardens',
        fileUrl: 'https://storage/contracts/ast_2026.pdf',
        documentName: 'AST_2026_Unsigned.pdf',
        status: 'sent',
      };

      const result = await contractController.sendContractToTenant(landlordReq, contractPayload);

      expect(result.success).toBe(true);
      expect(result.contractId).toBeDefined();

      // Verify contract was stored in Firestore
      const savedContract = contractsDb.get(result.contractId);
      expect(savedContract).toBeDefined();
      expect(savedContract.contractName).toBe('Assured Shorthold Tenancy Agreement 2026');
      expect(savedContract.status).toBe('sent');

      // Verify real-time SSE event was broadcast to tenant
      expect(eventsService.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'contract_sent',
          targetEmail: 'alice@tenant.co',
        })
      );
    });

    it('Step 2: Tenant signs agreement and syncs signed contract document to landlord', async () => {
      const tenantReq = { user: { uid: 'tenant_alice', email: 'alice@tenant.co' } };
      const syncPayload = {
        landlordId: 'landlord_001',
        landlordEmail: 'landlord@luxcity.co',
        propertyId: 'prop_penthouse',
        propertyAddress: '12B Sky Gardens, London',
        contractName: 'AST 2026 Signed',
        fileUrl: 'https://storage/contracts/ast_2026_signed.pdf',
        status: 'signed',
        signedDate: new Date().toISOString(),
      };

      const syncResult = await contractController.syncContractToLandlord(tenantReq, syncPayload);

      expect(syncResult.success).toBe(true);
      expect(syncResult.contractId).toBeDefined();

      // Verify landlord is notified via SSE
      expect(eventsService.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'contract_synced',
          targetEmail: 'landlord@luxcity.co',
        })
      );
    });

    it('Step 3: Landlord sends signed contract PDF via email with attachment', async () => {
      // Mock dynamic resend mailer
      vi.doMock('../utils/resend', () => ({
        sendEmail: vi.fn().mockResolvedValue('resend_msg_doc_success_100'),
      }));

      const landlordReq = { user: { uid: 'landlord_001', email: 'landlord@luxcity.co' } };
      const emailBody = {
        to: 'alice@tenant.co',
        recipientName: 'Alice Tenant',
        contractName: '12B Sky Gardens - Fully Executed AST',
      };
      const mockPdfFile = {
        fieldname: 'attachment',
        originalname: 'AST_Fully_Executed.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        size: 2048,
        buffer: Buffer.from('%PDF-1.4 sample fully executed tenancy contract'),
      };

      const mailRes = await contractController.sendSignedContract(landlordReq, emailBody, mockPdfFile as any);
      expect(mailRes.success).toBe(true);
      expect(mailRes.messageId).toBe('resend_msg_doc_success_100');
    });

    it('Step 4: Template authorization — only template creator can delete contract template', async () => {
      templatesDb.set('tpl_landlord_template', {
        id: 'tpl_landlord_template',
        userId: 'landlord_001',
        name: 'Standard 12M AST Template',
      });

      // Intruder attempt fails
      const intruderReq = { user: { uid: 'intruder_user' } };
      await expect(
        contractController.deleteContractTemplate(intruderReq, 'tpl_landlord_template')
      ).rejects.toThrow('Unauthorized template deletion');
      expect(templatesDb.has('tpl_landlord_template')).toBe(true);

      // Owner deletion succeeds
      const ownerReq = { user: { uid: 'landlord_001' } };
      const okRes = await contractController.deleteContractTemplate(ownerReq, 'tpl_landlord_template');
      expect(okRes).toEqual({ success: true });
      expect(templatesDb.has('tpl_landlord_template')).toBe(false);
    });
  });
});
