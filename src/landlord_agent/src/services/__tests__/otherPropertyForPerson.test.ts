import { describe, expect, it } from 'vitest';
import { otherPropertyForPerson } from '../otherPropertyForPerson';

describe('otherPropertyForPerson', () => {
  const tenants = [
    { id: 'removed', email: 'aisha@example.com', name: 'Aisha', propertyId: '', propertyAddress: '' },
    { id: 'kept', email: 'aisha@example.com', name: 'Aisha', propertyId: 'prop-b', propertyAddress: '12 Church Lane' },
  ];

  it('finds the other tenancy when the record being added back has no property', () => {
    expect(otherPropertyForPerson(tenants, [], 'Aisha@example.com', 'prop-a')).toEqual({
      name: 'Aisha',
      address: '12 Church Lane',
    });
  });

  it('finds a property that still lists the tenant after their record was cleared', () => {
    expect(otherPropertyForPerson(
      [{ id: 'removed', email: 'aisha@example.com', name: 'Aisha', propertyId: '' }],
      [{ id: 'prop-b', address: '12 Church Lane', tenantId: 'removed', tenant: { id: 'removed', email: 'aisha@example.com', name: 'Aisha' } }],
      'aisha@example.com',
      'prop-a',
    )?.address).toBe('12 Church Lane');
  });

  it('returns null when the only attachment is the destination property', () => {
    expect(otherPropertyForPerson(tenants, [], 'aisha@example.com', 'prop-b')).toBeNull();
  });
});
