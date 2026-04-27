import * as cheerio from 'cheerio';
import { IScraper, PropertyData } from '../Scraper';

// Rightmove location identifiers for common cities
const LOCATION_IDS: Record<string, string> = {
  london:     'REGION%5E87490',
  manchester: 'REGION%5E904',
  birmingham: 'REGION%5E162',
  leeds:      'REGION%5E787',
  bristol:    'REGION%5E219',
  edinburgh:  'REGION%5E475',
  glasgow:    'REGION%5E550',
  liverpool:  'REGION%5E796',
  sheffield:  'REGION%5E1259',
  nottingham: 'REGION%5E981',
};

export class RightmoveScraper implements IScraper {
  name = 'Rightmove';

  async scrape(query: string, _filters: any): Promise<PropertyData[]> {
    const { isRental, locationId, locationName, minBeds, maxBeds, maxPrice } = this.parseQuery(query);
    const url = this.buildUrl(isRental, locationId, minBeds, maxBeds, maxPrice);

    try {

      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-GB,en;q=0.5',
        },
        signal: AbortSignal.timeout(45000) as any,
      });

      if (!res.ok) {
        console.error(`[Rightmove] HTTP ${res.status}`);
        return [];
      }

      const html = await res.text();
      return this.parseFromHtml(html, locationName, isRental);

    } catch (err: any) {
      console.error(`[Rightmove] Error: ${err.message || err}`);
      return [];
    }
  }

  private parseFromHtml(html: string, locationName: string, isRental: boolean): PropertyData[] {
    const $ = cheerio.load(html);
    const nextData = $('#__NEXT_DATA__').html();
    if (!nextData) {
      return [];
    }

    let jsonData: any;
    try {
      jsonData = JSON.parse(nextData);
    } catch (e) {
      console.error('[Rightmove] Failed to parse __NEXT_DATA__');
      return [];
    }

    const properties = jsonData.props?.pageProps?.searchResults?.properties;
    if (!properties || !Array.isArray(properties)) {
      return [];
    }

    const results: PropertyData[] = [];
    for (const p of properties) {
      if (!p.id) continue;

      const priceStr = isRental
        ? `£${(p.price?.amount || 0).toLocaleString('en-GB')} pcm`
        : `£${(p.price?.amount || 0).toLocaleString('en-GB')}`;

      const fullUrl = `https://www.rightmove.co.uk${p.propertyUrl}`;
      
      // Extract agent details
      const agentName = p.customer?.branchDisplayName || p.customer?.branchName || 'Unknown Agent';
      const agentPhone = p.customer?.contactTelephone || p.customer?.telephone || '';
      const agentWebsite = p.customer?.branchLandingPageUrl 
        ? `https://www.rightmove.co.uk${p.customer.branchLandingPageUrl}` 
        : fullUrl;

      results.push({
        title:        p.summary || `${p.bedrooms || '?'} bed ${p.propertySubType || 'property'} in ${p.displayAddress}`,
        price:        priceStr,
        location:     p.displayAddress,
        bedrooms:     (p.bedrooms !== undefined && p.bedrooms !== null && !isNaN(Number(p.bedrooms))) ? Number(p.bedrooms) : null,
        propertyType: p.propertySubType || 'Property',
        imageUrls:    p.propertyImages?.images?.map((img: any) => img.srcUrl).filter(Boolean).slice(0, 5) || 
                      (p.propertyImages?.mainImage?.src ? [p.propertyImages.mainImage.src] : []),
        agent: { 
          name: agentName, 
          phone: agentPhone,
          website: agentWebsite
        },
        source:       'Rightmove',
        url:          fullUrl,
      });
    }

    return results;
  }

  private buildUrl(isRental: boolean, locationId: string, minBeds?: string, maxBeds?: string, maxPrice?: string): string {
    const base = isRental
      ? 'https://www.rightmove.co.uk/property-to-rent/find.html'
      : 'https://www.rightmove.co.uk/property-for-sale/find.html';

    const params = new URLSearchParams({
      searchType: isRental ? 'RENT' : 'BUY',
      locationIdentifier: decodeURIComponent(locationId),
      index: '0',
    });

    if (minBeds) params.set('minBedrooms', minBeds);
    if (maxBeds) params.set('maxBedrooms', maxBeds);
    if (maxPrice) params.set('maxPrice', maxPrice);

    return `${base}?${params.toString()}`;
  }

  private parseQuery(query: string) {
    const q = query.toLowerCase();
    const isRental = q.includes('rent') || q.includes('pcm');

    const locMatch = q.match(/in\s+([a-z\s]+?)(?:\s+under|\s+for|\s+max|\s*$)/i);
    const rawLoc = locMatch ? locMatch[1].trim().split(/\s+/)[0] : 'london';
    const locationId = LOCATION_IDS[rawLoc] || LOCATION_IDS['london'];

    const bedsMatch = q.match(/(\d+)\s*bed/i);
    const beds = bedsMatch ? bedsMatch[1] : undefined;

    const priceMatch = q.match(/under\s*£?\s*([\d,]+)\s*k?/i) || q.match(/£([\d,]+)\s*pcm/i);
    let maxPrice: string | undefined;
    if (priceMatch) {
      const raw = priceMatch[1].replace(/,/g, '');
      maxPrice = q.includes('k') ? String(parseInt(raw) * 1000) : raw;
    }

    return { isRental, locationId, locationName: rawLoc, minBeds: beds, maxBeds: beds, maxPrice };
  }
}
