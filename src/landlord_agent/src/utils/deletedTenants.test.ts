import { describe, it, expect, beforeEach } from 'vitest';
import {
  recordDeletedTenant,
  isTenantDeleted,
  getDeletedTenantRecords,
  clearDeletedTenantRecord,
} from './deletedTenants';

describe('deletedTenants utility', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('records a deleted tenant and identifies them by ID and email', () => {
    expect(isTenantDeleted('tn-1', 'alex@example.com')).toBe(false);

    recordDeletedTenant('tn-1', 'alex@example.com');

    expect(isTenantDeleted('tn-1', undefined)).toBe(true);
    expect(isTenantDeleted(undefined, 'alex@example.com')).toBe(true);
    expect(isTenantDeleted(undefined, 'ALEX@example.com ')).toBe(true);
    expect(isTenantDeleted('tn-2', 'other@example.com')).toBe(false);
  });

  it('persists records in localStorage', () => {
    recordDeletedTenant('tn-abc', 'test@test.com');
    const records = getDeletedTenantRecords();
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      id: 'tn-abc',
      email: 'test@test.com',
    });
  });

  it('allows clearing a deleted record if needed', () => {
    recordDeletedTenant('tn-restore', 'restore@example.com');
    expect(isTenantDeleted('tn-restore')).toBe(true);

    clearDeletedTenantRecord('tn-restore');
    expect(isTenantDeleted('tn-restore')).toBe(false);
  });
});
