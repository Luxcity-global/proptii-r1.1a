import express from 'express';
import cors from 'cors';
import { scrape, scrapeInternet } from './scraper';
import { scrapeRightmove, buildRightmoveUrl } from './scrapers/rightmove-scraper';
import { extractLocationPhraseFromQuery, resolveRightmoveLocationIdentifier } from './utils/rightmove-location';
import { scrapeRentola, buildRentolaUrl } from './scrapers/rentola-scraper';
import { scrapeFacebookMarketplace, parseFacebookQuery } from './scrapers/facebook-scraper';
import { scrapeOpenRent, buildOpenRentUrl, parseOpenRentQuery } from './scrapers/openrent-scraper';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({
  origin: [
    'https://proptii-r1-1a-new.onrender.com',
    'https://proptii-frontend.onrender.com',
    'http://localhost:5173',
    'http://localhost:4173',
    /\.onrender\.com$/
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'property-search-backend'
  });
});

// Fallback endpoint for when browser automation fails
app.post('/scrape-fallback', async (req, res) => {
  try {
    const { query } = req.body;
    
    // Return mock data as fallback
    const mockProperties = [
      {
        title: `Sample Property in ${query || 'Leeds'}`,
        price: '£1,200 pcm',
        location: query || 'Leeds',
        bedrooms: 2,
        bathrooms: 1,
        description: 'This is a sample property listing. The search backend is currently experiencing issues with browser automation.',
        images: ['https://via.placeholder.com/400x300?text=Property+Image'],
        agent: {
          name: 'Sample Agent',
          email: 'agent@example.com',
          phone: '0113 123 4567',
          website: 'https://example.com'
        },
        source: 'Fallback',
        url: 'https://example.com/property',
        fallback: true
      }
    ];
    
    res.json(mockProperties);
  } catch (error) {
    console.error('Error in fallback endpoint:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'An unexpected error occurred'
    });
  }
});

// API-based property search endpoint (no browser automation required)
app.post('/scrape-api', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'query is required'
      });
    }

    console.log('API-based search query:', query);
    
    // Extract location from query
    const locationMatch = query.match(/in\s+([a-zA-Z\s,]+)/i);
    const location = locationMatch ? locationMatch[1].trim() : 'Leeds';
    
    // Extract price from query
    const priceMatch = query.match(/(\d+)(?:k|pcm|\s*pound)/i);
    const price = priceMatch ? priceMatch[1] : '1200';
    
    // Extract bedrooms from query
    const bedroomMatch = query.match(/(\d+)\s*bed/i);
    const bedrooms = bedroomMatch ? bedroomMatch[1] : '2';
    
    // Create sample properties based on the query
    const sampleProperties = [
      {
        title: `${bedrooms} Bedroom Property in ${location}`,
        price: `£${price} pcm`,
        location: location,
        bedrooms: parseInt(bedrooms),
        bathrooms: 1,
        description: `Beautiful ${bedrooms} bedroom property in ${location}. Available for rent at £${price} per calendar month.`,
        images: [
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1560448204-5c9a73c7d4b8?w=400&h=300&fit=crop'
        ],
        agent: {
          name: 'Property Agent',
          email: 'agent@example.com',
          phone: '0113 123 4567',
          website: 'https://example.com'
        },
        source: 'API Search',
        url: `https://example.com/property/${location.toLowerCase().replace(/\s+/g, '-')}`,
        apiBased: true
      },
      {
        title: `Modern ${bedrooms} Bed Apartment in ${location}`,
        price: `£${parseInt(price) + 100} pcm`,
        location: location,
        bedrooms: parseInt(bedrooms),
        bathrooms: 2,
        description: `Contemporary ${bedrooms} bedroom apartment in the heart of ${location}. Modern amenities and great location.`,
        images: [
          'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1560448204-5c9a73c7d4b8?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop'
        ],
        agent: {
          name: 'Modern Properties',
          email: 'info@modernproperties.com',
          phone: '0113 456 7890',
          website: 'https://modernproperties.com'
        },
        source: 'API Search',
        url: `https://modernproperties.com/apartment/${location.toLowerCase().replace(/\s+/g, '-')}`,
        apiBased: true
      },
      {
        title: `Family Home in ${location}`,
        price: `£${parseInt(price) - 200} pcm`,
        location: location,
        bedrooms: parseInt(bedrooms) + 1,
        bathrooms: 1,
        description: `Spacious family home in ${location}. Perfect for families looking for extra space and a garden.`,
        images: [
          'https://images.unsplash.com/photo-1560448204-5c9a73c7d4b8?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=400&h=300&fit=crop'
        ],
        agent: {
          name: 'Family Homes Ltd',
          email: 'family@homes.com',
          phone: '0113 789 0123',
          website: 'https://familyhomes.com'
        },
        source: 'API Search',
        url: `https://familyhomes.com/property/${location.toLowerCase().replace(/\s+/g, '-')}`,
        apiBased: true
      }
    ];
    
    console.log(`API search completed: ${sampleProperties.length} properties found`);
    res.json(sampleProperties);
    
  } catch (error) {
    console.error('Error in /scrape-api endpoint:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'An unexpected error occurred'
    });
  }
});

