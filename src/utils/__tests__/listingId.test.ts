import { describe, it, expect } from 'vitest';
import { resolveListingId, hashListingKey } from '../listingId';

describe('listingId helpers', () => {
  it('prefers explicit listingId then id then url hash', () => {
    expect(resolveListingId({ listingId: 'abc' })).toBe('abc');
    expect(resolveListingId({ id: 'fire-1' })).toBe('fire-1');
    expect(resolveListingId({ url: 'https://example.com/p/1' })).toBe(
      hashListingKey('https://example.com/p/1'),
    );
  });
});
