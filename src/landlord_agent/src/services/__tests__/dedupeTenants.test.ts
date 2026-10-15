import { describe, expect, it } from 'vitest';
import { dedupeTenants } from '../dedupeTenants';

describe('dedupeTenants', () => {
  it('keeps one row when the same person was saved twice for one property', () => {
    const rows = dedupeTenants([
      {
        id: 'pending-invite',
        name: 'sarah',
        email: 'Sarah@example.com',
        propertyId: 'prop-1',
        propertyAddress: '14 High Street',
        status: 'pending',
        rentAmount: 0,
      },
      {
        id: 'active-tenancy',
        name: 'Sarah Jones',
        email: 'sarah@example.com',
        phone: '07000000000',
        propertyId: 'prop-1',
        propertyAddress: '14 High Street',
        status: 'active',
        rentAmount: 1200,
        updatedAt: '2026-10-01T00:00:00.000Z',
      },
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe('active-tenancy');
    expect(rows[0].name).toBe('Sarah Jones');
  });

  it('keeps a separate row for each property', () => {
    const rows = dedupeTenants([
      {
        id: 'home',
        name: 'Sarah Jones',
        email: 'sarah@example.com',
        propertyId: 'prop-1',
        propertyAddress: '14 High Street',
        status: 'active',
        rentAmount: 1200,
      },
      {
        id: 'flat',
        name: 'Sarah Jones',
        email: 'sarah@example.com',
        propertyId: 'prop-2',
        propertyAddress: '2 Park Road',
        status: 'active',
        rentAmount: 900,
      },
    ]);

    expect(rows.map((row) => row.id)).toEqual(['home', 'flat']);
  });

  it('folds a property-less copy into the single tenancy and keeps the property link', () => {
    const rows = dedupeTenants([
      {
        id: 'blank',
        name: 'Sarah Jones',
        email: 'sarah@example.com',
        phone: '07000000000',
        status: 'active',
        rentAmount: 0,
      },
      {
        id: 'linked',
        name: 'sarah',
        email: 'sarah@example.com',
        propertyId: 'prop-1',
        propertyAddress: '14 High Street',
        status: 'pending',
        rentAmount: 0,
      },
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe('blank');
    expect(rows[0].propertyId).toBe('prop-1');
    expect(rows[0].propertyAddress).toBe('14 High Street');
  });

  it('matches the same address when one copy has no property id', () => {
    const rows = dedupeTenants([
      {
        id: 'by-address',
        name: 'Sarah Jones',
        email: 'sarah@example.com',
        propertyAddress: '14 High Street',
        status: 'active',
        rentAmount: 1200,
      },
      {
        id: 'by-id',
        name: 'Sarah Jones',
        email: 'sarah@example.com',
        propertyId: 'prop-1',
        propertyAddress: '14 High Street',
        status: 'active',
        rentAmount: 1200,
        updatedAt: '2026-10-02T00:00:00.000Z',
      },
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe('by-id');
    expect(rows[0].propertyId).toBe('prop-1');
  });

  it('does not merge different people or records with no email', () => {
    const rows = dedupeTenants([
      { id: 'a', name: 'Alex', email: 'alex@example.com', propertyId: 'prop-1', status: 'active' },
      { id: 'b', name: 'Blair', email: 'blair@example.com', propertyId: 'prop-1', status: 'active' },
      { id: 'c', name: 'No Email', propertyId: 'prop-1', status: 'active' },
      { id: 'd', name: 'No Email', propertyId: 'prop-1', status: 'active' },
    ]);

    expect(rows.map((row) => row.id)).toEqual(['a', 'b', 'c', 'd']);
  });
});
