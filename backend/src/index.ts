import express from 'express';
import cors from 'cors';
import { scrape, scrapeInternet } from './scraper';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

app.post('/scrape', async (req, res) => {
  try {

    const { url } = req.body;
    const apiKey = 'BSAbpHw4lHUQBBsmRTmY3pEK6WmT8Nz';

    if (!url) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'url is required'
      });
    }

    console.log('Fetching URL:', url);
    const results = await scrape(url, apiKey);
    res.json(results);
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
    const apiKey = 'BSAbpHw4lHUQBBsmRTmY3pEK6WmT8Nz';

    if (!query) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'query is required'
      });
    }

    console.log('Internet search query:', query);
    const results = await scrapeInternet(query, apiKey);
    res.json(results);
  } catch (error) {
    console.error('Error in /scrape-internet endpoint:', error);
    
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'An unexpected error occurred'
    });
  }
});

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
}); 