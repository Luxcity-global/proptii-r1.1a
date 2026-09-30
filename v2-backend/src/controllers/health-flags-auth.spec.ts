import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HealthController } from './health.controller';
import { FlagsController } from './flags.controller';
import { AuthController } from './auth.controller';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import * as admin from 'firebase-admin';

describe('Section 1 & 2: Health, Runtime Flags & Auth Endpoints', () => {
  describe('HealthController (/health, /ping)', () => {
    let healthController: HealthController;

    beforeEach(() => {
      healthController = new HealthController();
    });

    it('[GET /health & /ping] checkHealth returns status ok, timestamp, and service name', () => {
      const result = healthController.checkHealth();
      expect(result).toBeDefined();
      expect(result.status).toBe('ok');
      expect(result.service).toBe('proptii-v2-backend');
      expect(new Date(result.timestamp).getTime()).not.toBeNaN();
    });
  });

  describe('FlagsController (/flags)', () => {
    let flagsController: FlagsController;
    let mockFactsStore: any;

    beforeEach(() => {
      mockFactsStore = {
        isGovDataLayerEnabled: vi.fn(),
      };
      flagsController = new FlagsController(mockFactsStore);
    });

    it('[GET /flags] returns gov_data_layer true when enabled', async () => {
      mockFactsStore.isGovDataLayerEnabled.mockResolvedValue(true);
      const res = await flagsController.getFlags();
      expect(res).toEqual({ gov_data_layer: true });
      expect(mockFactsStore.isGovDataLayerEnabled).toHaveBeenCalled();
    });

    it('[GET /flags] returns gov_data_layer false when disabled', async () => {
      mockFactsStore.isGovDataLayerEnabled.mockResolvedValue(false);
      const res = await flagsController.getFlags();
      expect(res).toEqual({ gov_data_layer: false });
    });
  });

  describe('AuthController (/auth/me, /auth/role)', () => {
    let authController: AuthController;

    beforeEach(() => {
      authController = new AuthController();
    });

    it('[GET /auth/me & POST /auth/me] returns current user identity and role', async () => {
      const req = {
        user: {
          uid: 'user-abc',
          email: 'user@proptii.co',
          role: 'landlord',
        },
      };

      const me = await authController.getMe(req);
      expect(me).toEqual({
        uid: 'user-abc',
        email: 'user@proptii.co',
        role: 'landlord',
      });
    });

    it('[GET /auth/me] handles user without assigned role', async () => {
      const req = {
        user: {
          uid: 'new-user',
          email: 'new@proptii.co',
        },
      };

      const me = await authController.getMe(req);
      expect(me).toEqual({
        uid: 'new-user',
        email: 'new@proptii.co',
        role: null,
      });
    });

    it('[POST /auth/role] rejects invalid role with BadRequestException', async () => {
      const req = { user: { uid: 'user-1', email: 'test@example.com' } };
      await expect(
        authController.updateRole(req, { role: 'superadmin' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('[POST /auth/role] strictly prevents tenants from switching to landlord or agent (403 Forbidden)', async () => {
      const req = { user: { uid: 'user-tenant', email: 'tenant@example.com', role: 'tenant' } };
      await expect(
        authController.updateRole(req, { role: 'landlord' }),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        authController.updateRole(req, { role: 'agent' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('[POST /auth/role] allows valid role assignment for new users', async () => {
      const setMock = vi.fn().mockResolvedValue(undefined);
      const docMock = vi.fn().mockReturnValue({ set: setMock });
      const colMock = vi.fn().mockReturnValue({ doc: docMock });

      vi.spyOn(admin, 'apps', 'get').mockReturnValue([{ name: 'test-app' }] as any);
      vi.spyOn(admin, 'firestore').mockReturnValue({
        collection: colMock,
        FieldValue: { serverTimestamp: () => 'timestamp' },
      } as any);

      const req = { user: { uid: 'user-new', email: 'New@Example.COM' } };
      const res = await authController.updateRole(req, { role: 'tenant', source: 'onboarding' });

      expect(res.success).toBe(true);
      expect(res.role).toBe('tenant');
      expect(colMock).toHaveBeenCalledWith('users');
      expect(docMock).toHaveBeenCalledWith('user-new');
      expect(setMock).toHaveBeenCalledWith(
        expect.objectContaining({
          uid: 'user-new',
          email: 'new@example.com',
          role: 'tenant',
          roleSource: 'onboarding',
        }),
        { merge: true },
      );
    });
  });
});
