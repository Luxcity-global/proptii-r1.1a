import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import { ParsedQuery, parseSearchQuery, buildOpenrentUrl } from '../utils/queryParser';
// import puppeteer from 'puppeteer'; // Uncomment if needed for dynamic content

// Unified property schema
export interface Property {
  id: string;
  title: string;
  address: string;
  price: number;
  priceUnit: string;
  bedrooms: number;
  bathrooms: number;
  propertyType: string;
  description: string;
  images: string[];
  listingUrl: string;
  agent: {
    name: string;
    contact: string;
  };
  availableFrom: string;
}

const OPENRENT_URL = 'https://www.openrent.co.uk/properties-to-rent/london'; // Example: London listings

async function fetchOpenrentPage(url: string): Promise<string> {
  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; ProptiiBot/1.0; +https://proptii.com/bot)',
      // Add more headers if needed
    },
    // TODO: Add proxy or cookies if required
  });
  return response.data;
}

// --- Price parsing utility ---
function parsePrice(text: string): number {
  // Remove currency symbols and non-numeric except comma, dot
  const match = text.replace(/[^\d.,]/g, '').match(/[\d,.]+/);
  if (!match) return 0;
  // Remove commas, parse as float, then floor to int
  const num = Math.floor(parseFloat(match[0].replace(/,/g, '')));
  return isNaN(num) ? 0 : num;
}

export function parseOpenrentListings(html: string): Property[] {
  const $ = cheerio.load(html);
  const properties: Property[] = [];
  const seenUrls = new Set<string>();
  let skipped = 0, partial = 0, duplicates = 0;
  const partialSamples: any[] = [];

  $('.pli.clearfix').each((_, el) => {
    const $el = $(el);
    // Title and address (extract from listing title)
    const titleElement = $el.find('.listing-title');
    const title = titleElement.text().trim();
    // Extract address from title (usually after the first comma)
    let address = '';
    const titleMatch = title.match(/,\s*(.+)$/);
    if (titleMatch) address = titleMatch[1];
    // Price (per month by default, per week if available)
    let price = 0;
    let priceUnit = 'pcm';
    const priceElement = $el.find('.pim.pl-title h2');
    const priceText = priceElement.text();
    if (priceText) price = parsePrice(priceText);
    // Check if per week is shown instead
    const weekPriceElement = $el.find('.piw.pl-title h2');
    if (weekPriceElement.text().trim()) {
      const weekPriceText = weekPriceElement.text();
      if (weekPriceText) {
        price = parsePrice(weekPriceText);
        priceUnit = 'pw';
      }
    }
    // Bedrooms and bathrooms from the details list
    let bedrooms = 0, bathrooms = 0;
    $el.find('.lic li span').each((_, spanEl) => {
      const text = $(spanEl).text().trim();
      const bedMatch = text.match(/(\d+)\s*Bed/);
      const bathMatch = text.match(/(\d+)\s*Bath/);
      if (bedMatch) bedrooms = parseInt(bedMatch[1], 10);
      if (bathMatch) bathrooms = parseInt(bathMatch[1], 10);
    });
    // Property type (extract from title)
    let propertyType = '';
    const typeMatch = title.match(/(\d+\s*Bed\s*[^,]+)/);
    if (typeMatch) propertyType = typeMatch[1];
    // Description
    const description = $el.find('.listing-desc').text().trim();
    // Images (use data-src for lazy-loaded images, fallback to src)
    const images: string[] = [];
    $el.find('.propertyPic.or-lazy-image').each((_, imgEl) => {
      const src = $(imgEl).attr('data-src') || $(imgEl).attr('src');
      if (src && !images.includes(src)) images.push(src);
    });
    // Listing URL
    const href = $el.attr('href');
    if (!href) {
      skipped++;
      partialSamples.push({ reason: 'missing href', title, address });
      return;
    }
    const listingUrl = 'https://www.openrent.co.uk' + href;
    // Agent (default to OpenRent)
    const agent = {
      name: 'OpenRent',
      contact: '',
    };
    // Available from (not available in search results, would need detail page)
    const availableFrom = '';
    // Deduplication
    if (seenUrls.has(listingUrl)) {
      duplicates++;
      partialSamples.push({ reason: 'duplicate', listingUrl });
      return;
    }
    seenUrls.add(listingUrl);
    // Check for partial records (missing key fields)
    let isPartial = false;
    if (!title || !address || !price) {
      isPartial = true;
      partial++;
      partialSamples.push({ reason: 'partial', title, address, price, listingUrl });
    }
    // Studios/shared: allow 0 bedrooms, but log
    if (bedrooms === 0) {
      partialSamples.push({ reason: 'studio/shared', title, address, listingUrl });
    }
    // If all key fields are missing, skip
    if (!title && !address && !price) {
      skipped++;
      partialSamples.push({ reason: 'missing all key fields', listingUrl });
      return;
    }
    // Add property
    properties.push({
      id: listingUrl,
      title: title || '',
      address: address || '',
      price: price || 0,
      priceUnit,
      bedrooms,
      bathrooms,
      propertyType: propertyType || '',
      description: description || '',
      images,
      listingUrl,
      agent,
      availableFrom,
    });
  });
  // QA Logging
  console.log(`\n[QA] Skipped: ${skipped}, Partial: ${partial}, Duplicates: ${duplicates}`);
  if (partialSamples.length > 0) {
    console.log('[QA] Partial/Edge Case Samples:', partialSamples.slice(0, 5));
  }
  return properties;
}

