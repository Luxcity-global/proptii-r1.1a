import axios from 'axios';
import * as cheerio from 'cheerio';

export interface RightmoveRawProperty {
  title: string;
  address: string;
  price: string;
  bedrooms: string;
  propertyType: string;
  listingUrl: string;
  imageUrl: string;
  agentName: string;
  agentLogoUrl?: string;
}

export interface RightmoveQuery {
  location: string;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  propertyType?: string;
  listingType: 'for-sale' | 'to-rent';
}

function buildRightmoveUrl(query: RightmoveQuery, pageIndex: number = 0): string {
  // TODO: Map location to locationIdentifier (may require lookup)
  // For now, use a placeholder region code for London
  const locationIdentifier = 'REGION%5E87490';
  const base = query.listingType === 'to-rent'
    ? 'https://www.rightmove.co.uk/property-to-rent/find.html'
    : 'https://www.rightmove.co.uk/property-for-sale/find.html';
  const params = [
    `locationIdentifier=${locationIdentifier}`,
    query.minBedrooms ? `minBedrooms=${query.minBedrooms}` : '',
    query.maxBedrooms ? `maxBedrooms=${query.maxBedrooms}` : '',
    query.minPrice ? `minPrice=${query.minPrice}` : '',
    query.maxPrice ? `maxPrice=${query.maxPrice}` : '',
    query.propertyType ? `propertyTypes=${encodeURIComponent(query.propertyType)}` : '',
    `index=${pageIndex}`
  ].filter(Boolean).join('&');
  return `${base}?${params}`;
}

export async function fetchRightmovePage(url: string): Promise<string> {
  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; ProptiiBot/1.0; +https://proptii.com/bot)',
    },
  });
  return response.data;
}

export function parseRightmoveListings(html: string): RightmoveRawProperty[] {
  const $ = cheerio.load(html);
  const properties: RightmoveRawProperty[] = [];
  // Rightmove property cards: .l-searchResult is the main container
  $('.l-searchResult').each((_, el) => {
    const $el = $(el);
    // Title/address
    const title = $el.find('.propertyCard-title').text().trim();
    const address = $el.find('.propertyCard-address').text().trim();
    // Price
    const price = $el.find('.propertyCard-priceValue').text().trim();
    // Bedrooms (try to extract from title or summary)
    let bedrooms = '';
    const summary = $el.find('.propertyCard-description').text().trim();
    const bedMatch = summary.match(/(\d+)\s*bed/i) || title.match(/(\d+)\s*bed/i);
    if (bedMatch) bedrooms = bedMatch[1];
    // Property type (try to extract from summary or title)
    let propertyType = '';
    const typeMatch = summary.match(/\d+\s*bed\s*([^,]+)/i) || title.match(/\d+\s*bed\s*([^,]+)/i);
    if (typeMatch) propertyType = typeMatch[1].trim();
    // Listing URL
    let listingUrl = $el.find('.propertyCard-link').attr('href') || '';
    if (listingUrl && !listingUrl.startsWith('http')) {
      listingUrl = 'https://www.rightmove.co.uk' + listingUrl;
    }
    // Image URL
    let imageUrl = $el.find('.propertyCard-img img').attr('src') || '';
    if (!imageUrl) {
      imageUrl = $el.find('.propertyCard-img img').attr('data-src') || '';
    }
    // Agent name/logo
    const agentName = $el.find('.propertyCard-branchSummary-branchName').text().trim();
    const agentLogoUrl = $el.find('.propertyCard-branchLogo img').attr('src') || '';
    // Push property if at least title and price exist
    if (title && price && listingUrl) {
      properties.push({
        title,
        address,
        price,
        bedrooms,
        propertyType,
        listingUrl,
        imageUrl,
        agentName,
        agentLogoUrl,
      });
    }
  });
  console.log(`[RightmoveScraper] Extracted ${properties.length} properties from page.`);
  return properties;
}

export async function scrapeRightmoveWithQuery(query: RightmoveQuery, pages: number = 3): Promise<RightmoveRawProperty[]> {
  let allProperties: RightmoveRawProperty[] = [];
  for (let i = 0; i < pages; i++) {
    const url = buildRightmoveUrl(query, i * 24); // Rightmove paginates by index=24,48,72...
    const html = await fetchRightmovePage(url);
    const properties = parseRightmoveListings(html);
    allProperties = allProperties.concat(properties);
  }
  return allProperties;
} 