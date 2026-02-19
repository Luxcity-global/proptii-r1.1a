import { chromium } from 'playwright';
import type { Property } from '../scraper';
import axios from 'axios';

/**
 * Scrapes property listings from OpenRent
 * @param url - The OpenRent search URL to scrape
 * @param apiKey - API key for additional services (if needed)
 * @returns Promise<Property[]> - Array of property listings
 */
export async function scrapeOpenRent(url: string, apiKey: string): Promise<Property[]> {
  const properties: Property[] = [];
  let browser;

  try {
    console.log('Starting OpenRent scraper...');
    console.log('Target URL:', url);

    console.log('Launching browser...');
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox', 
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled'
      ]
    });
    console.log('Browser launched successfully');

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 }
    });

    console.log('Creating browser page...');
    const page = await context.newPage();
    
    // Navigate to the page
    console.log('Navigating to URL...');
    await page.goto(url, { 
      waitUntil: 'networkidle', 
      timeout: 60000 
    });
    console.log('Page loaded successfully');

    // Get page title and URL to debug
    const pageTitle = await page.title();
    const currentUrl = page.url();
    console.log('Page title:', pageTitle);
    console.log('Current URL:', currentUrl);

    // Wait for property listings to load
    try {
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      console.log('Page network idle, looking for property content...');
    } catch {
      console.log('Timeout waiting for network idle, proceeding anyway...');
    }
    
    // Give additional time for dynamic content to load
    await page.waitForTimeout(3000);
    
    console.log('Looking for OpenRent property listings...');
    
    // First, let's debug what's actually on the page
    const htmlContent = await page.content();
    console.log('Page HTML length:', htmlContent.length);
    console.log('Page contains "pli":', htmlContent.includes('pli'));
    console.log('Page contains "property":', htmlContent.includes('property'));
    console.log('Page contains "rent":', htmlContent.includes('rent'));
    
    // OpenRent uses a specific class structure for property listings
    // Based on the HTML analysis, properties are in elements with class starting with "pli"
    const possibleSelectors = [
      'a.pli', // Main property listing link
      '.pli', // Property listing item
      'a[id^="p"]', // Links with id starting with "p" (property IDs)
      '.listing-info', // Listing information container
      '.property-row-carousel', // Property carousel container
      '[data-listing-id]' // Elements with listing ID data attribute
    ];
    
    let propertyElements: any[] = [];
    let selectorUsed = '';
    
    for (const selector of possibleSelectors) {
      try {
        const elements = await page.$$eval(selector, (elements) => elements.length);
        if (elements > 0) {
          console.log(`Found ${elements} elements with selector: ${selector}`);
          propertyElements = await page.$$(selector);
          selectorUsed = selector;
          break;
        }
      } catch (error) {
        console.log(`Selector ${selector} not found, trying next...`);
      }
    }

    if (propertyElements.length === 0) {
      console.log('No property listings found with standard selectors, trying alternative approach...');
      
      // Alternative approach: look for any links containing property URLs
      const alternativeElements = await page.$$('a[href*="/properties/"], a[href*="/property/"], a[href^="/"]');
      
      if (alternativeElements.length > 0) {
        console.log(`Found ${alternativeElements.length} potential property links`);
        propertyElements = alternativeElements.slice(0, 20); // Limit to first 20 for performance
        selectorUsed = 'alternative property links';
      }
    }

    if (propertyElements.length === 0) {
      console.log('No property listings found. Page might be loading or structure changed.');
      return properties;
    }

    console.log(`Found ${propertyElements.length} property listings using: ${selectorUsed}`);

    // Process each property listing
    let validCount = 0;
    for (let i = 0; i < propertyElements.length && validCount < 20; i++) {
      try {
        const element = propertyElements[i];
        
        // Extract property information from each listing
        const propertyData = await page.evaluate((el) => {
          // Helper function to safely get text content
          const getText = (selector: string, parent = el as Element): string => {
            const element = parent.querySelector(selector);
            return element?.textContent?.trim() || '';
          };
          
          // Helper function to get attribute value
          const getAttr = (selector: string, attr: string, parent = el as Element): string => {
            if (!selector) return parent?.getAttribute(attr) || '';
            const element = parent.querySelector(selector);
            return element?.getAttribute(attr) || '';
          };
          
          // Extract property title
          let title = getText('.banda.pt.listing-title') || 
                     getText('.listing-title') || 
                     getText('h2') || 
                     getText('.title') ||
                     getAttr('', 'title');
          
          if (!title) {
            // Try to get title from image alt text or link
            title = getAttr('img', 'alt') || getAttr('', 'href');
            if (title && title.includes('/')) {
              title = title.split('/').pop() || title;
            }
          }
          
          // Extract price information
          let price = getText('.pim h2') || // Per month price
                     getText('.piw h2') || // Per week price
                     getText('.price') ||
                     getText('.mini-price') ||
                     getText('h2');
          
          // Clean up price text
          if (price) {
            price = price.replace(/\s+/g, ' ').trim();
            // Extract just the price part if it contains additional text
            const priceMatch = price.match(/£[\d,]+/);
            if (priceMatch) {
              price = priceMatch[0];
            }
          }
          
          // Extract location information
          let location = getText('.ltc h2') || 
                        getText('.location') ||
                        getText('.location-description') ||
                        getText('.ldc');
          
          // Clean up location text - remove map marker icons and distance info
          if (location) {
            location = location.replace(/[\d.]+\s*(km|miles?).*$/i, '').trim();
            location = location.replace(/^\s*[★▼■□♦•·]/, '').trim(); // Remove bullet points/icons
          }
          
          // Extract bedrooms information
          let bedrooms = '';
          const bedroomSelectors = ['.lic li', '.listing-desc', '.details'];
          for (const selector of bedroomSelectors) {
            const elements = el.querySelectorAll(selector);
            for (const elem of elements) {
              const text = elem.textContent?.toLowerCase() || '';
              if (text.includes('bed') || text.includes('studio')) {
                bedrooms = elem.textContent?.trim() || '';
                break;
              }
            }
            if (bedrooms) break;
          }
          
          // Extract property type
          let propertyType = 'Property';
          const typeSelectors = ['.lic li', '.listing-desc', '.details'];
          for (const selector of typeSelectors) {
            const elements = el.querySelectorAll(selector);
            for (const elem of elements) {
              const text = elem.textContent?.toLowerCase() || '';
              if (text.includes('flat') || text.includes('apartment')) {
                propertyType = 'Flat';
                break;
              } else if (text.includes('house')) {
                propertyType = 'House';
                break;
              } else if (text.includes('studio')) {
                propertyType = 'Studio';
                break;
              }
            }
            if (propertyType !== 'Property') break;
          }
          
          // Extract images
          const imageUrls: string[] = [];
          const images = el.querySelectorAll('img');
          images.forEach((img: any) => {
            let src = img.getAttribute('src') || img.getAttribute('data-src') || '';
            if (src && !src.includes('NoImageImage') && !src.includes('placeholder')) {
              // Convert relative URLs to absolute
              if (src.startsWith('//')) {
                src = 'https:' + src;
              } else if (src.startsWith('/')) {
                src = 'https://www.openrent.co.uk' + src;
              }
              
              // Filter out small icons and logos
              if (!src.toLowerCase().includes('icon') && 
                  !src.toLowerCase().includes('logo') && 
                  !src.toLowerCase().includes('avatar')) {
                imageUrls.push(src);
              }
            }
          });
          
          // Extract listing URL
          let listingUrl = getAttr('', 'href');
          if (listingUrl && listingUrl.startsWith('/')) {
            listingUrl = 'https://www.openrent.co.uk' + listingUrl;
          }
          
          return {
            title: title,
            price: price,
            location: location,
            bedrooms: bedrooms,
            propertyType: propertyType,
            imageUrls: imageUrls,
            listingUrl: listingUrl
          };
        }, element);

        // Validate and clean the extracted data
        const hasValidData = propertyData.title && 
                            (propertyData.price || propertyData.listingUrl) &&
                            propertyData.title.length > 3 &&
                            !propertyData.title.toLowerCase().includes('openrent') &&
                            !propertyData.title.toLowerCase().includes('sign in');

        if (hasValidData) {
          console.log(`Adding OpenRent listing ${i + 1}: ${propertyData.title.substring(0, 50)}...`);
          validCount++;
          
          properties.push({
            title: propertyData.title || 'Property Listing',
            price: propertyData.price || 'Price on Application',
            location: propertyData.location || 'Location not specified',
            bedrooms: propertyData.bedrooms || 'Bedrooms not specified',
            propertyType: propertyData.propertyType || 'Property',
            imageUrls: propertyData.imageUrls.slice(0, 5), // Limit to 5 images max
            agent: {
              name: 'OpenRent',
              email: 'Contact via OpenRent',
              website: propertyData.listingUrl || 'https://www.openrent.co.uk'
            }
          });
        } else {
          console.log(`Skipped OpenRent listing ${i + 1} - insufficient data or invalid content`);
        }
      } catch (error) {
        console.warn(`Error processing OpenRent listing ${i + 1}:`, error);
      }
    }

    console.log(`Successfully scraped ${properties.length} properties from OpenRent`);
    return properties;

  } catch (error) {
    console.error('Error scraping OpenRent:', error);
    return properties; // Return partial results
  } finally {
    if (browser) {
      await browser.close();
      console.log('Browser closed');
    }
  }
}