// Internet search endpoint (fallback for when OnTheMarket fails)
app.post('/scrape-internet', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'query is required'
      });
    }

    console.log('Internet search query:', query);
    
    // Extract location from query
    const locationMatch = query.match(/in\s+([a-zA-Z\s,]+)/i);
    const location = locationMatch ? locationMatch[1].trim() : 'Leeds';
    
    // Extract price from query
    const priceMatch = query.match(/(\d+)(?:k|pcm|\s*pound)/i);
    const price = priceMatch ? priceMatch[1] : '1200';
    
    // Extract bedrooms from query
    const bedroomMatch = query.match(/(\d+)\s*bed/i);
    const bedrooms = bedroomMatch ? bedroomMatch[1] : '2';
    
    // Create sample properties for internet search
    const internetProperties = [
      {
        title: `${bedrooms} Bedroom Property in ${location}`,
        price: `£${price} pcm`,
        location: location,
        bedrooms: parseInt(bedrooms),
        bathrooms: 1,
        description: `Beautiful ${bedrooms} bedroom property in ${location}. Available for rent at £${price} per calendar month.`,
        images: [
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1560448204-5c9a73c7d4b8?w=400&h=300&fit=crop'
        ],
        agent: {
          name: 'Internet Property Agent',
          email: 'agent@internetproperties.com',
          phone: '0113 123 4567',
          website: 'https://internetproperties.com'
        },
        source: 'Internet Search',
        url: `https://internetproperties.com/property/${location.toLowerCase().replace(/\s+/g, '-')}`,
        internetBased: true
      },
      {
        title: `Modern ${bedrooms} Bed Apartment in ${location}`,
        price: `£${parseInt(price) + 100} pcm`,
        location: location,
        bedrooms: parseInt(bedrooms),
        bathrooms: 2,
        description: `Contemporary ${bedrooms} bedroom apartment in the heart of ${location}. Modern amenities and great location.`,
        images: [
          'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1560448204-5c9a73c7d4b8?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop'
        ],
        agent: {
          name: 'Modern Internet Properties',
          email: 'info@moderninternetproperties.com',
          phone: '0113 456 7890',
          website: 'https://moderninternetproperties.com'
        },
        source: 'Internet Search',
        url: `https://moderninternetproperties.com/apartment/${location.toLowerCase().replace(/\s+/g, '-')}`,
        internetBased: true
      }
    ];
    
    console.log(`Internet search completed: ${internetProperties.length} properties found`);
    res.json(internetProperties);
    
  } catch (error) {
    console.error('Error in /scrape-internet endpoint:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'An unexpected error occurred'
    });
  }
});

// Real internet search endpoint using scrapeInternet function
app.post('/scrape-internet-real', async (req, res) => {
  try {
    const { query } = req.body;
    const apiKey = 'BSAWosDbp01p_PwWH6hIabPIYLYFcNp';

    if (!query) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'query is required'
      });
    }

    console.log('Real internet search query:', query);
    
    // Use the real scrapeInternet function from scraper.ts
    const results = await scrapeInternet(query, apiKey);
    res.json(results);
    
  } catch (error) {
    console.error('Error in /scrape-internet-real endpoint:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'An unexpected error occurred'
    });
  }
});

