import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContractController } from './contract.controller';
import { ContractService } from '../services/contract.service';
import { EventsService } from '../services/events.service';

describe('ContractController & ContractService End-to-End Functionality', () => {
  let controller: ContractController;
  let contractService: ContractService;
  let eventsService: EventsService;

  beforeEach(() => {
    vi.restoreAllMocks();

    eventsService = {
      emit: vi.fn(),
      subscribe: vi.fn(),
    } as unknown as EventsService;

    contractService = new ContractService();

    // Mock Firestore db
    const mockDocRef = {
      set: vi.fn().mockResolvedValue(undefined),
      get: vi.fn().mockResolvedValue({ exists: true, data: () => ({ id: 'tpl-1', userId: 'user-123' }) }),
      delete: vi.fn().mockResolvedValue(undefined),
    };
    const mockCollection = {
      doc: vi.fn().mockReturnValue(mockDocRef),
      where: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      get: vi.fn().mockResolvedValue({ docs: [], empty: true }),
    };

    vi.spyOn(contractService as any, 'db', 'get').mockReturnValue({
      collection: vi.fn().mockReturnValue(mockCollection),
    });
    vi.spyOn(contractService as any, 'contractsCol', 'get').mockReturnValue(mockCollection);
    vi.spyOn(contractService as any, 'templatesCol', 'get').mockReturnValue(mockCollection);

    controller = new ContractController(contractService, eventsService);
  });

  describe('sendSignedContract functionality', () => {
    it('rejects invalid recipient email addresses', async () => {
      const req = { user: { uid: 'user-1', email: 'landlord@proptii.co' } };
      const body = { to: 'invalid-email', contractName: 'Standard Tenancy' };

      const result = await controller.sendSignedContract(req, body);
      expect(result).toEqual({ success: false, error: 'Invalid recipient email address' });
    });

    it('successfully processes multipart PDF upload and sends email with attachment', async () => {
      // Mock the dynamic import of resend utility
      vi.doMock('../utils/resend', () => ({
        sendEmail: vi.fn().mockResolvedValue('resend-msg-id-999'),
      }));

      const req = { user: { uid: 'landlord-1', email: 'landlord@proptii.co' } };
      const body = {
        to: 'tenant@example.com',
        recipientName: 'Alice Tenant',
        contractName: '24 Park Lane AST',
      };
      const file = {
        fieldname: 'attachment',
        originalname: '24_park_lane_signed.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        size: 1024,
        buffer: Buffer.from('%PDF-1.4 test contract content'),
      };

      const result = await controller.sendSignedContract(req, body, file);
      expect(result).toMatchObject({
        success: true,
        message: 'Signed contract emailed successfully',
        messageId: 'resend-msg-id-999',
      });
    });

    it('successfully processes base64 attachment when uploaded as JSON', async () => {
      vi.doMock('../utils/resend', () => ({
        sendEmail: vi.fn().mockResolvedValue('resend-json-msg-123'),
      }));

      const req = { user: { uid: 'landlord-1', email: 'landlord@proptii.co' } };
      const body = {
        to: 'tenant2@example.com',
        recipientName: 'Bob Tenant',
        contractName: 'Studio Flat AST',
        attachmentBase64: Buffer.from('PDF content').toString('base64'),
      };

      const result = await controller.sendSignedContract(req, body);
      expect(result).toMatchObject({
        success: true,
        message: 'Signed contract emailed successfully',
        messageId: 'resend-json-msg-123',
      });
    });
  });

  describe('sendContractToTenant landlord flow', () => {
    it('creates contract record and emits SSE event', async () => {
      const req = { user: { uid: 'landlord-99', email: 'landlord@proptii.co' } };
      const body = {
        tenantEmail: 'tenant@example.com',
        tenantName: 'John Doe',
        title: 'Tenancy Agreement 2026',
        propertyId: 'prop-1',
      };

      const result = await controller.sendContractToTenant(req, body);
      expect(result.success).toBe(true);
      expect(eventsService.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'contract_sent',
          userId: 'landlord-99',
          targetEmail: 'tenant@example.com',
        }),
      );
    });
  });

  describe('syncContractToLandlord flow', () => {
    it('persists synced contract and notifies landlord via SSE', async () => {
      const req = { user: { uid: 'tenant-1', email: 'tenant@example.com' } };
      const body = {
        contractId: 'contract-123',
        tenantEmail: 'tenant@example.com',
        landlordEmail: 'landlord@proptii.co',
        status: 'signed',
      };

      const result = await controller.syncContractToLandlord(req, body);
      expect(result.success).toBe(true);
      expect(eventsService.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'contract_synced',
          targetEmail: 'landlord@proptii.co',
        }),
      );
    });
  });

  describe('deleteTemplate authorization', () => {
    it('allows owner to delete their template', async () => {
      const req = { user: { uid: 'user-123' } };
      const result = await controller.deleteContractTemplate(req, 'tpl-1');
      expect(result).toEqual({ success: true });
    });

    it('rejects non-owner template deletion', async () => {
      const req = { user: { uid: 'attacker-456' } };
      await expect(controller.deleteContractTemplate(req, 'tpl-1')).rejects.toThrow('Unauthorized template deletion');
    });
  });

  describe('landlord contracts management', () => {
    it('creates contract with base64 data', async () => {
      const req = { user: { uid: 'll-1' } };
      const body = {
        contractData: {
          title: 'AST 12 Month Agreement',
          recipientName: 'Alice Tenant',
          recipientEmail: 'alice@example.com',
        },
        fileName: 'ast_12m.pdf',
        base64Data: 'JVBERi0xLjQK...',
      };

      const result = await controller.createContractWithBase64(req, body);
      expect(result.success).toBe(true);
      expect(result.id).toBeDefined();
      expect(result.contractId).toBeDefined();
    });

    it('retrieves landlord contracts list', async () => {
      const req = { user: { uid: 'll-1', email: 'landlord@test.com' } };
      const result = await controller.getLandlordContracts(req, 'll-1');
      expect(result.success).toBe(true);
      expect(Array.isArray(result.contracts)).toBe(true);
    });

    it('saves signed contract from tenant', async () => {
      const req = { user: { uid: 'tenant-1', email: 'tenant@test.com' } };
      const body = {
        title: 'Signed Tenancy Agreement',
        tenantEmail: 'tenant@test.com',
        status: 'signed',
      };

      const result = await controller.saveSignedContract(req, body);
      expect(result.success).toBe(true);
      expect(result.id).toBeDefined();
      expect(eventsService.emit).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'contract_sent' }),
      );
    });
  });
});
