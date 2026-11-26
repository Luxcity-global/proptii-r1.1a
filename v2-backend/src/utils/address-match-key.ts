/**
 * H4 — normalised address matching key.
 * Ignores case, spacing and punctuation; preserves flat/unit tokens so two
 * flats in the same building do not collide. Prefer UPRN when both sides have it.
 */

const FLAT_TOKEN =
  /\b(?:flat|apartment|apt|unit|suite|room|floor|maisonette)\s*([a-z0-9/-]+)\b/i;

/** Strip punctuation/spaces; keep alphanumerics. */
function compact(value: string): string {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function extractUnitToken(addressLine: string): string {
  const match = String(addressLine || '').match(FLAT_TOKEN);
  if (!match) return '';
  // Normalise synonyms so "Apartment 4B" and "Apt 4B" share a key.
  const raw = String(match[0]).toLowerCase();
  const normalised = raw
    .replace(/\bapartments?\b/g, 'flat')
    .replace(/\bapts?\b/g, 'flat')
    .replace(/\bunits?\b/g, 'flat')
    .replace(/\bsuites?\b/g, 'flat')
    .replace(/\bmaisonettes?\b/g, 'flat');
  return compact(normalised);
}

function extractUkPostcode(raw: string): string {
  const upper = String(raw || '').toUpperCase();
  const match = upper.match(/\b([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})\b/);
  return match ? compact(match[1]) : '';
}

/**
 * Build a stable match key from address + postcode (+ optional UPRN).
 * When UPRN is present it dominates (unique property reference).
 */
export function buildAddressMatchKey(input: {
  address?: string | null;
  postcode?: string | null;
  uprn?: string | null;
  city?: string | null;
}): string {
  const uprn = String(input.uprn || '').trim();
  if (uprn) return `uprn:${compact(uprn)}`;

  const address = String(input.address || '').trim();
  const postcode =
    extractUkPostcode(input.postcode || '') ||
    extractUkPostcode(address) ||
    compact(String(input.postcode || ''));
  const unit = extractUnitToken(address);
  // Remove unit phrase from line before compacting street so "Flat 2, 10 High St"
  // and "Flat 3, 10 High St" share the street segment but differ on unit.
  const streetOnly = address.replace(FLAT_TOKEN, ' ').trim();
  const street = compact(streetOnly) || compact(address);
  const city = compact(String(input.city || ''));

  return ['addr', unit || '-', street || '-', city || '-', postcode || '-'].join(':');
}

export function addressKeysMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  const left = String(a || '').trim();
  const right = String(b || '').trim();
  if (!left || !right) return false;
  return left === right;
}
