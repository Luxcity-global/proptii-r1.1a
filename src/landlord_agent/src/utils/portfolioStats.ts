import { isTenantDeleted } from './deletedTenants';
import { isPropertyArchivedLocal } from './archivedProperties';

export interface PortfolioUnit {
  id: string;
  status?: string | null;
  rent?: number | null;
  tenantId?: string | null;
  tenant?: unknown;
  archived?: boolean | null;
  isArchived?: boolean | null;
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

/** Determine whether a property has been moved to the archive. */
export function isPropertyArchived(
  property: { id?: string | null; address?: string | null; status?: string | null; archived?: boolean | null; isArchived?: boolean | null } | null | undefined
): boolean {
  if (!property) return false;
  if (property.status === 'archived' || property.archived === true || property.isArchived === true) {
    return true;
  }
  return isPropertyArchivedLocal(property.id, property.address);
}

/** A unit is occupied when its status says so, or a tenant record is linked to it. */
export function isUnitOccupied(property: PortfolioUnit, tenants: PortfolioTenantLink[] = []): boolean {
  if (isPropertyArchived(property)) return false;

  const tenantEmail = typeof (property.tenant as any)?.email === 'string' ? (property.tenant as any).email : undefined;
  const tenantId = property.tenantId || (property.tenant as any)?.id;
  if (isTenantDeleted(tenantId, tenantEmail)) {
    return false;
  }

  const linked = tenants.some((tenant) => {
    if (isTenantDeleted(tenant.id, (tenant as any)?.email)) return false;
    return (
      (Boolean(tenant.propertyId) && tenant.propertyId === property.id) ||
      (Boolean(property.tenantId) && Boolean(tenant.id) && tenant.id === property.tenantId)
    );
  });

  if (property.status === 'vacant') {
    return linked;
  }

  return property.status === 'occupied' || Boolean(property.tenantId) || Boolean(property.tenant) || linked;
}

/**
 * Occupied, vacant, and renovating always add up to the portfolio size.
 * Monthly rent is the rent on occupied units only, matching the dashboard revenue card.
 * Archived properties are excluded from active portfolio calculations.
 */
export function countPortfolio(properties: PortfolioUnit[] | null | undefined, tenants: PortfolioTenantLink[] = []): PortfolioCounts {
  const list = (properties || []).filter((p) => !isPropertyArchived(p));
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

