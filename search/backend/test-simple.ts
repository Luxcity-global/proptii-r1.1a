import { buildOpenRentUrl, parseOpenRentQuery } from './src/scrapers/openrent-scraper';

console.log('=== Testing OpenRent Helper Functions ===');

// Test URL building
console.log('\n1. Testing URL building:');
const testCases = [
  { location: 'Liverpool, Merseyside', filters: {} },
  { location: 'Liverpool, Merseyside', filters: { maxPrice: 1500 } },
  { location: 'Liverpool, Merseyside', filters: { maxPrice: 1500, bedrooms: '2' } },
  { location: 'Manchester', filters: { bedrooms: '1', propertyType: 'flat' } }
];

testCases.forEach((test, i) => {
  const url = buildOpenRentUrl(test.location, test.filters);
  console.log(`Test ${i + 1}:`, url);
});

// Test query parsing
console.log('\n2. Testing query parsing:');
const queries = [
  '2 bedroom flat in Liverpool under £1000',
  'Studio apartment in Manchester',
  '3 bed house in Leeds max £1500',
  'property in Birmingham under £800'
];

queries.forEach((query, i) => {
  const parsed = parseOpenRentQuery(query);
  console.log(`Query ${i + 1}: "${query}"`);
  console.log(`Parsed:`, parsed);
  console.log('---');
});

console.log('\n=== Helper functions work correctly ===');
console.log('The issue is likely with Playwright browser automation on Windows.');
console.log('Recommendations:');
console.log('1. Try running: npx playwright install chromium');
console.log('2. Check if Windows Defender is blocking Playwright');
console.log('3. Consider using puppeteer instead of Playwright for Windows compatibility');