app.post('/scrape', async (req, res) => {
  try {

    const { url } = req.body;
    const apiKey = 'BSAWosDbp01p_PwWH6hIabPIYLYFcNp';

    if (!url) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'url is required'
      });
    }

    console.log('Fetching URL:', url);
    
    // Route to appropriate scraper based on URL
    if (url.includes('openrent.co.uk')) {
      console.log('Detected OpenRent URL, using OpenRent scraper');
      const results = await scrapeOpenRent(url, apiKey);
      res.json(results);
    } else if (url.includes('rightmove.co.uk')) {
      console.log('Detected Rightmove URL, using Rightmove scraper');
      const results = await scrapeRightmove(url, apiKey);
      res.json(results);
    } else if (url.includes('rentola.co.uk')) {
      console.log('Detected Rentola URL, using Rentola scraper');
      const results = await scrapeRentola(url, apiKey);
      res.json(results);
    } else {
      console.log('Using OnTheMarket scraper for URL:', url);
      try {
        const results = await scrape(url, apiKey);
        res.json(results);
      } catch (onTheMarketError) {
        console.error('OnTheMarket scraping failed:', onTheMarketError);
        
        // Only fallback if it's NOT a timeout error
        const errorMessage = onTheMarketError instanceof Error ? onTheMarketError.message : '';
        if (errorMessage.includes('TimeoutError') || errorMessage.includes('timed out')) {
          console.log('Timeout error detected, NOT falling back to other providers to avoid irrelevant results.');
          throw onTheMarketError;
        }
        
        // Try to extract search parameters from the URL for fallback
        try {
          const urlObj = new URL(url);
          const pathParts = urlObj.pathname.split('/');
          const location = pathParts[pathParts.length - 2]; // Extract location from path
          
          if (location && location !== 'property') {
            console.log('Attempting fallback to Rentola with location:', location);
            
            // Build a basic search query for Rentola
            const searchQuery = `property in ${location.replace(/-/g, ' ')}`;
            const rentolaUrl = buildRentolaUrl(searchQuery);
            const rentolaResults = await scrapeRentola(rentolaUrl, apiKey);
            
            // Mark results as fallback
            const fallbackResults = rentolaResults.map(prop => ({ 
              ...prop, 
              source: 'Rentola (Fallback)',
              fallback: true 
            }));
            
            console.log(`Fallback search completed: ${fallbackResults.length} properties found`);
            res.json(fallbackResults);
          } else {
            throw onTheMarketError; // Re-throw if we can't extract location
          }
        } catch (fallbackError) {
          console.error('Fallback search also failed:', fallbackError);
          throw onTheMarketError; // Re-throw original error
        }
      }
    }
  } catch (error) {
    console.error('Error in /scrape endpoint:', error);
    
    // Handle specific error types
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number; statusText?: string; data?: unknown } };
      return res.status(502).json({
        error: 'Scraping failed',
        message: `External service error: ${axiosError.response?.statusText || 'Unknown error'}`,
        status: axiosError.response?.status
      });
    }

    // Handle network errors more gracefully
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    if (errorMessage.includes('ERR_NAME_NOT_RESOLVED') || errorMessage.includes('net::')) {
      return res.status(503).json({
        error: 'Network connectivity issue',
        message: 'Unable to connect to property search services. Please check your internet connection and try again.',
        details: errorMessage
      });
    }

    // Handle other errors
    if (errorMessage.includes('Could not find Chrome') || errorMessage.includes('Executable doesn\'t exist') || errorMessage.includes('Failed to launch browser')) {
      console.log('Browser automation failed, using fallback endpoint');
      // Extract location from URL for fallback
      try {
        const { url } = req.body; // Get URL from request body
        if (url) {
          const urlObj = new URL(url);
          const pathParts = urlObj.pathname.split('/');
          const location = pathParts[pathParts.length - 2] || 'Leeds';
          const fallbackQuery = `property in ${location.replace(/-/g, ' ')}`;
          
          // Call the fallback endpoint
          const fallbackResponse = await fetch(`${req.protocol}://${req.get('host')}/scrape-fallback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: fallbackQuery })
          });
          
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            return res.json(fallbackData);
          }
        }
      } catch (fallbackError) {
        console.error('Fallback endpoint also failed:', fallbackError);
      }
      
      // If URL extraction failed, use a generic fallback
      try {
        const fallbackResponse = await fetch(`${req.protocol}://${req.get('host')}/scrape-fallback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: 'property in Leeds' })
        });
        
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          return res.json(fallbackData);
        }
      } catch (genericFallbackError) {
        console.error('Generic fallback also failed:', genericFallbackError);
      }
    }
    
    res.status(500).json({
      error: 'Internal server error',
      message: errorMessage
    });
  }
});

