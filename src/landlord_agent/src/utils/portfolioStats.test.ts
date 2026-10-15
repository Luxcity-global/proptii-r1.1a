import { describe, expect, it } from 'vitest';
import { countPortfolio } from './portfolioStats';

describe('countPortfolio', () => {
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
});
