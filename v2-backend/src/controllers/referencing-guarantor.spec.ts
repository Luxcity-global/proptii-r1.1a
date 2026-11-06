import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReferencingController } from './referencing.controller';
import { RefereeGuarantorController } from './referee-guarantor.controller';
import { ForbiddenException, BadRequestException } from '@nestjs/common';

describe('Section 11 & 12: Referencing, Passport Sharing & Guarantor Endpoints', () => {
  describe('ReferencingController', () => {
    let controller: ReferencingController;
    let refService: any;
    let guarantorService: any;

    beforeEach(() => {
      refService = {
        getReferencingStatusByEmail: vi.fn(),
        saveSectionData: vi.fn(),
        shareReferencingPassport: vi.fn(),
        getPublicPassportByToken: vi.fn(),
        sendReferencingRequest: vi.fn(),
        saveUserFile: vi.fn(),
      };
      guarantorService = {};
      controller = new ReferencingController(refService, guarantorService as any);
    });

    it('[GET /referencing/status/:tenantEmail] checks referencing status by tenant email', async () => {
      refService.getReferencingStatusByEmail.mockResolvedValue({
        status: 'completed',
        completedSections: ['identity', 'employment', 'financial'],
      });

      const res = await controller.getReferencingStatus('tenant@example.com');
      expect(refService.getReferencingStatusByEmail).toHaveBeenCalledWith('tenant@example.com');
      expect(res.status).toBe('completed');
    });

    it('[POST /referencing/identity] saves identity section for authenticated tenant or guest', async () => {
      refService.saveSectionData.mockResolvedValue({ success: true, section: 'identity' });
      const req = { user: { uid: 'tenant-123' } };
      const body = { firstName: 'Alice', lastName: 'Smith', passportNumber: 'GB123456' };

      const res = await controller.saveIdentityData(req, body);
      expect(refService.saveSectionData).toHaveBeenCalledWith('tenant-123', 'identity', body);
      expect(res.success).toBe(true);
    });

    it('[POST /referencing/shares] shares referencing passport with a landlord or agent', async () => {
      refService.shareReferencingPassport.mockResolvedValue({ success: true, shareId: 'share-99' });
      const req = { user: { uid: 'tenant-123' } };
      const body = { recipientEmail: 'landlord@test.com', permissions: ['full'] };

      const res = await controller.sharePassport(req, body);
      expect(refService.shareReferencingPassport).toHaveBeenCalledWith('tenant-123', body);
      expect(res.shareId).toBe('share-99');
    });

    it('[GET /referencing/public/:viewToken] public token view (no auth required)', async () => {
      refService.getPublicPassportByToken.mockResolvedValue({
        applicant: { name: 'Alice Smith' },
        verified: true,
      });

      const res = await controller.getPublicPassport('valid-public-token');
      expect(refService.getPublicPassportByToken).toHaveBeenCalledWith('valid-public-token');
      expect(res.applicant.name).toBe('Alice Smith');
    });

    it('[POST /referencing/request] sends referencing invite email to tenant', async () => {
      refService.sendReferencingRequest.mockResolvedValue({ success: true, requestId: 'req-456' });
      const req = { user: { uid: 'landlord-1', email: 'landlord@proptii.co', name: 'Landlord User' } };
      const body = { tenantEmail: 'tenant@test.com', tenantName: 'Tenant John', propertyAddress: '1 London Way' };

      const res = await controller.requestReferencing(req, body);
      expect(refService.sendReferencingRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantEmail: 'tenant@test.com',
          tenantName: 'Tenant John',
          landlordId: 'landlord-1',
          landlordName: 'Landlord User',
          propertyAddress: '1 London Way',
        }),
      );
      expect(res.success).toBe(true);
    });

    it('[GET /referencing/forms/:formId] blocks unauthorized tenant from reading other applicant data', async () => {
      const unauthorizedReq = { user: { uid: 'unauthorized-tenant', role: 'tenant' } };
      await expect(
        controller.getReferencingForm(unauthorizedReq, 'victim-applicant-id'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('[GET /referencing/forms/:formId] allows owning applicant or landlord/agent to access referencing form', async () => {
      refService.getFormData = vi.fn().mockResolvedValue({ id: 'tenant-1', currentStep: 2 });

      const ownerReq = { user: { uid: 'tenant-1', role: 'tenant' } };
      const resOwner = await controller.getReferencingForm(ownerReq, 'tenant-1');
      expect(resOwner.success).toBe(true);

      const landlordReq = { user: { uid: 'landlord-99', role: 'landlord' } };
      const resLandlord = await controller.getReferencingForm(landlordReq, 'tenant-1');
      expect(resLandlord.success).toBe(true);
    });

    it('[POST /referencing/files/save] enforces verified caller UID and ignores forged body.userId', async () => {
      refService.saveUserFile.mockResolvedValue({ success: true, fileUrl: 'https://storage/doc.pdf' });
      const authReq = { user: { uid: 'real-tenant-uid' } };
      const fakeBody = { userId: 'victim-landlord-uid' };
      const mockFile = { originalname: 'doc.pdf', buffer: Buffer.from('data') } as any;

      await controller.saveUserFile(authReq, mockFile, fakeBody);
      expect(refService.saveUserFile).toHaveBeenCalledWith('real-tenant-uid', mockFile, fakeBody);
      expect(refService.saveUserFile).not.toHaveBeenCalledWith('victim-landlord-uid', mockFile, fakeBody);
    });

    it('[POST /referencing/files/save] scopes guest guarantor/referee upload to invitation token', async () => {
      refService.saveUserFile.mockResolvedValue({ success: true, fileUrl: 'https://storage/proof.pdf' });
      const guestReq = { user: null };
      const tokenBody = { invitationToken: 'invite-tok-789', userId: 'attacker-trying-override' };
      const mockFile = { originalname: 'proof.pdf', buffer: Buffer.from('data') } as any;

      await controller.saveUserFile(guestReq, mockFile, tokenBody);
      expect(refService.saveUserFile).toHaveBeenCalledWith('token_invite-tok-789', mockFile, tokenBody);
    });

    it('[POST /referencing/files/save] sandboxes anonymous upload to isolated guest ID preventing ID spoofing', async () => {
      refService.saveUserFile.mockResolvedValue({ success: true, fileUrl: 'https://storage/temp.pdf' });
      const guestReq = { user: null };
      const spoofBody = { userId: 'admin-account-id' };
      const mockFile = { originalname: 'temp.pdf', buffer: Buffer.from('data') } as any;

      await controller.saveUserFile(guestReq, mockFile, spoofBody);
      expect(refService.saveUserFile).toHaveBeenCalledWith(expect.stringMatching(/^guest_/), mockFile, spoofBody);
      expect(refService.saveUserFile).not.toHaveBeenCalledWith('admin-account-id', mockFile, spoofBody);
    });
  });

  describe('RefereeGuarantorController', () => {
    let controller: RefereeGuarantorController;
    let service: any;

    beforeEach(() => {
      service = {
        getResponses: vi.fn(),
        saveResponse: vi.fn(),
        inviteGuarantor: vi.fn(),
        sendReferencingEmail: vi.fn(),
      };
      controller = new RefereeGuarantorController(service);
    });

    it('[GET /referee-guarantor-responses] retrieves referee and guarantor responses for current user', async () => {
      service.getResponses.mockResolvedValue([{ id: 'resp-1', type: 'guarantor' }]);
      const req = { user: { uid: 'tenant-1' } };

      const res = await controller.getResponses(req);
      expect(service.getResponses).toHaveBeenCalledWith('tenant-1');
      expect(res).toHaveLength(1);
    });

    it('[POST /referee-guarantor-responses] saves referee/guarantor questionnaire submission with valid identifier', async () => {
      service.saveResponse.mockResolvedValue({ success: true, id: 'resp-1' });
      const body = { applicantId: 'tenant-1', type: 'employer', confirmedSalary: 55000 };

      const res = await controller.saveResponse(body);
      expect(service.saveResponse).toHaveBeenCalledWith(body);
      expect(res.success).toBe(true);
    });

    it('[POST /referee-guarantor-responses] rejects submission without token or applicant identifier', async () => {
      await expect(
        controller.saveResponse({ type: 'employer', confirmedSalary: 55000 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('[POST /referencing/send-email] strictly blocks phishing open relay on external unapproved formUrl', async () => {
      const maliciousPayload = {
        to: 'referee@employer.com',
        tenantName: 'John',
        type: 'referee' as const,
        formUrl: 'https://evil-phishing-site.ru/steal-credentials',
      };
      await expect(
        controller.sendEmail(maliciousPayload),
      ).rejects.toThrow(BadRequestException);
    });

    it('[POST /referencing/send-email] allows email dispatch when formUrl belongs to approved Proptii domain', async () => {
      service.sendReferencingEmail.mockResolvedValue({ success: true });
      const validPayload = {
        to: 'referee@employer.com',
        tenantName: 'John',
        type: 'referee' as const,
        formUrl: 'https://proptii.co/referencing/questionnaire?token=tok-12345',
      };
      const res = await controller.sendEmail(validPayload);
      expect(service.sendReferencingEmail).toHaveBeenCalledWith(validPayload);
      expect(res.success).toBe(true);
    });

    it('[POST /referencing/invite-guarantor] invites guarantor with secure token link', async () => {
      service.inviteGuarantor.mockResolvedValue({ success: true, inviteId: 'inv-g-1' });
      const req = { user: { uid: 'tenant-1', email: 'tenant@test.com', name: 'Tenant A' } };
      const body = {
        guarantorName: 'Bob Guarantor',
        guarantorEmail: 'bob@guarantor.com',
        guarantorPhone: '07000000000',
        message: 'Please guarantee my tenancy',
      };

      const res = await controller.inviteGuarantor(req, body);
      expect(service.inviteGuarantor).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant-1',
          tenantEmail: 'tenant@test.com',
          tenantName: 'Tenant A',
          guarantorName: 'Bob Guarantor',
          guarantorEmail: 'bob@guarantor.com',
        }),
      );
      expect(res.success).toBe(true);
    });
  });
});
