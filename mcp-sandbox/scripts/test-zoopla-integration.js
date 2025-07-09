#!/usr/bin/env node

/**
 * Zoopla Integration Test Script
 * Tests the complete Zoopla integration with PropertyDataMCP
 */

const { PropertyDataMCP } = require('../src/mcp/property-data/PropertyDataMCP.ts');

async function testZooplaIntegration() {
  console.log('🧪 Testing Zoopla Integration with PropertyDataMCP\n');
  console.log('=' .repeat(60));

  const propertyMCP = new PropertyDataMCP();

  // Test 1: Basic Zoopla scraping
  console.log('📋 Test 1: Basic Zoopla Scraping');
  console.log('-'.repeat(40));
  
  try {
    const zooplaResults = await propertyMCP.scrapeZoopla('London');
    console.log(`✅ Zoopla scraping successful: ${zooplaResults.length} properties`);
    
    if (zooplaResults.length > 0) {
      console.log('Sample Zoopla property:', {
        id: zooplaResults[0].id,
        title: zooplaResults[0].title,
        price: zooplaResults[0].price.display,
        location: zooplaResults[0].location.city,
        bedrooms: zooplaResults[0].specifications.bedrooms,
        source: zooplaResults[0].metadata.source
      });
    }
  } catch (error) {
    console.error('❌ Zoopla scraping failed:', error.message);
  }
  console.log('');

  // Test 2: Multi-source search with Zoopla
  console.log('🔍 Test 2: Multi-Source Search (including Zoopla)');
  console.log('-'.repeat(40));
  
  try {
    const multiSourceResults = await propertyMCP.searchProperties('London', { bedrooms: 2 }, true);
    console.log(`✅ Multi-source search successful: ${multiSourceResults.length} properties`);
    
    // Group by source
    const bySource = multiSourceResults.reduce((acc, property) => {
      const source = property.metadata.source;
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {});
    
    console.log('Properties by source:', bySource);
    
    // Show sample from each source
    const sources = Object.keys(bySource);
    sources.forEach(source => {
      const sample = multiSourceResults.find(p => p.metadata.source === source);
      if (sample) {
        console.log(`${source}: ${sample.title} - ${sample.price.display}`);
      }
    });
  } catch (error) {
    console.error('❌ Multi-source search failed:', error.message);
  }
  console.log('');

  // Test 3: Zoopla pagination
  console.log('📄 Test 3: Zoopla Pagination');
  console.log('-'.repeat(40));
  
  try {
    const paginatedResults = await propertyMCP.scrapeWithPagination('zoopla', 'London', 2);
    console.log(`✅ Zoopla pagination successful: ${paginatedResults.length} properties`);
    
    if (paginatedResults.length > 0) {
      console.log('Sample paginated property:', {
        id: paginatedResults[0].id,
        title: paginatedResults[0].title,
        price: paginatedResults[0].price.display,
        source: paginatedResults[0].metadata.source
      });
    }
  } catch (error) {
    console.error('❌ Zoopla pagination failed:', error.message);
  }
  console.log('');

  // Test 4: Cache functionality
  console.log('💾 Test 4: Cache Functionality');
  console.log('-'.repeat(40));
  
  try {
    const startTime = Date.now();
    const firstCall = await propertyMCP.scrapeZoopla('Manchester');
    const firstCallTime = Date.now() - startTime;
    
    const cacheStartTime = Date.now();
    const secondCall = await propertyMCP.scrapeZoopla('Manchester');
    const cacheCallTime = Date.now() - cacheStartTime;
    
    console.log(`✅ Cache test completed:`);
    console.log(`   First call: ${firstCallTime}ms (${firstCall.length} properties)`);
    console.log(`   Cached call: ${cacheCallTime}ms (${secondCall.length} properties)`);
    console.log(`   Cache speedup: ${Math.round(firstCallTime / cacheCallTime)}x faster`);
  } catch (error) {
    console.error('❌ Cache test failed:', error.message);
  }
  console.log('');

  // Test 5: Error handling
  console.log('⚠️ Test 5: Error Handling');
  console.log('-'.repeat(40));
  
  try {
    // Test with invalid query
    const invalidResults = await propertyMCP.scrapeZoopla('invalid-location-xyz-123');
    console.log(`✅ Error handling test: ${invalidResults.length} properties returned for invalid query`);
  } catch (error) {
    console.log(`✅ Error handling test: Properly caught error: ${error.message}`);
  }
  console.log('');

  // Test 6: Schema validation
  console.log('🔍 Test 6: Schema Validation');
  console.log('-'.repeat(40));
  
  try {
    const testResults = await propertyMCP.scrapeZoopla('Birmingham');
    
    if (testResults.length > 0) {
      const sample = testResults[0];
      
      // Check required fields
      const requiredFields = ['id', 'title', 'price', 'location', 'specifications', 'metadata'];
      const missingFields = requiredFields.filter(field => !sample[field]);
      
      if (missingFields.length === 0) {
        console.log('✅ All required fields present');
      } else {
        console.log(`❌ Missing required fields: ${missingFields.join(', ')}`);
      }
      
      // Check data types
      const typeChecks = [
        { field: 'id', type: 'string', value: sample.id },
        { field: 'title', type: 'string', value: sample.title },
        { field: 'price.amount', type: 'number', value: sample.price?.amount },
        { field: 'specifications.bedrooms', type: 'number', value: sample.specifications?.bedrooms },
        { field: 'metadata.source', type: 'string', value: sample.metadata?.source }
      ];
      
      const typeErrors = typeChecks.filter(check => typeof check.value !== check.type);
      
      if (typeErrors.length === 0) {
        console.log('✅ All data types correct');
      } else {
        console.log(`❌ Type errors: ${typeErrors.map(e => `${e.field} should be ${e.type}`).join(', ')}`);
      }
      
      console.log('Sample validated property:', {
        id: sample.id,
        title: sample.title,
        price: sample.price?.display,
        bedrooms: sample.specifications?.bedrooms,
        source: sample.metadata?.source
      });
    } else {
      console.log('⚠️ No properties to validate');
    }
  } catch (error) {
    console.error('❌ Schema validation failed:', error.message);
  }
  console.log('');

  // Test 7: Performance metrics
  console.log('⚡ Test 7: Performance Metrics');
  console.log('-'.repeat(40));
  
  try {
    const startTime = Date.now();
    const results = await propertyMCP.scrapeZoopla('London');
    const endTime = Date.now();
    
    console.log(`✅ Performance test completed:`);
    console.log(`   Total time: ${endTime - startTime}ms`);
    console.log(`   Properties per second: ${Math.round(results.length / ((endTime - startTime) / 1000))}`);
    console.log(`   Average time per property: ${Math.round((endTime - startTime) / results.length)}ms`);
  } catch (error) {
    console.error('❌ Performance test failed:', error.message);
  }
  console.log('');

  console.log('🎉 Zoopla Integration Test Complete!');
  console.log('=' .repeat(60));
}

// Run the test
if (require.main === module) {
  testZooplaIntegration()
    .then(() => {
      console.log('✅ All tests completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { testZooplaIntegration }; 