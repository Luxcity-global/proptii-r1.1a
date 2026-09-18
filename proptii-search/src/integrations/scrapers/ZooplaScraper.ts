import * as cheerio from 'cheerio';
import { IScraper, PropertyData } from '../Scraper';
import { postcodeLocationService, ResolvedLocation } from '../../core/services/PostcodeLocationService';

export class ZooplaScraper implements IScraper {
  name = 'Zoopla';

  async scrape(query: string, filters: any = {}): Promise<PropertyData[]> {
    const parsed = this.parseQuery(query);

    let resolvedLoc: ResolvedLocation | undefined = filters.resolvedLocation;
    if (!resolvedLoc && !filters.locationSlug && !filters.location) {
      try {
        resolvedLoc = await postcodeLocationService.resolve(query, filters);
      } catch (e: any) {
        console.warn('[Zoopla] Location resolution failed:', e?.message || e);
      }
    }

    // Determine location slug (prefer outcode or clean district slug)
    const locationSlug = resolvedLoc?.otmLocationSlug ||
                         resolvedLoc?.outcode?.toLowerCase() ||
                         filters.locationSlug ||
                         filters.location ||
                         parsed.location;

    const isRental = filters.isRental !== undefined ? Boolean(filters.isRental) : parsed.isRental;
    const minPrice = filters.minPrice !== undefined ? String(filters.minPrice) : undefined;
    const maxPrice = filters.maxPrice !== undefined ? String(filters.maxPrice) : parsed.maxPrice;
    const minBeds = filters.minBeds !== undefined ? String(filters.minBeds) : parsed.minBeds;
    const maxBeds = filters.maxBeds !== undefined ? String(filters.maxBeds) : undefined;
    const propertyType = filters.propertyType || filters.types?.[0];

    const targetUrl = this.buildUrl(locationSlug, minPrice, maxPrice, minBeds, maxBeds, isRental, propertyType);
    const fetchUrl = this.resolveFetchUrl(targetUrl);

    try {
      console.log(`[Zoopla] Fetching ${targetUrl}`);

      const res = await fetch(fetchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-GB,en;q=0.9',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Upgrade-Insecure-Requests': '1',
        },
        signal: AbortSignal.timeout(30000) as any,
      });

      if (!res.ok) {
        if (res.status === 403) {
          console.warn('[Zoopla] Cloudflare challenge detected (HTTP 403) — skipping Zoopla provider for this request (configure ZOOPLA_PROXY_URL for residential bypass)');
          return [];
        }
        console.error(`[Zoopla] HTTP ${res.status}`);
        return [];
      }

      const html = await res.text();
      if (html.includes('cf-mitigated') || html.includes('challenges.cloudflare.com')) {
        console.warn('[Zoopla] Cloudflare challenge page returned — skipping Zoopla provider');
        return [];
      }

