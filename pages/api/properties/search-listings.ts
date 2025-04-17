import { NextApiRequest, NextApiResponse } from 'next';
import * as cheerio from 'cheerio';
import { Property } from '../../../src/components/viewings/context/BookViewingContext';

const RIGHTMOVE_SEARCH_URL_PATTERN = /^https?:\/\/(www\.)?rightmove\.co\.uk\/(property-for-sale|property-to-rent|properties|find).*$/;
const ZOOPLA_SEARCH_URL_PATTERN = /^https?:\/\/(www\.)?zoopla\.co\.uk\/(for-sale|to-rent)\/.*$/;
const OPENRENT_SEARCH_URL_PATTERN = /^https?:\/\/(www\.)?openrent\.co\.uk\/properties-to-rent\/.*$/;

interface PropertyParser {
  selector: string;
  extract: ($: ReturnType<typeof cheerio.load>, element: cheerio.Element) => Property | null;
  baseUrl: string;
}

const PARSERS: Record<string, PropertyParser> = {
  rightmove: {
    selector: '[data-test="propertyCard"]',
    baseUrl: 'https://www.rightmove.co.uk',
    extract: ($: ReturnType<typeof cheerio.load>, element: cheerio.Element): Property | null => {
      const $element = $(element);
      const price = $element.find('[data-test="propertyPrice"]').text().trim();
      const title = $element.find('[data-test="propertyTitle"]').text().trim();
      const location = $element.find('[data-test="propertySubtitle"]').text().trim();
      const image = $element.find('img[data-test="propertyImage"]').attr('src') || '';
      const propertyUrl = $element.find('a[data-test="propertyCard-link"]').attr('href');
      
      if (!price || !title) return null;

      // Extract specs from the property features
      const specs = {
        beds: parseInt($element.find('[data-test="propertyBedrooms"]').text()) || 0,
        baths: parseInt($element.find('[data-test="propertyBathrooms"]').text()) || 0,
        area: $element.find('[data-test="propertyFloorArea"]').text().trim() || 'N/A'
      };

      return {
        id: `rm-${Date.now()}-${Math.random()}`,
        price,
        title,
        location,
        image: image.startsWith('http') ? image : `${PARSERS.rightmove.baseUrl}${image}`,
        specs,
        propertyUrl: propertyUrl ? `${PARSERS.rightmove.baseUrl}${propertyUrl}` : undefined
      };
    }
  },
  zoopla: {
    selector: '[data-testid="regular-listing"]',
    baseUrl: 'https://www.zoopla.co.uk',
    extract: ($: ReturnType<typeof cheerio.load>, element: cheerio.Element): Property | null => {
      const $element = $(element);
      const price = $element.find('[data-testid="listing-price"]').text().trim();
      const title = $element.find('[data-testid="listing-title"]').text().trim();
      const location = $element.find('[data-testid="listing-location"]').text().trim();
      const image = $element.find('img').first().attr('src') || '';
      const propertyUrl = $element.find('a').first().attr('href');
      
      if (!price || !title) return null;

      // Extract specs from the listing details
      const specs = {
        beds: parseInt($element.find('[data-testid="listing-spec-beds"] span').first().text()) || 0,
        baths: parseInt($element.find('[data-testid="listing-spec-baths"] span').first().text()) || 0,
        area: $element.find('[data-testid="listing-spec-floorArea"] span').first().text().trim() || 'N/A'
      };

      return {
        id: `zp-${Date.now()}-${Math.random()}`,
        price,
        title,
        location,
        image: image.startsWith('http') ? image : `${PARSERS.zoopla.baseUrl}${image}`,
        specs,
        propertyUrl: propertyUrl ? `${PARSERS.zoopla.baseUrl}${propertyUrl}` : undefined
      };
    }
  },
  openrent: {
    selector: '.property-box',
    baseUrl: 'https://www.openrent.co.uk',
    extract: ($: ReturnType<typeof cheerio.load>, element: cheerio.Element): Property | null => {
      const $element = $(element);
      const titleElement = $element.find('.banda a');
      const price = $element.find('.price').text().trim().split('per')[0].trim();
      const title = titleElement.text().trim();
      const location = $element.find('.location').text().trim();
      const image = $element.find('.mainImage').attr('src') || '';
      const propertyUrl = titleElement.attr('href');
      
      if (!price || !title) return null;

      // Extract specs from the description
      const description = $element.find('.description').text().trim();
      const bedsMatch = description.match(/(\d+)\s*(?:double\s*)?bed/i);
      const bathsMatch = description.match(/(\d+)\s*bath/i);
      
      const specs = {
        beds: bedsMatch ? parseInt(bedsMatch[1]) : 0,
        baths: bathsMatch ? parseInt(bathsMatch[1]) : 0,
        area: 'N/A' // OpenRent typically doesn't show area in search results
      };

      return {
        id: `or-${Date.now()}-${Math.random()}`,
        price,
        title,
        location,
        image: image.startsWith('http') ? image : `${PARSERS.openrent.baseUrl}${image}`,
        specs,
        propertyUrl: propertyUrl ? `${PARSERS.openrent.baseUrl}${propertyUrl}` : undefined
      };
    }
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { searchUrl } = req.body;
    console.log('Received search URL:', searchUrl);
    
    if (!searchUrl) {
      return res.status(400).json({ message: 'Search URL is required' });
    }

    // Validate URL format
    try {
      new URL(searchUrl);
    } catch (error) {
      return res.status(400).json({ message: 'Invalid URL format' });
    }
    
    // Determine which parser to use
    let parser: PropertyParser | undefined;
    let parserName = '';

    if (RIGHTMOVE_SEARCH_URL_PATTERN.test(searchUrl)) {
      parser = PARSERS.rightmove;
      parserName = 'rightmove';
    } else if (ZOOPLA_SEARCH_URL_PATTERN.test(searchUrl)) {
      parser = PARSERS.zoopla;
      parserName = 'zoopla';
    } else if (OPENRENT_SEARCH_URL_PATTERN.test(searchUrl)) {
      parser = PARSERS.openrent;
      parserName = 'openrent';
    }

    if (!parser) {
      console.log('URL pattern matching results:', {
        rightmove: RIGHTMOVE_SEARCH_URL_PATTERN.test(searchUrl),
        zoopla: ZOOPLA_SEARCH_URL_PATTERN.test(searchUrl),
        openrent: OPENRENT_SEARCH_URL_PATTERN.test(searchUrl)
      });
      return res.status(400).json({ 
        message: 'Invalid property search URL format. Only Rightmove, Zoopla, and OpenRent URLs are supported.' 
      });
    }

    console.log(`Using ${parserName} parser for URL:`, searchUrl);

    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"macOS"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
      'Connection': 'keep-alive'
    };

    // Add site-specific headers
    if (parserName === 'rightmove') {
      headers['Referer'] = 'https://www.rightmove.co.uk/';
    } else if (parserName === 'zoopla') {
      headers['Referer'] = 'https://www.zoopla.co.uk/';
    } else if (parserName === 'openrent') {
      headers['Referer'] = 'https://www.openrent.co.uk/';
    }

    const response = await fetch(searchUrl, { headers });

    console.log('Fetch response status:', response.status);
    console.log('Fetch response headers:', response.headers);

    if (!response.ok) {
      if (response.status === 403) {
        console.error('Access forbidden - possible bot detection');
        return res.status(403).json({ 
          message: 'Unable to access the property site. This might be due to rate limiting or bot detection.' 
        });
      }
      if (response.status === 404) {
        console.error('Page not found');
        return res.status(404).json({ 
          message: 'The property listing page could not be found. The URL might be invalid or the listing may have been removed.' 
        });
      }
      console.error('Failed to fetch:', response.status, response.statusText);
      throw new Error(`Failed to fetch search results: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    console.log('HTML received, length:', html.length);
    
    if (html.length < 1000) {
      console.warn('Suspiciously short HTML response:', html);
      return res.status(403).json({ 
        message: 'Received an invalid response from the property site. This might be due to rate limiting or bot detection.' 
      });
    }

    console.log('First 500 chars of HTML:', html.substring(0, 500));
    
    const $ = cheerio.load(html);
    const properties: Property[] = [];
    
    // Get first 3 regular listings
    const listings = $(parser.selector);
    console.log(`Found ${listings.length} listings with selector "${parser.selector}"`);
    
    if (listings.length === 0) {
      // Log a sample of the HTML structure to help debug selector issues
      console.log('HTML structure sample:');
      $('body').children().slice(0, 3).each((_, el) => {
        console.log($(el).prop('tagName'), $(el).attr('class') || 'no-class');
      });
      return res.status(404).json({ message: 'No property listings found' });
    }

    listings.each((index: number, element: cheerio.Element) => {
      try {
        const property = parser.extract($, element);
        if (property) {
          console.log(`Successfully extracted property ${index + 1}:`, {
            title: property.title,
            price: property.price,
            location: property.location,
            specs: property.specs
          });
          properties.push(property);
        } else {
          console.log(`Failed to extract property ${index + 1} - missing required fields`);
        }
      } catch (error) {
        console.error(`Error extracting property ${index + 1}:`, error);
      }
      if (properties.length >= 3) return false;
    });

    if (properties.length === 0) {
      console.log('No valid properties found');
      return res.status(404).json({ message: 'No valid property data could be extracted' });
    }

    console.log('Returning properties:', properties.length);
    res.status(200).json(properties);
  } catch (error) {
    console.error('Error processing property search:', error);
    res.status(500).json({ 
      message: 'Error processing property search',
      error: (error as Error).message 
    });
  }
} 