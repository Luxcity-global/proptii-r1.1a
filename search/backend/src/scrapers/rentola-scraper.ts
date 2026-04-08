import { chromium } from 'playwright';
import type { Property } from '../scraper';
import { Logger } from '../utils/logger';

const logger = new Logger('RentolaScraper');

/**
 * Scrapes property listings from Rentola UK
 * @param url - The Rentola search URL to scrape
 * @param apiKey - API key for additional services (if needed)
 * @returns Promise<Property[]> - Array of property listings
 */
export async function scrapeRentola(url: string, apiKey: string): Promise<Property[]> {
  const properties: Property[] = [];
  let browser;

  try {
    logger.info('Starting Rentola scraper...');
    logger.info('Target URL:', url);

    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--disable-gpu-sandbox',
        '--disable-software-rasterizer',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection',
        '--disable-background-networking',
        '--disable-client-side-phishing-detection',
        '--disable-sync',
        '--disable-default-apps',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-images',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--window-size=1920x1080',
        '--data-path=/tmp/playwright_data',
        '--homedir=/tmp',
        '--disk-cache-dir=/tmp/playwright_cache',
        '--media-cache-dir=/tmp/playwright_media_cache',
        '--aggressive-cache-discard',
        '--memory-pressure-off'
      ]
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 }
    });

    const page = await context.newPage();
    
    // Navigate to the page
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    logger.info('Page loaded successfully');

    // Get page title and URL to debug
    const pageTitle = await page.title();
    const currentUrl = page.url();
    logger.info('Page title:', pageTitle);
    logger.info('Current URL:', currentUrl);

    // Wait for page content to load properly
    try {
      // First wait for any content to load
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      logger.info('Page network idle, looking for property content...');
    } catch {
      logger.info('Timeout waiting for network idle, proceeding anyway...');
    }
    
    // Give additional time for dynamic content
    await page.waitForTimeout(2000);
    
    // Try multiple approaches to find Rentola property listings
    logger.info('Looking for Rentola property listings...');
    
    // Let's try a simpler, more direct approach for Rentola
    // Based on typical Rentola structure and focusing on what works
    const possibleSelectors = [
      // Direct property links (most likely to be individual properties)
      'a[href*="/property/"]',
      'a[href*="/listing/"]', 
      
      // Common property container patterns
      '.property-item',
      '.listing-item',
      '.property-card',
      '.listing-card',
      
      // Generic containers but more specific
      'div[class*="property"]',
      'div[class*="listing"]',
      'article',
      
      // Fallback patterns
      'div[data-property]',
      '[data-testid*="property"]',
      '.search-result'
    ];
    
    let propertyElements: any[] = [];
    let bestSelector = '';
    let maxElements = 0;
    
    // Try all selectors and find the one with most elements
    for (const selector of possibleSelectors) {
      try {
        const elements = await page.$$(selector);
        logger.info(`Selector "${selector}": found ${elements.length} elements`);
        
        if (elements.length > maxElements) {
          maxElements = elements.length;
          propertyElements = elements;
          bestSelector = selector;
        }
      } catch (error) {
        logger.warn(`Error with selector "${selector}":`, error);
      }
    }
    
    logger.info(`Best selector: "${bestSelector}" with ${maxElements} elements`);
    
    // Debug: If we're not finding many elements, let's see what's on the page
    if (propertyElements.length < 10) {
      logger.info('Debugging page content to find property elements...');
      
      // Try to find elements with £ symbol which usually indicates prices
      try {
        const elementsWithPounds = await page.$$('::-p-text(£)');
        logger.info(`Found ${elementsWithPounds.length} elements containing £ symbol`);
        
        if (elementsWithPounds.length > propertyElements.length) {
          // Get parent elements of price elements as they're likely property containers
          const parentElements = [];
          for (let i = 0; i < Math.min(elementsWithPounds.length, 25); i++) {
            try {
              const parent = await elementsWithPounds[i].evaluateHandle(el => el.parentElement);
              if (parent) {
                parentElements.push(parent);
              }
            } catch {
              continue;
            }
          }
          
          if (parentElements.length > propertyElements.length) {
            logger.info(`Using ${parentElements.length} parent elements of price indicators`);
            propertyElements = parentElements;
            bestSelector = 'price parent elements';
          }
        }
      } catch (error) {
        logger.warn('Error finding elements with £ symbol:', error);
      }
    }
    
    // If we still have very few elements, try one more focused approach
    if (propertyElements.length < 5) {
      logger.info('Few elements found, trying focused content search...');
      
      try {
        // Try a more targeted approach - look for links that might be individual properties
        const propertyLinks = await page.$$('a');
        logger.info(`Found ${propertyLinks.length} links, filtering for property-related ones...`);
        
        const propertyRelatedLinks = [];
        // Check first 50 links to avoid timeout
        for (let i = 0; i < Math.min(propertyLinks.length, 50); i++) {
          try {
            const href = await propertyLinks[i].getAttribute('href');
            const text = await propertyLinks[i].textContent();
            
            if (href && (href.includes('/property/') || href.includes('/listing/')) ||
                text && (text.includes('£') || text.includes('bedroom') || text.includes('bed'))) {
              propertyRelatedLinks.push(propertyLinks[i]);
              if (propertyRelatedLinks.length >= 25) break; // Stop at 25
            }
          } catch {
            continue;
          }
        }
        
        if (propertyRelatedLinks.length > propertyElements.length) {
          logger.info(`Found ${propertyRelatedLinks.length} property-related links`);
          propertyElements = propertyRelatedLinks;
          bestSelector = 'property links';
        }
      } catch (error) {
        logger.warn('Error with focused content search:', error);
      }
    }

    // Try one scroll to load more properties if we have fewer than 10
    if (propertyElements.length < 10) {
      logger.info('Scrolling once to load more properties...');
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await page.waitForTimeout(2000); // Give time for new content to load
      
      // Re-run the best selector to get updated elements
      try {
        if (bestSelector) {
          const newElements = await page.$$(bestSelector);
          if (newElements.length > propertyElements.length) {
            logger.info(`After scroll: found ${newElements.length} elements (was ${propertyElements.length})`);
            propertyElements = newElements;
          }
        }
      } catch (error) {
        logger.warn('Error checking for new elements after scroll:', error);
      }
    }

    logger.info(`Processing ${propertyElements.length} potential property elements...`);

    // If no property elements found, return empty array (no mock data)
    if (propertyElements.length === 0) {
      logger.info('No property elements found on Rentola page');
      return [];
    }
    
    // Process found property elements (aim for 15-20 results)
    const maxProperties = Math.min(propertyElements.length, 30); // Process up to 30 to get 15-20 good ones
    logger.info(`Processing up to ${maxProperties} elements to extract 15-20 quality properties...`);
    
    for (let i = 0; i < maxProperties; i++) {
      const element = propertyElements[i];
      
      try {
        // Extract text content from the element and its children
        const elementText = await element.textContent() || '';
        
        // Try to extract property information from the text
        let title = '';
        let price = '';
        let location = '';
        let bedrooms = 'Not specified';
        let propertyType = 'Property';
        
        // Extract title with improved selectors for Rentola
        try {
          const titleSelectors = [
            'h2', 'h3', 'h4', 
            '.title', '.property-title', '.listing-title',
            'a[title]', 'a', 
            '[data-testid*="title"]',
            '.property-name'
          ];
          
          for (const selector of titleSelectors) {
            try {
              const titleElement = await element.$(selector);
              if (titleElement) {
                const titleText = await titleElement.textContent();
                if (titleText && titleText.trim().length > 5) {
                  title = titleText.trim();
                  break;
                }
              }
            } catch {
              continue;
            }
          }
          
          // If no title found with selectors, try text content
          if (!title) {
            const lines = elementText.split('\n').filter((line: string) => line.trim().length > 10);
            title = lines[0] || '';
          }
        } catch (error) {
          logger.warn('Error extracting title:', error);
        }
        
        // Extract price with comprehensive patterns
        try {
          // Try multiple price selectors
          const priceSelectors = [
            '.price', '.rent', '.cost', '.amount', 
            '[data-testid*="price"]', '[class*="price"]',
            '[class*="rent"]', '[class*="cost"]'
          ];
          
          for (const selector of priceSelectors) {
            try {
              const priceElement = await element.$(selector);
              if (priceElement) {
                const priceText = await priceElement.textContent();
                if (priceText && (priceText.includes('£') || priceText.match(/\d+/))) {
                  price = priceText.trim();
                  logger.info(`Found price with selector ${selector}: ${price}`);
                  break;
                }
              }
            } catch {
              continue;
            }
          }
          
          // Fallback to comprehensive regex search in all element text
          if (!price || price === 'Price on request') {
            const pricePatterns = [
              // Specific monthly patterns
              /£\s*[\d,]+(?:\.\d{2})?\s*(?:pcm|per\s*month|pm|monthly|\/month)/i,
              // Weekly patterns
              /£\s*[\d,]+(?:\.\d{2})?\s*(?:pw|per\s*week|weekly|\/week)/i,
              // General currency patterns
              /£\s*[\d,]+(?:\.\d{2})?/i,
              // Numbers followed by pcm/pm
              /[\d,]+\s*(?:pcm|pm|per\s*month)/i,
              // Simple number patterns that might be prices
              /\b[\d,]{3,}\b/
            ];
            
            for (const regex of pricePatterns) {
              const match = elementText.match(regex);
              if (match) {
                price = match[0].includes('£') ? match[0] : `£${match[0]}`;
                logger.info(`Found price with regex: ${price}`);
                break;
              }
            }
          }
        } catch (error) {
          logger.warn('Error extracting price:', error);
        }
        
        // Clean up price format
        if (price && price !== 'Price on request') {
          price = price.replace(/\s+/g, ' ').trim();
          if (!price.includes('pcm') && !price.includes('pw') && !price.includes('week')) {
            price += ' pcm'; // Add pcm if not specified
          }
        }
        
        if (!price || price === 'Price on request') {
          price = 'Price on request';
        }
        
        // Extract bedrooms
        const bedroomMatch = elementText.match(/(\d+)\s*(?:bed|bedroom)/i);
        if (bedroomMatch) {
          bedrooms = `${bedroomMatch[1]} bedroom${bedroomMatch[1] !== '1' ? 's' : ''}`;
        }
        
        // Extract property type
        if (elementText.toLowerCase().includes('apartment')) propertyType = 'Apartment';
        else if (elementText.toLowerCase().includes('house')) propertyType = 'House';
        else if (elementText.toLowerCase().includes('flat')) propertyType = 'Flat';
        else if (elementText.toLowerCase().includes('studio')) propertyType = 'Studio';
        
        // Extract location with improved selectors
        try {
          const locationSelectors = ['.location', '.address', '.area', '.locality', '[data-testid*="location"]'];
          
          for (const selector of locationSelectors) {
            try {
              const locationElement = await element.$(selector);
              if (locationElement) {
                const locationText = await locationElement.textContent();
                if (locationText && locationText.trim().length > 3) {
                  location = locationText.trim();
                  break;
                }
              }
            } catch {
              continue;
            }
          }
          
          // Fallback to regex search for common UK locations
          if (!location) {
            const locationPatterns = [
              /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,?\s*(?:Leeds|London|Manchester|Birmingham|Liverpool|Sheffield|Bristol|Newcastle|Nottingham|Leicester|Coventry|Bradford|Salford|Cardiff|Edinburgh|Glasgow))/i,
              /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z][a-z]+)/i
            ];
            
            for (const regex of locationPatterns) {
              const match = elementText.match(regex);
              if (match) {
                location = match[1];
                break;
              }
            }
          }
        } catch (error) {
          console.warn('Error extracting location:', error);
        }
        
        if (!location) location = 'Location not specified';
        
        // Extract images
        const imageUrls: string[] = [];
        try {
          const images = await element.$$('img');
          for (const img of images.slice(0, 3)) { // Limit to 3 images per property
            const src = await img.getAttribute('src') || await img.getAttribute('data-src');
            if (src && !src.includes('placeholder') && !src.includes('icon') && !src.includes('logo')) {
              let fullUrl = src;
              if (src.startsWith('//')) fullUrl = 'https:' + src;
              else if (src.startsWith('/')) fullUrl = 'https://rentola.co.uk' + src;
              imageUrls.push(fullUrl);
            }
          }
        } catch (error) {
          logger.warn(`Failed to extract images for property ${i + 1}`);
        }
        
        // Get property detail link
        let propertyLink = 'https://rentola.co.uk';
        try {
          const linkElement = await element.$('a');
          if (linkElement) {
            const href = await linkElement.getAttribute('href');
            if (href) {
              propertyLink = href.startsWith('http') ? href : `https://rentola.co.uk${href}`;
            }
          }
        } catch {
          // Use default link
        }
        
        // Only add if we have meaningful data (stricter criteria for real data)
        const hasValidTitle = title && title.length > 10 && !title.toLowerCase().includes('property listing');
        const hasValidPrice = price && (price.includes('£') || price.toLowerCase().includes('price'));
        const hasValidLocation = location && location.length > 5 && location !== 'Location not specified';
        
        if (hasValidTitle && (hasValidPrice || hasValidLocation)) {
          logger.info(`Adding real Rentola property ${i + 1}: ${title.substring(0, 50)}...`);
          
          properties.push({
            title: title.substring(0, 200),
            price: price,
            location: location,
            bedrooms: bedrooms,
            propertyType: propertyType,
            imageUrls: imageUrls,
            agent: {
              name: 'Rentola Partner',
              email: 'info@rentola.co.uk',
              website: propertyLink
            }
          });
        } else {
          logger.info(`Skipping property ${i + 1} - insufficient real data (title: ${hasValidTitle}, price: ${hasValidPrice}, location: ${hasValidLocation})`);
        }
        
        // Early termination if we have enough good properties
        if (properties.length >= 20) {
          logger.info(`Reached target of 20 properties, stopping processing at element ${i + 1}`);
          break;
        }
      } catch (error) {
        logger.warn(`Error processing Rentola property ${i + 1}:`, error);
      }
    }
    
    // If we have fewer than 5 properties, that might indicate an issue
    if (properties.length < 5) {
      logger.warn(`Only found ${properties.length} properties. This might indicate:`);
      logger.warn('- Page structure has changed');
      logger.warn('- Selectors need updating');
      logger.warn('- Properties don\'t match search criteria');
    }

    logger.info(`Successfully scraped ${properties.length} properties from Rentola`);
    
    // Return only real scraped data (no mock data fallback)
    logger.info(`Returning ${properties.length} real Rentola properties (no mock data)`);
    
    return properties;

  } catch (error) {
    logger.error('Error scraping Rentola:', error);
    throw error;
  } finally {
    if (browser) {
      try {
        await browser.close();
        logger.info('Rentola browser closed');
      } catch (error) {
        logger.warn('Error closing Rentola browser:', error);
      }
    }
  }
}

