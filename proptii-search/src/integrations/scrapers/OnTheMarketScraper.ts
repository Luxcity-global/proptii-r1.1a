import * as cheerio from 'cheerio';
import { IScraper, PropertyData } from '../Scraper';
import { postcodeLocationService, ResolvedLocation } from '../../core/services/PostcodeLocationService';

export class OnTheMarketScraper implements IScraper {
  name = 'OnTheMarket';

  async scrape(query: string, filters: any = {}): Promise<PropertyData[]> {
    // ── Priority: structured filter fields (from AI classify) → parseQuery fallback ──
    // The controller merges classifiedEntities into filters before calling scrape(),
    // so filters.bedrooms, filters.minPrice etc. are already AI-resolved when available.
    const parsed = this.parseQuery(query);

    let resolvedLoc: ResolvedLocation | undefined = filters.resolvedLocation;
    if (!resolvedLoc && !filters.locationSlug && !filters.location) {
      try {
        resolvedLoc = await postcodeLocationService.resolve(query, filters);
      } catch (e: any) {
        console.warn('[OnTheMarket] Location resolution failed:', e?.message || e);
      }
    }

    // Location: resolvedLocation (geocoded) > structured filter > parseQuery fallback
    const location =
      resolvedLoc?.otmLocationSlug ||
      filters.locationSlug ||
      filters.location ||
      parsed.location;

    // Tenure: structured filter > parseQuery fallback
    const isRental =
      filters.isRental !== undefined
        ? Boolean(filters.isRental)
        : filters.channel
          ? filters.channel !== 'sale'
          : filters.tenure
            ? filters.tenure !== 'buy'
            : parsed.isRental;

    // Bedrooms: structured filter (single value sets both min/max) > parseQuery fallback
    const structuredBeds = filters.bedrooms !== undefined ? String(filters.bedrooms) : undefined;
    const minBeds =
      filters.minBeds !== undefined
        ? String(filters.minBeds)
        : structuredBeds !== undefined
          ? structuredBeds
          : parsed.minBeds;
    const maxBeds =
      filters.maxBeds !== undefined
        ? String(filters.maxBeds)
        : structuredBeds !== undefined
          ? structuredBeds
          : undefined;

    // Price: structured filter > parseQuery fallback
    const minPrice =
      filters.minPrice !== undefined
        ? String(filters.minPrice)
        : filters.price_min !== undefined
          ? String(filters.price_min)
          : undefined;
    const maxPrice =
      filters.maxPrice !== undefined
        ? String(filters.maxPrice)
        : filters.price_max !== undefined
          ? String(filters.price_max)
          : filters.budget
            ? String(filters.budget)
            : parsed.maxPrice;

    // Property type: structured filter > parseQuery fallback
    const propertyType =
      filters.propertyType ||
      filters.property_type ||
      filters.types?.[0] ||
      parsed.propertyType;

    const url = this.buildUrl(location, minPrice, maxPrice, minBeds, maxBeds, isRental, propertyType);

    try {
      console.log(`[OnTheMarket] Fetching ${url}`);

      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-GB,en;q=0.5',
        },
        signal: AbortSignal.timeout(45000) as any,
      });

      if (!res.ok) {
        console.error(`[OnTheMarket] HTTP ${res.status}`);
        return [];
      }

      const html = await res.text();
      return this.parseFromHtml(html);

    } catch (err: any) {
      console.error(`[OnTheMarket] Error: ${err.message || err}`);
      return [];
    }
  }

  private parseFromHtml(html: string): PropertyData[] {
    const $ = cheerio.load(html);
    let jsonData: any = null;

    // OTM uses Next.js, so look for __NEXT_DATA__ script
    const nextData = $('#__NEXT_DATA__').text();
    if (nextData) {
      try {
        const parsed = JSON.parse(nextData);
        // Paths: browser session used props.results.list, curl used props.initialReduxState.results.list
        jsonData = parsed.props?.initialReduxState?.results?.list || 
                   parsed.props?.results?.list || 
                   parsed.props?.pageProps?.properties || 
                   [];
      } catch (e) {
        console.error('[OnTheMarket] Failed to parse __NEXT_DATA__');
      }
    }

    if (!jsonData || !Array.isArray(jsonData)) {
      console.log('[OnTheMarket] No properties found in JSON');
      return [];
    }

    const results: PropertyData[] = [];
    for (const p of jsonData) {
      if (!p.id) continue;

      const priceStr = p.price || (p.price_label ? `${p.price_label}` : 'Price on application');
      const fullUrl = `https://www.onthemarket.com${p['details-url'] || p.otm_url || `/details/${p.id}/`}`;
      
      // Extract agent details from the JSON
      const agentName = p.agent?.name || p['agent-name'] || 'Proptii Agent';
      const agentPhone = p.agent?.telephone || p['agent-telephone'] || '';
      const agentWebsite = (p.agent?.['details-url'] || p.agent?.otm_url || p['agent-otm-url']) 
        ? `https://www.onthemarket.com${p.agent?.['details-url'] || p.agent?.otm_url || p['agent-otm-url']}` 
        : fullUrl;

      const titleLower = (p['property-title'] || p.display_address || p.title || '').toLowerCase();
      const rawBedrooms = (p.bedrooms !== undefined && p.bedrooms !== null && !isNaN(Number(p.bedrooms))) ? Number(p.bedrooms) : null;
      const isStudio = titleLower.includes('studio') || (p['humanised-property-type'] || '').toLowerCase().includes('studio');
      const bedrooms = isStudio ? 0 : rawBedrooms;
      const propertyType = isStudio ? 'Studio' : (p['humanised-property-type'] || p.property_type || 'Property');

      results.push({
        title:        p['property-title'] || p.display_address || p.title || 'Property',
        price:        priceStr,
        location:     p.address || p.display_address || 'UK',
        bedrooms,
        propertyType,
        imageUrls:    p.images?.map((img: any) => img.default || img.url).filter(Boolean).slice(0, 5) || [],
        agent: { 
          name: agentName, 
          phone: agentPhone,
          website: agentWebsite
        },
        source:       'OnTheMarket',
        url:          fullUrl,
        coordinates:  (p.location?.lat && p.location?.lon) ? { lat: Number(p.location.lat), lng: Number(p.location.lon) } :
                      (p.latitude && p.longitude) ? { lat: Number(p.latitude), lng: Number(p.longitude) } : undefined,
        amenities:    (Array.isArray(p.features) ? p.features : (Array.isArray(p.key_features) ? p.key_features : []))
                        .map((f: any) => (typeof f === 'string' ? f : (f?.description || f?.title || '')).trim())
                        .filter(Boolean),
        addedOrReduced: p.humanised_publish_date || (p.publish_date ? `Added ${new Date(p.publish_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : undefined),
        publishedOn:  p.publish_date || p.created || undefined,
        description:  p.description || p.summary || undefined,
      });
    }

    console.log(`[OnTheMarket] Parsed ${results.length} properties with agent details`);
    return results;
  }

  private buildUrl(
    location: string,
    minPrice?: string,
    maxPrice?: string,
    minBeds?: string,
    maxBeds?: string,
    isRental: boolean = true,
    propertyType?: string
  ): string {
    const base = isRental 
      ? 'https://www.onthemarket.com/to-rent/property/' 
      : 'https://www.onthemarket.com/for-sale/property/';
      
    const loc = encodeURIComponent(location.toLowerCase().trim().replace(/\s+/g, '-'));
    
    const params = new URLSearchParams({
      view: 'map-list'
    });

    if (minPrice) params.set('price-min', minPrice);
    if (maxPrice) params.set('price-max', maxPrice);

    const isStudioRequested = (propertyType && propertyType.toLowerCase().includes('studio')) || minBeds === '0' || maxBeds === '0';
    if (isStudioRequested) {
      params.set('min-bedrooms', '0');
      params.set('max-bedrooms', '0');
      params.set('prop-types', 'flat-apartment');
    } else {
      if (minBeds !== undefined && minBeds !== '') params.set('min-bedrooms', minBeds);
      if (maxBeds !== undefined && maxBeds !== '') params.set('max-bedrooms', maxBeds);
      if (propertyType) {
        const lower = propertyType.toLowerCase();
        if (lower.includes('flat') || lower.includes('apartment')) {
          params.set('prop-types', 'flat-apartment');
        } else if (lower.includes('house')) {
          params.set('prop-types', 'houses');
        } else if (lower.includes('bungalow')) {
          params.set('prop-types', 'bungalows');
        }
      }
    }

    return `${base}${loc}/?${params.toString()}`;
  }

  private parseQuery(query: string) {
    const q = query.toLowerCase().trim();
    const isRental = q.includes('rent') || q.includes('pcm') || !q.includes('sale');
    
    // Improved location regex matching multi-word areas
    const locMatch = q.match(/(?:in|around|near)\s+([a-z\s]+?)(?:\s+under|\s+for|\s+max|\s+from|\s*$)/i);
    const location = locMatch ? locMatch[1].trim() : 'london';

    let minBeds: string | undefined;
    let maxBeds: string | undefined;
    let propertyType: string | undefined;

    if (/\bstudios?\b/i.test(q)) {
      minBeds = '0';
      maxBeds = '0';
      propertyType = 'studio';
    } else {
      const bedsMatch = q.match(/(\d+)\s*bed/i);
      minBeds = bedsMatch ? bedsMatch[1] : undefined;
    }

    const priceMatch = q.match(/under\s*£?\s*([\d,]+)\s*k?/i) || q.match(/£([\d,]+)\s*pcm/i);
    let maxPrice: string | undefined;
    if (priceMatch) {
      const raw = priceMatch[1].replace(/,/g, '');
      maxPrice = q.includes('k') && Number(raw) < 100 ? String(parseInt(raw) * 1000) : raw;
    }

    return { location, maxPrice, minBeds, maxBeds, isRental, propertyType };
  }
}
