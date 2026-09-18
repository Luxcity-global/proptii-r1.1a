import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LeadsService } from './leads.service';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as admin from 'firebase-admin';

// Mock firebase-admin
vi.mock('firebase-admin', () => {
  const mockSet = vi.fn().mockResolvedValue(undefined);
  const mockUpdate = vi.fn().mockResolvedValue(undefined);
  const mockGet = vi.fn();

  const mockDoc = vi.fn((id?: string) => ({
    id: id || 'test-lead-id-123',
    set: mockSet,
    update: mockUpdate,
    get: mockGet,
  }));

  const mockCollection = vi.fn((colName: string) => ({
    doc: mockDoc,
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    get: vi.fn().mockResolvedValue({ docs: [] }),
  }));

  return {
    firestore: Object.assign(vi.fn(() => ({
      collection: mockCollection,
    })), {
      Timestamp: {
        fromMillis: (ms: number) => ({ toMillis: () => ms, toDate: () => new Date(ms) }),
      },
      FieldValue: {
        serverTimestamp: () => 'SERVER_TIMESTAMP',
      },
    }),
  };
});

describe('LeadsService', () => {
  let service: LeadsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new LeadsService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('submitLead & Token Generation', () => {
    it('creates lead and returns a signed token and leadId', async () => {
      const dto = {
        role: 'Independent landlord',
        propertyCount: '2–5',
        timeSinks: ['Chasing late rent', 'Tenant referencing'],
        adminHours: '2–5 hours',
        biggestGain: 'Automating rent collection',
        frustration: 'Too many spreadsheets',
      };

      const result = await service.submitLead(dto as any, '127.0.0.1');

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('leadId');
      expect(result.leadId).toBe('test-lead-id-123');
      expect(typeof result.token).toBe('string');
      expect(result.token.length).toBeGreaterThan(20);
    });
  });

  describe('getLeadBySession', () => {
    it('throws UnauthorizedException on invalid token', async () => {
      await expect(service.getLeadBySession('not-a-valid-token')).rejects.toThrow(UnauthorizedException);
    });

    it('returns lead session payload when token is valid and doc matches', async () => {
      const dto = {
        role: 'Independent landlord',
        propertyCount: '2–5',
        timeSinks: ['Chasing late rent'],
        adminHours: '2–5 hours',
        biggestGain: 'Automating rent collection',
      };

      const { token } = await service.submitLead(dto as any);

      // Mock Firestore get to return the document
      const mockDoc = admin.firestore().collection('campaign_leads').doc('test-lead-id-123');
      const crypto = await import('crypto');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      vi.mocked(mockDoc.get).mockResolvedValueOnce({
        exists: true,
        data: () => ({
          ...dto,
          sessionTokenHash: tokenHash,
        }),
      } as any);

      const session = await service.getLeadBySession(token);
      expect(session.leadId).toBe('test-lead-id-123');
      expect(session.role).toBe('Independent landlord');
      expect(session.timeSinks).toEqual(['Chasing late rent']);
    });
  });

  describe('activateLead', () => {
    it('updates lead with email and sets activated=true', async () => {
      const mockDoc = admin.firestore().collection('campaign_leads').doc('test-lead-id-123');
      vi.mocked(mockDoc.get).mockResolvedValueOnce({
        exists: true,
      } as any);

      await service.activateLead('test-lead-id-123', 'USER@EXAMPLE.COM');

      expect(mockDoc.update).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'user@example.com',
          activated: true,
        }),
      );
    });

    it('throws BadRequestException if lead is not found', async () => {
      const mockDoc = admin.firestore().collection('campaign_leads').doc('nonexistent');
      vi.mocked(mockDoc.get).mockResolvedValueOnce({
        exists: false,
      } as any);

      await expect(service.activateLead('nonexistent', 'test@example.com')).rejects.toThrow(BadRequestException);
    });
  });
});