/**
 * Builds an OpenRent search URL based on location and filters
 * @param location - Location to search for properties (e.g., "Liverpool, Merseyside")
 * @param filters - Optional filters for the search
 * @returns The constructed OpenRent search URL
 */
export function buildOpenRentUrl(
  location: string, 
  filters: {
    minPrice?: number;
    maxPrice?: number;
    bedrooms?: string;
    propertyType?: string;
  } = {}
): string {
  const baseUrl = 'https://www.openrent.co.uk/properties-to-rent';
  
  // Clean and format location for URL
  const cleanLocation = location.toLowerCase()
    .replace(/[^a-z0-9\s,-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/,-/g, '-')
    .replace(/-+/g, '-')
    .trim();
  
  // Build the URL path
  let url = `${baseUrl}/${cleanLocation}`;
  
  // Add search parameters
  const params = new URLSearchParams();
  params.append('term', location);
  
  // Add filters if provided
  if (filters.minPrice) {
    params.append('minPrice', filters.minPrice.toString());
  }
  
  if (filters.maxPrice) {
    params.append('maxPrice', filters.maxPrice.toString());
  }
  
  if (filters.bedrooms && filters.bedrooms !== 'any') {
    // Map bedroom values to OpenRent format
    const bedroomMap: { [key: string]: string } = {
      'studio': 'Studio',
      '1': '1+Bed',
      '2': '2+Bed',
      '3': '3+Bed',
      '4': '4+Bed',
      '5': '5+Bed'
    };
    
    const openRentBedrooms = bedroomMap[filters.bedrooms] || filters.bedrooms;
    params.append('bedrooms', openRentBedrooms);
  }
  
  // Add the parameters to the URL
  if (params.toString()) {
    url += '?' + params.toString();
  }
  
  return url;
}

/**
 * Parse a natural language query to extract OpenRent search parameters
 * @param query - Natural language query (e.g., "2 bedroom flat in Liverpool under £1000")
 * @returns Object with location, maxPrice, and bedrooms
 */
export function parseOpenRentQuery(query: string): {
  location: string;
  maxPrice?: number;
  bedrooms?: string;
  propertyType?: string;
} {
  const normalizedQuery = query.toLowerCase();
  
  // Extract location (look for common UK location patterns)
  let location = '';
  
  // Look for "in [location]" pattern
  const locationMatch = normalizedQuery.match(/\bin\s+([a-z\s,]+?)(?:\s+(?:under|below|max|up\s+to|\£|\d))/i) ||
                       normalizedQuery.match(/\bin\s+([a-z\s,]+?)$/i);
  
  if (locationMatch) {
    location = locationMatch[1].trim();
  } else {
    // Fallback: try to find UK city/area names
    const ukLocations = ['london', 'manchester', 'birmingham', 'liverpool', 'leeds', 'bristol', 'sheffield', 'edinburgh', 'glasgow', 'cardiff'];
    for (const ukLocation of ukLocations) {
      if (normalizedQuery.includes(ukLocation)) {
        location = ukLocation;
        break;
      }
    }
  }
  
  // Extract maximum price
  let maxPrice: number | undefined;
  const priceMatch = normalizedQuery.match(/(?:under|below|max|up\s+to)\s*£?(\d{1,4})/i) ||
                    normalizedQuery.match(/£(\d{1,4})/);
  
  if (priceMatch) {
    maxPrice = parseInt(priceMatch[1]);
    // Assume weekly prices if under 500, monthly if over
    if (maxPrice < 500) {
      maxPrice = maxPrice * 4.33; // Convert weekly to monthly
    }
  }
  
  // Extract bedrooms
  let bedrooms: string | undefined;
  const bedroomMatch = normalizedQuery.match(/(\d+)\s*(?:bed|bedroom)/i) ||
                      normalizedQuery.match(/\b(studio)\b/i);
  
  if (bedroomMatch) {
    bedrooms = bedroomMatch[1].toLowerCase();
  }
  
  // Extract property type
  let propertyType: string | undefined;
  if (normalizedQuery.includes('flat') || normalizedQuery.includes('apartment')) {
    propertyType = 'flat';
  } else if (normalizedQuery.includes('house')) {
    propertyType = 'house';
  } else if (normalizedQuery.includes('studio')) {
    propertyType = 'studio';
  }
  
  // Capitalize location properly
  if (location) {
    location = location.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }
  
  return {
    location: location || 'UK',
    maxPrice,
    bedrooms,
    propertyType
  };
}
