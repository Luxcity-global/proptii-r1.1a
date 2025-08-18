import express from 'express';
import cors from 'cors';
import { scrape, scrapeInternet } from './scraper';
import { scrapeRightmove, buildRightmoveUrl } from './scrapers/rightmove-scraper';
import { extractLocationPhraseFromQuery, resolveRightmoveLocationIdentifier } from './utils/rightmove-location';
import { scrapeRentola, buildRentolaUrl } from './scrapers/rentola-scraper';
import { scrapeFacebookMarketplace, parseFacebookQuery } from './scrapers/facebook-scraper';
import { scrapeOpenRent, buildOpenRentUrl, parseOpenRentQuery } from './scrapers/openrent-scraper';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

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
      const results = await scrape(url, apiKey);
      res.json(results);
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

    // Handle other errors
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'An unexpected error occurred'
    });
  }
});

app.post('/scrape-internet', async (req, res) => {
  try {
    const { query } = req.body;
    const apiKey = 'BSAWosDbp01p_PwWH6hIabPIYLYFcNp';

    if (!query) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'query is required'
      });
    }

    console.log('Simplified internet search query (Rentola only):', query);
    
    // Use ONLY Rentola for fast, focused results
    try {
      const rentolaUrl = buildRentolaUrl(query);
      console.log('Searching Rentola:', rentolaUrl);
      const rentolaResults = await scrapeRentola(rentolaUrl, apiKey);
      
      // Mark all results with source
      const allResults = rentolaResults.map(prop => ({ ...prop, source: 'Rentola' }));
      
      console.log(`Rentola search completed: ${rentolaResults.length} properties found`);
      res.json(allResults);
    } catch (error) {
      console.warn('Rentola search failed:', error);
      res.json([]); // Return empty array if Rentola fails
    }
  } catch (error) {
    console.error('Error in /scrape-internet endpoint:', error);
    
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'An unexpected error occurred'
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
}); 