#!/usr/bin/env node

/**
 * Test Enhanced API Endpoints (Phase 2.2)
 * 
 * This script tests all the new enhanced API endpoints that leverage
 * the enhanced PropertyDataMCP with real scraping capabilities.
 * 
 * Usage:
 *   node scripts/test-enhanced-api.js [endpoint] [options]
 * 
 * Endpoints:
 *   - health: Test health check endpoint
 *   - enhanced-search: Test enhanced search with real data support
 *   - scraping: Test direct scraping endpoint
 *   - cache: Test cache management endpoint
 *   - all: Test all endpoints
 * 
 * Examples:
 *   node scripts/test-enhanced-api.js health
 *   node scripts/test-enhanced-api.js enhanced-search "London" true
 *   node scripts/test-enhanced-api.js scraping "openrent" "Manchester" 2
 *   node scripts/test-enhanced-api.js all
 */

const axios = require('axios');

// Configuration
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3002/api/mcp';
const API_TIMEOUT = 30000; // 30 seconds

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️ ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️ ${message}`, 'yellow');
}

async function testHealthEndpoint() {
  log('\n🏥 Testing Health Endpoint', 'cyan');
  
  try {
    const startTime = Date.now();
    const response = await axios.get(`${BASE_URL}/health`, { timeout: API_TIMEOUT });
    const endTime = Date.now();
    
    if (response.status === 200 && response.data.success) {
      const healthData = response.data.data;
      
      logSuccess(`Health check passed in ${endTime - startTime}ms`);
      logInfo(`Status: ${healthData.status}`);
      logInfo(`Version: ${healthData.version}`);
      logInfo(`Uptime: ${Math.round(healthData.performance.uptime)}s`);
      
      // Log service status
      Object.entries(healthData.services).forEach(([service, status]) => {
        const statusColor = status.status === 'operational' ? 'green' : 'red';
        log(`${service}: ${status.status}`, statusColor);
      });
      
      // Log features
      logInfo('Features:');
      Object.entries(healthData.features).forEach(([feature, enabled]) => {
        const featureColor = enabled ? 'green' : 'yellow';
        log(`  ${feature}: ${enabled}`, featureColor);
      });
      
      return true;
    } else {
      logError('Health check failed - unexpected response');
      return false;
    }
  } catch (error) {
    logError(`Health check failed: ${error.message}`);
    return false;
  }
}

async function testEnhancedSearch(query = 'London', useRealData = false) {
  log(`\n🔍 Testing Enhanced Search: "${query}" (real: ${useRealData})`, 'cyan');
  
  try {
    const payload = {
      query: query,
      filters: {
        minPrice: 1000,
        maxPrice: 3000,
        bedrooms: 2
      },
      useRealData: useRealData
    };
    
    const startTime = Date.now();
    const response = await axios.post(`${BASE_URL}/enhanced-search`, payload, { 
      timeout: API_TIMEOUT,
      headers: { 'Content-Type': 'application/json' }
    });
    const endTime = Date.now();
    
    if (response.status === 200 && response.data.success) {
      const data = response.data.data;
      const stats = data.searchStats;
      
      logSuccess(`Enhanced search completed in ${endTime - startTime}ms`);
      logInfo(`Total results: ${stats.totalResults}`);
      logInfo(`Search time: ${stats.searchTime}ms`);
      logInfo(`Data source: ${stats.dataSource}`);
      logInfo(`Filters applied: ${Object.keys(stats.filters).length}`);
      
      if (data.properties && data.properties.length > 0) {
        const sampleProperty = data.properties[0];
        logInfo('Sample property:');
        log(`  ID: ${sampleProperty.id}`);
        log(`  Title: ${sampleProperty.title}`);
        log(`  Price: ${sampleProperty.price.display}`);
        log(`  Source: ${sampleProperty.metadata.source}`);
        log(`  Search Score: ${sampleProperty.metadata.searchScore}`);
      }
      
      return true;
    } else {
      logError('Enhanced search failed - unexpected response');
      return false;
    }
  } catch (error) {
    logError(`Enhanced search failed: ${error.message}`);
    if (error.response) {
      logError(`Response: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

