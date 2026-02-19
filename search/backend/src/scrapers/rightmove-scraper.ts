import puppeteer from 'puppeteer';
import type { LaunchOptions } from 'puppeteer';
import * as cheerio from 'cheerio';
import { Property, getChromeExecutablePath } from '../scraper';

/**
 * Scrapes property listings from Rightmove
 * @param url - The Rightmove search URL to scrape
 * @param apiKey - API key for additional services (if needed)
 * @returns Promise<Property[]> - Array of property listings
 */
export async function scrapeRightmove(url: string, apiKey: string): Promise<Property[]> {
  const properties: Property[] = [];
  // Collect detail page URLs alongside items so we can enrich a limited set later
  const detailTargets: { index: number; url: string }[] = [];
  let browser;

  try {
    // Clean up and validate the URL
    const cleanUrl = url.replace(/manchester-under/, 'manchester');
    console.log('Original URL:', url);
    console.log('Cleaned URL:', cleanUrl);
    
    console.log('Launching browser...');
    // Get Chrome executable path dynamically
    const chromeExecutablePath = await getChromeExecutablePath();
    if (chromeExecutablePath) {
      console.log('Using Chrome executable for Rightmove:', chromeExecutablePath);
    }
    
    // Launch browser with robust error handling
    const launchOptions: LaunchOptions = {
      headless: true,
      executablePath: chromeExecutablePath,
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
        '--disable-features=TranslateUI,VizDisplayCompositor',
        '--disable-ipc-flooding-protection',
        '--disable-background-networking',
        '--disable-client-side-phishing-detection',
        '--disable-sync',
        '--disable-default-apps',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-images',
        '--disable-web-security',
        '--disable-speech-api',
        '--disable-notifications',
        '--window-size=1920x1080',
        '--single-process',
        '--data-path=/tmp/puppeteer_data_rm',
        '--homedir=/tmp',
        '--disk-cache-dir=/tmp/puppeteer_cache_rm',
        '--media-cache-dir=/tmp/puppeteer_media_cache_rm',
        '--aggressive-cache-discard',
        '--memory-pressure-off'
      ]
    };

    browser = await puppeteer.launch(launchOptions);

    console.log('Creating new page...');
    const page = await browser.newPage();

    // Set viewport and modern user agent
    await page.setViewport({ width: 1440, height: 900 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36');
    await page.setExtraHTTPHeaders({
      'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8'
    });
    // Lighten requests to reduce blocking and speed up
    try {
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        const resourceType = req.resourceType();
        if (['image', 'media', 'font', 'stylesheet'].includes(resourceType)) {
          req.abort();
        } else {
          req.continue();
        }
      });
    } catch {}

    // Set default timeout for all operations
    page.setDefaultTimeout(60000);
    page.setDefaultNavigationTimeout(60000);

    // Pre-warm homepage to set cookies (e.g., consent), then navigate to search URL
    try {
      await page.goto('https://www.rightmove.co.uk/', { waitUntil: 'domcontentloaded', timeout: 45000 });
      // Attempt to accept consent if present
      try {
        await page.waitForSelector('#onetrust-accept-btn-handler, .optanon-allow, button[aria-label*="Accept"]', { timeout: 3000 });
        await page.click('#onetrust-accept-btn-handler').catch(() => {});
        await page.click('.optanon-allow').catch(() => {});
      } catch {}
    } catch {}

    console.log('Navigating to URL...');
    // Navigate to URL with retry logic
    let retries = 3;
    while (retries > 0) {
      try {
        await page.setExtraHTTPHeaders({ referer: 'https://www.rightmove.co.uk/' });
        await page.goto(cleanUrl, {
          // Using domcontentloaded is more reliable with heavy third-party scripts
          waitUntil: 'domcontentloaded',
          timeout: 60000
        });
        break;
      } catch (error) {
        console.error(`Navigation failed, retries left: ${retries - 1}`, error);
        retries--;
        if (retries === 0) throw error;
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds before retry
      }
    }

    console.log('Waiting for content to load...');
    // Wait for initial page load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Try to wait for main Rightmove content containers to appear
    await Promise.race([
      page.waitForSelector('.l-searchResult', { timeout: 20000 }).catch(() => null),
      page.waitForSelector('.propertyCard', { timeout: 20000 }).catch(() => null),
      page.waitForSelector('[data-test*="property"]', { timeout: 20000 }).catch(() => null),
      page.waitForSelector('.searchHeader-resultCount', { timeout: 20000 }).catch(() => null),
      page.waitForSelector('#l-container', { timeout: 20000 }).catch(() => null)
    ]).catch(() => {
      console.log('Initial property selectors not found, waiting longer...');
    });

    // Additional wait for dynamic content and lazy loading
    console.log('Waiting for dynamic content to render...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Wait for images and other assets to start loading by checking if the page has loaded
    try {
      await page.waitForFunction(() => document.readyState === 'complete', { timeout: 10000 });
    } catch {
      console.log('Page complete state not reached within timeout, continuing...');
    }
    
    // Additional wait specifically for Rightmove's JavaScript to populate data
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Sprint 2 Phase 2: skip scroll when SEARCH_OPT_DISABLE_SCROLLING=true to save time
    const disableScrolling = process.env.SEARCH_OPT_DISABLE_SCROLLING === 'true';
    if (!disableScrolling) {
      console.log('Scrolling to load all images...');
      // Scroll down to trigger lazy loading of images and content
      await page.evaluate(() => {
        return new Promise((resolve) => {
          let scrollCount = 0;
          const maxScrolls = 8;
          const scrollInterval = setInterval(() => {
            window.scrollBy(0, window.innerHeight * 0.8);
            scrollCount++;
            if (scrollCount >= maxScrolls) {
              clearInterval(scrollInterval);
              // Scroll back to top to ensure all content is visible
              window.scrollTo(0, 0);
              // Wait for any final loading
              setTimeout(() => resolve(undefined), 2000);
            }
          }, 1000);
        });
      });
      // Additional wait after scrolling for content to stabilize
      console.log('Waiting for content to stabilize after scrolling...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('Getting page content...');
    // Get page content
    const content = await page.content();
    const $ = cheerio.load(content);
    
    console.log('Page title:', $('title').text());
    
    // Page loaded successfully
    
    // Check for error pages
    const pageTitle = $('title').text().toLowerCase();
    if (pageTitle.includes("couldn't find") || pageTitle.includes("error") || pageTitle.includes("not found")) {
      console.log('Error page detected. URL may be invalid or location not found.');
      console.log('Current URL:', await page.url());
      
      // Try to extract any helpful error messages
      const errorMessage = $('body').text();
      if (errorMessage.includes('location')) {
        console.log('Location-related error detected. Check location identifier.');
      }
      
      return [];
    }

    // Find all property cards - try multiple Rightmove selectors
    let propertyCards = $('.l-searchResult');
    
    // Try alternative selectors that Rightmove might use
    if (propertyCards.length === 0) {
      propertyCards = $('.propertyCard');
    }
    
    if (propertyCards.length === 0) {
      propertyCards = $('[data-test="property-result"]');
    }
    
    if (propertyCards.length === 0) {
      propertyCards = $('.property-card');
    }
    
    if (propertyCards.length === 0) {
      propertyCards = $('article');
    }
    
    if (propertyCards.length === 0) {
      propertyCards = $('[class*="property"]');
    }
    
    console.log(`Found ${propertyCards.length} property cards`);

    if (propertyCards.length === 0) {
      console.log('No property cards found. Checking page structure...');
      
      // Log some key elements to understand page structure
      console.log('Available elements with "property" in class:', $('[class*="property"]').length);
      console.log('Available elements with "result" in class:', $('[class*="result"]').length);
      console.log('Available elements with "card" in class:', $('[class*="card"]').length);
      
      // Check for specific Rightmove elements
      console.log('Elements with "propertyCard":', $('.propertyCard').length);
      console.log('Elements with "searchResult":', $('.searchResult').length);
      console.log('Elements with "listing":', $('.listing').length);
      
      // Log some sample classes
      const sampleClasses = $('div[class*="property"], div[class*="result"], div[class*="card"], div[class*="listing"]')
        .map((i, el) => $(el).attr('class'))
        .get()
        .slice(0, 15);
      console.log('Sample classes:', sampleClasses);
      
      // Check if there's a "no results" message
      const noResultsText = $('body').text().toLowerCase();
      if (noResultsText.includes('no properties') || noResultsText.includes('no results') || noResultsText.includes('0 properties')) {
        console.log('No results message detected in page content');
      }
      
      return [];
    }

    propertyCards.each((_i, el) => {
      try {
        const $el = $(el);
        
        // Extract title using multiple selectors - clean and limit length
        let title = $el.find('.propertyCard-title').text().trim() ||
                   $el.find('.propertyCard-details h2').text().trim() ||
                   $el.find('h2').text().trim() ||
                   $el.find('[data-test*="heading"]').text().trim() ||
                   $el.find('[class*="heading"]').text().trim() ||
                   $el.find('[class*="title"]').text().trim() ||
                   $el.find('a[data-test*="property"]').text().trim() ||
                   $el.find('a').first().text().trim() ||
                   $el.find('.propertyCard-address').text().trim();
        
        // Clean title: remove excessive text and take first meaningful part
        if (title.length > 100) {
          title = title.split(/[.!]/)[0].trim(); // Split on sentence endings
          if (title.length > 100) {
            title = title.substring(0, 97) + '...'; // Truncate if still too long
          }
        }
        
        // Extract price using multiple selectors and clean it
        let price = $el.find('.propertyCard-priceValue').text().trim() ||
                   $el.find('.propertyCard-price').text().trim() ||
                   $el.find('[data-test*="price"]').text().trim() ||
                   $el.find('[class*="price"]').text().trim() ||
                   $el.find('[class*="cost"]').text().trim() ||
                   $el.find('span').filter((i, span) => $(span).text().includes('£')).first().text().trim() ||
                   $el.find('div').filter((i, div) => $(div).text().includes('£')).first().text().trim();
        
        // Clean price: extract first price mention
        if (price && price.includes('£')) {
          const priceMatch = price.match(/£[\d,]+(?:\s*(?:pcm|per month|pw|per week))?/i);
          if (priceMatch) {
            price = priceMatch[0];
          }
        }
        
        // Extract location/address using multiple selectors
        let location = $el.find('.propertyCard-address').text().trim() ||
                        $el.find('.propertyCard-location').text().trim() ||
                        $el.find('[data-test*="address"]').text().trim() ||
                        $el.find('[class*="address"]').text().trim() ||
                        $el.find('[class*="location"]').text().trim() ||
                        $el.find('span').filter((i, span) => {
                          const text = $(span).text();
                          return text.length > 10 && !text.includes('£') && !text.includes('bed') && !text.includes('pcm');
                        }).first().text().trim();

        // Attempt to capture marketing note like "Reduced on ..." and append to location
        const reducedMatch = $el.text().match(/(Reduced on\s+\d{1,2}\/\d{1,2}\/\d{2,4}[^\n]*)/i) ||
                              $el.text().match(/(Added on\s+\d{1,2}\/\d{1,2}\/\d{2,4}[^\n]*)/i);
        if (reducedMatch) {
          const reducedText = reducedMatch[1].trim();
          location = location ? `${location} ${reducedText}` : reducedText;
        }
        
        // Extract bedroom info using multiple approaches
        const allText = $el.text();
        const bedroomText = $el.find('.propertyCard-details').text().trim() ||
                           $el.find('[data-test*="bed"]').text().trim() ||
                           $el.find('[class*="bed"]').text().trim() ||
                           title + ' ' + allText;
        
        let bedrooms = 'Not specified';
        // Try different bedroom patterns
        const bedroomPatterns = [
          /(\d+)\s*(?:bed|bedroom)/i,
          /(\d+)\s*bed/i,
          /(\d+)bed/i,
          /(\d+)\s*br/i,
          /(\d+)\s*bd/i
        ];
        
        for (const pattern of bedroomPatterns) {
          const match = bedroomText.match(pattern);
          if (match) {
            const count = parseInt(match[1]);
            bedrooms = count === 1 ? '1 bedroom' : `${count} bedrooms`;
            break;
          }
        }
        
        // Check for studio
        if (bedrooms === 'Not specified' && bedroomText.toLowerCase().includes('studio')) {
          bedrooms = 'Studio';
        }
        
        // Last resort: check for numbers in the title/text that might indicate bedrooms
        if (bedrooms === 'Not specified') {
          const numberMatch = allText.match(/\b([1-9])\b/);
          if (numberMatch && (allText.toLowerCase().includes('flat') || allText.toLowerCase().includes('apartment'))) {
            const num = parseInt(numberMatch[1]);
            if (num <= 6) { // Reasonable bedroom count
              bedrooms = num === 1 ? '1 bedroom' : `${num} bedrooms`;
            }
          }
        }
        
        // Extract property type from details
        let propertyType = 'Property';
        const propertyTypes = ['house', 'flat', 'apartment', 'bungalow', 'cottage', 'villa', 'townhouse', 'studio', 'maisonette', 'detached', 'semi-detached', 'terraced'];
        const detailsText = ($el.find('.propertyCard-details').text() + ' ' + title + ' ' + location).toLowerCase();
        
        for (const type of propertyTypes) {
          if (detailsText.includes(type)) {
            propertyType = type.charAt(0).toUpperCase() + type.slice(1);
            break;
          }
        }
        
        // Extract multiple images for each property
        const imageUrls: string[] = [];
        
        // Try multiple selectors for image extraction - prioritize Rightmove specific classes
        const $propertyImages = $el.find('.propertyCard-img img, .propertyCard-image img, .propertyCard-slideshow img, img[data-test*="property"], img[class*="property"]');
        $propertyImages.each((_imgIndex, imgEl) => {
          const imgSrc = $(imgEl).attr('src') || $(imgEl).attr('data-src') || $(imgEl).attr('data-lazy-src') || $(imgEl).attr('data-original');
          if (imgSrc && !imageUrls.includes(imgSrc)) {
            imageUrls.push(imgSrc);
          }
        });
        
        // If no images found, try alternative selectors but be more selective
        if (imageUrls.length === 0) {
          const $allImages = $el.find('img');
          $allImages.each((_imgIndex, imgEl) => {
            const imgSrc = $(imgEl).attr('src') || $(imgEl).attr('data-src') || $(imgEl).attr('data-original');
            const imgAlt = $(imgEl).attr('alt') || '';
            const imgClass = $(imgEl).attr('class') || '';
            
            // Only include images that seem to be property photos
            if (imgSrc && !imageUrls.includes(imgSrc) && 
                (!imgAlt.toLowerCase().includes('logo') && !imgClass.toLowerCase().includes('logo'))) {
              imageUrls.push(imgSrc);
            }
          });
        }
        
        // Clean and validate image URLs
        const validImageUrls = imageUrls
          .filter(url => url && url.trim() !== '')
          .map(url => {
            // Convert relative URLs to absolute URLs
            if (url.startsWith('//')) {
              return 'https:' + url;
            } else if (url.startsWith('/')) {
              return 'https://www.rightmove.co.uk' + url;
            }
            return url;
          })
          .filter(url => {
            // Filter out common non-property images
            const urlLower = url.toLowerCase();
            return !urlLower.includes('logo') && 
                   !urlLower.includes('icon') && 
                   !urlLower.includes('avatar') &&
                   !urlLower.includes('placeholder') &&
                   !urlLower.includes('sprite');
          });
        
        // Attempt to extract a listing URL for enrichment and agent website
        let listingUrl =
          $el.find('a[href*="/properties/"]').first().attr('href') ||
          $el.find('a.propertyCard-link').first().attr('href') ||
          $el.find('a[href]').first().attr('href') || '';

        if (listingUrl) {
          if (listingUrl.startsWith('//')) {
            listingUrl = 'https:' + listingUrl;
          } else if (listingUrl.startsWith('/')) {
            listingUrl = 'https://www.rightmove.co.uk' + listingUrl;
          }
        }

        // Extract agent information
        const agentText = $el.find('.propertyCard-contactsItem').text().trim() ||
                         $el.find('.propertyCard-branchLogo').attr('alt') ||
                         $el.find('.propertyCard-branchName').text().trim() ||
                         $el.find('[data-test*="agent"]').text().trim() ||
                         $el.find('[class*="agent"]').text().trim() ||
                         $el.find('[class*="branch"]').text().trim();
        
        // Clean agent name
        let agentName = agentText || 'Rightmove Agent';
        
        // Remove common prefixes and clean up
        agentName = agentName
          .replace(/^(Marketed by|Listed by|By)\s+/i, '')
          .replace(/\s*-\s*.*$/, '') // Remove everything after first dash
          .trim();
        
        if (!agentName || agentName.length < 2) {
          agentName = 'Rightmove Agent';
        }

        // Remove debug logging for production

        // Better data quality checks - require either title/location/price or substantial content
        const hasMinimalData = (title && title.length > 3) || 
                              (location && location.length > 3) || 
                              (price && price.includes('£'));
        
        const hasSubstantialContent = title.length > 10 || location.length > 10 || validImageUrls.length > 0;
        
        if (hasMinimalData && hasSubstantialContent) {
          // Clean up extracted data before adding
          const cleanTitle = title && title.length > 200 ? title.substring(0, 197) + '...' : title;
          const cleanLocation = location && location.length > 100 ? location.substring(0, 97) + '...' : location;
          
          const propertyIndex = properties.length;

          properties.push({
            title: cleanTitle || 'Property Listing',
            price: price || 'Price on Application',
            location: cleanLocation || 'Location not specified',
            bedrooms: bedrooms,
            propertyType: propertyType,
            imageUrls: validImageUrls.slice(0, 10), // Limit to 10 images max per property
            agent: {
              name: agentName,
              email: '', // Will be filled later with email lookup
              website: listingUrl || undefined
            }
          });

          // Track a limited number of items to enrich via detail pages
          if (listingUrl) {
            detailTargets.push({ index: propertyIndex, url: listingUrl });
          }
          
          console.log('Added property:', {
            title: cleanTitle || 'No title',
            price: price || 'No price',
            location: cleanLocation || 'No location',
            bedrooms,
            imageUrls: validImageUrls.length > 0 ? `Found ${validImageUrls.length} images` : 'No images found'
          });
        } else {
          console.log(`Skipped property ${_i + 1} - insufficient data (title: ${title?.length || 0} chars, location: ${location?.length || 0} chars, price: ${price ? 'found' : 'missing'})`);
        }
      } catch (itemError) {
        console.error('Error processing property item:', itemError);
      }
    });

    // Enrich a subset of properties by visiting their detail pages (without changing count)
    const MAX_ENRICH = 15;
    const targetsToEnrich = detailTargets.slice(0, MAX_ENRICH);
    for (const target of targetsToEnrich) {
      const { index, url: detailUrl } = target;
      try {
        console.log(`Enriching property [${index}] from detail page: ${detailUrl}`);
        await page.goto(detailUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

        // Give the page a moment to render dynamic sections
        await new Promise(resolve => setTimeout(resolve, 2000));

        const detailContent = await page.content();
        const $$ = cheerio.load(detailContent);

        const pageText = $$('body').text();

        // Extract better title, price, location
        const dTitle = ($$('h1').first().text().trim() || $$('[class*="title"]').first().text().trim());
        const dPrice = ($$('[class*="price"]').first().text().trim() || pageText.match(/£[\d,]+\s*(?:pcm|pw|per month|per week)?/i)?.[0] || '').trim();
        const dLocation = ($$('[class*="address"]').first().text().trim() || $$('[class*="location"]').first().text().trim());

        // Bedrooms and property type
        let dBedrooms: string | undefined;
        const dBedroomMatch = pageText.match(/(\d+)\s*(?:bed|bedroom)/i);
        if (dBedroomMatch) {
          const c = parseInt(dBedroomMatch[1]);
          dBedrooms = c === 1 ? '1 bedroom' : `${c} bedrooms`;
        } else if (pageText.toLowerCase().includes('studio')) {
          dBedrooms = 'Studio';
        }

        let dPropertyType: string | undefined;
        const typeCandidates = ['house','flat','apartment','bungalow','cottage','villa','townhouse','studio','maisonette','detached','semi-detached','terraced'];
        const textLower = pageText.toLowerCase();
        for (const t of typeCandidates) {
          if (textLower.includes(t)) {
            dPropertyType = t.charAt(0).toUpperCase() + t.slice(1);
            break;
          }
        }

        // Collect gallery images
        const detailImages: string[] = [];
        $$('.gallery img, [class*="image"] img, img[data-src], img[src]').each((_i2, imgEl) => {
          const src = $$(imgEl).attr('src') || $$(imgEl).attr('data-src') || $$(imgEl).attr('data-lazy-src') || '';
          if (src && !detailImages.includes(src)) {
            detailImages.push(src);
          }
        });
        const normalizedDetailImages = detailImages
          .map(u => u.startsWith('//') ? 'https:' + u : (u.startsWith('/') ? 'https://www.rightmove.co.uk' + u : u))
          .filter(u => u && !u.toLowerCase().includes('logo') && !u.toLowerCase().includes('icon'));

        // Merge into existing property
        const current = properties[index];
        if (!current) continue;

        properties[index] = {
          ...current,
          title: current.title && current.title.length > 10 ? current.title : (dTitle || current.title),
          price: current.price && current.price.includes('£') ? current.price : (dPrice || current.price),
          location: current.location && current.location !== 'Location not specified' ? current.location : (dLocation || current.location),
          bedrooms: current.bedrooms !== 'Not specified' ? current.bedrooms : (dBedrooms || current.bedrooms),
          propertyType: current.propertyType && current.propertyType !== 'Property' ? current.propertyType : (dPropertyType || current.propertyType),
          imageUrls: Array.from(new Set([...(current.imageUrls || []), ...normalizedDetailImages])).slice(0, 10),
          agent: {
            ...current.agent,
            website: current.agent.website || detailUrl,
          }
        };

      } catch (enrichErr) {
        console.warn(`Failed to enrich property at ${detailUrl}:`, enrichErr);
      }
    }

    // Final de-duplication: prefer unique agent.website when available, else by title|price|location signature
    const uniqueMap = new Map<string, Property>();
    for (const p of properties) {
      const key = (p.agent.website || '').toLowerCase() ||
        `${(p.title || '').toLowerCase()}|${(p.price || '').toLowerCase()}|${(p.location || '').toLowerCase()}`;
      if (!uniqueMap.has(key)) uniqueMap.set(key, p);
    }
    const uniqueList = Array.from(uniqueMap.values());

    console.log(`Successfully scraped ${uniqueList.length} properties from Rightmove`);
    return uniqueList;

  } catch (error) {
    console.error('Error scraping Rightmove:', error);
    throw error;
  } finally {
    if (browser) {
      try {
        console.log('Closing browser...');
        await browser.close();
      } catch (closeError) {
        console.error('Error closing browser:', closeError);
      }
    }
  }
}

/**
 * Builds a Rightmove URL from search parameters
 * @param query - Natural language search query
 * @returns string - Formatted Rightmove URL
 */
// Location identifier mapping for major UK cities
const LOCATION_IDENTIFIERS: Record<string, string> = {
  'london': 'REGION^87490',
  'manchester': 'REGION^61885',
  'salford': 'REGION^1164',
  'birmingham': 'REGION^2',
  // Leeds (West Yorkshire) correct region identifier
  'leeds': 'REGION^787',
  'liverpool': 'REGION^61282',
  'sheffield': 'REGION^61315',
  'bristol': 'REGION^6',
  'newcastle': 'REGION^61300',
  'nottingham': 'REGION^61304',
  'leicester': 'REGION^61273',
  'coventry': 'REGION^61223',
  'bradford': 'REGION^61203',
  'cardiff': 'REGION^8',
  'edinburgh': 'REGION^61143',
  'glasgow': 'REGION^74',
  'belfast': 'REGION^3',
  'cambridge': 'REGION^61214',
  'oxford': 'REGION^61305',
  'bath': 'REGION^61196',
  'york': 'REGION^61351'
};

export function buildRightmoveUrl(query: string, resolvedLocationIdentifier?: string): string {
  const q = query.toLowerCase();
  const isRental = q.includes('rent') || q.includes('pcm');
  // extract city name from "in <location>" pattern, stopping at common delimiters
  const inMatch = query.match(/in\s+([a-zA-Z\s]+?)(?:\s+(?:for|under|to|within|with|near)\b|$)/i);
  const locationPhrase = (inMatch ? inMatch[1] : '').trim();
  const locationWord = locationPhrase.split(/\s+/)[0].toLowerCase();
  const locationIdentifier = resolvedLocationIdentifier || LOCATION_IDENTIFIERS[locationWord];

  // bedrooms
  const bedMatch = q.match(/(\d+)\s*bed/i);
  const bedrooms = bedMatch ? parseInt(bedMatch[1]) : 2;

  // price
  let maxPrice = 0;
  const priceK = q.match(/(\d+)\s*k/);
  const priceNum = q.match(/(\d{3,6})/);
  if (isRental) {
    const pcm = q.match(/(\d{2,5})\s*pcm/);
    maxPrice = pcm ? parseInt(pcm[1]) : (priceNum ? parseInt(priceNum[1]) : 1250);
  } else {
    maxPrice = priceK ? parseInt(priceK[1]) * 1000 : (priceNum ? parseInt(priceNum[1]) : 500000);
  }

  const params = new URLSearchParams();
  // Rightmove infers context from the path, so avoid deprecated/ambiguous params like searchType/channel/transactionType
  if (locationIdentifier) {
    // Signal that we prefer the canonical identifier when present
    params.set('useLocationIdentifier', 'true');
    params.set('locationIdentifier', locationIdentifier);
  } else if (locationPhrase) {
    // Only use textual location when we don't have an identifier
    params.set('searchLocation', locationPhrase);
  }
  // Always include searchLocation for better canonicalization and to help Rightmove match text even with identifier
  if (locationPhrase && !params.has('searchLocation')) {
    params.set('searchLocation', locationPhrase);
  }
  params.set('minBedrooms', String(bedrooms));
  params.set('maxBedrooms', String(bedrooms));
  params.set('maxPrice', String(maxPrice));
  if (/(flat|apartment)/i.test(query)) {
    params.set('propertyTypes', 'flat');
  }
  params.set('radius', '0.0');
  params.set('index', '0');
  params.set('sortType', '6');
  // Exclude let agreed to avoid empty results where applicable
  if (isRental) {
    params.set('includeLetAgreed', 'false');
  }

  const base = isRental
    ? 'https://www.rightmove.co.uk/property-to-rent/find.html'
    : 'https://www.rightmove.co.uk/property-for-sale/find.html';
  const url = `${base}?${params.toString()}`;
  console.log('Generated dynamic Rightmove URL:', url);
  return url;
}