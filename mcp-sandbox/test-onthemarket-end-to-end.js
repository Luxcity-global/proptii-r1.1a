const { scrapeOnTheMarketWithQuery } = require('./src/scrapers/onthemarketScraper');
const { transformOnTheMarketProperties } = require('./src/mcp/transformers/onthemarket-transformer');

async function testOnTheMarketEndToEnd() {
  console.log('🧪 [E2E_TEST] Testing OnTheMarket end-to-end flow...');
  
  try {
    // Test query
    const query = '2 bedroom flat London';
    console.log(`🔍 [E2E_TEST] Testing with query: "${query}"`);
    
    // Step 1: Scrape raw data
    console.log('\n📄 [E2E_TEST] Step 1: Scraping raw data...');
    const rawProperties = await scrapeOnTheMarketWithQuery(query);
    console.log(`✅ [E2E_TEST] Raw scraping completed: ${rawProperties.length} properties found`);
    
    if (rawProperties.length === 0) {
      console.log('❌ [E2E_TEST] No raw properties found - scraper may not be working');
      return;
    }
    
    // Show sample raw property
    const sampleRaw = rawProperties[0];
    console.log('\n📋 [E2E_TEST] Sample raw property:');
    console.log(`  Title: ${sampleRaw.title}`);
    console.log(`  Address: ${sampleRaw.address}`);
    console.log(`  Price: £${sampleRaw.price} ${sampleRaw.priceUnit}`);
    console.log(`  Bedrooms: ${sampleRaw.bedrooms}`);
    console.log(`  Images: ${sampleRaw.images.length} images`);
    console.log(`  Agent: ${sampleRaw.agent.name}`);
    console.log(`  URL: ${sampleRaw.listingUrl}`);
    
    // Step 2: Transform to MCP format
    console.log('\n🔄 [E2E_TEST] Step 2: Transforming to MCP format...');
    const transformedProperties = transformOnTheMarketProperties(rawProperties);
    console.log(`✅ [E2E_TEST] Transformation completed: ${transformedProperties.length} properties transformed`);
    
    if (transformedProperties.length === 0) {
      console.log('❌ [E2E_TEST] No transformed properties - transformer may not be working');
      return;
    }
    
    // Show sample transformed property
    const sampleTransformed = transformedProperties[0];
    console.log('\n📋 [E2E_TEST] Sample transformed property:');
    console.log(`  ID: ${sampleTransformed.id}`);
    console.log(`  Title: ${sampleTransformed.title}`);
    console.log(`  Price: ${sampleTransformed.price.display}`);
    console.log(`  Location: ${sampleTransformed.location.address}`);
    console.log(`  City: ${sampleTransformed.location.city}`);
    console.log(`  Postcode: ${sampleTransformed.location.postcode}`);
    console.log(`  Bedrooms: ${sampleTransformed.specifications.bedrooms}`);
    console.log(`  Property Type: ${sampleTransformed.specifications.propertyType}`);
    console.log(`  Images: ${sampleTransformed.images.length} images`);
    console.log(`  Agent: ${sampleTransformed.agent.name} (${sampleTransformed.agent.company})`);
    console.log(`  Features: ${sampleTransformed.features.join(', ')}`);
    console.log(`  Source: ${sampleTransformed.metadata.source}`);
    
    // Step 3: Validate results
    console.log('\n✅ [E2E_TEST] Step 3: Validation...');
    let validCount = 0;
    let issues = [];
    
    transformedProperties.forEach((prop, index) => {
      if (!prop.title || prop.title.length < 5) {
        issues.push(`Property ${index}: Missing or short title`);
      }
      if (!prop.price || prop.price.amount < 100) {
        issues.push(`Property ${index}: Invalid price`);
      }
      if (!prop.location || !prop.location.address) {
        issues.push(`Property ${index}: Missing address`);
      }
      if (!prop.images || prop.images.length === 0) {
        issues.push(`Property ${index}: No images`);
      }
      if (!prop.agent || !prop.agent.name) {
        issues.push(`Property ${index}: Missing agent info`);
      }
      
      if (prop.title && prop.price && prop.location && prop.images && prop.agent) {
        validCount++;
      }
    });
    
    console.log(`✅ [E2E_TEST] Validation results:`);
    console.log(`  Total properties: ${transformedProperties.length}`);
    console.log(`  Valid properties: ${validCount}`);
    console.log(`  Success rate: ${((validCount / transformedProperties.length) * 100).toFixed(1)}%`);
    
    if (issues.length > 0) {
      console.log(`⚠️ [E2E_TEST] Issues found:`);
      issues.slice(0, 5).forEach(issue => console.log(`  - ${issue}`));
      if (issues.length > 5) {
        console.log(`  ... and ${issues.length - 5} more issues`);
      }
    }
    
    console.log('\n✅ [E2E_TEST] End-to-end test completed successfully!');
    
  } catch (error) {
    console.error('❌ [E2E_TEST] End-to-end test failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

testOnTheMarketEndToEnd(); 