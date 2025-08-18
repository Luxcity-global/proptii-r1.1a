import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import { ParsedQuery, parseSearchQuery, buildOnTheMarketUrl } from '../utils/queryParser';
import puppeteer from 'puppeteer';

// Unified property schema (same as OpenRent)
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

const ONTHEMARKET_BASE_URL = 'https://www.onthemarket.com';

async function fetchOnTheMarketPage(url: string): Promise<string> {
  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; ProptiiBot/1.0; +https://proptii.com/bot)',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
      'Connection': 'keep-alive',
    },
    timeout: 15000,
  });
  return response.data;
}

// --- Price parsing utility (simplified like OpenRent) ---
function parsePrice(text: string): number {
  // Remove currency symbols and non-numeric except comma, dot
  const match = text.replace(/[^\d.,]/g, '').match(/[\d,.]+/);
  if (!match) return 0;
  // Remove commas, parse as float, then floor to int
  const num = Math.floor(parseFloat(match[0].replace(/,/g, '')));
  return isNaN(num) ? 0 : num;
}

export function parseOnTheMarketListings(html: string): Property[] {
  const $ = cheerio.load(html);
  const properties: Property[] = [];
  const seenUrls = new Set<string>();
  let skipped = 0, partial = 0, duplicates = 0;
  const partialSamples: any[] = [];

  // OnTheMarket uses multiple selector patterns for flexibility (as per documentation)
  $('.property-result, .property-card, .property-listing, li.otm-PropertyCard').each((_, el) => {
    const $el = $(el);
    
    // Skip non-property cards (like development ads)
    if ($el.find('#in-market-').length > 0) {
      return;
    }
    
    // Extract title using multiple selectors (as per documentation)
    let title = '';
    const titleSelectors = [
      '.property-title', '.property-heading', 'h3 a', 'h2 a',
      'meta[itemprop="description"]', '.title', '.address'
    ];
    
    for (const selector of titleSelectors) {
      const titleElement = $el.find(selector).first();
      if (selector.includes('meta')) {
        title = titleElement.attr('content') || '';
      } else {
        title = titleElement.text().trim();
      }
      if (title && title.length > 5) break;
    }
    
    // Extract address from title or dedicated address selectors
    let address = '';
    const addressSelectors = ['.property-address', '.address', '.location'];
    
    for (const selector of addressSelectors) {
      const addressElement = $el.find(selector).first();
      address = addressElement.text().trim();
      if (address && address.length > 3) break;
    }
    
    // If no dedicated address found, extract from title
    if (!address && title) {
      const addressMatch = title.match(/[-,]\s*(.+)$/);
      if (addressMatch) {
        address = addressMatch[1].trim();
      } else {
        address = title; // Fallback to full title
      }
    }
    
    // Extract price using multiple selectors (as per documentation)
    let price = 0;
    let priceUnit = 'pcm';
    const priceSelectors = [
      '.property-price', '.price', '.price-display',
      '.otm-Price .price', '.otm-price'
    ];
    
    let priceText = '';
    for (const selector of priceSelectors) {
      const priceElement = $el.find(selector).first();
      priceText = priceElement.text().trim();
      if (priceText && priceText.includes('£')) break;
    }
    
    if (priceText) {
      // Extract the first price (pcm) from format like "£10,833 pcm (£2,500 pw)"
      const pcmMatch = priceText.match(/£([\d,]+)\s*pcm/i);
      if (pcmMatch) {
        price = parsePrice(pcmMatch[0]);
        priceUnit = 'pcm';
      } else {
        // Fallback to any price found
        price = parsePrice(priceText);
        if (priceText.toLowerCase().includes('pw')) {
          priceUnit = 'pw';
        }
      }
    }
    
    // Extract bedrooms from title or features
    let bedrooms = 0;
    if (title) {
      const bedroomMatch = title.match(/(\d+)\s*bedroom/i);
      if (bedroomMatch) {
        bedrooms = parseInt(bedroomMatch[1], 10);
      }
    }
    
    // Extract property type from title
    let propertyType = '';
    if (title) {
      const typeMatch = title.match(/(\d+\s*bed\s*[^,]+)/i);
      if (typeMatch) {
        propertyType = typeMatch[1];
      }
    }
    
    // Extract bathrooms (estimate based on bedrooms)
    const bathrooms = Math.max(1, Math.floor(bedrooms / 2));
    
    // Extract description
    const description = title || 'Property details from OnTheMarket';
    
    // Extract images using multiple approaches (as per documentation)
    const images: string[] = [];
    $el.find('img').each((_, imgEl) => {
      const src = $(imgEl).attr('src') || $(imgEl).attr('data-src') || $(imgEl).attr('data-lazy-src');
      const alt = $(imgEl).attr('alt') || '';
      
      // Filter for property images (exclude logos, icons, etc.)
      if (src && 
          !src.includes('logo') && 
          !src.includes('icon') && 
          !src.includes('sticker') &&
          !src.includes('placeholder') &&
          !images.includes(src)) {
        images.push(src);
      }
    });
    
    // Extract listing URL using multiple approaches (as per documentation)
    let listingUrl = '';
    const urlSelectors = [
      'meta[itemprop="url"]',
      'a[href*="/details/"]',
      'a[href*="/property/"]',
      'a[href*="onthemarket.com"]'
    ];
    
    for (const selector of urlSelectors) {
      const urlElement = $el.find(selector).first();
      if (selector.includes('meta')) {
        listingUrl = urlElement.attr('content') || '';
      } else {
        listingUrl = urlElement.attr('href') || '';
      }
      if (listingUrl) break;
    }
    
    if (listingUrl && !listingUrl.startsWith('http')) {
      listingUrl = ONTHEMARKET_BASE_URL + listingUrl;
    }
    
    if (!listingUrl) {
      listingUrl = `${ONTHEMARKET_BASE_URL}/property/${Date.now()}-${Math.random()}`;
    }
    
    // Extract agent information using multiple approaches
    let agentName = 'OnTheMarket Agent';
    let agentContact = '';
    const agentSelectors = [
      '.otm-PropertyCardAgent',
      '.agent',
      '.agency',
      '.company'
    ];
    
    for (const selector of agentSelectors) {
      const agentElement = $el.find(selector).first();
      if (agentElement.length) {
        const agentText = agentElement.text().trim();
        // Extract agent name from format like "Added today by Bunn & Co - Pimlico"
        const agentMatch = agentText.match(/by\s+(.+?)(?:\s*-\s*|$)/);
        if (agentMatch) {
          agentName = agentMatch[1].trim();
          break;
        }
      }
    }
    
    const agent = {
      name: agentName,
      contact: agentContact,
    };
    
    // Available from
    const availableFrom = 'Available now';
    
    // Skip if missing essential data
    if (!title || !price || price < 100 || price > 50000) {
      skipped++;
      partialSamples.push({ reason: 'missing essential data', title, price, listingUrl });
      return;
    }
    
    // Deduplication
    if (seenUrls.has(listingUrl)) {
      duplicates++;
      partialSamples.push({ reason: 'duplicate', listingUrl });
      return;
    }
    seenUrls.add(listingUrl);
    
    // Add property
    properties.push({
      id: listingUrl,
      title: title || '',
      address: address || '',
      price: price || 0,
      priceUnit,
      bedrooms: bedrooms || 0,
      bathrooms: bathrooms || 1,
      propertyType: propertyType || 'Property',
      description: description || '',
      images: images.length > 0 ? images : ['/placeholder-property.jpg'],
      listingUrl,
      agent,
      availableFrom,
    });
  });
  
  // QA Logging (same as OpenRent)
  console.log(`\n[QA] OnTheMarket - Skipped: ${skipped}, Partial: ${partial}, Duplicates: ${duplicates}`);
  if (partialSamples.length > 0) {
    console.log('[QA] OnTheMarket Partial/Edge Case Samples:', partialSamples.slice(0, 5));
  }
  
  return properties;
}

