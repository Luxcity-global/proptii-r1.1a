/**
 * Zoopla Scraper
 * Extracts property data from Zoopla using Cheerio and Puppeteer
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer, { Browser } from 'puppeteer';
import { ParsedQuery, parseSearchQuery } from '../utils/queryParser';
import { buildZooplaUrl } from './zooplaQueryParser';
import { ZooplaProperty, transformZooplaProperties, getZooplaTransformationStats } from './zooplaSchemaTransformer';
import { HttpsProxyAgent } from 'https-proxy-agent';

const ZOOPLA_PROXY_URL = process.env.ZOOPLA_PROXY_URL || '';

// Rate limiting and anti-bot measures
class ZooplaRateLimiter {
  private requestTimes: number[] = [];
  private maxRequestsPerMinute = 30;
  private minDelayBetweenRequests = 2000; // 2 seconds

  async waitForNextRequest(): Promise<void> {
    const now = Date.now();
    this.requestTimes = this.requestTimes.filter(time => now - time < 60000);
    
    if (this.requestTimes.length >= this.maxRequestsPerMinute) {
      const waitTime = 60000 - (now - this.requestTimes[0]);
      console.log(`⏳ Rate limit reached, waiting ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    // Ensure minimum delay between requests
    if (this.requestTimes.length > 0) {
      const timeSinceLastRequest = now - this.requestTimes[this.requestTimes.length - 1];
      if (timeSinceLastRequest < this.minDelayBetweenRequests) {
        const waitTime = this.minDelayBetweenRequests - timeSinceLastRequest;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    this.requestTimes.push(Date.now());
  }
}

const rateLimiter = new ZooplaRateLimiter();

// User-Agent pool for anti-bot evasion
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36'
];

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function randomDelay(minMs = 2000, maxMs = 5000): Promise<void> {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise(resolve => setTimeout(resolve, delay));
}

function isBlockedOrCaptcha(html: string): boolean {
  const lower = html.toLowerCase();
  return (
    lower.includes('captcha') ||
    lower.includes('unusual traffic') ||
    lower.includes('are you a human') ||
    lower.includes('zoopla') && lower.includes('blocked') ||
    lower.includes('please verify you are a human')
  );
}

/**
 * Fetch Zoopla page with proxy support
 */
async function fetchZooplaPage(url: string): Promise<string> {
  await rateLimiter.waitForNextRequest();
  await randomDelay();
  const userAgent = getRandomUserAgent();

  const axiosConfig: any = {
    headers: {
      'User-Agent': userAgent,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    },
    timeout: 15000,
    maxRedirects: 5
  };
  if (ZOOPLA_PROXY_URL) {
    axiosConfig.httpsAgent = new HttpsProxyAgent(ZOOPLA_PROXY_URL);
    axiosConfig.proxy = false;
  }

  const response = await axios.get(url, axiosConfig);
  if (isBlockedOrCaptcha(response.data)) {
    console.warn('[Zoopla] Blocked or CAPTCHA detected. Returning empty result.');
    return '';
  }
  return response.data;
}

/**
 * Parse price from Zoopla price text
 */
function parseZooplaPrice(priceText: string): { amount: number; frequency: 'per_month' | 'per_week' | 'total'; display: string } {
  const cleanText = priceText.replace(/[^\d.,]/g, '');
  const match = cleanText.match(/[\d,.]+/);
  const amount = match ? Math.floor(parseFloat(match[0].replace(/,/g, ''))) : 0;
  
  let frequency: 'per_month' | 'per_week' | 'total' = 'per_month';
  let display = priceText.trim();
  
  if (priceText.toLowerCase().includes('pw') || priceText.toLowerCase().includes('per week')) {
    frequency = 'per_week';
  } else if (priceText.toLowerCase().includes('pa') || priceText.toLowerCase().includes('per annum')) {
    frequency = 'total';
  }
  
  return { amount, frequency, display };
}

/**
 * Extract property details from Zoopla listing
 */
