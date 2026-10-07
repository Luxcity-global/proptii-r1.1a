import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TenantsController } from './tenants.controller';
import { PaymentsController } from './payments.controller';
import { TenantInvitationsController } from './tenant-invitations.controller';
import { NotFoundException } from '@nestjs/common';
import * as admin from 'firebase-admin';

describe('Section 4, 5 & 6: Tenants, Payments & Tenant Invitations Endpoints', () => {
  describe('PaymentsController', () => {
    let controller: PaymentsController;
    let tenantsService: any;

    beforeEach(() => {
      tenantsService = {
        saveBulkPayments: vi.fn(),
        getTenantPayments: vi.fn(),
        getPaymentPeriod: vi.fn(),
        updatePaymentStatus: vi.fn(),
      };
      controller = new PaymentsController(tenantsService);
    });

    it('[POST /payments/bulk] saves batch payment schedules', async () => {
      const writes = [{ id: 'p-1', amount: 1200 }, { id: 'p-2', amount: 1200 }];
      tenantsService.saveBulkPayments.mockResolvedValue({ success: true, count: 2 });

      const res = await controller.saveBulkPayments({ writes });
      expect(tenantsService.saveBulkPayments).toHaveBeenCalledWith(writes);
      expect(res.success).toBe(true);
    });

    it('[GET /payments/tenant/:tenantId] retrieves all payment schedules for a tenant', async () => {
      tenantsService.getTenantPayments.mockResolvedValue({ success: true, payments: [{ id: 'p-1' }] });
      const res = await controller.getTenantPayments('tenant-100');
      expect(tenantsService.getTenantPayments).toHaveBeenCalledWith('tenant-100');
      expect(res.payments).toHaveLength(1);
    });

    it('[GET /payments/:id] returns single payment period or throws 404', async () => {
      tenantsService.getPaymentPeriod.mockResolvedValueOnce({ id: 'p-1', amount: 1500 });
      const found = await controller.getPaymentPeriod('p-1');
      expect(found).toEqual({ success: true, period: { id: 'p-1', amount: 1500 } });

      tenantsService.getPaymentPeriod.mockResolvedValueOnce(null);
      await expect(controller.getPaymentPeriod('missing-p')).rejects.toThrow(NotFoundException);
    });

    it('[PUT /payments/:id/status] updates payment status with notes and options', async () => {
      tenantsService.updatePaymentStatus.mockResolvedValue({ success: true });

      const res1 = await controller.updatePaymentStatus('p-1', {
        status: 'paid',
        options: { notes: 'Paid via bank transfer' },
      });
      expect(tenantsService.updatePaymentStatus).toHaveBeenCalledWith('p-1', 'paid', 'Paid via bank transfer');
      expect(res1.success).toBe(true);

      const res2 = await controller.updatePaymentStatus('p-2', {
        status: 'paid',
        options: { paidAt: '2026-09-30T10:00:00Z', notes: 'Instant checkout' },
      });
      expect(res2.success).toBe(true);
    });
  });

  describe('TenantInvitationsController', () => {
    let controller: TenantInvitationsController;
    let mockSet: any;
    let mockGet: any;

    beforeEach(() => {
      mockSet = vi.fn().mockResolvedValue(undefined);
      mockGet = vi.fn().mockResolvedValue({
        docs: [
          {
            id: 'inv_123',
            data: () => ({ email: 'tenant@test.com', status: 'pending', landlordId: 'll-1' }),
          },
        ],
      });

      const mockCol = {
        doc: vi.fn().mockReturnValue({ set: mockSet }),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnValue({ get: mockGet }),
      };

      vi.spyOn(admin, 'apps', 'get').mockReturnValue([{ name: 'test-app' }] as any);
      const firestoreMock: any = vi.fn().mockReturnValue({
        collection: vi.fn().mockReturnValue(mockCol),
      });
      firestoreMock.FieldValue = { serverTimestamp: () => 'timestamp' };
      vi.spyOn(admin, 'firestore').mockImplementation(firestoreMock);
      (admin.firestore as any).FieldValue = { serverTimestamp: () => 'timestamp' };

      controller = new TenantInvitationsController();
    });

    it('[POST /tenant-invitations] creates and records a tenant invitation in Firestore', async () => {
      const req = { user: { uid: 'landlord-1', email: 'll@proptii.co' } };
      const body = { tenantEmail: 'invited@tenant.com', propertyId: 'prop-1' };

      const res = await controller.createInvitation(req, body);
      expect(res.success).toBe(true);
      expect(res.id).toMatch(/^inv_/);
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantEmail: 'invited@tenant.com',
          propertyId: 'prop-1',
          landlordId: 'landlord-1',
          landlordEmail: 'll@proptii.co',
          status: 'pending',
        }),
      );
    });

    it('[GET /tenant-invitations] lists invitations for authenticated landlord', async () => {
      const req = { user: { uid: 'll-1' } };
      const res = await controller.getInvitations(req);
      expect(res.invitations).toHaveLength(1);
      expect(res.invitations[0].id).toBe('inv_123');
      expect(res.invitations[0].email).toBe('tenant@test.com');
    });

    it('[PUT /tenant-invitations/:id] updates invitation status to accepted or declined', async () => {
      const res = await controller.updateInvitation('inv_123', { status: 'accepted' });
      expect(res.success).toBe(true);
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'accepted',
        }),
        { merge: true },
      );
    });
  });
});
