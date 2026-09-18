import { ZooplaScraper } from '../integrations/scrapers/ZooplaScraper';

describe('ZooplaScraper', () => {
  let scraper: ZooplaScraper;

  beforeEach(() => {
    scraper = new ZooplaScraper();
  });

  describe('buildUrl', () => {
    it('constructs rental URL with outcode slug', () => {
      const url = scraper.buildUrl('e14', undefined, undefined, undefined, undefined, true);
      expect(url).toBe('https://www.zoopla.co.uk/to-rent/property/e14/?page_size=25');
    });

    it('constructs for-sale URL when isRental is false', () => {
      const url = scraper.buildUrl('sw10', undefined, undefined, undefined, undefined, false);
      expect(url).toBe('https://www.zoopla.co.uk/for-sale/property/sw10/?page_size=25');
    });

    it('adds price and bedroom filters into query parameters', () => {
      const url = scraper.buildUrl('e14', '1500', '3500', '2', '3', true, 'flat');
      expect(url).toContain('price_min=1500');
      expect(url).toContain('price_max=3500');
      expect(url).toContain('beds_min=2');
      expect(url).toContain('beds_max=3');
      expect(url).toContain('property_sub_type=flats');
    });
  });

  describe('parseFromHtml', () => {
    it('parses listings from Next.js __NEXT_DATA__ JSON script', () => {
      const mockNextData = {
        props: {
          pageProps: {
            data: {
              listings: {
                regular: [
                  {
                    listingId: '68219482',
                    title: '2 bed flat to rent in Canary Wharf',
                    pricing: {
                      label: '£2,800 pcm',
                      amount: 2800,
                    },
                    address: 'Pan Peninsula Square, London, E14',
                    counts: { numBedrooms: 2 },
                    propertyType: 'Flat',
                    images: [
                      { srcUrl: 'https://lid.zoocdn.com/u/1024/768/img1.jpg' },
                      { srcUrl: 'https://lid.zoocdn.com/u/1024/768/img2.jpg' },
                    ],
                    branch: {
                      name: 'Foxtons Canary Wharf',
                      phone: '020 7654 3210',
                      website: 'https://www.foxtons.co.uk',
                    },
                    location: {
                      coordinates: {
                        latitude: 51.5012,
                        longitude: -0.0189,
                      },
                    },
                    listingUris: {
                      detail: '/to-rent/details/68219482/',
                    },
                  },
                ],
              },
            },
          },
        },
      };

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <script id="__NEXT_DATA__" type="application/json">${JSON.stringify(mockNextData)}</script>
          </head>
          <body><div>Content</div></body>
        </html>
      `;

      const results = scraper.parseFromHtml(html, true);
      expect(results.length).toBe(1);

      const prop = results[0];
      expect(prop.title).toBe('2 bed flat to rent in Canary Wharf');
      expect(prop.price).toBe('£2,800 pcm');
      expect(prop.location).toBe('Pan Peninsula Square, London, E14');
      expect(prop.bedrooms).toBe(2);
      expect(prop.propertyType).toBe('Flat');
      expect(prop.source).toBe('Zoopla');
      expect(prop.url).toBe('https://www.zoopla.co.uk/to-rent/details/68219482/');
      expect(prop.imageUrls).toEqual(['https://lid.zoocdn.com/u/1024/768/img1.jpg', 'https://lid.zoocdn.com/u/1024/768/img2.jpg']);
      expect(prop.agent.name).toBe('Foxtons Canary Wharf');
      expect(prop.agent.phone).toBe('020 7654 3210');
      expect(prop.coordinates).toEqual({ lat: 51.5012, lng: -0.0189 });
    });

    it('sanitizes bogus or "no_data" titles from Next.js data', () => {
      const mockNextData = {
        props: {
          pageProps: {
            data: {
              listings: {
                regular: [
                  {
                    listingId: '99999',
                    title: 'no_data...',
                    pricing: { amount: 3200 },
                    address: 'Wapping High Street, London, E1W',
                    counts: { numBedrooms: 3 },
                    propertyType: 'Apartment',
                    listingUris: { detail: '/to-rent/details/99999/' },
                  },
                ],
              },
            },
          },
        },
      };

      const html = `
        <script id="__NEXT_DATA__" type="application/json">${JSON.stringify(mockNextData)}</script>
      `;

      const results = scraper.parseFromHtml(html, true);
      expect(results[0].title).toBe('3 bed Apartment in Wapping High Street, London, E1W');
    });

    it('parses properties from fallback DOM structure if __NEXT_DATA__ is missing', () => {
      const html = `
        <div data-testid="search-result">
          <h2>1 bed flat to rent</h2>
          <div data-testid="listing-price">£1,900 pcm</div>
          <address>King Street, London, W6</address>
          <a data-testid="listing-details-link" href="/to-rent/details/12345/">View Details</a>
          <img src="https://lid.zoocdn.com/img.jpg" />
        </div>
      `;

      const results = scraper.parseFromHtml(html, true);
      expect(results.length).toBe(1);
      expect(results[0].title).toBe('1 bed flat to rent');
      expect(results[0].bedrooms).toBe(1);
      expect(results[0].price).toBe('£1,900 pcm');
      expect(results[0].location).toBe('King Street, London, W6');
      expect(results[0].url).toBe('https://www.zoopla.co.uk/to-rent/details/12345/');
    });
  });

  describe('scrape error resilience', () => {
    it('gracefully returns empty array on Cloudflare 403 challenge', async () => {
      const globalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 403,
        text: jest.fn().mockResolvedValue('Just a moment... Enable JavaScript and cookies to continue'),
      } as any);

      try {
        const results = await scraper.scrape('flats in E14');
        expect(results).toEqual([]);
      } finally {
        global.fetch = globalFetch;
      }
    });

    it('gracefully returns empty array when network throws an error', async () => {
      const globalFetch = global.fetch;
      global.fetch = jest.fn().mockRejectedValue(new Error('Connection reset by peer'));

      try {
        const results = await scraper.scrape('flats in SW10');
        expect(results).toEqual([]);
      } finally {
        global.fetch = globalFetch;
      }
    });
  });
});
