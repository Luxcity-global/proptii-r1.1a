/**
 * C2 — public search visibility helper.
 * Orthogonal to occupancy `status`. Owner portfolio always includes private listings.
 *
 * A listing appears in tenant search only when:
 *  - listingVisibility === 'public'
 *  - status is vacant (and not archived)
 *  - property-level compliance docs are present (gas, EICR, EPC+rating, deposit)
 */
export type ListingVisibility = 'private' | 'public';

export function normalizeListingVisibility(
  value: unknown,
): ListingVisibility | null {
  if (value == null || value === '') return null;
  const v = String(value).toLowerCase().trim();
  if (v === 'private' || v === 'public') return v;
  return null;
}

function hasDocOfType(docs: any[], type: string): boolean {
  return docs.some((d) => String(d?.type || '').toLowerCase() === type.toLowerCase());
}

function hasEpcWithRating(docs: any[]): boolean {
  return docs.some((d) => {
    if (String(d?.type || '').toLowerCase() !== 'epc') return false;
    const rating = d?.epcRating ?? d?.rating;
    return typeof rating === 'string' && rating.trim().length > 0;
  });
}

function hasDepositSatisfied(property: {
  documents?: any[] | null;
  takesDeposit?: string | null;
  depositProtectionConfirmed?: boolean | null;
}): boolean {
  const takes = String(property.takesDeposit || '').toLowerCase();
  if (takes === 'no') return true;
  if (property.depositProtectionConfirmed === true) return true;
  return hasDocOfType(property.documents || [], 'deposit-protection');
}

/**
 * Property-level compliance required before a listing may appear in tenant search.
 * Account verification (photo ID / proof of address) is enforced separately by C1 when enabled.
 */
export function hasPropertyListingCompliance(property: {
  documents?: any[] | null;
  takesDeposit?: string | null;
  depositProtectionConfirmed?: boolean | null;
} | null | undefined): boolean {
  if (!property) return false;
  const docs = Array.isArray(property.documents) ? property.documents : [];
  if (!hasDocOfType(docs, 'gas-cert')) return false;
  if (!hasDocOfType(docs, 'eicr')) return false;
  if (!hasEpcWithRating(docs)) return false;
  if (!hasDepositSatisfied(property)) return false;
  return true;
}

/** Whether a property may appear in public tenant search (to-let). */
export function isPubliclySearchable(property: {
  status?: string | null;
  listingVisibility?: string | null;
  archived?: boolean | null;
  isArchived?: boolean | null;
  documents?: any[] | null;
  takesDeposit?: string | null;
  depositProtectionConfirmed?: boolean | null;
} | null | undefined): boolean {
  if (!property) return false;
  const status = String(property.status || '').toLowerCase();
  if (status === 'draft' || status === 'archived') return false;
  if (property.archived === true || property.isArchived === true) return false;
  if (status !== 'vacant') return false;

  // Only explicitly published listings — just-saved / private stay out of search.
  if (normalizeListingVisibility(property.listingVisibility) !== 'public') return false;

  // Compliance docs required for tenant-facing search results.
  if (!hasPropertyListingCompliance(property)) return false;

  return true;
}
