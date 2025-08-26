import { chromium } from 'playwright';
import type { Property } from '../scraper';

/**
 * Scrapes property listings from Facebook Marketplace
 * @param location - Location to search for properties
 * @param maxPrice - Maximum price filter
 * @param bedrooms - Number of bedrooms
 * @returns Promise<Property[]> - Array of property listings
 */
export async function scrapeFacebookMarketplace(location: string, maxPrice: number = 2000, bedrooms: string = '1'): Promise<Property[]> {
  const properties: Property[] = [];
  let browser;

  try {
    console.log('Starting Facebook Marketplace scraper...');
    console.log(`Searching for properties in ${location}, max £${maxPrice}, ${bedrooms} bedrooms`);

    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 }
    });

    const page = await context.newPage();
    
    // Build more specific Facebook Marketplace URL for UK property rentals
    const searchQuery = encodeURIComponent(`${bedrooms} bed flat rent ${location} UK £`);
    const fbUrl = `https://www.facebook.com/marketplace/${location.toLowerCase()}/search/?query=${searchQuery}&type=rentals&propertyType=rentals`;
    
    console.log('Navigating to Facebook Marketplace:', fbUrl);
    await page.goto(fbUrl, { waitUntil: 'domcontentloaded' });

    // Wait for listings to load with reduced timeout for speed
    try {
      await page.waitForSelector('[data-testid="marketplace-product-item"], .marketplace-list-item', { timeout: 6000 });
    } catch {
      console.log('No Facebook listings found or page structure changed');
      return properties;
    }

    // Quick scroll to load more listings
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(1500); // Reduced from 3000 to 1500

    // Extract property listings
    const listingElements = await page.$$('[data-testid="marketplace-product-item"], .marketplace-list-item, [role="article"]');
    console.log(`Found ${listingElements.length} potential Facebook listings`);

    let validCount = 0;
    for (let i = 0; i < listingElements.length && validCount < 3; i++) {
      const element = listingElements[i];
      
      try {
        // Extract title/description
        const title = await element.$eval('span[dir="auto"], .marketplace-product-title, h3', (el: Element) => el.textContent?.trim()).catch(() => '');
        
        // Extract price
        const price = await element.$eval('span:has-text("£"), .price', (el: Element) => el.textContent?.trim()).catch(() => '');
        
        // Extract location with better selectors
        const locationText = await element.$eval('[data-testid="location"], .location, span[dir="auto"]:nth-child(2)', (el: Element) => el.textContent?.trim()).catch(() => '');
        
        // Extract image
        const imageUrls: string[] = [];
        try {
          const imgElement = await element.$('img');
          if (imgElement) {
            const src = await imgElement.getAttribute('src');
            if (src && !src.includes('placeholder')) {
              imageUrls.push(src);
            }
          }
        } catch (error) {
          console.warn(`Failed to extract image for Facebook listing ${i + 1}`);
        }

        // Extract listing URL
        let listingUrl = '';
        try {
          const linkElement = await element.$('a[href*="/marketplace/item/"]');
          if (linkElement) {
            const href = await linkElement.getAttribute('href');
            if (href) {
              listingUrl = href.startsWith('http') ? href : `https://www.facebook.com${href}`;
            }
          }
        } catch (error) {
          console.warn(`Failed to extract URL for Facebook listing ${i + 1}`);
        }

        // Filter for rental properties and validate data with location check
        const isRental = (title?.toLowerCase().includes('rent') || 
                         title?.toLowerCase().includes('pcm') || 
                         title?.toLowerCase().includes('per month') ||
                         price?.toLowerCase().includes('pcm')) ?? false;
        
        // Check if location matches the search area (avoid international results)
        const isUKLocation = !locationText || 
                           locationText.toLowerCase().includes(location.toLowerCase()) ||
                           locationText.toLowerCase().includes('uk') ||
                           locationText.toLowerCase().includes('england') ||
                           locationText.toLowerCase().includes('yorkshire') ||
                           locationText.toLowerCase().includes('manchester') ||
                           locationText.toLowerCase().includes('london') ||
                           locationText.toLowerCase().includes('birmingham');
        
        const hasValidData = title && title.length > 10 && 
                           price && price.includes('£') &&
                           isRental && isUKLocation &&
                           !title.toLowerCase().includes('login') &&
                           !title.toLowerCase().includes('facebook');

        if (hasValidData) {
          console.log(`Adding Facebook listing ${i + 1}: ${title.substring(0, 50)}...`);
          validCount++;
          
          properties.push({
            title: title,
            price: price,
            location: locationText || `${location} area`,
            bedrooms: `${bedrooms} bedroom${bedrooms !== '1' ? 's' : ''}`,
            propertyType: 'Property',
            imageUrls: imageUrls,
            agent: {
              name: 'Facebook Marketplace',
              email: 'Contact via Facebook',
              website: listingUrl || 'https://www.facebook.com/marketplace'
            }
          });
        }
      } catch (error) {
        console.warn(`Error processing Facebook listing ${i + 1}:`, error);
      }
    }

    console.log(`Successfully scraped ${properties.length} properties from Facebook Marketplace`);
    return properties;

  } catch (error) {
    console.error('Error scraping Facebook Marketplace:', error);
    return properties; // Return partial results
  } finally {
    if (browser) {
      await browser.close();
      console.log('Browser closed');
    }
  }
}

/**
 * Parse query to extract Facebook search parameters
 * @param query - Natural language query
 * @returns Object with location, maxPrice, and bedrooms
 */
export function parseFacebookQuery(query: string): { location: string; maxPrice: number; bedrooms: string } {
  const q = query.toLowerCase();
  
  // Extract location
  const locationMatch = q.match(/in\s+([a-zA-Z\s,]+?)(?:\s+for|\s*$)/i);
  const location = locationMatch ? locationMatch[1].trim() : 'UK';
  
  // Extract price
  const priceMatch = q.match(/(?:for\s+|up\s+to\s+|under\s+|max\s+)?£?(\d+)(?:k|pcm|pm|\/month)/i);
  let maxPrice = priceMatch ? parseInt(priceMatch[1]) : 2000;
  if (q.includes('k') && maxPrice < 10) {
    maxPrice = maxPrice * 1000;
  }
  
  // Extract bedrooms
  const bedroomMatch = q.match(/(\d+)\s*bed/i);
  const bedrooms = bedroomMatch ? bedroomMatch[1] : '1';
  
  return { location, maxPrice, bedrooms };
}