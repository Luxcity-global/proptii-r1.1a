import * as cheerio from 'cheerio';
import { IScraper, PropertyData } from '../Scraper';
import { postcodeLocationService, ResolvedLocation } from '../../core/services/PostcodeLocationService';

// Rightmove location identifiers for UK cities, London boroughs, and key districts
const LOCATION_IDS: Record<string, string> = {
  // Major UK Cities
  london: 'REGION%5E87490',
  manchester: 'REGION%5E904',
  birmingham: 'REGION%5E162',
  leeds: 'REGION%5E787',
  bristol: 'REGION%5E219',
  edinburgh: 'REGION%5E475',
  glasgow: 'REGION%5E550',
  liverpool: 'REGION%5E796',
  sheffield: 'REGION%5E1259',
  nottingham: 'REGION%5E981',
  newcastle: 'REGION%5E953',
  brighton: 'REGION%5E245',
  cambridge: 'REGION%5E274',
  oxford: 'REGION%5E1035',
  bath: 'REGION%5E115',
  cardiff: 'REGION%5E285',
  belfast: 'REGION%5E131',
  southampton: 'REGION%5E1287',
  reading: 'REGION%5E1139',
  york: 'REGION%5E1489',
  norwich: 'REGION%5E978',
  plymouth: 'REGION%5E1077',
  exeter: 'REGION%5E494',
  bournemouth: 'REGION%5E189',
  aberdeen: 'REGION%5E8',
  swansea: 'REGION%5E1318',
  leicester: 'REGION%5E791',
  coventry: 'REGION%5E364',
  'milton keynes': 'REGION%5E919',
  miltonkeynes: 'REGION%5E919',

  // Greater London Boroughs & Key Areas
  'canary wharf': 'REGION%5E70384',
  canary: 'REGION%5E70384',
  docklands: 'REGION%5E70384',
  islington: 'REGION%5E87508',
  camden: 'REGION%5E87500',
  hackney: 'REGION%5E87506',
  kensington: 'REGION%5E87510',
  chelsea: 'REGION%5E87510',
  westminster: 'REGION%5E87532',
  greenwich: 'REGION%5E87504',
  shoreditch: 'REGION%5E85398',
  stratford: 'REGION%5E85408',
  brixton: 'REGION%5E85246',
  clapham: 'REGION%5E85262',
  wandsworth: 'REGION%5E87530',
  richmond: 'REGION%5E87522',
  wimbledon: 'REGION%5E85458',
  hammersmith: 'REGION%5E87507',
  fulham: 'REGION%5E87507',
  southwark: 'REGION%5E87526',
  lambeth: 'REGION%5E87514',
  lewisham: 'REGION%5E87515',
  croydon: 'REGION%5E87501',
  ealing: 'REGION%5E87502',
  enfield: 'REGION%5E87503',
  barnet: 'REGION%5E87494',
  haringey: 'REGION%5E87509',
  harrow: 'REGION%5E87511',
  havering: 'REGION%5E87512',
  brent: 'REGION%5E87498',
  bromley: 'REGION%5E87499',
  bexley: 'REGION%5E87496',
  kingston: 'REGION%5E87513',
  hillingdon: 'REGION%5E87516',
  hounslow: 'REGION%5E87517',
  merton: 'REGION%5E87520',
  newham: 'REGION%5E87521',
  redbridge: 'REGION%5E87523',
  sutton: 'REGION%5E87528',
  'tower hamlets': 'REGION%5E87529',
  towerhamlets: 'REGION%5E87529',
  'waltham forest': 'REGION%5E87531',
  walthamforest: 'REGION%5E87531',
  angel: 'REGION%5E87508',
  paddington: 'REGION%5E85362',
  marylebone: 'REGION%5E85348',
  mayfair: 'REGION%5E85350',
  soho: 'REGION%5E85400',
  vauxhall: 'REGION%5E85438',
  bermondsey: 'REGION%5E85236',
  battersea: 'REGION%5E85230',
  putney: 'REGION%5E85376',
  'notting hill': 'REGION%5E85358',
  nottinghill: 'REGION%5E85358',
  hampstead: 'REGION%5E85304',
  highgate: 'REGION%5E85310',
};