export async function fetchOnTheMarketSearchPage(url: string): Promise<string> {
  try {
    console.log(`🔍 [ON_THE_MARKET] Fetching: ${url}`);
    const html = await fetchOnTheMarketPage(url);
    console.log(`✅ [ON_THE_MARKET] Successfully fetched ${html.length} characters`);
    return html;
  } catch (error) {
    console.error(`❌ [ON_THE_MARKET] Error fetching page:`, error);
    throw error;
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function scrapeOnTheMarketWithQuery(query: string, filters?: any): Promise<Property[]> {
  try {
    console.log(`🏠 [ON_THE_MARKET] Starting search for: "${query}"`);
    
    const parsedQuery = parseSearchQuery(query);
    console.log('  Parsed query:', JSON.stringify(parsedQuery, null, 2));
    
    const url = buildOnTheMarketUrl(parsedQuery);
    console.log(`🔗 [ON_THE_MARKET] Search URL: ${url}`);
    
    const allProperties: Property[] = [];
    const maxPages = 4; // Match OpenRent
    const maxProperties = 80; // Match OpenRent exactly
    
    // Try HTTP + Cheerio first (like OpenRent), fallback to Puppeteer only if needed
    console.log(`📄 [ON_THE_MARKET] Using HTTP + Cheerio approach (like OpenRent)`);
    
    for (let page = 1; page <= maxPages; page++) {
      // Stop if we've reached the property limit
      if (allProperties.length >= maxProperties) {
        console.log(`🎯 [ON_THE_MARKET] Reached property limit of ${maxProperties}, stopping`);
        break;
      }
      
      const pageUrl = page === 1 ? url : `${url}&page=${page}`;
      console.log(`📄 [ON_THE_MARKET] Scraping page ${page}: ${pageUrl}`);
      
      let properties: Property[] = [];
      
      try {
        // Primary approach: HTTP + Cheerio (like OpenRent)
      const html = await fetchOnTheMarketSearchPage(pageUrl);
        properties = parseOnTheMarketListings(html);
        console.log(`📊 [ON_THE_MARKET] HTTP approach found ${properties.length} properties on page ${page}`);
        
        // If no properties found on first page, try Puppeteer fallback
        if (page === 1 && properties.length === 0) {
          console.log(`🤖 [ON_THE_MARKET] No properties with HTTP, trying Puppeteer fallback...`);
          try {
            properties = await scrapeOnTheMarketWithPuppeteer(pageUrl);
            console.log(`📊 [ON_THE_MARKET] Puppeteer fallback found ${properties.length} properties`);
          } catch (puppeteerError) {
            console.log(`❌ [ON_THE_MARKET] Puppeteer fallback also failed: ${puppeteerError}`);
          }
        }
        
      } catch (httpError) {
        console.error(`❌ [ON_THE_MARKET] HTTP failed for page ${page}: ${httpError}`);
        properties = [];
      }
      
      console.log(`📊 [ON_THE_MARKET] Page ${page} properties found: ${properties.length}`);
      
      // Add properties but respect the 80 limit
      const remainingSlots = maxProperties - allProperties.length;
      const propertiesToAdd = properties.slice(0, remainingSlots);
      allProperties.push(...propertiesToAdd);
      
      console.log(`📈 [ON_THE_MARKET] Added ${propertiesToAdd.length} properties, total: ${allProperties.length}/${maxProperties}`);
      
      // If first page has no results, try London fallback (like OpenRent logic)
      if (page === 1 && properties.length === 0) {
        console.log(`🔍 [ON_THE_MARKET] No properties found, trying London fallback...`);
        
          const londonUrl = buildOnTheMarketUrl({ ...parsedQuery, location: 'london' });
          console.log(`🔗 [ON_THE_MARKET] London fallback URL: ${londonUrl}`);
          
        try {
          const londonHtml = await fetchOnTheMarketSearchPage(londonUrl);
          const londonProperties = parseOnTheMarketListings(londonHtml);
          console.log(`📊 [ON_THE_MARKET] London fallback found: ${londonProperties.length} properties`);
          
          // Add London properties but respect the limit
          const remainingSlots = maxProperties - allProperties.length;
          const propertiesToAdd = londonProperties.slice(0, remainingSlots);
          allProperties.push(...propertiesToAdd);
        } catch (error) {
          console.log(`❌ [ON_THE_MARKET] London fallback failed: ${error}`);
        }
        
        break; // Don't continue pagination if first page had no results
      }
      
      if (properties.length === 0) {
          console.log(`⏹️ [ON_THE_MARKET] No properties found on page ${page}, stopping pagination`);
          break;
        }
        
      await sleep(1000); // Rate limiting like OpenRent
    }
    
    console.log(`✅ [ON_THE_MARKET] Total properties scraped: ${allProperties.length} (limit: ${maxProperties})`);
    return allProperties;
    
  } catch (error) {
    console.error(`❌ [ON_THE_MARKET] Error during scraping:`, error);
    return [];
  }
}

// Puppeteer fallback function (simplified)
export async function scrapeOnTheMarketWithPuppeteer(url: string): Promise<Property[]> {
  console.log(`🤖 [ON_THE_MARKET_PUPPETEER] Fallback browser scraping for: ${url}`);
  
  let browser: any = null;
  let page: any = null;
  
  try {
    browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
    page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (compatible; ProptiiBot/1.0; +https://proptii.com/bot)');
    
    console.log(`🌐 [ON_THE_MARKET_PUPPETEER] Navigating to: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Wait for content to load
    await page.waitForTimeout(3000);
    
    // Get the rendered HTML
    const html = await page.content();
    console.log(`📄 [ON_THE_MARKET_PUPPETEER] Retrieved HTML: ${html.length} characters`);
    
    // Use same parser as HTTP approach
    const properties = parseOnTheMarketListings(html);
    console.log(`✅ [ON_THE_MARKET_PUPPETEER] Extracted ${properties.length} properties`);
    
    return properties;
    
  } catch (error) {
    console.error(`❌ [ON_THE_MARKET_PUPPETEER] Error:`, error);
    return [];
  } finally {
    try {
      if (page) await page.close();
      if (browser) await browser.close();
    } catch (e) {
      console.error(`⚠️ [ON_THE_MARKET_PUPPETEER] Cleanup error:`, e);
    }
  }
}

// Export for testing
export async function testOnTheMarketScraping() {
  try {
    console.log('🧪 [ON_THE_MARKET] Testing scraper...');
    const properties = await scrapeOnTheMarketWithQuery('2 bedroom flat in London');
    console.log('✅ [ON_THE_MARKET] Test completed. Properties found:', properties.length);
    if (properties.length > 0) {
      console.log('📋 [ON_THE_MARKET] Sample property:', properties[0]);
    }
  } catch (error) {
    console.error('❌ [ON_THE_MARKET] Test failed:', error);
  }
}

// Main function for standalone testing
async function main() {
  try {
    console.log('🏠 [ON_THE_MARKET] Fetching On the Market listings...');
    const properties = await scrapeOnTheMarketWithQuery('2 bedroom flat in central London');
    console.log('📊 [ON_THE_MARKET] Extracted properties:', properties.length);
    
    if (properties.length > 0) {
      console.log('📋 [ON_THE_MARKET] Sample properties:');
      properties.slice(0, 3).forEach((prop, idx) => {
        console.log(`  ${idx + 1}. ${prop.title} - £${prop.price} ${prop.priceUnit}`);
        console.log(`     ${prop.address}`);
        console.log(`     ${prop.bedrooms} bed, ${prop.propertyType}`);
        console.log(`     ${prop.listingUrl}`);
        console.log('');
      });
    }
    
  } catch (err) {
    console.error('❌ [ON_THE_MARKET] Error scraping On the Market:', err);
  }
}