function extractZooplaPropertyDetails($listing: cheerio.Cheerio<any>): {
  bedrooms: number;
  bathrooms: number;
  propertyType: string;
} {
  let bedrooms = 0;
  let bathrooms = 0;
  let propertyType = '';
  
  // Try multiple selectors for bedrooms/bathrooms
  const detailSelectors = [
    '[data-testid="listing-details"] span',
    '.listing-details span',
    '.property-details span',
    '.listing-info span'
  ];
  
  for (const selector of detailSelectors) {
    $listing.find(selector).each((_, element) => {
      const text = $listing.find(element).text().trim().toLowerCase();
      
      // Extract bedrooms
      const bedMatch = text.match(/(\d+)\s*(?:bed|bedroom)/);
      if (bedMatch && !bedrooms) {
        bedrooms = parseInt(bedMatch[1], 10);
      }
      
      // Extract bathrooms
      const bathMatch = text.match(/(\d+)\s*(?:bath|bathroom)/);
      if (bathMatch && !bathrooms) {
        bathrooms = parseInt(bathMatch[1], 10);
      }
    });
    
    if (bedrooms && bathrooms) break;
  }
  
  // Extract property type from title or description
  const title = $listing.find('[data-testid="listing-title"]').text().trim();
  const propertyTypes = ['flat', 'apartment', 'house', 'bungalow', 'studio', 'maisonette', 'penthouse'];
  
  for (const type of propertyTypes) {
    if (title.toLowerCase().includes(type)) {
      propertyType = type;
      break;
    }
  }
  
  return { bedrooms, bathrooms, propertyType };
}

/**
 * Extract Zoopla agent information
 */
function extractZooplaAgent($listing: cheerio.Cheerio<any>): {
  name: string;
  company: string;
  phone?: string;
  email?: string;
} {
  const agentSelectors = [
    '[data-testid="agent-name"]',
    '.agent-name',
    '.listing-agent .name',
    '.property-agent .name'
  ];
  
  let agentName = '';
  let agentCompany = '';
  
  for (const selector of agentSelectors) {
    const element = $listing.find(selector);
    if (element.length > 0) {
      agentName = element.text().trim();
      break;
    }
  }
  
  // Try to extract company name
  const companySelectors = [
    '[data-testid="agent-company"]',
    '.agent-company',
    '.listing-agent .company',
    '.property-agent .company'
  ];
  
  for (const selector of companySelectors) {
    const element = $listing.find(selector);
    if (element.length > 0) {
      agentCompany = element.text().trim();
      break;
    }
  }
  
  return {
    name: agentName || 'Zoopla Agent',
    company: agentCompany || 'Zoopla'
  };
}

/**
 * Extract Zoopla images
 */
function extractZooplaImages($listing: cheerio.Cheerio<any>): { src: string; alt: string; isPrimary: boolean }[] {
  const images: { src: string; alt: string; isPrimary: boolean }[] = [];
  
  const imageSelectors = [
    '[data-testid="listing-image"] img',
    '.listing-image img',
    '.property-image img',
    'img[data-src]',
    'img[src*="zoopla"]'
  ];
  
  for (const selector of imageSelectors) {
    $listing.find(selector).each((index, element) => {
      if (index >= 5) return; // Limit to 5 images
      
      const $img = cheerio.load(element);
      const src = $img('img').attr('data-src') || $img('img').attr('src') || '';
      const alt = $img('img').attr('alt') || '';
      
      if (src && !images.some(img => img.src === src)) {
        images.push({
          src,
          alt,
          isPrimary: index === 0
        });
      }
    });
    
    if (images.length > 0) break;
  }
  
  return images;
}

/**
 * Extract Zoopla features
 */
function extractZooplaFeatures($listing: cheerio.Cheerio<any>): string[] {
  const features: string[] = [];
  
  const featureSelectors = [
    '[data-testid="listing-features"] span',
    '.listing-features span',
    '.property-features span',
    '.amenities span'
  ];
  
  for (const selector of featureSelectors) {
    $listing.find(selector).each((_, element) => {
      const feature = cheerio.load(element).text().trim();
      if (feature && !features.includes(feature)) {
        features.push(feature);
      }
    });
    
    if (features.length > 0) break;
  }
  
  return features.slice(0, 10); // Limit to 10 features
}

/**
 * Generate unique ID for Zoopla property
 */
function generateZooplaId($listing: cheerio.Cheerio<any>, index: number): string {
  // Try to extract from URL first
  const link = $listing.find('a[href*="/to-rent/details/"]').attr('href');
  if (link) {
    const match = link.match(/\/to-rent\/details\/([^\/]+)/);
    if (match) {
      return match[1];
    }
  }
  
  // Fallback to index-based ID
  return `zoopla-${Date.now()}-${index}`;
}

/**
 * Parse Zoopla search results from HTML
 */
