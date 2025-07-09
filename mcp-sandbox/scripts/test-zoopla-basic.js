#!/usr/bin/env node

/**
 * Basic Zoopla Test Script
 * Quick validation of core Zoopla scraping functionality
 */

const { scrapeZooplaWithQuery } = require('../dist/scrapers/zooplaScraper');
const { buildZooplaUrl } = require('../dist/scrapers/zooplaQueryParser');
const { parseSearchQuery } = require('../dist/utils/queryParser');

async function testBasicZooplaScraping() {
  console.log('🔍 Testing Basic Zoopla Scraping');
  console.log('=' .repeat(40));
  
  const testQuery = '2 bedroom flat in London';
  
  try {
    console.log(`Testing query: "${testQuery}"`);
    
    // Test URL building
    console.log('\n1. Testing URL building...');
    const parsedQuery = parseSearchQuery(testQuery);
    const url = buildZooplaUrl(parsedQuery);
    console.log(`   Parsed query:`, parsedQuery);
    console.log(`   Generated URL: ${url}`);
    
    // Test scraping
    console.log('\n2. Testing scraping...');
    const startTime = Date.now();
    const properties = await scrapeZooplaWithQuery(testQuery);
    const duration = Date.now() - startTime;
    
    console.log(`   ✅ Found ${properties.length} properties in ${duration}ms`);
    
    if (properties.length > 0) {
      const sample = properties[0];
      console.log('\n3. Sample property:');
      console.log(`   ID: ${sample.id}`);
      console.log(`   Title: ${sample.title}`);
      console.log(`   Price: ${sample.price.display}`);
      console.log(`   Location: ${sample.location.address}`);
      console.log(`   Bedrooms: ${sample.details.bedrooms}`);
      console.log(`   Images: ${sample.images.length}`);
      
      // Validate structure
      const hasRequiredFields = sample.id && sample.title && sample.price && sample.location;
      console.log(`   Structure valid: ${hasRequiredFields ? '✅' : '❌'}`);
    }
    
    console.log('\n🎉 Basic test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run test
testBasicZooplaScraping(); 