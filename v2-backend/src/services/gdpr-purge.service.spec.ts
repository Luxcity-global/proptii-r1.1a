import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GdprPurgeService } from './gdpr-purge.service';
import * as admin from 'firebase-admin';

vi.mock('firebase-admin', () => {
  const deleteFn = vi.fn().mockResolvedValue(true);
  const getFn = vi.fn().mockResolvedValue({ exists: true, data: () => ({ id: 'u1' }) });
  const docFn = vi.fn(() => ({ get: getFn, delete: deleteFn }));
  const whereFn = vi.fn().mockReturnThis();
  const getQueryFn = vi.fn().mockResolvedValue({
    docs: [
      { id: 'doc-1', ref: { delete: deleteFn } },
      { id: 'doc-2', ref: { delete: deleteFn } },
    ],
  });
  const addFn = vi.fn().mockResolvedValue({ id: 'audit-log-1' });

  const firestoreMock = {
    collection: vi.fn(() => ({
      doc: docFn,
      where: whereFn,
      get: getQueryFn,
      add: addFn,
    })),
  };

  const getFilesFn = vi.fn().mockResolvedValue([
    [{ delete: vi.fn().mockResolvedValue(true) }],
  ]);
  const bucketMock = {
    getFiles: getFilesFn,
  };

  return {
    firestore: Object.assign(() => firestoreMock, {
      FieldValue: { serverTimestamp: () => 'SERVER_TIMESTAMP' },
    }),
    storage: () => ({ bucket: () => bucketMock }),
  };
});

describe('GdprPurgeService', () => {
  let service: GdprPurgeService;

  beforeEach(() => {
    service = new GdprPurgeService();
  });

  it('should cascade deletion across user, referencing, viewings, and storage', async () => {
    const result = await service.purgeUserData('user-to-forget-99', 'admin@proptii.co');

    expect(result.ok).toBe(true);
    expect(result.targetUserId).toBe('user-to-forget-99');
    expect(result.purgedRecords.userProfile).toBe(true);
    expect(result.purgedRecords.referencingDocs).toBeGreaterThanOrEqual(1);
    expect(result.purgedRecords.viewingRequests).toBe(2);
    expect(result.auditLogId).toBe('audit-log-1');
  });
});
