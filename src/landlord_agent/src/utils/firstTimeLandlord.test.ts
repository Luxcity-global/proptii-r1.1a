import { describe, expect, it } from 'vitest';
import {
  buildOnboardingChecklist,
  isFirstTimeLandlord,
  resolveLandlordGreeting,
} from './firstTimeLandlord';

describe('firstTimeLandlord (H3)', () => {
  it('treats empty portfolio as first-time', () => {
    expect(isFirstTimeLandlord([])).toBe(true);
    expect(isFirstTimeLandlord(undefined)).toBe(true);
    expect(isFirstTimeLandlord([{ id: '1' } as any])).toBe(false);
  });

  it('uses Welcome then Welcome back copy', () => {
    expect(resolveLandlordGreeting(true, 'Aisha').heading).toBe('Welcome, Aisha');
    expect(resolveLandlordGreeting(false, 'Aisha').heading).toBe('Welcome back, Aisha');
  });

  it('ticks checklist from C1/C2-like states', () => {
    const items = buildOnboardingChecklist({
      accountVerified: true,
      hasProperty: true,
      propertyComplianceComplete: false,
      hasPublishedListing: false,
    });
    expect(items.find((i) => i.id === 'account_verification')?.done).toBe(true);
    expect(items.find((i) => i.id === 'add_property')?.done).toBe(true);
    expect(items.find((i) => i.id === 'compliance')?.done).toBe(false);
    expect(items.find((i) => i.id === 'publish')?.done).toBe(false);
  });
});