export function parseZooplaSearchResults(html: string): ZooplaProperty[] {
  const $ = cheerio.load(html);
  const properties: ZooplaProperty[] = [];
  const seenUrls = new Set<string>();
  
  console.log('🔍 Parsing Zoopla search results...');
  
  // Multiple selectors to try for Zoopla listings
  const listingSelectors = [
    '[data-testid="listing-details"]',
    '.listing-details',
    '.property-card',
    '.search-result',
    '[data-testid="property-card"]'
  ];
  
  let listingsFound = false;
  
  for (const selector of listingSelectors) {
    const listings = $(selector);
    
    if (listings.length > 0) {
      console.log(`✅ Found ${listings.length} listings with selector: ${selector}`);
      listingsFound = true;
      
      listings.each((index, element) => {
        if (index >= 10) return; // Limit to 10 properties per page
        
        try {
          const $listing = $(element);
          
          // Extract basic information
          const title = $listing.find('[data-testid="listing-title"]').text().trim() ||
                       $listing.find('.listing-title').text().trim() ||
                       $listing.find('h2, h3').first().text().trim();
          
          const priceText = $listing.find('[data-testid="listing-price"]').text().trim() ||
                           $listing.find('.listing-price').text().trim() ||
                           $listing.find('.price').text().trim();
          
          const address = $listing.find('[data-testid="listing-address"]').text().trim() ||
                         $listing.find('.listing-address').text().trim() ||
                         $listing.find('.address').text().trim();
          
          const description = $listing.find('[data-testid="listing-description"]').text().trim() ||
                             $listing.find('.listing-description').text().trim() ||
                             $listing.find('.description').text().trim();
          
          // Parse price
          const price = parseZooplaPrice(priceText);
          
          // Extract property details
          const details = extractZooplaPropertyDetails($listing);
          
          // Extract listing URL
          const listingUrl = $listing.find('a[href*="/to-rent/details/"]').attr('href');
          const fullUrl = listingUrl ? `https://www.zoopla.co.uk${listingUrl}` : '';
          
          // Skip if no URL or duplicate
          if (!fullUrl || seenUrls.has(fullUrl)) {
            return;
          }
          seenUrls.add(fullUrl);
          
          // Extract other information
          const agent = extractZooplaAgent($listing);
          const images = extractZooplaImages($listing);
          const features = extractZooplaFeatures($listing);
          
          // Create property object
          const property: ZooplaProperty = {
            id: generateZooplaId($listing, index),
            title: title || 'Property in London',
            price,
            location: {
              address: address || 'London',
              area: '',
              postcode: '',
              coordinates: undefined
            },
            details: {
              bedrooms: details.bedrooms,
              bathrooms: details.bathrooms,
              propertyType: details.propertyType,
              floorArea: undefined,
              floorAreaUnit: undefined
            },
            images,
            agent,
            features,
            description: description || 'Beautiful property in a great location',
            availableFrom: undefined,
            listingUrl: fullUrl,
            metadata: {
              lastUpdated: new Date().toISOString(),
              source: 'zoopla',
              searchScore: Math.random() * 100
            }
          };
          
          // Only add if we have essential data
          if (property.title && property.price.amount > 0) {
            properties.push(property);
          }
          
        } catch (error) {
          console.error('Error parsing Zoopla listing:', error);
        }
      });
      
      break; // Use first successful selector
    }
  }
  
  if (!listingsFound) {
    console.warn('⚠️ No Zoopla listings found with any selector');
    console.log('Available elements:', $('*').length);
  }
  
  console.log(`✅ Parsed ${properties.length} Zoopla properties`);
  return properties;
}

/**
 * Scrape Zoopla with Cheerio (basic approach)
 */
export async function scrapeZooplaWithCheerio(query: string, filters?: any): Promise<ZooplaProperty[]> {
  const scrapingId = Math.random().toString(36).substr(2, 9);
  console.log(`🏠 [ZOOPLA_CHEERIO] [${scrapingId}] Starting Zoopla scraping for: "${query}"`);
  try {
    const parsedQuery = parseSearchQuery(query);
    const url = buildZooplaUrl(parsedQuery);
    console.log(`🔗 [ZOOPLA_CHEERIO] [${scrapingId}] Fetching URL: ${url}`);
    const html = await fetchZooplaPage(url);
    if (!html) return [];
    const properties = parseZooplaSearchResults(html);
    console.log(`✅ [ZOOPLA_CHEERIO] [${scrapingId}] Scraping completed: ${properties.length} properties`);
    return properties;
  } catch (error) {
    console.warn(`❌ [ZOOPLA_CHEERIO] [${scrapingId}] Scraping failed:`, error);
    return [];
  }
}