async function main() {
  try {
    console.log('Fetching Openrent listings...');
    const html = await fetchOpenrentPage(OPENRENT_URL);
    const properties = parseOpenrentListings(html);
    console.log('Extracted properties:', properties);
    // TODO: Save to MCP Data Store or output as needed
  } catch (err) {
    console.error('Error scraping Openrent:', err);
    // TODO: If listings are missing, try Puppeteer fallback
    // const browser = await puppeteer.launch();
    // ...
  }
}

// Reference image: Orpington-2-Bed-Flat-Bramley-Court-BR6-To-Rent-Now-for-£1-800-00-p-m-07-06-2025_11_31_AM.png
// This image covers the structure of the listing page for selector mapping.

const LISTING_URL = 'https://www.openrent.co.uk/property-to-rent/orpington/2-bed-flat-bramley-court-br6/1606882';
const HTML_FILE = './src/openrent-listing-sample.html';

export function extractPropertyFromHtml(html: string, url: string): Property {
  const $ = cheerio.load(html);

  // Title (try h1, fallback to <title>)
  const title = $('h1').first().text().trim() || $('title').text().trim();

  // Address (often in a subtitle or summary)
  let address = '';
  address = $(".property-title__address").text().trim() ||
            $(".property-header-address").text().trim() ||
            $(".property-title").text().trim();
  if (!address) {
    // Try to extract from title if not found
    const titleMatch = title.match(/,\s*(.*)$/);
    if (titleMatch) address = titleMatch[1];
  }

  // Price (refined selector)
  let price = 0;
  let priceUnit = 'pcm';
  const priceText = $('p.fs-d-3').first().text().replace(/[^\d.]/g, '');
  if (priceText) price = parseInt(priceText, 10);
  const priceUnitText = $('p.fs-d-3').first().next().text();
  if (/week/i.test(priceUnitText)) priceUnit = 'pw';
  else if (/month|pcm/i.test(priceUnitText)) priceUnit = 'pcm';

  // Bedrooms/Bathrooms (refined selectors)
  let bedrooms = 0, bathrooms = 0;
  const bedDt = $('dt:contains("Bedrooms")');
  if (bedDt.length) {
    const bedDd = bedDt.parent().find('dd').first().text().trim();
    if (bedDd) bedrooms = parseInt(bedDd, 10);
  }
  const bathDt = $('dt:contains("Bathrooms")');
  if (bathDt.length) {
    const bathDd = bathDt.parent().find('dd').first().text().trim();
    if (bathDd) bathrooms = parseInt(bathDd, 10);
  }

  // Property type (try to extract from title or summary)
  let propertyType = '';
  const typeMatch = title.match(/\d+\s*Bed\s*(.*?)\s*,/i);
  if (typeMatch) propertyType = typeMatch[1];

  // Description
  let description = '';
  description = $('.property-description, .description, .listing-description').first().text().trim();
  if (!description) {
    // Try meta description
    description = $('meta[name=description]').attr('content') || '';
  }

  // Images: extract property images with better filtering
  const images: string[] = [];
  $('img').each((_, imgEl) => {
    const src = $(imgEl).attr('src');
    const alt = $(imgEl).attr('alt') || '';
    const classes = $(imgEl).attr('class') || '';
    
    // Filter for property images (exclude icons, logos, etc.)
    if (src && 
        !images.includes(src) && 
        !src.includes('logo') && 
        !src.includes('icon') && 
        !src.includes('avatar') &&
        !src.includes('placeholder') &&
        (src.includes('property') || 
         src.includes('listing') || 
         src.includes('photo') || 
         src.includes('image') ||
         alt.toLowerCase().includes('property') ||
         alt.toLowerCase().includes('room') ||
         alt.toLowerCase().includes('view') ||
         classes.includes('property') ||
         classes.includes('listing') ||
         classes.includes('photo') ||
         classes.includes('image') ||
         src.match(/\.(jpg|jpeg|png|webp)$/i))) {
      images.push(src);
    }
  });
  
  // If no filtered images found, try a broader approach
  if (images.length === 0) {
    $('img[src*="property"], img[src*="listing"], img[src*="photo"], img[src*="image"]').each((_, imgEl) => {
      const src = $(imgEl).attr('src');
      if (src && !images.includes(src)) images.push(src);
    });
  }

  // Listing URL
  const listingUrl = url;

  // Agent/Landlord info
  let agentName = '';
  let agentContact = '';
  agentName = $('.landlord-name, .landlord__name, .sidebar-landlord-name').first().text().trim();
  if (!agentName) agentName = 'OpenRent';
  // Contact info is usually not public, so leave blank or note as not available

  // Available from: look for 'Today' or blank
  let availableFrom = '';
  const availableText = $("body").text();
  if (/\bToday\b/i.test(availableText)) availableFrom = 'Today';

  return {
    id: listingUrl,
    title,
    address,
    price,
    priceUnit,
    bedrooms,
    bathrooms,
    propertyType,
    description,
    images,
    listingUrl,
    agent: {
      name: agentName,
      contact: agentContact,
    },
    availableFrom,
  };
}

