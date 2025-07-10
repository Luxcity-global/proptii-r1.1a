#!/usr/bin/env node

/**
 * Test Cloudflare Bypass for Zoopla
 * Validates the advanced Puppeteer stealth approach
 */

const { testCloudflareBypass, scrapeZooplaWithCloudflareBypass } = require('../src/scrapers/zooplaCloudflareBypass');

// Test URLs
const TEST_URLS = [
  'https://www.zoopla.co.uk/to-rent/london/',
  'https://www.zoopla.co.uk/to-rent/details/64663731/',
  'https://www.zoopla.co.uk/to-rent/manchester/',
  'https://www.zoopla.co.uk/to-rent/birmingham/'
];

const TEST_QUERIES = [
  '2 bedroom flat to rent in London',
  '3 bedroom house to rent in Manchester',
  '1 bedroom apartment to rent in Birmingham'
];

async function testBypassCapability() {
  console.log('🛡️ Testing Cloudflare Bypass Capability');
  console.log('=' .repeat(50));

  const results = [];

  for (const url of TEST_URLS) {
    console.log(`\n🌐 Testing URL: ${url}`);
    
    try {
      const startTime = Date.now();
      const success = await testCloudflareBypass(url);
      const duration = Date.now() - startTime;

      results.push({
        url,
        success,
        duration,
        timestamp: new Date().toISOString()
      });

      console.log(`   ${success ? '✅' : '❌'} Bypass ${success ? 'SUCCESSFUL' : 'FAILED'} (${duration}ms)`);

    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      results.push({
        url,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  return results;
}

async function testPropertyScraping() {
  console.log('\n🏠 Testing Property Scraping with Bypass');
  console.log('=' .repeat(50));

  const results = [];

  for (const query of TEST_QUERIES) {
    console.log(`\n🔍 Testing Query: "${query}"`);
    
    try {
      const startTime = Date.now();
      const properties = await scrapeZooplaWithCloudflareBypass(query);
      const duration = Date.now() - startTime;

      results.push({
        query,
        propertiesFound: properties.length,
        duration,
        timestamp: new Date().toISOString()
      });

      console.log(`   ✅ Found ${properties.length} properties (${duration}ms)`);
      
      if (properties.length > 0) {
        console.log(`   📊 Sample property: ${properties[0].title}`);
        console.log(`   💰 Price: ${properties[0].price.display}`);
        console.log(`   📍 Location: ${properties[0].location.address}`);
      }

    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      results.push({
        query,
        propertiesFound: 0,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  return results;
}

async function generateReport(bypassResults, scrapingResults) {
  console.log('\n📊 Test Report');
  console.log('=' .repeat(50));

  // Bypass success rate
  const bypassSuccessCount = bypassResults.filter(r => r.success).length;
  const bypassSuccessRate = (bypassSuccessCount / bypassResults.length) * 100;
  
  console.log(`🛡️ Cloudflare Bypass Success Rate: ${bypassSuccessRate.toFixed(1)}% (${bypassSuccessCount}/${bypassResults.length})`);

  // Scraping success rate
  const scrapingSuccessCount = scrapingResults.filter(r => r.propertiesFound > 0).length;
  const scrapingSuccessRate = (scrapingSuccessCount / scrapingResults.length) * 100;
  
  console.log(`🏠 Property Scraping Success Rate: ${scrapingSuccessRate.toFixed(1)}% (${scrapingSuccessCount}/${scrapingResults.length})`);

  // Average performance
  const avgBypassTime = bypassResults
    .filter(r => r.success && r.duration)
    .reduce((sum, r) => sum + r.duration, 0) / bypassSuccessCount || 0;

  const avgScrapingTime = scrapingResults
    .filter(r => r.propertiesFound > 0 && r.duration)
    .reduce((sum, r) => sum + r.duration, 0) / scrapingSuccessCount || 0;

  console.log(`⏱️ Average Bypass Time: ${avgBypassTime.toFixed(0)}ms`);
  console.log(`⏱️ Average Scraping Time: ${avgScrapingTime.toFixed(0)}ms`);

  // Total properties found
  const totalProperties = scrapingResults.reduce((sum, r) => sum + (r.propertiesFound || 0), 0);
  console.log(`📈 Total Properties Found: ${totalProperties}`);

  // Save detailed report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      bypassSuccessRate,
      scrapingSuccessRate,
      avgBypassTime,
      avgScrapingTime,
      totalProperties
    },
    bypassResults,
    scrapingResults
  };

  const fs = require('fs');
  const reportPath = `cloudflare-bypass-test-report-${Date.now()}.json`;
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);

  return report;
}

async function main() {
  console.log('🚀 Starting Cloudflare Bypass Tests');
  console.log('=' .repeat(50));

  try {
    // Test bypass capability
    const bypassResults = await testBypassCapability();
    
    // Test property scraping
    const scrapingResults = await testPropertyScraping();
    
    // Generate report
    const report = await generateReport(bypassResults, scrapingResults);
    
    console.log('\n✅ Testing completed successfully!');
    
    // Exit with appropriate code
    const overallSuccess = report.summary.bypassSuccessRate > 50 && report.summary.scrapingSuccessRate > 50;
    process.exit(overallSuccess ? 0 : 1);

  } catch (error) {
    console.error('\n❌ Testing failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testBypassCapability,
  testPropertyScraping,
  generateReport
}; 