/**
 * Scrape Zoopla with Puppeteer (enhanced approach)
 */
export async function scrapeZooplaWithPuppeteer(query: string, filters?: any): Promise<ZooplaProperty[]> {
  const scrapingId = Math.random().toString(36).substr(2, 9);
  console.log(`🏠 [ZOOPLA_PUPPETEER] [${scrapingId}] Starting Zoopla Puppeteer scraping for: "${query}"`);
  
  let browser: Browser | null = null;
  
  try {
    await randomDelay();
    const puppeteerArgs = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ];
    if (ZOOPLA_PROXY_URL) {
      puppeteerArgs.push(`--proxy-server=${ZOOPLA_PROXY_URL}`);
    }
    browser = await puppeteer.launch({
      headless: true,
      args: puppeteerArgs
    });
    
    const page = await browser.newPage();
    
    // Set random user agent
    const userAgent = getRandomUserAgent();
    await page.setUserAgent(userAgent);
    
    // Add stealth measures
    await page.evaluateOnNewDocument(() => {
      // @ts-ignore - Browser context
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
      
      // Override plugins
      // @ts-ignore - Browser context
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });
      
      // Override languages
      // @ts-ignore - Browser context
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
      });
    });
    
    const parsedQuery = parseSearchQuery(query);
    const url = buildZooplaUrl(parsedQuery);
    
    console.log(`🔗 [ZOOPLA_PUPPETEER] [${scrapingId}] Navigating to: ${url}`);
    
    await page.goto(url, { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    });
    
    // Wait for content to load
    try {
      await page.waitForSelector('[data-testid="listing-details"]', { timeout: 10000 });
    } catch (error) {
      console.warn(`⚠️ [ZOOPLA_PUPPETEER] [${scrapingId}] No listings found with primary selector, trying alternatives...`);
      
      // Try alternative selectors
      const alternativeSelectors = [
        '.listing-details',
        '.property-card',
        '.search-result'
      ];
      
      let found = false;
      for (const selector of alternativeSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 5000 });
          found = true;
          console.log(`✅ [ZOOPLA_PUPPETEER] [${scrapingId}] Found listings with selector: ${selector}`);
          break;
        } catch (e) {
          // Continue to next selector
        }
      }
      
      if (!found) {
        console.warn(`⚠️ [ZOOPLA_PUPPETEER] [${scrapingId}] No listings found with any selector`);
      }
    }
    
    // Extract HTML
    const html = await page.content();
    if (isBlockedOrCaptcha(html)) {
      console.warn(`[Zoopla][Puppeteer] Blocked or CAPTCHA detected. Returning empty result.`);
      return [];
    }
    const properties = parseZooplaSearchResults(html);
    
    console.log(`✅ [ZOOPLA_PUPPETEER] [${scrapingId}] Scraping completed: ${properties.length} properties`);
    return properties;
    
  } catch (error) {
    console.warn(`❌ [ZOOPLA_PUPPETEER] [${scrapingId}] Scraping failed:`, error);
    return [];
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('Error closing Puppeteer browser:', closeError);
      }
    }
  }
}

/**
 * Scrape Zoopla with pagination support
 */
