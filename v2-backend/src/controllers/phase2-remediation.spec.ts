import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateFileContent } from '../utils/file-content-validator';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { ViewingRequestService } from '../services/viewing-request.service';
import { ContractService } from '../services/contract.service';
import { TenantsService } from '../services/tenants.service';
import { ReferencingService } from '../services/referencing.service';
import { BillingService } from '../services/billing.service';

describe('Phase 2 Remediation Test Suite — Distributed Real-Time, Performance & Data Integrity', () => {

  // ── Cluster A: File Content Validation & Security (Task 11) ─────────────────
  describe('Cluster C (Task 11): Content-based File Validation (Magic Bytes)', () => {
    it('blocks Windows executable (.exe / .dll) with MZ magic header', () => {
      const exeBuffer = Buffer.from('4d5a90000300000004000000ffff', 'hex');
      const result = validateFileContent(exeBuffer, 'document.pdf', 'application/pdf');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Executable');
    });

    it('blocks Linux ELF binary with \\x7fELF header', () => {
      const elfBuffer = Buffer.from('7f454c4602010100', 'hex');
      const result = validateFileContent(elfBuffer, 'receipt.png', 'image/png');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('binary');
    });

    it('blocks shell scripts with #! shebang', () => {
      const scriptBuffer = Buffer.from('#!/bin/bash\nrm -rf /', 'utf-8');
      const result = validateFileContent(scriptBuffer, 'contract.pdf');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Shell');
    });

    it('blocks HTML and embedded script payloads disguised as images or PDFs', () => {
      const htmlBuffer = Buffer.from('<html><body><script>alert(1)</script></body></html>', 'utf-8');
      const result = validateFileContent(htmlBuffer, 'id_card.png');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('HTML');
    });

    it('accepts legitimate PDF files (%PDF)', () => {
      const pdfBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj', 'utf-8');
      const result = validateFileContent(pdfBuffer, 'contract.pdf');
      expect(result.valid).toBe(true);
      expect(result.detectedType).toBe('application/pdf');
    });

    it('accepts legitimate PNG image headers', () => {
      const pngBuffer = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex');
      const result = validateFileContent(pngBuffer, 'photo.png');
      expect(result.valid).toBe(true);
      expect(result.detectedType).toBe('image/png');
    });

    it('accepts legitimate JPEG image headers', () => {
      const jpgBuffer = Buffer.from('ffd8ffe000104a4649460001', 'hex');
      const result = validateFileContent(jpgBuffer, 'passport.jpg');
      expect(result.valid).toBe(true);
      expect(result.detectedType).toBe('image/jpeg');
    });
  });

  // ── Cluster B: Viewing Requests Double-Booking & Denormalization (Tasks 6 & 7) ─
  describe('Cluster B (Tasks 6 & 7): Viewing Requests Optimization & Double-Booking Prevention', () => {
    it('denormalizes property fields onto viewing records to eliminate N+1 queries', async () => {
      const service = new ViewingRequestService();
      const mockDoc: any = {
        id: 'viewing_123',
        status: 'pending',
        propertyTitle: 'Flat 4, Westminster, SW1P 2PD',
        propertyAddress: 'Flat 4, Westminster, SW1P 2PD',
        propertyPrice: 2200,
        propertyPhoto: 'https://storage.proptii.co/prop1.jpg',
        tenantName: 'John Doe',
        tenantPhone: '07123456789',
        tenantEmail: 'john@example.com',
      };

      const presented = (service as any).presentViewing('viewing_123', mockDoc);
      expect(presented.propertyAddress).toBe('Flat 4, Westminster, SW1P 2PD');
      expect(presented.propertyPrice).toBe(2200);
      expect(presented.propertyPhoto).toBe('https://storage.proptii.co/prop1.jpg');
      expect(presented.tenantName).toBe('John Doe');
      expect(presented.tenantPhone).toBe('07123456789');
    });

    it('throws ConflictException (409) when confirming a double-booked viewing slot', async () => {
      const service = new ViewingRequestService();

      // Mock Firestore collection with an existing confirmed viewing on the same slot
      const mockCol = {
        where: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              get: vi.fn().mockResolvedValue({
                docs: [
                  {
                    id: 'existing_viewing_999',
                    data: () => ({
                      propertyId: 'prop_abc',
                      status: 'confirmed',
                      requestedDate: '2026-11-01',
                      requestedTime: '14:00',
                    }),
                  },
                ],
              }),
            }),
          }),
        }),
        doc: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({
            exists: true,
            data: () => ({
              id: 'viewing_conflict',
              propertyId: 'prop_abc',
              status: 'pending',
              requestedDate: '2026-11-01',
              requestedTime: '14:00',
              landlordId: 'landlord_1',
              tenantId: 'tenant_other_99',
              tenantEmail: 'applicant@example.com',
            }),
          }),
          update: vi.fn().mockResolvedValue({}),
        }),
      };

      Object.defineProperty(service, 'collection', {
        get: () => mockCol,
        configurable: true,
      });
      (service as any).assertCanManage = vi.fn().mockResolvedValue(true);

      // Attempting to confirm this viewing should throw ConflictException
      await expect(
        service.updateViewingStatus(
          'viewing_conflict',
          'landlord_1',
          'confirmed',
          undefined,
          { uid: 'landlord_1', email: 'landlord@example.com', role: 'landlord' }
        )
      ).rejects.toThrow(ConflictException);
    });
  });

  // ── Cluster D: Contract Audit Trail & Template Versioning (Tasks 12, 13, 14) ──
  describe('Cluster D (Tasks 12, 13, 14): Contracts Audit Trail, Signature Storage & Template Versioning', () => {
    it('records tamper-evident audit trail with IP, UA, UTC timestamp, and SHA-256 hash', async () => {
      const contractService = new ContractService();

      let savedPayload: any = null;
      const mockCol = {
        doc: vi.fn().mockReturnValue({
          set: vi.fn().mockImplementation(async (payload) => {
            savedPayload = payload;
          }),
          get: vi.fn().mockResolvedValue({ exists: false }),
        }),
      };
      Object.defineProperty(contractService, 'contractsCol', {
        get: () => mockCol,
        configurable: true,
      });

      const auditContext = {
        ip: '198.51.100.42',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      };

      const result = await contractService.saveSignedContract(
        {
          title: 'Standard AST 2026',
          tenantEmail: 'tenant@example.com',
          contractContent: 'This is the full legal text of the AST agreement...',
          signedDate: '2026-10-22T15:30:00Z',
        },
        'user_tenant_1',
        auditContext,
      );

      expect(result.success).toBe(true);
      expect(savedPayload).toBeDefined();
      expect(savedPayload.auditTrail).toBeDefined();
      expect(savedPayload.auditTrail.signerIp).toBe('198.51.100.42');
      expect(savedPayload.auditTrail.signerUserAgent).toContain('Mozilla/5.0');
      expect(savedPayload.auditTrail.documentSha256).toHaveLength(64); // SHA-256 hex is 64 chars
      expect(savedPayload.templateVersion).toBe('ast_uk_2026_v1');
    });

    it('strips inline base64 signature and stores URL reference instead of raw bytes', async () => {
      const contractService = new ContractService();

      let savedPayload: any = null;
      const mockCol = {
        doc: vi.fn().mockReturnValue({
          set: vi.fn().mockImplementation(async (payload) => {
            savedPayload = payload;
          }),
          get: vi.fn().mockResolvedValue({ exists: false }),
        }),
      };
      Object.defineProperty(contractService, 'contractsCol', {
        get: () => mockCol,
        configurable: true,
      });

      await contractService.saveSignedContract(
        {
          title: 'AST Agreement',
          signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          tenantEmail: 'tenant@test.com',
        },
        'tenant_1',
      );

      expect(savedPayload.signature).toBeUndefined();
      expect(savedPayload.signatureData).toBeUndefined();
      expect(savedPayload.templateVersion).toBe('ast_uk_2026_v1');
    });
  });

  // ── Cluster E: Bulk Imports Batching (Tasks 15 & 16) ─────────────────────────
  describe('Cluster E (Tasks 15 & 16): Bulk Tenant Import Batching', () => {
    it('batches up to 500 tenants in chunks of 400 without per-row sleep', async () => {
      const tenantsService = new TenantsService();

      let batchCommitted = 0;
      let opsInBatch = 0;

      const mockBatch = {
        set: vi.fn().mockImplementation(() => {
          opsInBatch++;
        }),
        commit: vi.fn().mockImplementation(async () => {
          batchCommitted++;
          opsInBatch = 0;
        }),
      };

      const mockDb = {
        batch: vi.fn().mockReturnValue(mockBatch),
      };

      const mockCol = {
        doc: vi.fn().mockReturnValue({}),
      };

      Object.defineProperty(tenantsService, 'db', {
        get: () => mockDb,
        configurable: true,
      });
      Object.defineProperty(tenantsService, 'collection', {
        get: () => mockCol,
        configurable: true,
      });

      // 450 rows -> should use 2 batch commits (400 + 50) with NO sleep
      const rows = Array.from({ length: 450 }, (_, i) => ({
        firstName: `Tenant${i}`,
        lastName: 'Test',
        email: `tenant${i}@example.com`,
      }));

      const startTime = Date.now();
      const result = await tenantsService.bulkCreateTenants(rows, 'landlord_1');
      const duration = Date.now() - startTime;

      expect(result.total).toBe(450);
      expect(result.succeeded).toBe(450);
      expect(result.failed).toBe(0);
      expect(mockDb.batch).toHaveBeenCalledTimes(2);
      expect(duration).toBeLessThan(1000); // 450 rows processed in <1s without 50ms sleeps
    });

    it('delegates large imports (>500 rows) to background job', async () => {
      const tenantsService = new TenantsService();
      const mockBatch = {
        set: vi.fn(),
        commit: vi.fn().mockResolvedValue({}),
      };
      Object.defineProperty(tenantsService, 'db', {
        get: () => ({ batch: vi.fn().mockReturnValue(mockBatch) }),
        configurable: true,
      });
      Object.defineProperty(tenantsService, 'collection', {
        get: () => ({ doc: vi.fn().mockReturnValue({}) }),
        configurable: true,
      });

      const rows = Array.from({ length: 550 }, (_, i) => ({
        firstName: `LargeTenant${i}`,
        email: `large${i}@test.com`,
      }));

      const result = await tenantsService.bulkCreateTenants(rows, 'agent_1');
      expect(result.async).toBe(true);
      expect(result.jobId).toBeDefined();
      expect(result.total).toBe(550);
    });
  });

  // ── Cluster E: Stripe Customer Deduplication & Subscriptions Source of Truth (Tasks 17 & 18) ──
  describe('Cluster E (Tasks 17 & 18): Stripe Customer Deduplication & Canonical Subscriptions', () => {
    it('normalizes email and reuses existing Stripe customer by email lookup', async () => {
      const billingService = new BillingService();

      const existingStripeCustomer = { id: 'cus_existing_12345', email: 'user@example.com' };
      const mockStripe = {
        customers: {
          list: vi.fn().mockResolvedValue({ data: [existingStripeCustomer] }),
          create: vi.fn(),
        },
      };

      const mockDb = {
        collection: vi.fn().mockReturnValue({
          doc: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue({ exists: false, data: () => ({}) }),
            set: vi.fn().mockResolvedValue({}),
          }),
        }),
      };

      Object.defineProperty(billingService, 'stripe', {
        get: () => mockStripe,
        configurable: true,
      });
      Object.defineProperty(billingService, 'db', {
        get: () => mockDb,
        configurable: true,
      });

      const customerId = await billingService.getOrCreateStripeCustomer('user_123', '  USER@EXAMPLE.COM  ');

      expect(customerId).toBe('cus_existing_12345');
      // Should query Stripe with trimmed lowercase email
      expect(mockStripe.customers.list).toHaveBeenCalledWith({
        email: 'user@example.com',
        limit: 1,
      });
      // Should NOT create a duplicate customer
      expect(mockStripe.customers.create).not.toHaveBeenCalled();
    });
  });
});
