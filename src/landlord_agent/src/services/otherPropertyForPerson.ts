export interface TenancyPerson {
  id?: string;
  email?: string;
  name?: string;
  propertyId?: string;
  propertyAddress?: string;
}

export interface TenancyProperty {
  id: string;
  address?: string;
  tenantId?: string;
  tenant?: { id?: string; email?: string; name?: string };
}

/** Another property this person is already on, besides the one they are about to join. */
export function otherPropertyForPerson(
  tenants: TenancyPerson[],
  properties: TenancyProperty[],
  email: string | undefined,
  destinationPropertyId: string | undefined,
): { name: string; address: string } | null {
  const key = (email || '').trim().toLowerCase();
  if (!key || !destinationPropertyId) return null;

  const samePerson = tenants.filter((tenant) => (tenant.email || '').trim().toLowerCase() === key);
  const ids = new Set(samePerson.map((tenant) => tenant.id).filter((id): id is string => Boolean(id)));

  for (const tenant of samePerson) {
    const propertyId = (tenant.propertyId || '').trim();
    if (!propertyId || propertyId === 'setup-property' || propertyId === destinationPropertyId) continue;
    return {
      name: tenant.name || 'This tenant',
      address: tenant.propertyAddress || properties.find((property) => property.id === propertyId)?.address || 'another property',
    };
  }

  for (const property of properties) {
    if (property.id === destinationPropertyId) continue;
    const linkedId = property.tenantId || property.tenant?.id;
    const linkedEmail = (property.tenant?.email || '').trim().toLowerCase();
    const linked = Boolean((linkedId && ids.has(linkedId)) || (linkedEmail && linkedEmail === key));
    if (!linked) continue;
    return {
      name: property.tenant?.name || samePerson[0]?.name || 'This tenant',
      address: property.address || 'another property',
    };
  }

  return null;
}
