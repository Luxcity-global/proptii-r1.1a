import { describe, it, expect } from 'vitest';
import { entitiesToPills } from '../FilterPills';
import { EMPTY_ENTITIES } from '../../../types/govData';

describe('entitiesToPills', () => {
  it('builds pills from populated entities', () => {
    const pills = entitiesToPills({
      ...EMPTY_ENTITIES,
      location: 'Leeds',
      bedrooms: 2,
      tenure: 'rent',
      price_max: 1200,
    });

    expect(pills.map((p) => p.label)).toEqual([
      'Leeds',
      '2 bed',
      'To rent',
      'Up to £1,200',
    ]);
  });

  it('returns empty list when entities are empty', () => {
    expect(entitiesToPills(EMPTY_ENTITIES)).toEqual([]);
    expect(entitiesToPills(null)).toEqual([]);
  });
});