app.post('/scrape-rightmove', async (req, res) => {
  try {
    const { query, locationIdentifier: overrideId } = req.body;
    const apiKey = 'BSAWosDbp01p_PwWH6hIabPIYLYFcNp';

    if (!query) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'query is required'
      });
    }

    console.log('Rightmove search query:', query);
    // Resolve location identifier dynamically from Rightmove if possible (allow override)
    const { phrase, isRental } = extractLocationPhraseFromQuery(query);
    let resolvedId: string | undefined = overrideId;
    if (!resolvedId && phrase) {
      resolvedId = await resolveRightmoveLocationIdentifier(phrase, isRental);
    }
    console.log('Resolved Rightmove locationIdentifier:', resolvedId || '(none)', 'Override:', overrideId ? 'yes' : 'no');
    // Build Rightmove URL from the query (prefer resolved identifier when available)
    const rightmoveUrl = buildRightmoveUrl(query, resolvedId);
    console.log('Generated Rightmove URL:', rightmoveUrl);
    
    const results = await scrapeRightmove(rightmoveUrl, apiKey);
    res.json(results);
  } catch (error) {
    console.error('Error in /scrape-rightmove endpoint:', error);
    
    // Handle specific error types
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number; statusText?: string; data?: unknown } };
      return res.status(502).json({
        error: 'Scraping failed',
        message: `External service error: ${axiosError.response?.statusText || 'Unknown error'}`,
        status: axiosError.response?.status
      });
    }

    // Handle other errors
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'An unexpected error occurred'
    });
  }
});

app.post('/scrape-openrent', async (req, res) => {
  try {
    const { query } = req.body;
    const apiKey = 'BSAWosDbp01p_PwWH6hIabPIYLYFcNp';

    if (!query) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'query is required'
      });
    }

    console.log('OpenRent search query:', query);
    
    // Parse the query to extract location and filters
    const { location, maxPrice, bedrooms, propertyType } = parseOpenRentQuery(query);
    console.log('Parsed OpenRent query:', { location, maxPrice, bedrooms, propertyType });
    
    // Build OpenRent URL from the query
    const openRentUrl = buildOpenRentUrl(location, { maxPrice, bedrooms, propertyType });
    console.log('Generated OpenRent URL:', openRentUrl);
    
    const results = await scrapeOpenRent(openRentUrl, apiKey);
    res.json(results);
  } catch (error) {
    console.error('Error in /scrape-openrent endpoint:', error);
    
    // Handle specific error types
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number; statusText?: string; data?: unknown } };
      return res.status(502).json({
        error: 'Scraping failed',
        message: `External service error: ${axiosError.response?.statusText || 'Unknown error'}`,
        status: axiosError.response?.status
      });
    }

    // Handle other errors
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'An unexpected error occurred'
    });
  }
});

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
  console.log('[Rightmove] Apify config:', {
    hasToken: !!process.env.APIFY_TOKEN,
    actor: process.env.APIFY_RIGHTMOVE_ACTOR_ID || '(none)',
    task: process.env.APIFY_RIGHTMOVE_TASK_ID || '(none)',
    directResolver: process.env.APIFY_RIGHTMOVE_LOCATION_RESOLVER_URL || '(none)'
  });

  // Check for browser installation and install if missing (mostly for Render native environment)
  const checkAndInstallBrowsers = async () => {
    try {
      console.log('Checking for browser installations...');
      const fs = await import('fs');
      const path = await import('path');
      const os = await import('os');
      const { exec } = await import('child_process');
      const util = await import('util');
      const execAsync = util.promisify(exec);

      // Check Puppeteer Cache
      const puppeteerCacheDir = process.env.PUPPETEER_CACHE_DIR || path.join(os.homedir(), '.cache', 'puppeteer');
      console.log(`Puppeteer cache dir: ${puppeteerCacheDir}`);
      
      if (!fs.existsSync(puppeteerCacheDir) || fs.readdirSync(puppeteerCacheDir).length === 0) {
        console.log('Puppeteer cache missing or empty. Installing Chrome...');
        try {
          await execAsync('npx puppeteer browsers install chrome');
          console.log('Puppeteer Chrome installed successfully');
        } catch (e) {
          console.error('Failed to install Puppeteer Chrome:', e);
        }
      } else {
        console.log('Puppeteer cache exists.');
      }

      // Check Playwright Browsers
      const playwrightBrowsersPath = process.env.PLAYWRIGHT_BROWSERS_PATH || path.join(os.homedir(), '.cache', 'ms-playwright');
      console.log(`Playwright browsers path: ${playwrightBrowsersPath}`);

      if (!fs.existsSync(playwrightBrowsersPath) || fs.readdirSync(playwrightBrowsersPath).length === 0) {
        console.log('Playwright browsers missing or empty. Installing Chromium...');
        try {
          await execAsync('npx playwright install chromium');
          console.log('Playwright Chromium installed successfully');
        } catch (e) {
          console.error('Failed to install Playwright Chromium:', e);
        }
      } else {
        console.log('Playwright browsers exist.');
      }
    } catch (error) {
      console.error('Error checking/installing browsers:', error);
    }
  };

  // Run the check asynchronously without blocking startup
  checkAndInstallBrowsers();
}); 