export class RightmoveScraper implements IScraper {
  name = 'Rightmove';

  async scrape(query: string, filters: any = {}): Promise<PropertyData[]> {
    // ── Priority: structured filter fields (from AI classify) → parseQuery fallback ──
    const parsed = this.parseQuery(query);

    let resolvedLoc: ResolvedLocation | undefined = filters.resolvedLocation;
    if (!resolvedLoc && !filters.locationId) {
      try {
        resolvedLoc = await postcodeLocationService.resolve(query, filters);
      } catch (e: any) {
        console.warn('[Rightmove] Location resolution failed:', e?.message || e);
      }
    }

    // Tenure: structured filter > parseQuery fallback
    const isRental =
      filters.isRental !== undefined
        ? Boolean(filters.isRental)
        : filters.channel
          ? filters.channel !== 'sale'
          : filters.tenure
            ? filters.tenure !== 'buy'
            : parsed.isRental;

    // Location: resolvedLocation > structured filter > parseQuery fallback
    const locationId = resolvedLoc?.rightmoveLocationId || filters.locationId || parsed.locationId;
    const locationName = resolvedLoc?.displayName || parsed.locationName;

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
          : parsed.maxBeds;

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

    const url = this.buildUrl(isRental, locationId, minBeds, maxBeds, minPrice, maxPrice, propertyType);


    try {
      console.log(`[Rightmove] Fetching ${url}`);

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
      console.log('[Rightmove] No __NEXT_DATA__ found');
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
      console.log('[Rightmove] No property data found in __NEXT_DATA__');
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
      const agentName = p.customer?.branchDisplayName || p.customer?.branchName || 'Proptii Agent';
      const agentPhone = p.customer?.contactTelephone || p.customer?.telephone || '';
      const agentWebsite = p.customer?.branchLandingPageUrl 
        ? `https://www.rightmove.co.uk${p.customer.branchLandingPageUrl}` 
        : fullUrl;

      // Sanitize title to avoid 'no_data...'
      const rawSummary = (p.summary || '').trim();
      const isBogusSummary = !rawSummary || rawSummary.toLowerCase().startsWith('no_data') || rawSummary.length < 5;
      const fallbackTitle = `${p.bedrooms !== undefined && p.bedrooms !== null ? `${p.bedrooms} bed ` : ''}${p.propertySubType || 'Property'} in ${p.displayAddress}`;
      const title = isBogusSummary ? fallbackTitle : rawSummary;
      const rawSummaryLower = (p.summary || '').toLowerCase();
      const rawSubType = (p.propertySubType || '').toLowerCase();
      const isStudio = rawSummaryLower.includes('studio') || rawSubType.includes('studio');
      const bedrooms = isStudio ? 0 : ((p.bedrooms !== undefined && p.bedrooms !== null && !isNaN(Number(p.bedrooms))) ? Number(p.bedrooms) : null);
      const propertyType = isStudio ? 'Studio' : (p.propertySubType || 'Property');

      results.push({
        title:        p.propertyTitle || p.displayAddress || 'Property',
        price:        priceStr,
        location:     p.displayAddress || 'UK',
        bedrooms,
        propertyType,
        imageUrls:    p.propertyImages?.images?.map((img: any) => img.srcUrl).filter(Boolean).slice(0, 5) || 
                      (p.propertyImages?.mainImage?.src ? [p.propertyImages.mainImage.src] : []),
        agent: { 
          name: agentName, 
          phone: agentPhone,
          website: agentWebsite
        },
        source:       'Rightmove',
        url:          fullUrl,
        coordinates:  p.location && p.location.latitude && p.location.longitude 
                        ? { lat: Number(p.location.latitude), lng: Number(p.location.longitude) } 
                        : undefined,
        amenities:    Array.isArray(p.keyFeatures) 
                        ? p.keyFeatures
                            .map((f: any) => (typeof f === 'string' ? f : (f?.description || f?.htmlDescription || '')).trim())
                            .filter(Boolean) 
                        : [],
        addedOrReduced: p.addedOrReduced || (p.firstVisibleDate ? `Added ${new Date(p.firstVisibleDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : undefined),
        publishedOn:  p.firstVisibleDate || undefined,
        description:  p.summary || undefined,
      });
    }

    console.log(`[Rightmove] Parsed ${results.length} properties with agent details`);
    return results;
  }

  private buildUrl(
    isRental: boolean,
    locationId: string,
    minBeds?: string,
    maxBeds?: string,
    minPrice?: string,
    maxPrice?: string,
    propertyType?: string
  ): string {
    const base = isRental
      ? 'https://www.rightmove.co.uk/property-to-rent/find.html'
      : 'https://www.rightmove.co.uk/property-for-sale/find.html';

    const params = new URLSearchParams({
      searchType: isRental ? 'RENT' : 'BUY',
      locationIdentifier: decodeURIComponent(locationId),
      index: '0',
    });

    const isStudioRequested = (propertyType && propertyType.toLowerCase().includes('studio')) || minBeds === '0' || maxBeds === '0';
    if (isStudioRequested) {
      params.set('minBedrooms', '0');
      params.set('maxBedrooms', '0');
      params.set('propertyTypes', 'flat');
    } else {
      if (minBeds) params.set('minBedrooms', minBeds);
      if (maxBeds) params.set('maxBedrooms', maxBeds);
      if (minPrice) params.set('minPrice', minPrice);
      if (maxPrice) params.set('maxPrice', maxPrice);
      if (propertyType) {
        const lower = propertyType.toLowerCase();
        if (lower.includes('flat') || lower.includes('apartment')) {
          params.set('propertyTypes', 'flat');
        } else if (lower.includes('house') || lower.includes('terraced') || lower.includes('detached')) {
          params.set('propertyTypes', 'detached,semi-detached,terraced');
        } else if (lower.includes('bungalow')) {
          params.set('propertyTypes', 'bungalow');
        }
      }
    }

    return `${base}?${params.toString()}`;
  }

  private parseQuery(query: string) {
    const q = query.toLowerCase().trim();
    const isRental = q.includes('rent') || q.includes('pcm') || !q.includes('sale');

    // Match multi-word locations after "in" or "around" or "near"
    const locMatch = q.match(/(?:in|around|near)\s+([a-z\s]+?)(?:\s+under|\s+for|\s+max|\s+from|\s*$)/i);
    let rawLoc = 'london';
    let locationId = LOCATION_IDS['london'];

    if (locMatch) {
      const candidate = locMatch[1].trim();
      const candidateNoSpaces = candidate.replace(/\s+/g, '');
      const firstWord = candidate.split(/\s+/)[0];

      if (LOCATION_IDS[candidate]) {
        rawLoc = candidate;
        locationId = LOCATION_IDS[candidate];
      } else if (LOCATION_IDS[candidateNoSpaces]) {
        rawLoc = candidate;
        locationId = LOCATION_IDS[candidateNoSpaces];
      } else if (LOCATION_IDS[firstWord]) {
        rawLoc = firstWord;
        locationId = LOCATION_IDS[firstWord];
      } else {
        // Find partial match in keys
        const matchKey = Object.keys(LOCATION_IDS).find(key => candidate.includes(key));
        if (matchKey) {
          rawLoc = matchKey;
          locationId = LOCATION_IDS[matchKey];
        } else {
          rawLoc = candidate;
        }
      }
    }

    let beds: string | undefined;
    let propertyType: string | undefined;

    if (/\bstudios?\b/i.test(q)) {
      beds = '0';
      propertyType = 'studio';
    } else {
      const bedsMatch = q.match(/(\d+)\s*bed/i);
      beds = bedsMatch ? bedsMatch[1] : undefined;
    }

    const priceMatch = q.match(/under\s*£?\s*([\d,]+)\s*k?/i) || q.match(/£([\d,]+)\s*pcm/i);
    let maxPrice: string | undefined;
    if (priceMatch) {
      const raw = priceMatch[1].replace(/,/g, '');
      maxPrice = q.includes('k') && Number(raw) < 100 ? String(parseInt(raw) * 1000) : raw;
    }

    return { isRental, locationId, locationName: rawLoc, minBeds: beds, maxBeds: beds, maxPrice, propertyType };
  }
}