function extractAndLogFromSavedHtml() {
  const html = fs.readFileSync(HTML_FILE, 'utf-8');
  const property = extractPropertyFromHtml(html, LISTING_URL);
  console.log('Extracted property:', property);
}

extractAndLogFromSavedHtml();

function testLiveListingsExtraction() {
  try {
    const html = fs.readFileSync('./openrent-listings-sample.html', 'utf-8');
    const properties = parseOpenrentListings(html);
    console.log('Live listings extraction test:');
    console.log(`Found ${properties.length} properties`);
    if (properties.length > 0) {
      console.log('Sample property:', properties[0]);
    }
    return properties;
  } catch (err) {
    console.error('Error testing live listings extraction:', err);
    return [];
  }
}

// Test the live listings extraction
testLiveListingsExtraction();

// Fetch Openrent search results page with user-agent spoofing
export async function fetchOpenrentSearchPage(url: string): Promise<string> {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      },
      timeout: 15000,
      validateStatus: () => true,
    });
    if (response.status === 403 || response.status === 429) {
      throw new Error(`Blocked by Openrent (status ${response.status})`);
    }
    if (/captcha|verify/i.test(response.data)) {
      throw new Error('Blocked by CAPTCHA');
    }
    return response.data;
  } catch (err) {
    console.error('[Live Fetch] Error:', (err as Error).message || err);
    return '';
  }
}

// Helper: sleep for ms
function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// CLI entry point for paginated live scraping
if (require.main === module && process.argv[2] === 'live-paginate') {
  (async () => {
    const baseUrl = 'https://www.openrent.co.uk/properties-to-rent/london';
    const maxPages = 4;
    const allProperties: Property[] = [];
    const seenUrls = new Set<string>();
    for (let page = 0; page < maxPages; page++) {
      const url = page === 0 ? baseUrl : `${baseUrl}?skip=${page * 20}`;
      console.log(`[Live Paginate] Fetching page ${page + 1}: ${url}`);
      const html = await fetchOpenrentSearchPage(url);
      if (!html) {
        console.warn(`[Live Paginate] No HTML for page ${page + 1}`);
        continue;
      }
      const properties = parseOpenrentListings(html);
      for (const prop of properties) {
        if (!seenUrls.has(prop.listingUrl)) {
          allProperties.push(prop);
          seenUrls.add(prop.listingUrl);
        }
      }
      await sleep(2000); // 2s delay between requests
    }
    console.log(`[Live Paginate] Aggregated ${allProperties.length} unique properties across ${maxPages} pages.`);
    if (allProperties.length > 0) {
      console.log('[Live Paginate] Sample property:', allProperties[0]);
    }
  })();
}

