import { describe, it, expect } from 'vitest';
import { addressKeysMatch, buildAddressMatchKey } from './address-match-key';

describe('buildAddressMatchKey', () => {
  it('matches case, spacing and punctuation variants', () => {
    const a = buildAddressMatchKey({
      address: '10 High Street, London',
      postcode: 'SW1A 1AA',
    });
    const b = buildAddressMatchKey({
      address: '10  high-street,  london!',
      postcode: 'sw1a1aa',
    });
    expect(a).toBe(b);
    expect(addressKeysMatch(a, b)).toBe(true);
  });

  it('does not match two different flats in the same building', () => {
    const flat2 = buildAddressMatchKey({
      address: 'Flat 2, 10 High Street',
      postcode: 'SW1A 1AA',
    });
    const flat3 = buildAddressMatchKey({
      address: 'Flat 3, 10 High Street',
      postcode: 'SW1A 1AA',
    });
    expect(flat2).not.toBe(flat3);
  });

  it('matches the same flat with different formatting', () => {
    const a = buildAddressMatchKey({
      address: 'Apartment 4B, 22 Queen Road',
      postcode: 'E1 6AN',
    });
    const b = buildAddressMatchKey({
      address: 'Apt 4b  22 Queen Road',
      postcode: 'e1 6an',
    });
    expect(a).toBe(b);
  });

  it('prefers UPRN when present', () => {
    const a = buildAddressMatchKey({
      address: 'Anything',
      postcode: 'SW1A 1AA',
      uprn: '123456789012',
    });
    const b = buildAddressMatchKey({
      address: 'Completely Different',
      postcode: 'E1 6AN',
      uprn: '123456789012',
    });
    expect(a).toBe(b);
    expect(a.startsWith('uprn:')).toBe(true);
  });
});
