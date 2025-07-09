#!/usr/bin/env node

/**
 * Test Enhanced PropertyDataMCP with Real Scraping
 * 
 * This script tests the enhanced PropertyDataMCP with real scraping capabilities.
 * It can be run with different modes to test various features.
 * 
 * Usage:
 *   node scripts/test-enhanced-mcp.js [mode] [query] [pages]
 * 
 * Modes:
 *   - status: Get scraping status
 *   - mock: Test mock data search
 *   - real: Test real data search (if enabled)
 *   - openrent: Test direct Openrent scraping
 *   - enhanced: Test enhanced search with real data
 *   - paginated: Test paginated scraping
 *   - cache: Test cache operations
 *   - all: Run all tests
 * 
 * Examples:
 *   node scripts/test-enhanced-mcp.js status
 *   node scripts/test-enhanced-mcp.js real "London" 2
 *   node scripts/test-enhanced-mcp.js openrent "Manchester" 4
 *   node scripts/test-enhanced-mcp.js all
 */

const { PropertyDataMCP } = require('../dist/mcp/property-data/PropertyDataMCP');

async function runTest() {
  const args = process.argv.slice(2);
  const mode = args[0] || 'status';
  const query = args[1] || 'London';
  const pages = parseInt(args[2]) || 2;

  console.log(`🧪 Testing Enhanced PropertyDataMCP`);
  console.log(`Mode: ${mode}`);
  console.log(`Query: ${query}`);
  console.log(`Pages: ${pages}`);
  console.log('');

  const propertyMCP = new PropertyDataMCP();

  try {
    switch (mode.toLowerCase()) {
      case 'status':
        await testStatus(propertyMCP);
        break;
      
      case 'mock':
        await testMockSearch(propertyMCP, query);
        break;
      
      case 'real':
        await testRealSearch(propertyMCP, query);
        break;
      
      case 'openrent':
        await testOpenrentScraping(propertyMCP, query, pages);
        break;
      
      case 'enhanced':
        await testEnhancedSearch(propertyMCP, query);
        break;
      
      case 'paginated':
        await testPaginatedScraping(propertyMCP, query, pages);
        break;
      
      case 'cache':
        await testCacheOperations(propertyMCP);
        break;
      
      case 'all':
        await runAllTests(propertyMCP, query, pages);
        break;
      
      default:
        console.error(`❌ Unknown mode: ${mode}`);
        console.log('Available modes: status, mock, real, openrent, enhanced, paginated, cache, all');
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

async function testStatus(propertyMCP) {
  console.log('📊 Test: Scraping Status');
  const status = await propertyMCP.getScrapingStatus();
  console.log('Status:', JSON.stringify(status, null, 2));
}

async function testMockSearch(propertyMCP, query) {
  console.log('📋 Test: Mock Data Search');
  const results = await propertyMCP.searchProperties(query, { bedrooms: 2 }, false);
  console.log(`✅ Mock search successful: ${results.length} properties`);
  
  if (results.length > 0) {
    console.log('Sample property:', {
      id: results[0].id,
      title: results[0].title,
      price: results[0].price.display,
      source: results[0].metadata.source
    });
  }
}

async function testRealSearch(propertyMCP, query) {
  console.log('🏠 Test: Real Data Search');
  const results = await propertyMCP.searchProperties(query, { bedrooms: 2 }, true);
  console.log(`✅ Real search successful: ${results.length} properties`);
  
  if (results.length > 0) {
    console.log('Sample property:', {
      id: results[0].id,
      title: results[0].title,
      price: results[0].price.display,
      source: results[0].metadata.source,
      location: results[0].location.city
    });
  }
}

async function testOpenrentScraping(propertyMCP, query, pages) {
  console.log('🔍 Test: Direct Openrent Scraping');
  const results = await propertyMCP.scrapeOpenrent(query);
  console.log(`✅ Openrent scraping successful: ${results.length} properties`);
  
  if (results.length > 0) {
    console.log('Sample Openrent property:', {
      id: results[0].id,
      title: results[0].title,
      price: results[0].price.display,
      source: results[0].metadata.source,
      features: results[0].features.slice(0, 3)
    });
  }
}

async function testEnhancedSearch(propertyMCP, query) {
  console.log('🚀 Test: Enhanced Search with Real Data');
  const results = await propertyMCP.searchPropertiesWithRealData(query, { 
    minPrice: 1000, 
    maxPrice: 3000,
    bedrooms: 1 
  }, true);
  console.log(`✅ Enhanced search successful: ${results.length} properties`);
  
  if (results.length > 0) {
    console.log('Sample enhanced property:', {
      id: results[0].id,
      title: results[0].title,
      price: results[0].price.display,
      searchScore: results[0].metadata.searchScore,
      source: results[0].metadata.source
    });
  }
}

async function testPaginatedScraping(propertyMCP, query, pages) {
  console.log('📄 Test: Paginated Scraping');
  const results = await propertyMCP.scrapeWithPagination('openrent', query, pages);
  console.log(`✅ Paginated scraping successful: ${results.length} properties`);
  
  if (results.length > 0) {
    console.log('Sample paginated property:', {
      id: results[0].id,
      title: results[0].title,
      price: results[0].price.display,
      source: results[0].metadata.source
    });
  }
}

async function testCacheOperations(propertyMCP) {
  console.log('💾 Test: Cache Operations');
  
  const testProperties = [
    {
      id: 'test-1',
      title: 'Test Property 1',
      price: { amount: 1500, currency: 'GBP', type: 'rent', display: '£1,500 pcm' },
      location: { address: 'Test Address', city: 'London', postcode: 'SW1A 1AA' },
      specifications: { bedrooms: 2, bathrooms: 1, propertyType: 'Flat' },
      features: ['Furnished'],
      description: 'Test description',
      images: [],
      agent: { name: 'Test Agent', company: 'Test Company' },
      amenities: { nearby: [], onsite: [] },
      status: 'available',
      metadata: { 
        createdAt: new Date().toISOString(), 
        lastUpdated: new Date().toISOString(), 
        searchScore: 85, 
        viewCount: 0, 
        source: 'test' 
      }
    }
  ];

  await propertyMCP.updatePropertyCache('test', testProperties);
  console.log('✅ Cache update successful');

  const cachedProperties = await propertyMCP.getRealPropertyData('test', false);
  console.log(`✅ Cache retrieval successful: ${cachedProperties.length} properties`);
}

async function runAllTests(propertyMCP, query, pages) {
  console.log('🧪 Running All Tests\n');
  
  await testStatus(propertyMCP);
  console.log('');
  
  await testMockSearch(propertyMCP, query);
  console.log('');
  
  await testRealSearch(propertyMCP, query);
  console.log('');
  
  await testOpenrentScraping(propertyMCP, query, pages);
  console.log('');
  
  await testEnhancedSearch(propertyMCP, query);
  console.log('');
  
  await testPaginatedScraping(propertyMCP, query, pages);
  console.log('');
  
  await testCacheOperations(propertyMCP);
  console.log('');
  
  console.log('✅ All tests completed successfully!');
}

// Run the test
runTest().catch(console.error); 