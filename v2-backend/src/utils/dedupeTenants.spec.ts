import { describe, expect, it } from 'vitest';
import { dedupeTenants } from './dedupeTenants';

describe('dedupeTenants', () => {
  it('returns the fuller record once when one tenant was stored twice', () => {
    const rows = dedupeTenants([
      {
        id: 'invite',
        name: 'sarah',
        email: 'SARAH@example.com',
        propertyId: 'prop-1',
        propertyAddress: '14 High Street',
        status: 'pending',
        rentAmount: 0,
      },
      {
        id: 'tenancy',
        name: 'Sarah Jones',
        email: 'sarah@example.com',
        propertyId: 'prop-1',
        propertyAddress: '14 High Street',
        status: 'active',
        rentAmount: 950,
      },
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe('tenancy');
  });

  it('preserves two tenancies for the same email on different properties', () => {
    const rows = dedupeTenants([
      { id: 'one', email: 'sarah@example.com', propertyId: 'prop-1', status: 'active', rentAmount: 1 },
      { id: 'two', email: 'sarah@example.com', propertyId: 'prop-2', status: 'active', rentAmount: 1 },
    ]);

    expect(rows.map((row) => row.id)).toEqual(['one', 'two']);
  });
});
