import { scrapeOpenRent, buildOpenRentUrl, parseOpenRentQuery } from './src/scrapers/openrent-scraper';

async function testOpenRent() {
  console.log('=== Testing OpenRent Scraper ===');
  
  // Test URL building
  console.log('\n1. Testing URL building:');
  const testUrl = buildOpenRentUrl('Liverpool, Merseyside', { maxPrice: 1500, bedrooms: '2' });
  console.log('Built URL:', testUrl);
  
  // Test query parsing
  console.log('\n2. Testing query parsing:');
  const parsed = parseOpenRentQuery('2 bedroom flat in Liverpool under £1000');
  console.log('Parsed query:', parsed);
  
  // Test scraping with a simple direct URL
  console.log('\n3. Testing direct scraping:');
  const testDirectUrl = 'https://www.openrent.co.uk/properties-to-rent/liverpool-merseyside?term=Liverpool,%20Merseyside';
  
  try {
    console.log('Scraping URL:', testDirectUrl);
    const results = await scrapeOpenRent(testDirectUrl, 'test-api-key');
    console.log(`Found ${results.length} properties:`);
    
    if (results.length > 0) {
      console.log('\nFirst property:');
      console.log(JSON.stringify(results[0], null, 2));
    } else {
      console.log('No properties found - debugging needed');
    }
  } catch (error) {
    console.error('Error during scraping:', error);
  }
}

testOpenRent().then(() => {
  console.log('\n=== Test completed ===');
  process.exit(0);
}).catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});