export async function scrapeZooplaWithPagination(query: string, pages: number = 4): Promise<ZooplaProperty[]> {
  const scrapingId = Math.random().toString(36).substr(2, 9);
  console.log(`🏠 [ZOOPLA_PAGINATION] [${scrapingId}] Starting Zoopla paginated scraping: ${pages} pages`);
  
  const allProperties: ZooplaProperty[] = [];
  const seenUrls = new Set<string>();
  
  try {
    for (let page = 1; page <= pages; page++) {
      try {
        console.log(`📄 [ZOOPLA_PAGINATION] [${scrapingId}] Scraping page ${page}/${pages}`);
      
        const parsedQuery = parseSearchQuery(query);
        const pageUrl = buildZooplaUrl(parsedQuery, page);
      
        // Try Puppeteer first, fallback to Cheerio
        let properties: ZooplaProperty[];
        try {
          properties = await scrapeZooplaWithPuppeteer(query, { page });
        } catch (puppeteerError) {
          console.warn(`⚠️ [ZOOPLA_PAGINATION] [${scrapingId}] Puppeteer failed for page ${page}, trying Cheerio...`);
          properties = await scrapeZooplaWithCheerio(query, { page });
        }
      
        // Deduplicate properties
        const newProperties = properties.filter(property => {
          if (seenUrls.has(property.listingUrl)) {
            return false;
          }
          seenUrls.add(property.listingUrl);
          return true;
        });
      
        allProperties.push(...newProperties);
      
        console.log(`✅ [ZOOPLA_PAGINATION] [${scrapingId}] Page ${page}: ${newProperties.length} new properties (${allProperties.length} total)`);
      
        // Rate limiting between pages
        if (page < pages) {
          const delay = 2000 + Math.random() * 3000; // 2-5 seconds
          console.log(`⏳ [ZOOPLA_PAGINATION] [${scrapingId}] Waiting ${Math.round(delay)}ms before next page...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      
      } catch (error) {
        console.warn(`❌ [ZOOPLA_PAGINATION] [${scrapingId}] Error scraping page ${page}:`, error);
        break;
      }
    }
  
    console.log(`✅ [ZOOPLA_PAGINATION] [${scrapingId}] Paginated scraping completed: ${allProperties.length} total properties`);
    return allProperties;
  } catch (error) {
    console.warn(`❌ [ZOOPLA_PAGINATION] [${scrapingId}] Paginated scraping failed:`, error);
    return allProperties;
  }
}

/**
 * Main scraping function with fallback strategy
 */
export async function scrapeZooplaWithQuery(query: string, filters?: any): Promise<ZooplaProperty[]> {
  const scrapingId = Math.random().toString(36).substr(2, 9);
  console.log(`🏠 [ZOOPLA_MAIN] [${scrapingId}] Starting Zoopla scraping for: "${query}"`);
  
  try {
    // Try Cloudflare bypass first (new enhanced approach)
    console.log(`🛡️ [ZOOPLA_MAIN] [${scrapingId}] Attempting Cloudflare bypass scraping...`);
    try {
      const { scrapeZooplaWithCloudflareBypass } = await import('./zooplaCloudflareBypass');
      const bypassProperties = await scrapeZooplaWithCloudflareBypass(query, filters);
      
      if (bypassProperties.length > 0) {
        console.log(`✅ [ZOOPLA_MAIN] [${scrapingId}] Cloudflare bypass successful: ${bypassProperties.length} properties`);
        return bypassProperties;
      }
    } catch (bypassError) {
      console.warn(`⚠️ [ZOOPLA_MAIN] [${scrapingId}] Cloudflare bypass failed, trying standard methods:`, bypassError.message);
    }
    
    // Try Puppeteer as fallback
    console.log(`🔍 [ZOOPLA_MAIN] [${scrapingId}] Attempting standard Puppeteer scraping...`);
    const puppeteerProperties = await scrapeZooplaWithPuppeteer(query, filters);
    
    if (puppeteerProperties.length > 0) {
      console.log(`✅ [ZOOPLA_MAIN] [${scrapingId}] Puppeteer successful: ${puppeteerProperties.length} properties`);
      return puppeteerProperties;
    }
    
    // Fallback to Cheerio
    console.log(`🔄 [ZOOPLA_MAIN] [${scrapingId}] Puppeteer returned no results, trying Cheerio...`);
    const cheerioProperties = await scrapeZooplaWithCheerio(query, filters);
    
    console.log(`✅ [ZOOPLA_MAIN] [${scrapingId}] Cheerio completed: ${cheerioProperties.length} properties`);
    return cheerioProperties;
    
  } catch (error) {
    console.warn(`❌ [ZOOPLA_MAIN] [${scrapingId}] All scraping methods failed:`, error);
    return [];
  }
}

/**
 * Test function for development
 */
export async function testZooplaScraper(): Promise<void> {
  console.log('🧪 Testing Zoopla Scraper');
  console.log('=' .repeat(50));
  
  try {
    const testQuery = '2 bedroom flat in London';
    const properties = await scrapeZooplaWithQuery(testQuery);
    
    console.log(`✅ Test completed: ${properties.length} properties found`);
    
    if (properties.length > 0) {
      console.log('Sample property:', {
        id: properties[0].id,
        title: properties[0].title,
        price: properties[0].price.display,
        location: properties[0].location.address,
        bedrooms: properties[0].details.bedrooms,
        bathrooms: properties[0].details.bathrooms
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
} 