/**
 * Build Rentola search URL from query parameters
 * @param query - Search query (e.g., "2 bedroom flats to rent in Manchester for 1200pcm")
 * @returns string - Formatted Rentola URL
 */
export function buildRentolaUrl(query: string): string {
  const q = query.toLowerCase();
  
  // Extract location
  const locationMatch = q.match(/in\s+([a-zA-Z\s,]+?)(?:\s+for|\s*$)/i);
  const location = locationMatch ? locationMatch[1].trim().replace(/\s+/g, '') : 'london';
  
  // Extract price
  const priceMatch = q.match(/(?:for\s+|up\s+to\s+|under\s+|max\s+)?£?(\d+)(?:k|pcm|pm|\/month)/i);
  let maxPrice = priceMatch ? parseInt(priceMatch[1]) : 1200;
  if (q.includes('k') && maxPrice < 10) {
    maxPrice = maxPrice * 1000;
  }
  
  // Extract bedrooms
  const bedroomMatch = q.match(/(\d+)\s*bed/i);
  const bedrooms = bedroomMatch ? bedroomMatch[1] : '2';
  
  // Build URL parameters matching the working format
  const params = new URLSearchParams();
  params.set('location', location);
  
  // Add both house and apartment types (like the working URL)
  params.append('property_types', 'house');
  params.append('property_types', 'apartment');
  
  // Set rent range
  params.set('rent', `0-${maxPrice}`);
  
  // Set size (keeping default)
  params.set('size', '0');
  
  // Set rooms range (matching the working format)
  params.set('rooms', `${bedrooms}-${bedrooms}`);
  
  const baseUrl = 'https://rentola.co.uk/property-to-rent';
  const finalUrl = `${baseUrl}?${params.toString()}`;
  
  logger.info(`Built Rentola URL: ${finalUrl}`);
  return finalUrl;
}