/** Stable listing_id helpers (r1.4 primary key — not title_number). */

/** Short deterministic hash for scraped listing URLs / composite keys. */
export function hashListingKey(input: string): string {
  let hash = 0;
  const str = input.trim();
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return `h${Math.abs(hash).toString(36)}`;
}

/**
 * Resolve a stable listingId from whatever the listing already carries.
 * Prefer Firestore doc id or explicit listingId; else hash url / title+location.
 */
export function resolveListingId(property: {
  listingId?: string;
  id?: string;
  url?: string;
  title?: string;
  location?: string;
  price?: string;
}): string {
  if (property.listingId?.trim()) return property.listingId.trim();
  if (property.id?.trim()) return property.id.trim();
  if (property.url?.trim()) return hashListingKey(property.url);
  return hashListingKey(
    `${property.title || ''}|${property.location || ''}|${property.price || ''}`,
  );
}

export function ensureListingId<T extends Record<string, unknown>>(property: T): T & { listingId: string } {
  const listingId = resolveListingId(property as any);
  return { ...property, listingId };
}
