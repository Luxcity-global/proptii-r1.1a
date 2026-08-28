/**
 * Display-only helpers for listing headings vs description copy.
 * Do not use these to mutate property.title — that field is used for save IDs,
 * dedupe keys, share text, and listing identity.
 */

export type PropertyDisplayFields = {
  title?: string | null;
  description?: string | null;
  bedrooms?: string | number | null;
  propertyType?: string | null;
};

const BLURB_CHAR_LIMIT = 80;
const BLURB_WORD_LIMIT = 12;

const hasBedrooms = (bedrooms: PropertyDisplayFields['bedrooms']): boolean => {
  if (bedrooms === undefined || bedrooms === null || bedrooms === '') return false;
  const asString = String(bedrooms).trim();
  if (!asString || asString === '—' || asString.toLowerCase() === 'null') return false;
  return true;
};

const formatBedroomLabel = (bedrooms: string | number): string | null => {
  const numeric = Number(bedrooms);
  if (Number.isNaN(numeric)) {
    return `${String(bedrooms).trim()} Bedroom`;
  }
  if (numeric === 0) return null;
  return numeric === 1 ? '1 Bedroom' : `${numeric} Bedroom`;
};

const formatPropertyType = (propertyType?: string | null): string => {
  const type = (propertyType || '').trim();
  if (!type || type.toLowerCase() === 'property') return '';
  return type;
};

export const isListingBlurb = (text?: string | null): boolean => {
  const trimmed = (text || '').trim();
  if (!trimmed) return false;
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
  if (trimmed.length > BLURB_CHAR_LIMIT || wordCount > BLURB_WORD_LIMIT) return true;
  return /[.!?]/.test(trimmed) && trimmed.length > 50;
};

export const getPropertyDisplayTitle = (property: PropertyDisplayFields): string => {
  const title = (property.title || '').trim();
  const type = formatPropertyType(property.propertyType);
  const bedLabel = hasBedrooms(property.bedrooms)
    ? formatBedroomLabel(property.bedrooms as string | number)
    : null;

  const synthesized =
    bedLabel && type
      ? `${bedLabel} ${type}`
      : bedLabel
        ? `${bedLabel} Property`
        : type || '';

  if (isListingBlurb(title)) {
    return synthesized || title.split(/[.!?]/)[0].trim() || 'Property';
  }

  return title || synthesized || 'Property';
};

export const getPropertyListingDescription = (property: PropertyDisplayFields): string => {
  const description = (property.description || '').trim();
  if (description) return description;

  const title = (property.title || '').trim();
  if (isListingBlurb(title)) return title;
  return '';
};
