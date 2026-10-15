import { describe, expect, it } from 'vitest';
import { clientListings } from '../clientListings';

describe('clientListings', () => {
  it('shows one row per property when the same tenant is attached to two listings', () => {
    const rows = clientListings(
      [{
        id: 'aisha',
        name: 'Aisha Daodu',
        email: 'aisha@example.com',
        propertyId: 'prop-a',
        propertyAddress: '12 Church Lane',
        rentAmount: 3000,
      }],
      [
        { id: 'prop-a', address: '12 Church Lane', rent: 3000, tenantId: 'aisha' },
        { id: 'prop-b', address: '4 Park Road', rent: 1500, tenantId: 'aisha' },
      ],
    );

    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.propertyAddress)).toEqual(['12 Church Lane', '4 Park Road']);
    expect(rows[1].rentAmount).toBe(1500);
    expect(rows[0]).toMatchObject({ id: 'aisha', propertyId: 'prop-a' });
    expect(rows[1]).toMatchObject({ id: 'aisha', propertyId: 'prop-b' });
  });

  it('does not duplicate a tenant who is only on one property', () => {
    const tenant = {
      id: 'tom',
      email: 'tom@example.com',
      propertyId: 'prop-a',
      propertyAddress: '12 Church Lane',
      rentAmount: 900,
    };
    const rows = clientListings(
      [tenant],
      [{ id: 'prop-a', address: '12 Church Lane', rent: 900, tenantId: 'tom' }],
    );

    expect(rows).toEqual([tenant]);
  });

  it('keeps two saved tenancy records for two properties', () => {
    const rows = clientListings(
      [
        { id: 'one', email: 'aisha@example.com', propertyId: 'prop-a', propertyAddress: '12 Church Lane' },
        { id: 'two', email: 'aisha@example.com', propertyId: 'prop-b', propertyAddress: '4 Park Road' },
      ],
      [],
    );

    expect(rows.map((row) => row.id)).toEqual(['one', 'two']);
  });
});
