import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { buildZooplaUrl, buildOpenRentUrl } from '../utils/siteSearchMappings';

const router = express.Router();

router.post('/direct-property-search', async (req, res) => {
  const filters = req.body.filters;
  const results: any[] = [];

  // Zoopla
  try {
    const zooplaUrl = buildZooplaUrl(filters);
    const response = await axios.get(zooplaUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $ = cheerio.load(response.data);
    $('h2[data-testid="listing-title"]').each((_, el) => {
      results.push({ site: 'zoopla', title: $(el).text().trim() });
    });
  } catch (err) {
    console.error('Zoopla fetch error:', err.message);
  }

  // OpenRent
  try {
    const openRentUrl = buildOpenRentUrl(filters);
    const response = await axios.get(openRentUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $ = cheerio.load(response.data);
    $('.propertyCard-title').each((_, el) => {
      results.push({ site: 'openrent', title: $(el).text().trim() });
    });
  } catch (err) {
    console.error('OpenRent fetch error:', err.message);
  }

  res.json({ results });
});

export default router; 