const axios = require('axios');
const cheerio = require('cheerio');

async function testOnTheMarketFix() {
  console.log('🧪 [TEST] Testing OnTheMarket scraper with updated selectors...');
  
  try {
    // Test URL for OnTheMarket
    const url = 'https://www.onthemarket.com/to-rent/property/london/';
    
    console.log(`📄 [TEST] Fetching: ${url}`);
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
      },
      timeout: 15000,
    });
    
    const html = response.data;
    const $ = cheerio.load(html);
    
    console.log(`✅ [TEST] Successfully fetched ${html.length} characters`);
    
    // Test the selectors we're using
    const selectors = [
      '.property-result',
      '.property-card', 
      '.property-listing',
      'li.otm-PropertyCard'
    ];
    
    console.log('\n🔍 [TEST] Testing selectors:');
    selectors.forEach(selector => {
      const count = $(selector).length;
      console.log(`  ${selector}: ${count} elements found`);
    });
    
    // Test title selectors
    const titleSelectors = [
      '.property-title',
      '.property-heading', 
      'h3 a',
      'h2 a',
      'meta[itemprop="description"]',
      '.title',
      '.address'
    ];
    
    console.log('\n🔍 [TEST] Testing title selectors:');
    titleSelectors.forEach(selector => {
      const count = $(selector).length;
      console.log(`  ${selector}: ${count} elements found`);
      if (count > 0) {
        const firstElement = $(selector).first();
        const text = selector.includes('meta') ? firstElement.attr('content') : firstElement.text().trim();
        console.log(`    Sample: "${text.substring(0, 50)}..."`);
      }
    });
    
    // Test price selectors
    const priceSelectors = [
      '.property-price',
      '.price',
      '.price-display',
      '.otm-Price .price',
      '.otm-price'
    ];
    
    console.log('\n🔍 [TEST] Testing price selectors:');
    priceSelectors.forEach(selector => {
      const count = $(selector).length;
      console.log(`  ${selector}: ${count} elements found`);
      if (count > 0) {
        const firstElement = $(selector).first();
        const text = firstElement.text().trim();
        console.log(`    Sample: "${text}"`);
      }
    });
    
    // Test agent selectors
    const agentSelectors = [
      '.otm-PropertyCardAgent',
      '.agent',
      '.agency',
      '.company'
    ];
    
    console.log('\n🔍 [TEST] Testing agent selectors:');
    agentSelectors.forEach(selector => {
      const count = $(selector).length;
      console.log(`  ${selector}: ${count} elements found`);
      if (count > 0) {
        const firstElement = $(selector).first();
        const text = firstElement.text().trim();
        console.log(`    Sample: "${text}"`);
      }
    });
    
    // Test image extraction
    console.log('\n🔍 [TEST] Testing image extraction:');
    const images = [];
    $('img').each((_, imgEl) => {
      const src = $(imgEl).attr('src') || $(imgEl).attr('data-src') || $(imgEl).attr('data-lazy-src');
      const alt = $(imgEl).attr('alt') || '';
      
      if (src && 
          !src.includes('logo') && 
          !src.includes('icon') && 
          !src.includes('sticker') &&
          !src.includes('placeholder') &&
          !images.includes(src)) {
        images.push(src);
      }
    });
    
    console.log(`  Total property images found: ${images.length}`);
    if (images.length > 0) {
      console.log(`  Sample image: ${images[0]}`);
    }
    
    console.log('\n✅ [TEST] OnTheMarket selector analysis complete!');
    
  } catch (error) {
    console.error('❌ [TEST] Error testing OnTheMarket:', error.message);
  }
}

testOnTheMarketFix(); 