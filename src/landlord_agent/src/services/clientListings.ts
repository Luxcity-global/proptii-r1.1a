/**
 * One Clients-page row per property a tenant is attached to.
 * Other screens keep the underlying tenant records unchanged.
 */

export interface ClientListingTenant {
  id: string;
  email?: string;
  name?: string;
  propertyId?: string;
  propertyAddress?: string;
  rentAmount?: number;
}

export interface ClientListingProperty {
  id: string;
  address?: string;
  rent?: number;
  tenantId?: string;
  tenant?: { id?: string; email?: string };
}

function norm(value?: string): string {
  return (value || '').trim().toLowerCase();
}

function listingKey(email: string, propertyId: string, address: string, fallbackId: string): string {
  const property = propertyId && propertyId !== 'setup-property'
    ? `id:${propertyId}`
    : address
      ? `addr:${norm(address)}`
      : `tenant:${fallbackId}`;
  return `${email || fallbackId}|${property}`;
}

export function clientListingKey(tenant: ClientListingTenant): string {
  return listingKey(norm(tenant.email), (tenant.propertyId || '').trim(), tenant.propertyAddress || '', tenant.id);
}

export function clientListings<T extends ClientListingTenant>(
  tenants: T[],
  properties: ClientListingProperty[],
): T[] {
  const rows: T[] = [];
  const seen = new Set<string>();

  const add = (tenant: T, propertyId: string, address: string, rent?: number) => {
    const key = listingKey(norm(tenant.email), propertyId, address, tenant.id);
    if (seen.has(key)) return;
    seen.add(key);

    const ownPropertyId = (tenant.propertyId || '').trim();
    const sameListing = (!propertyId && !address)
      || propertyId === ownPropertyId
      || (!ownPropertyId && norm(address) === norm(tenant.propertyAddress));

    if (sameListing) {
      rows.push(tenant);
      return;
    }

    rows.push({
      ...tenant,
      propertyId: propertyId || tenant.propertyId,
      propertyAddress: address || tenant.propertyAddress,
      rentAmount: typeof rent === 'number' && rent > 0 ? rent : tenant.rentAmount,
    });
  };

  tenants.forEach((tenant) => {
    add(tenant, (tenant.propertyId || '').trim(), tenant.propertyAddress || '');
  });

  properties.forEach((property) => {
    const linkedEmail = norm(property.tenant?.email);
    const linked = tenants.find((tenant) =>
      (property.tenantId && tenant.id === property.tenantId)
      || (property.tenant?.id && tenant.id === property.tenant.id)
      || (linkedEmail && norm(tenant.email) === linkedEmail)
    );
    if (!linked) return;
    if (!property.tenantId && !property.tenant?.id && !linkedEmail) return;
    add(linked, property.id, property.address || '', property.rent);
  });

  return rows;
}
