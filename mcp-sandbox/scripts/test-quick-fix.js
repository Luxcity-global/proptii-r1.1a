#!/usr/bin/env node

/**
 * Quick Test Script to Verify API Routing Fixes
 * Tests the basic endpoints to ensure they're accessible
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3002/api/mcp';
const API_TIMEOUT = 10000; // 10 seconds

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
      
      return true;
    } else {
      logError('Health check failed - unexpected response');
      return false;
    }
  } catch (error) {
    logError(`Health check failed: ${error.message}`);
    if (error.response) {
      logError(`Response: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

async function testEnhancedSearch() {
  log('\n🔍 Testing Enhanced Search', 'cyan');
  
  try {
    const payload = {
      query: 'London',
      filters: {
        minPrice: 1000,
        maxPrice: 3000,
        bedrooms: 2
      },
      useRealData: false
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

async function testCacheEndpoint() {
  log('\n💾 Testing Cache Endpoint', 'cyan');
  
  try {
    const startTime = Date.now();
    const response = await axios.get(`${BASE_URL}/cache`, { timeout: API_TIMEOUT });
    const endTime = Date.now();
    
    if (response.status === 200 && response.data.success) {
      const cacheData = response.data.data;
      
      logSuccess(`Cache check completed in ${endTime - startTime}ms`);
      logInfo(`Total entries: ${cacheData.totalEntries}`);
      logInfo(`Memory usage: ${cacheData.memoryUsage}`);
      logInfo(`Hit rate: ${cacheData.hitRate}%`);
      
      return true;
    } else {
      logError('Cache check failed - unexpected response');
      return false;
    }
  } catch (error) {
    logError(`Cache check failed: ${error.message}`);
    if (error.response) {
      logError(`Response: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

async function main() {
  log('🚀 Quick API Routing Fix Test', 'bright');
  log(`Base URL: ${BASE_URL}`);
  log('');
  
  try {
    const results = {
      health: await testHealthEndpoint(),
      enhancedSearch: await testEnhancedSearch(),
      cache: await testCacheEndpoint()
    };
    
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
    
    if (passed === total) {
      log('\n🎉 All tests passed! API routing is working correctly.', 'green');
    } else {
      log('\n⚠️ Some tests failed. Check the server and try again.', 'yellow');
    }
    
    return passed === total;
  } catch (error) {
    logError(`Test execution failed: ${error.message}`);
    return false;
  }
}

// Run the tests
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testHealthEndpoint,
  testEnhancedSearch,
  testCacheEndpoint,
  main
}; 