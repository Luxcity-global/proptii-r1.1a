import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BackupService } from './backup.service';
import * as fs from 'fs';

vi.mock('firebase-admin', () => {
  const getDocsFn = vi.fn().mockResolvedValue({
    size: 2,
    docs: [
      { id: 'item-1', data: () => ({ name: 'test-item-1' }) },
      { id: 'item-2', data: () => ({ name: 'test-item-2' }) },
    ],
  });
  const limitFn = vi.fn(() => ({ get: getDocsFn }));
  const addFn = vi.fn().mockResolvedValue({ id: 'backup-audit-1' });

  const firestoreMock = {
    collection: vi.fn(() => ({
      limit: limitFn,
      add: addFn,
    })),
  };

  return {
    firestore: Object.assign(() => firestoreMock, {
      FieldValue: { serverTimestamp: () => 'SERVER_TIMESTAMP' },
    }),
  };
});

describe('BackupService', () => {
  let service: BackupService;

  beforeEach(() => {
    service = new BackupService();
  });

  it('should export snapshot manifest across core collections', async () => {
    const manifest = await service.createBackup('admin@proptii.co');

    expect(manifest.backupId).toContain('backup_');
    expect(manifest.totalRecords).toBeGreaterThan(0);
    expect(manifest.collections['properties']).toBe(2);
    expect(manifest.collections['contracts']).toBe(2);
    expect(fs.existsSync(manifest.location)).toBe(true);

    // Clean up temporary test file
    try {
      fs.unlinkSync(manifest.location);
    } catch {}
  });

  it('should list backups correctly', async () => {
    const backups = await service.listBackups();
    expect(Array.isArray(backups)).toBe(true);
  });
});
