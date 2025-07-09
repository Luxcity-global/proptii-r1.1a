#!/usr/bin/env node

/**
 * Frontend Integration Test Script
 * Tests the enhanced API endpoints and real-time scraping integration
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3002/api/mcp';

// Test configuration
const TEST_CONFIG = {
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName, result, details = '') {
  const status = result ? '✅ PASS' : '❌ FAIL';
  const color = result ? 'green' : 'red';
  log(`${status} ${testName}`, color);
  if (details) {
    log(`   ${details}`, 'blue');
  }
}

async function testHealthEndpoint() {
  try {
    log('\n🏥 Testing Health Endpoint...', 'blue');
    
    const response = await axios.get(`${API_BASE_URL}/health`, TEST_CONFIG);
    
    logTest('Health endpoint responds', response.status === 200);
    logTest('Health data structure', response.data && response.data.success);
    logTest('Health status field', response.data?.data?.status);
    
    if (response.data?.data) {
      log(`   Overall Status: ${response.data.data.status}`, 'yellow');
      log(`   Scraping Enabled: ${response.data.data.scraping?.enabled}`, 'yellow');
      log(`   Services: ${Object.keys(response.data.data.services || {}).length}`, 'yellow');
    }
    
    return response.data;
  } catch (error) {
    logTest('Health endpoint responds', false, error.message);
    return null;
  }
}

async function testEnhancedSearch() {
  try {
    log('\n🔍 Testing Enhanced Search Endpoint...', 'blue');
    
    const searchPayload = {
      query: 'london',
      useRealData: false, // Use mock data for testing
      sources: ['openrent'],
      filters: {
        maxPrice: 3000,
        minBedrooms: 1
      },
      page: 1,
      limit: 10
    };
    
    const response = await axios.post(`${API_BASE_URL}/enhanced-search`, searchPayload, TEST_CONFIG);
    
    logTest('Enhanced search responds', response.status === 200);
    logTest('Search data structure', response.data && response.data.success);
    logTest('Properties returned', response.data?.data?.properties?.length > 0);
    logTest('Metadata included', response.data?.data?.metadata);
    
    if (response.data?.data) {
      const { properties, metadata } = response.data.data;
      log(`   Properties found: ${properties?.length || 0}`, 'yellow');
      log(`   Use Real Data: ${metadata?.useRealData}`, 'yellow');
      log(`   Sources: ${metadata?.sources?.join(', ')}`, 'yellow');
      log(`   Cache Status: ${metadata?.cacheStatus}`, 'yellow');
    }
    
    return response.data;
  } catch (error) {
    logTest('Enhanced search responds', false, error.message);
    return null;
  }
}

async function testScrapingEndpoint() {
  try {
    log('\n🔄 Testing Scraping Endpoint...', 'blue');
    
    const scrapingPayload = {
      source: 'openrent',
      query: 'london',
      pages: 2,
      filters: {
        maxPrice: 2500,
        minBedrooms: 1
      }
    };
    
    const response = await axios.post(`${API_BASE_URL}/scraping`, scrapingPayload, TEST_CONFIG);
    
    logTest('Scraping endpoint responds', response.status === 200);
    logTest('Scraping data structure', response.data && response.data.success);
    logTest('Scraping job created', response.data?.data?.jobId);
    
    if (response.data?.data) {
      log(`   Job ID: ${response.data.data.jobId}`, 'yellow');
      log(`   Status: ${response.data.data.status}`, 'yellow');
      log(`   Pages: ${response.data.data.pages}`, 'yellow');
    }
    
    return response.data;
  } catch (error) {
    logTest('Scraping endpoint responds', false, error.message);
    return null;
  }
}

async function testCacheEndpoint() {
  try {
    log('\n💾 Testing Cache Endpoint...', 'blue');
    
    const response = await axios.get(`${API_BASE_URL}/cache`, TEST_CONFIG);
    
    logTest('Cache endpoint responds', response.status === 200);
    logTest('Cache data structure', response.data && response.data.success);
    logTest('Cache info included', response.data?.data?.totalEntries !== undefined);
    
    if (response.data?.data) {
      const cacheInfo = response.data.data;
      log(`   Total Entries: ${cacheInfo.totalEntries}`, 'yellow');
      log(`   Memory Usage: ${cacheInfo.memoryUsage}`, 'yellow');
      log(`   Hit Rate: ${cacheInfo.hitRate}%`, 'yellow');
      log(`   Sources: ${Object.keys(cacheInfo.sources || {}).length}`, 'yellow');
    }
    
    return response.data;
  } catch (error) {
    logTest('Cache endpoint responds', false, error.message);
    return null;
  }
}

async function testDataSourcesEndpoint() {
  try {
    log('\n📚 Testing Data Sources Endpoint...', 'blue');
    
    const response = await axios.get(`${API_BASE_URL}/sources`, TEST_CONFIG);
    
    logTest('Sources endpoint responds', response.status === 200);
    logTest('Sources data structure', response.data && response.data.success);
    logTest('Sources list included', Array.isArray(response.data?.data));
    
    if (response.data?.data) {
      const sources = response.data.data;
      log(`   Available Sources: ${sources.length}`, 'yellow');
      sources.forEach(source => {
        log(`   - ${source.name}: ${source.status} (${source.propertiesCount} properties)`, 'yellow');
      });
    }
    
    return response.data;
  } catch (error) {
    logTest('Sources endpoint responds', false, error.message);
    return null;
  }
}

async function testRealTimeScraping() {
  try {
    log('\n⚡ Testing Real-time Scraping...', 'blue');
    
    // Start scraping
    const scrapingPayload = {
      source: 'openrent',
      query: 'london',
      pages: 1, // Just 1 page for testing
      filters: {
        maxPrice: 2000,
        minBedrooms: 1
      }
    };
    
    log('   Starting scraping job...', 'yellow');
    const startResponse = await axios.post(`${API_BASE_URL}/scraping`, scrapingPayload, TEST_CONFIG);
    
    if (!startResponse.data?.success) {
      logTest('Real-time scraping start', false, 'Failed to start scraping job');
      return null;
    }
    
    const jobId = startResponse.data.data.jobId;
    log(`   Job started with ID: ${jobId}`, 'yellow');
    
    // Wait a bit and check status
    log('   Waiting for scraping to complete...', 'yellow');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const statusResponse = await axios.get(`${API_BASE_URL}/scraping/status`, TEST_CONFIG);
    
    logTest('Scraping status check', statusResponse.status === 200);
    logTest('Scraping completed', statusResponse.data?.data?.isRunning === false);
    
    if (statusResponse.data?.data) {
      const status = statusResponse.data.data;
      log(`   Progress: ${status.progress}%`, 'yellow');
      log(`   Properties Found: ${status.propertiesFound}`, 'yellow');
      log(`   Errors: ${status.errors?.length || 0}`, 'yellow');
    }
    
    return statusResponse.data;
  } catch (error) {
    logTest('Real-time scraping', false, error.message);
    return null;
  }
}

async function runAllTests() {
  log('🚀 Starting Frontend Integration Tests', 'bold');
  log('=====================================', 'bold');
  
  const startTime = Date.now();
  
  // Run all tests
  const results = {
    health: await testHealthEndpoint(),
    enhancedSearch: await testEnhancedSearch(),
    scraping: await testScrapingEndpoint(),
    cache: await testCacheEndpoint(),
    sources: await testDataSourcesEndpoint(),
    realTimeScraping: await testRealTimeScraping()
  };
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  // Summary
  log('\n📊 Test Summary', 'bold');
  log('==============', 'bold');
  
  const passedTests = Object.values(results).filter(result => result !== null).length;
  const totalTests = Object.keys(results).length;
  
  log(`Total Tests: ${totalTests}`, 'blue');
  log(`Passed: ${passedTests}`, passedTests === totalTests ? 'green' : 'yellow');
  log(`Failed: ${totalTests - passedTests}`, passedTests === totalTests ? 'green' : 'red');
  log(`Duration: ${duration}ms`, 'blue');
  
  if (passedTests === totalTests) {
    log('\n🎉 All tests passed! Frontend integration is ready.', 'green');
  } else {
    log('\n⚠️  Some tests failed. Check the backend and try again.', 'yellow');
  }
  
  return results;
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    log(`\n💥 Test runner failed: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  testHealthEndpoint,
  testEnhancedSearch,
  testScrapingEndpoint,
  testCacheEndpoint,
  testDataSourcesEndpoint,
  testRealTimeScraping
}; 