      return this.parseFromHtml(html, isRental);

    } catch (err: any) {
      console.error(`[Zoopla] Error: ${err.message || err}`);
      return [];
    }
  }

  /**
   * If ZOOPLA_PROXY_URL is configured (e.g. ScraperAPI, BrightData, or custom gateway),
   * routes the request through the proxy service.
   */
  private resolveFetchUrl(targetUrl: string): string {
    const proxyUrl = process.env.ZOOPLA_PROXY_URL;
    if (!proxyUrl) return targetUrl;

    if (proxyUrl.includes('%URL%')) {
      return proxyUrl.replace('%URL%', encodeURIComponent(targetUrl));
    }
    if (proxyUrl.includes('url=')) {
      return `${proxyUrl}${encodeURIComponent(targetUrl)}`;
    }
    return targetUrl;
  }

  buildUrl(
    locationSlug: string,
    minPrice?: string,
    maxPrice?: string,
    minBeds?: string,
    maxBeds?: string,
    isRental: boolean = true,
    propertyType?: string
  ): string {
    const base = isRental
      ? 'https://www.zoopla.co.uk/to-rent/property/'
      : 'https://www.zoopla.co.uk/for-sale/property/';

    const cleanSlug = encodeURIComponent(locationSlug.toLowerCase().trim().replace(/\s+/g, '-'));
    const params = new URLSearchParams({
      page_size: '25',
    });

    if (minPrice) params.set('price_min', minPrice);
    if (maxPrice) params.set('price_max', maxPrice);
    if (minBeds) params.set('beds_min', minBeds);
    if (maxBeds) params.set('beds_max', maxBeds);

    if (propertyType) {
      const lower = propertyType.toLowerCase();
      if (lower.includes('flat') || lower.includes('apartment')) {
        params.set('property_sub_type', 'flats');
      } else if (lower.includes('house')) {
        params.set('property_sub_type', 'houses');
      } else if (lower.includes('bungalow')) {
        params.set('property_sub_type', 'bungalows');
      }
    }

    return `${base}${cleanSlug}/?${params.toString()}`;
  }

  parseFromHtml(html: string, isRental: boolean = true): PropertyData[] {
    const $ = cheerio.load(html);
    const nextDataRaw = $('#__NEXT_DATA__').html();

    if (nextDataRaw) {
      try {
        const jsonData = JSON.parse(nextDataRaw);
        const listings = jsonData.props?.pageProps?.data?.listings?.regular ||
                         jsonData.props?.pageProps?.listings ||
                         jsonData.props?.pageProps?.initialProps?.searchResults?.listings ||
                         [];

        if (Array.isArray(listings) && listings.length > 0) {
          return this.parseNextDataListings(listings, isRental);
        }
      } catch (e: any) {
        console.warn('[Zoopla] Failed to parse __NEXT_DATA__ JSON:', e?.message || e);
      }
    }

    // Fallback Cheerio DOM card parsing if __NEXT_DATA__ is missing or altered
    return this.parseFromDom($, isRental);
  }

  private parseNextDataListings(listings: any[], isRental: boolean): PropertyData[] {
    const results: PropertyData[] = [];

    for (const p of listings) {
      const id = p.listingId || p.id;
      if (!id) continue;

      const rawPrice = p.pricing?.label || (p.pricing?.amount ? `£${Number(p.pricing.amount).toLocaleString('en-GB')}${isRental ? ' pcm' : ''}` : 'Price on application');
      const address = p.address || p.displayAddress || 'UK';
      const bedrooms = p.counts?.numBedrooms ?? p.features?.flags?.bedrooms ?? (p.bedrooms !== undefined ? Number(p.bedrooms) : null);
      const propType = p.propertyType || p.propertySubType || 'Property';

      const rawSummary = (p.title || p.summary || '').trim();
      const isBogus = !rawSummary || rawSummary.toLowerCase().startsWith('no_data') || rawSummary.length < 5;
      const fallbackTitle = `${bedrooms ? `${bedrooms} bed ` : ''}${propType} in ${address}`;
      const title = isBogus ? fallbackTitle : rawSummary;

      const detailUri = p.listingUris?.detail || `/to-rent/details/${id}/`;
      const fullUrl = detailUri.startsWith('http') ? detailUri : `https://www.zoopla.co.uk${detailUri}`;

      // Images
      const images: string[] = [];
      if (Array.isArray(p.images)) {
        for (const img of p.images) {
          const src = img.srcUrl || img.original || img.filename;
          if (src) images.push(src);
        }
      } else if (p.image?.src) {
        images.push(p.image.src);
      }

      // Coordinates
      let coordinates: { lat: number; lng: number } | undefined;
      const lat = p.location?.coordinates?.latitude || p.latitude;
      const lng = p.location?.coordinates?.longitude || p.longitude;
      if (lat && lng && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
        coordinates = { lat: Number(lat), lng: Number(lng) };
      }

      // Agent
      const agentName = p.branch?.name || 'Zoopla Agent';
      const agentPhone = p.branch?.phone || '';
      const agentWebsite = p.branch?.website || fullUrl;

      results.push({
        title,
        price: rawPrice,
        location: address,
        bedrooms: bedrooms !== null && !isNaN(Number(bedrooms)) ? Number(bedrooms) : null,
        propertyType: propType,
        imageUrls: images.slice(0, 5),
        agent: {
          name: agentName,
          phone: agentPhone,
          website: agentWebsite,
        },
        source: 'Zoopla',
        url: fullUrl,
        coordinates,
      });
    }

    console.log(`[Zoopla] Parsed ${results.length} properties via Next.js data`);
    return results;
  }

  private parseFromDom($: cheerio.CheerioAPI, isRental: boolean): PropertyData[] {
    const results: PropertyData[] = [];

    $('[data-testid="search-result"]').each((_, el) => {
      const $el = $(el);
      const title = $el.find('h2').text().trim() || 'Property';
      const price = $el.find('[data-testid="listing-price"]').text().trim() || 'Price on application';
      const address = $el.find('address').text().trim() || 'UK';
      const href = $el.find('a[data-testid="listing-details-link"]').attr('href') || '';
      const fullUrl = href ? (href.startsWith('http') ? href : `https://www.zoopla.co.uk${href}`) : 'https://www.zoopla.co.uk';

      const img = $el.find('img').attr('src');
      const imageUrls = img ? [img] : [];

      // Extract bedrooms from text
      const bedsMatch = title.match(/(\d+)\s*bed/i);
      const bedrooms = bedsMatch ? Number(bedsMatch[1]) : null;

      results.push({
        title,
        price,
        location: address,
        bedrooms,
        propertyType: 'Property',
        imageUrls,
        agent: {
          name: 'Zoopla Agent',
          phone: '',
          website: fullUrl,
        },
        source: 'Zoopla',
        url: fullUrl,
      });
    });

    if (results.length > 0) {
      console.log(`[Zoopla] Parsed ${results.length} properties via DOM fallback`);
    }
    return results;
  }

  private parseQuery(query: string) {
    const q = query.toLowerCase().trim();
    const isRental = q.includes('rent') || q.includes('pcm') || !q.includes('sale');

    const locMatch = q.match(/\b(?:in|around|near|at)\s+([a-z0-9\s-]+?)(?:\s+(?:under|for|max|min|from|between|with|pcm|pw|£)\b|\s*$)/i);
    const location = locMatch ? locMatch[1].replace(/^(?:in|around|near|at)\s+/i, '').trim() : 'london';

    const bedsMatch = q.match(/(\d+)\s*bed/i);
    const minBeds = bedsMatch ? bedsMatch[1] : undefined;

    const priceMatch = q.match(/under\s*£?\s*([\d,]+)\s*k?/i) || q.match(/£([\d,]+)\s*pcm/i);
    let maxPrice: string | undefined;
    if (priceMatch) {
      const raw = priceMatch[1].replace(/,/g, '');
      maxPrice = q.includes('k') && Number(raw) < 100 ? String(parseInt(raw) * 1000) : raw;
    }

    return { location, maxPrice, minBeds, isRental };
  }
}
