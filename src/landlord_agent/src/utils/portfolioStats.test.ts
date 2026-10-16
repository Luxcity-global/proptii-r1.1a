import { describe, expect, it, beforeEach } from 'vitest';
import { countPortfolio, isUnitOccupied, isPropertyArchived } from './portfolioStats';
import { recordDeletedTenant } from './deletedTenants';

describe('portfolioStats', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const properties = [
    { id: 'a', status: 'occupied', rent: 1000 },
    { id: 'b', status: 'vacant', rent: 800, tenantId: 'tenant-b' },
    { id: 'c', status: 'vacant', rent: 700 },
    { id: 'd', status: 'under-renovation', rent: 900 },
    { id: 'e', status: 'under-renovation', rent: 600, tenant: { id: 'tenant-e' } },
  ];

  it('keeps occupied, vacant, and renovating equal to the portfolio size', () => {
    const stats = countPortfolio(properties, [{ id: 'tenant-b', propertyId: 'b' }]);

    expect(stats.occupied).toBe(3);
    expect(stats.vacant).toBe(1);
    expect(stats.renovating).toBe(1);
    expect(stats.occupied + stats.vacant + stats.renovating).toBe(stats.total);
    expect(stats.occupancyPct).toBe(60);
    expect(stats.monthlyRent).toBe(2400);
  });

  it('does not treat a tenant count as occupied properties when the portfolio is empty', () => {
    const stats = countPortfolio([], [{ id: 'tenant-1', propertyId: 'missing' }]);
    expect(stats).toMatchObject({ total: 0, occupied: 0, vacant: 0, renovating: 0, occupancyPct: 0, monthlyRent: 0 });
  });

  it('excludes archived properties from the active portfolio', () => {
    const listWithArchived = [
      ...properties,
      { id: 'f', status: 'archived', rent: 1200 },
      { id: 'g', status: 'vacant', rent: 500, archived: true },
    ];
    const stats = countPortfolio(listWithArchived, [{ id: 'tenant-b', propertyId: 'b' }]);
    expect(stats.total).toBe(5);
    expect(stats.monthlyRent).toBe(2400);
  });

  it('identifies archived properties properly', () => {
    expect(isPropertyArchived({ status: 'archived' })).toBe(true);
    expect(isPropertyArchived({ archived: true })).toBe(true);
    expect(isPropertyArchived({ isArchived: true })).toBe(true);
    expect(isPropertyArchived({ status: 'occupied', archived: false })).toBe(false);
    expect(isPropertyArchived(null)).toBe(false);
  });

  it('treats property with deleted tenant as vacant/not occupied', () => {
    recordDeletedTenant('tenant-deleted-1', 'deleted@example.com');

    const prop = {
      id: 'prop-1',
      status: 'occupied',
      tenantId: 'tenant-deleted-1',
      tenant: { id: 'tenant-deleted-1', email: 'deleted@example.com' },
    };

    expect(isUnitOccupied(prop, [])).toBe(false);

    const stats = countPortfolio([prop], []);
    expect(stats.occupied).toBe(0);
    expect(stats.vacant).toBe(1);
  });

  it('treats vacant property without linked tenant as vacant', () => {
    const prop = {
      id: 'prop-2',
      status: 'vacant',
    };

    expect(isUnitOccupied(prop, [])).toBe(false);

    const stats = countPortfolio([prop], []);
    expect(stats.occupied).toBe(0);
    expect(stats.vacant).toBe(1);
  });
});


