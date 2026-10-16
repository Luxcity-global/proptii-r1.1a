import type { Property } from '../types/property';

export interface PropertyDateDetails {
  /** Formatted exact publication date, e.g. "12 Oct 2026", or null if unknown */
  publishedDateFormatted: string | null;
  /** Raw ISO publication date if parseable */
  publishedDateIso: string | null;

  /** True if this property listing has been modified (price reduced, listing edited, etc.) */
  isModified: boolean;
  /** Formatted modified date, e.g. "14 Oct 2026", or null */
  modifiedDateFormatted: string | null;
  /** Description of what was modified, e.g. "Price reduced", "Listing updated" */
  modifiedReason: string | null;

  /**
   * Primary badge text for card & header:
   * e.g. "Price Reduced • 14 Oct 2026", "Updated • 14 Oct 2026", "Published • 12 Oct 2026", "Available Now"
   */
  badgeText: string;
  badgeVariant: 'emerald' | 'amber' | 'rose' | 'blue';

  /** Human-readable publication string, e.g. "Published on 12 Oct 2026" */
  publishedLabel: string;
  /** Human-readable modification string, e.g. "Price reduced on 14 Oct 2026", or null */
  modifiedLabel: string | null;
}

/**
 * Parses raw dates from various UK portals and ISO formats into a standard Date object.
 */
export function parsePropertyDate(raw: string | number | Date | undefined | null): Date | null {
  if (!raw) return null;
  if (raw instanceof Date) return isNaN(raw.getTime()) ? null : raw;
  if (typeof raw === 'number') {
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d;
  }

  const str = String(raw).trim();
  if (!str) return null;

  // Direct ISO parse: 2026-10-12T... or 2026-10-12
  const isoTime = Date.parse(str);
  if (!isNaN(isoTime) && str.includes('-')) {
    return new Date(isoTime);
  }

  const lower = str.toLowerCase();
  const now = new Date();

  if (lower.includes('today')) {
    return now;
  }
  if (lower.includes('yesterday')) {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    return y;
  }

  const daysAgoMatch = lower.match(/(\d+)\s*days?\s*ago/);
  if (daysAgoMatch) {
    const days = parseInt(daysAgoMatch[1], 10);
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d;
  }

  // UK date format: DD/MM/YYYY or DD.MM.YYYY or DD-MM-YYYY
  const ukMatch = str.match(/\b(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{2,4})\b/);
  if (ukMatch) {
    const day = parseInt(ukMatch[1], 10);
    const month = parseInt(ukMatch[2], 10) - 1;
    let year = parseInt(ukMatch[3], 10);
    if (year < 100) year += 2000;
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }

  // Month name match: "12 Oct" or "12 October 2026"
  const monthMatch = str.match(/\b(\d{1,2})\s+([A-Za-z]{3,9})(?:\s+(\d{4}))?\b/);
  if (monthMatch) {
    const day = parseInt(monthMatch[1], 10);
    const monthStr = monthMatch[2];
    const year = monthMatch[3] ? parseInt(monthMatch[3], 10) : now.getFullYear();
    const candidate = new Date(`${day} ${monthStr} ${year}`);
    if (!isNaN(candidate.getTime())) return candidate;
  }

  // Final fallback Date.parse
  if (!isNaN(isoTime)) {
    return new Date(isoTime);
  }

  return null;
}

/** Formats a date into "12 Oct 2026" */
export function formatPropertyDisplayDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Extracts exact publication date and modification details (date and what was modified).
 */
export function getPropertyDateInfo(property: Property): PropertyDateDetails {
  const publishedCandidate =
    property.publishedOn ||
    property.createdAt ||
    (property as any).firstVisibleDate ||
    (property as any).publish_date ||
    (property as any).created;

  const publishedDate = parsePropertyDate(publishedCandidate);

  // Check if addedOrReduced contains publication date if publishedCandidate wasn't present
  let resolvedPublishedDate = publishedDate;
  const rawAddedOrReduced = (property.addedOrReduced || '').trim();

  if (!resolvedPublishedDate && rawAddedOrReduced) {
    const parsedFromAor = parsePropertyDate(rawAddedOrReduced);
    if (parsedFromAor && /added|listed|published/i.test(rawAddedOrReduced)) {
      resolvedPublishedDate = parsedFromAor;
    }
  }

  // Check for modifications (Price reductions or Updates)
  let isModified = false;
  let modifiedDate: Date | null = null;
  let modifiedReason: string | null = null;

  // 1. Explicit modifiedReason / modifiedOn from backend or scraper
  if (property.modifiedReason || property.modifiedOn) {
    isModified = true;
    modifiedReason = property.modifiedReason || 'Listing updated';
    modifiedDate = parsePropertyDate(property.modifiedOn);
  }

  // 2. Rightmove / OnTheMarket price reduction in addedOrReduced (e.g. "Reduced on 12/10/2026" or "Reduced yesterday")
  if (/reduced|price\s*drop/i.test(rawAddedOrReduced)) {
    isModified = true;
    modifiedReason = 'Price reduced';
    const reductionDate = parsePropertyDate(rawAddedOrReduced);
    if (reductionDate) {
      modifiedDate = reductionDate;
    }
  }

  // 3. Native property updatedAt > createdAt check
  if (!isModified && property.updatedAt && property.createdAt) {
    const updated = parsePropertyDate(property.updatedAt);
    const created = parsePropertyDate(property.createdAt);
    if (updated && created) {
      const diffMinutes = Math.abs(updated.getTime() - created.getTime()) / (1000 * 60);
      if (diffMinutes > 5) {
        isModified = true;
        modifiedReason = 'Listing updated';
        modifiedDate = updated;
      }
    }
  }

  const publishedDateFormatted = resolvedPublishedDate ? formatPropertyDisplayDate(resolvedPublishedDate) : null;
  const modifiedDateFormatted = modifiedDate ? formatPropertyDisplayDate(modifiedDate) : null;

  // Build badge text & color variant
  let badgeText = 'Available Now';
  let badgeVariant: 'emerald' | 'amber' | 'rose' | 'blue' = 'emerald';

  if (isModified && modifiedReason) {
    const dateSuffix = modifiedDateFormatted ? ` • ${modifiedDateFormatted}` : '';
    badgeText = `${modifiedReason}${dateSuffix}`;
    badgeVariant = /price/i.test(modifiedReason) ? 'rose' : 'blue';
  } else if (publishedDateFormatted) {
    badgeText = `Published • ${publishedDateFormatted}`;
    badgeVariant = 'emerald';
  } else if (rawAddedOrReduced) {
    badgeText = rawAddedOrReduced;
    badgeVariant = /reduced/i.test(rawAddedOrReduced) ? 'rose' : 'emerald';
  }

  const publishedLabel = publishedDateFormatted ? `Published on ${publishedDateFormatted}` : 'Publication date unlisted';
  const modifiedLabel = isModified && modifiedReason
    ? (modifiedDateFormatted ? `${modifiedReason} on ${modifiedDateFormatted}` : `${modifiedReason}`)
    : null;

  return {
    publishedDateFormatted,
    publishedDateIso: resolvedPublishedDate ? resolvedPublishedDate.toISOString() : null,
    isModified,
    modifiedDateFormatted,
    modifiedReason,
    badgeText,
    badgeVariant,
    publishedLabel,
    modifiedLabel,
  };
}
