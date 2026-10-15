export interface PortfolioUnit {
  id: string;
  status?: string | null;
  rent?: number | null;
  tenantId?: string | null;
  tenant?: unknown;
}

export interface PortfolioTenantLink {
  id?: string;
  propertyId?: string | null;
}

export interface PortfolioCounts {
  total: number;
  occupied: number;
  vacant: number;
  renovating: number;
  occupancyPct: number;
  monthlyRent: number;
}

/** A unit is occupied when its status says so, or a tenant record is linked to it. */
export function isUnitOccupied(property: PortfolioUnit, tenants: PortfolioTenantLink[] = []): boolean {
  const linked = tenants.some((tenant) =>
    (Boolean(tenant.propertyId) && tenant.propertyId === property.id)
    || (Boolean(property.tenantId) && Boolean(tenant.id) && tenant.id === property.tenantId),
  );
  return property.status === 'occupied' || Boolean(property.tenantId) || Boolean(property.tenant) || linked;
}

/**
 * Occupied, vacant, and renovating always add up to the portfolio size.
 * Monthly rent is the rent on occupied units only, matching the dashboard revenue card.
 */
export function countPortfolio(properties: PortfolioUnit[] | null | undefined, tenants: PortfolioTenantLink[] = []): PortfolioCounts {
  const list = properties || [];
  let occupied = 0;
  let vacant = 0;
  let renovating = 0;
  let monthlyRent = 0;

  for (const property of list) {
    if (isUnitOccupied(property, tenants)) {
      occupied += 1;
      monthlyRent += Number(property.rent) || 0;
    } else if (property.status === 'under-renovation') {
      renovating += 1;
    } else {
      vacant += 1;
    }
  }

  const total = list.length;
  return {
    total,
    occupied,
    vacant,
    renovating,
    occupancyPct: total > 0 ? Math.round((occupied / total) * 100) : 0,
    monthlyRent,
  };
}