async function testScrapingEndpoint(source = 'openrent', query = 'London', pages = 2) {
  log(`\n🏠 Testing Scraping: ${source} - "${query}" (${pages} pages)`, 'cyan');
  
  try {
    const payload = {
      source: source,
      query: query,
      pages: pages
    };
    
    const startTime = Date.now();
    const response = await axios.post(`${BASE_URL}/scraping`, payload, { 
      timeout: API_TIMEOUT * 2, // Longer timeout for scraping
      headers: { 'Content-Type': 'application/json' }
    });
    const endTime = Date.now();
    
    if (response.status === 200 && response.data.success) {
      const data = response.data.data;
      const stats = data.scrapingStats;
      
      logSuccess(`Scraping completed in ${endTime - startTime}ms`);
      logInfo(`Source: ${stats.source}`);
      logInfo(`Total results: ${stats.totalResults}`);
      logInfo(`Pages scraped: ${stats.pagesScraped}`);
      logInfo(`Scraping time: ${stats.scrapingTime}ms`);
      logInfo(`Average time per page: ${stats.averageTimePerPage.toFixed(0)}ms`);
      
      if (data.properties && data.properties.length > 0) {
        const sampleProperty = data.properties[0];
        logInfo('Sample scraped property:');
        log(`  ID: ${sampleProperty.id}`);
        log(`  Title: ${sampleProperty.title}`);
        log(`  Price: ${sampleProperty.price.display}`);
        log(`  Source: ${sampleProperty.metadata.source}`);
      }
      
      return true;
    } else {
      logError('Scraping failed - unexpected response');
      return false;
    }
  } catch (error) {
    logError(`Scraping failed: ${error.message}`);
    if (error.response) {
      logError(`Response: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

async function testCacheEndpoint(action = 'status') {
  log(`\n💾 Testing Cache: ${action}`, 'cyan');
  
  try {
    let payload = { action: action };
    
    if (action === 'update') {
      // Create test properties for cache update
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
      
      payload = {
        action: action,
        source: 'test',
        properties: testProperties
      };
    }
    
    const startTime = Date.now();
    const response = await axios.post(`${BASE_URL}/cache`, payload, { 
      timeout: API_TIMEOUT,
      headers: { 'Content-Type': 'application/json' }
    });
    const endTime = Date.now();
    
    if (response.status === 200 && response.data.success) {
      logSuccess(`Cache operation completed in ${endTime - startTime}ms`);
      
      if (action === 'status') {
        const status = response.data.data;
        logInfo('Cache status:');
        log(`  Real scraping enabled: ${status.realScrapingEnabled}`);
        log(`  Scraping enabled: ${status.scrapingEnabled}`);
        log(`  Cache enabled: ${status.cacheEnabled}`);
        log(`  Redis enabled: ${status.redisEnabled}`);
      } else if (action === 'update') {
        logInfo(`Cache updated for source: ${response.data.source}`);
        logInfo(`Properties cached: ${response.data.propertiesCount}`);
      }
      
      return true;
    } else {
      logError('Cache operation failed - unexpected response');
      return false;
    }
  } catch (error) {
    logError(`Cache operation failed: ${error.message}`);
    if (error.response) {
      logError(`Response: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

async function runAllTests() {
  log('\n🧪 Running All Enhanced API Tests', 'magenta');
  
  const results = {
    health: false,
    enhancedSearch: false,
    scraping: false,
    cache: false
  };
  
  // Test health endpoint
  results.health = await testHealthEndpoint();
  
  // Test enhanced search (mock data)
  results.enhancedSearch = await testEnhancedSearch('London', false);
  
  // Test scraping (if real scraping is enabled)
  results.scraping = await testScrapingEndpoint('openrent', 'London', 1);
  
  // Test cache operations
  results.cache = await testCacheEndpoint('status');
  
  // Summary
  log('\n📊 Test Results Summary', 'magenta');
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? 'PASSED' : 'FAILED';
    const color = passed ? 'green' : 'red';
    log(`${test}: ${status}`, color);
  });
  
  log(`\nOverall: ${passed}/${total} tests passed`, passed === total ? 'green' : 'yellow');
  
  return passed === total;
}

async function main() {
  const args = process.argv.slice(2);
  const endpoint = args[0] || 'all';
  
  log('🚀 Enhanced API Testing (Phase 2.2)', 'bright');
  log(`Base URL: ${BASE_URL}`);
  log(`Endpoint: ${endpoint}`);
  log('');
  
  try {
    switch (endpoint.toLowerCase()) {
      case 'health':
        await testHealthEndpoint();
        break;
        
      case 'enhanced-search':
        const query = args[1] || 'London';
        const useRealData = args[2] === 'true';
        await testEnhancedSearch(query, useRealData);
        break;
        
      case 'scraping':
        const source = args[1] || 'openrent';
        const scrapeQuery = args[2] || 'London';
        const pages = parseInt(args[3]) || 2;
        await testScrapingEndpoint(source, scrapeQuery, pages);
        break;
        
      case 'cache':
        const action = args[1] || 'status';
        await testCacheEndpoint(action);
        break;
        
      case 'all':
        await runAllTests();
        break;
        
      default:
        logError(`Unknown endpoint: ${endpoint}`);
        log('Available endpoints: health, enhanced-search, scraping, cache, all');
        process.exit(1);
    }
  } catch (error) {
    logError(`Test execution failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the tests
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testHealthEndpoint,
  testEnhancedSearch,
  testScrapingEndpoint,
  testCacheEndpoint,
  runAllTests
}; 