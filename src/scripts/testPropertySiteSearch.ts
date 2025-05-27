// testPropertySiteSearch.ts
import axios from 'axios';
import * as cheerio from 'cheerio';
import {
  buildZooplaUrl,
  buildOpenRentUrl,
  buildOnTheMarketUrl,
  buildRightmoveUrl
} from '../utils/siteSearchMappings';

const siteBuilders = {
  zoopla: buildZooplaUrl,
  openrent: buildOpenRentUrl
  // onthemarket: buildOnTheMarketUrl,
  // rightmove: buildRightmoveUrl
};

async function testSiteSearch(site: string, filters: any) {
  if (!siteBuilders[site]) {
    console.error('Unsupported site:', site);
    return;
  }
  const url = siteBuilders[site](filters);
  console.log(`\n[${site.toUpperCase()}] Search URL: ${url}`);
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
      }
    });
    const html = response.data;
    const $ = cheerio.load(html);
    let titles: string[] = [];
    // Site-specific selectors
    if (site === 'zoopla') {
      $('h2[data-testid="listing-title"]').each((_, el) => titles.push($(el).text().trim()));
    } else if (site === 'openrent') {
      $('.propertyCard-title').each((_, el) => titles.push($(el).text().trim()));
    } else if (site === 'onthemarket') {
      $('.otm-PropertyCard-title, .property-info__address').each((_, el) => titles.push($(el).text().trim()));
    } else if (site === 'rightmove') {
      $('.propertyCard-title, .propertyCard-address').each((_, el) => titles.push($(el).text().trim()));
    }
    if (titles.length === 0) {
      console.log('No property titles found. The site may have changed its structure or blocked scraping.');
    } else {
      console.log('First few property titles:');
      titles.slice(0, 5).forEach((t, i) => console.log(`${i + 1}. ${t}`));
    }
  } catch (err) {
    console.error('Error fetching or parsing:', err.message);
  }
}

// Example usage:
const filters = {
  location: 'Walthamstow, London',
  minBeds: 2,
  maxBeds: 2,
  minPrice: 0,
  maxPrice: 2000,
  propertyType: 'Flat'
};

(async () => {
  for (const site of Object.keys(siteBuilders)) {
    await testSiteSearch(site, filters);
  }
})(); 