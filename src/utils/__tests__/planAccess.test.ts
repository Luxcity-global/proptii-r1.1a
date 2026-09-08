import { describe, expect, it } from 'vitest';
import { canAccessSection } from '../planAccess';

describe('canAccessSection', () => {
  it('allows unrestricted dashboard sections on Explorer', () => {
    expect(canAccessSection('dashboard', 'explorer', 'active')).toBe(true);
    expect(canAccessSection('saved-searches', 'explorer', 'active')).toBe(true);
  });

  it('locks referencing and contracts for Explorer', () => {
    expect(canAccessSection('tenant-referencing', 'explorer', 'active')).toBe(false);
    expect(canAccessSection('tenant-contracts', 'explorer', 'active')).toBe(false);
    expect(canAccessSection('tenant-referencing', null, null)).toBe(false);
  });

  it('unlocks referencing and contracts for Renter Pro', () => {
    expect(canAccessSection('tenant-referencing', 'renter_pro', 'active')).toBe(true);
    expect(canAccessSection('tenant-contracts', 'renter_pro', 'trialing')).toBe(true);
  });

  it('revokes paid access when the subscription is canceled or unpaid', () => {
    expect(canAccessSection('tenant-contracts', 'renter_pro', 'canceled')).toBe(false);
    expect(canAccessSection('tenant-contracts', 'buyer_pro', 'unpaid')).toBe(false);
  });
});
