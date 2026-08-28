import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveMapCoordinates } from '../reportMapCoords';

describe('resolveMapCoordinates', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('uses postcodes.io when the query contains a UK postcode', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo) => {
        const url = String(input);
        if (url.includes('api.postcodes.io')) {
          return {
            ok: true,
            json: async () => ({
              status: 200,
              result: { latitude: 51.464, longitude: -0.170 },
            }),
          };
        }
        throw new Error(`Unexpected fetch: ${url}`);
      }),
    );

    const coords = await resolveMapCoordinates('Falcon Road, London SW11 2LN');
    expect(coords).toEqual({ lat: 51.464, lng: -0.17, source: 'postcodes.io' });
  });
});
