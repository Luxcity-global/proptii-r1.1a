import { describe, expect, it } from 'vitest';
import { hasPropertyListingCompliance, isPubliclySearchable } from './listing-visibility';

const compliantDocs = [
  { type: 'gas-cert' },
  { type: 'eicr' },
  { type: 'epc', epcRating: 'C' },
  { type: 'deposit-protection' },
];

describe('hasPropertyListingCompliance', () => {
  it('requires gas, eicr, epc with rating, and deposit', () => {
    expect(hasPropertyListingCompliance({ documents: compliantDocs })).toBe(true);
    expect(hasPropertyListingCompliance({ documents: [{ type: 'gas-cert' }] })).toBe(false);
    expect(
      hasPropertyListingCompliance({
        documents: [
          { type: 'gas-cert' },
          { type: 'eicr' },
          { type: 'epc' }, // no rating
          { type: 'deposit-protection' },
        ],
      }),
    ).toBe(false);
  });

  it('accepts takesDeposit=no instead of deposit doc', () => {
    expect(
      hasPropertyListingCompliance({
        documents: [
          { type: 'gas-cert' },
          { type: 'eicr' },
          { type: 'epc', epcRating: 'B' },
        ],
        takesDeposit: 'no',
      }),
    ).toBe(true);
  });
});

describe('isPubliclySearchable', () => {
  it('hides draft and archived', () => {
    expect(isPubliclySearchable({ status: 'draft', listingVisibility: 'public', documents: compliantDocs })).toBe(false);
    expect(isPubliclySearchable({ status: 'archived', listingVisibility: 'public', documents: compliantDocs })).toBe(false);
    expect(isPubliclySearchable({ status: 'vacant', listingVisibility: 'public', archived: true, documents: compliantDocs })).toBe(false);
  });

  it('hides private and unpublished (no listingVisibility)', () => {
    expect(isPubliclySearchable({ status: 'vacant', listingVisibility: 'private', documents: compliantDocs })).toBe(false);
    expect(isPubliclySearchable({ status: 'vacant', documents: compliantDocs })).toBe(false);
  });

  it('hides published vacant without compliance docs', () => {
    expect(isPubliclySearchable({ status: 'vacant', listingVisibility: 'public', documents: [] })).toBe(false);
  });

  it('shows published vacant with compliance docs', () => {
    expect(
      isPubliclySearchable({
        status: 'vacant',
        listingVisibility: 'public',
        documents: compliantDocs,
      }),
    ).toBe(true);
  });

  it('does not show public occupied in to-let search', () => {
    expect(
      isPubliclySearchable({
        status: 'occupied',
        listingVisibility: 'public',
        documents: compliantDocs,
      }),
    ).toBe(false);
  });
});