// Enhanced Openrent scraper with query-based URL building
export async function scrapeOpenrentWithQuery(query: string, filters?: any): Promise<Property[]> {
  const scrapingId = Math.random().toString(36).substr(2, 9);
  console.log(`🏠 [ENHANCED_SCRAPER] [${scrapingId}] Starting enhanced Openrent scraping for: "${query}"`);
  
  try {
    // Parse the search query
    const parsedQuery = parseSearchQuery(query);
    console.log(`🔍 [ENHANCED_SCRAPER] [${scrapingId}] Parsed query:`, parsedQuery);
    
    // Build the targeted URL
    const baseUrl = buildOpenrentUrl(parsedQuery);
    console.log(`🌐 [ENHANCED_SCRAPER] [${scrapingId}] Targeting URL: ${baseUrl}`);
    
    const allProperties: Property[] = [];
    const seenUrls = new Set<string>();
    const maxPages = 4; // Configurable
    
    // Scrape multiple pages with the targeted URL
    for (let page = 1; page <= maxPages; page++) {
      try {
        console.log(`📄 [ENHANCED_SCRAPER] [${scrapingId}] Fetching page ${page}...`);
        
        // Build page URL with pagination
        const pageUrl = page === 1 ? baseUrl : `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}skip=${(page - 1) * 20}`;
        console.log(`🔗 [ENHANCED_SCRAPER] [${scrapingId}] Page URL: ${pageUrl}`);
        
        const html = await fetchOpenrentSearchPage(pageUrl);
        if (!html) {
          console.warn(`⚠️ [ENHANCED_SCRAPER] [${scrapingId}] No HTML for page ${page}`);
          break;
        }
        
        const pageProperties = parseOpenrentListings(html);
        console.log(`✅ [ENHANCED_SCRAPER] [${scrapingId}] Page ${page}: ${pageProperties.length} properties`);
        
        // Deduplicate properties
        for (const prop of pageProperties) {
          if (!seenUrls.has(prop.listingUrl)) {
            allProperties.push(prop);
            seenUrls.add(prop.listingUrl);
          }
        }
        
        // Add delay between pages to be respectful
        if (page < maxPages) {
          await sleep(2000);
        }
        
        // If no properties found on this page, stop pagination
        if (pageProperties.length === 0) {
          console.log(`🛑 [ENHANCED_SCRAPER] [${scrapingId}] No properties on page ${page}, stopping pagination`);
          break;
        }
        
      } catch (error) {
        console.error(`❌ [ENHANCED_SCRAPER] [${scrapingId}] Error scraping page ${page}:`, error);
        break; // Stop if a page fails
      }
    }
    
    // If no properties found with specific search, try a broader search
    if (allProperties.length === 0 && parsedQuery.location) {
      console.log(`🔄 [ENHANCED_SCRAPER] [${scrapingId}] No properties found for specific search, trying broader London search...`);
      
      // Try a broader search in London
      const broaderUrl = `https://www.openrent.co.uk/properties-to-rent/london`;
      console.log(`🌐 [ENHANCED_SCRAPER] [${scrapingId}] Broader URL: ${broaderUrl}`);
      
      try {
        const html = await fetchOpenrentSearchPage(broaderUrl);
        if (html) {
          const broaderProperties = parseOpenrentListings(html);
          console.log(`✅ [ENHANCED_SCRAPER] [${scrapingId}] Broader search: ${broaderProperties.length} properties`);
          
          // Add unique properties from broader search
          for (const prop of broaderProperties) {
            if (!seenUrls.has(prop.listingUrl)) {
              allProperties.push(prop);
              seenUrls.add(prop.listingUrl);
            }
          }
        }
      } catch (error) {
        console.error(`❌ [ENHANCED_SCRAPER] [${scrapingId}] Broader search failed:`, error);
      }
    }
    
    console.log(`✅ [ENHANCED_SCRAPER] [${scrapingId}] Enhanced scraping completed: ${allProperties.length} unique properties`);
    console.log(`📍 [ENHANCED_SCRAPER] [${scrapingId}] Location: ${parsedQuery.location}, Bedrooms: ${parsedQuery.bedrooms || 'any'}, Type: ${parsedQuery.propertyType || 'any'}`);
    
    if (allProperties.length > 0) {
      console.log(`🏠 [ENHANCED_SCRAPER] [${scrapingId}] Sample property:`, {
        title: allProperties[0].title,
        address: allProperties[0].address,
        bedrooms: allProperties[0].bedrooms,
        price: `£${allProperties[0].price} ${allProperties[0].priceUnit}`
      });
    }
    
    return allProperties;
    
  } catch (error) {
    console.error(`❌ [ENHANCED_SCRAPER] [${scrapingId}] Enhanced scraping failed:`, error);
    throw error;
  }
}

main(); 