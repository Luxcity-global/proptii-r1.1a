import type { FactFlag } from '../types/govData';

/** Optional search-card hint: listing field first, else first flagged fact label. */
export function reportHintFromFlags(
  flags: FactFlag[] | null | undefined,
  listingHint?: string | null,
): string | null {
  const fromListing = listingHint?.trim();
  if (fromListing) return fromListing;
  if (!flags?.length) return null;
  const flagged = flags.find((flag) => flag.state === 'flagged' && flag.label.trim());
  return flagged?.label.trim() || null;
}
