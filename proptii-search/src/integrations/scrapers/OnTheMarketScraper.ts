import * as cheerio from 'cheerio';
import { IScraper, PropertyData } from '../Scraper';

export class OnTheMarketScraper implements IScraper {
  name = 'OnTheMarket';

  async scrape(query: string, _filters: any): Promise<PropertyData[]> {
    const { location, maxPrice, minBeds, isRental } = this.parseQuery(query);
    const url = this.buildUrl(location, maxPrice, minBeds, isRental);

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

      results.push({
        title:        p['property-title'] || p.display_address || p.title || 'Property',
        price:        priceStr,
        location:     p.address || p.display_address || 'UK',
        bedrooms:     (p.bedrooms !== undefined && p.bedrooms !== null && !isNaN(Number(p.bedrooms))) ? Number(p.bedrooms) : null,
        propertyType: p['humanised-property-type'] || p.property_type || 'Property',
        imageUrls:    p.images?.map((img: any) => img.default || img.url).filter(Boolean).slice(0, 5) || [],
        agent: { 
          name: agentName, 
          phone: agentPhone,
          website: agentWebsite
        },
        source:       'OnTheMarket',
        url:          fullUrl,
      });
    }

    console.log(`[OnTheMarket] Parsed ${results.length} properties with agent details`);
    return results;
  }

  private buildUrl(location: string, maxPrice?: string, minBeds?: string, isRental: boolean = true): string {
    const base = isRental 
      ? 'https://www.onthemarket.com/to-rent/property/' 
      : 'https://www.onthemarket.com/for-sale/property/';
      
    const loc = encodeURIComponent(location.toLowerCase().replace(/\s+/g, '-'));
    
    const params = new URLSearchParams({
      view: 'map-list'
    });

    if (maxPrice) params.set('price-max', maxPrice);
    if (minBeds) params.set('min-bedrooms', minBeds);

    return `${base}${loc}/?${params.toString()}`;
  }

  private parseQuery(query: string) {
    const q = query.toLowerCase();
    const isRental = q.includes('rent') || q.includes('pcm') || !q.includes('sale');
    
    // Simple extraction logic
    const locMatch = q.match(/in\s+([a-z\s]+?)(?:\s+under|\s+for|\s+max|\s*$)/i);
    const location = locMatch ? locMatch[1].trim() : 'london';

    const bedsMatch = q.match(/(\d+)\s*bed/i);
    const minBeds = bedsMatch ? bedsMatch[1] : undefined;

    const priceMatch = q.match(/under\s*£?\s*([\d,]+)\s*k?/i) || q.match(/£([\d,]+)\s*pcm/i);
    let maxPrice: string | undefined;
    if (priceMatch) {
      const raw = priceMatch[1].replace(/,/g, '');
      maxPrice = q.includes('k') ? String(parseInt(raw) * 1000) : raw;
    }

    return { location, maxPrice, minBeds, isRental };
  }
}
