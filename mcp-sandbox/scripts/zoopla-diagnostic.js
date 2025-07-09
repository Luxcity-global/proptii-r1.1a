#!/usr/bin/env node

/**
 * Zoopla Diagnostic Script
 * Identifies the exact issue with Zoopla scraping
 * Tests each component step by step with detailed logging
 */

const fs = require('fs');
const path = require('path');

class ZooplaDiagnostic {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
  }

  async runDiagnostic() {
    console.log('🔍 Zoopla Diagnostic - Identifying Issues');
    console.log('=' .repeat(60));
    console.log(`Start Time: ${new Date().toISOString()}`);
    console.log(`Node Version: ${process.version}`);
    console.log(`Platform: ${process.platform}`);
    console.log(`Architecture: ${process.arch}`);
    console.log('');

    try {
      // Test 1: Environment and Dependencies
      await this.testEnvironment();
      
      // Test 2: Module Loading
      await this.testModuleLoading();
      
      // Test 3: Network Connectivity
      await this.testNetworkConnectivity();
      
      // Test 4: Basic HTTP Requests
      await this.testBasicHttpRequests();
      
      // Test 5: Puppeteer Installation
      await this.testPuppeteerInstallation();
      
      // Test 6: Basic Puppeteer Functionality
      await this.testBasicPuppeteer();
      
      // Test 7: Zoopla URL Building
      await this.testZooplaUrlBuilding();
      
      // Test 8: Zoopla HTML Parsing
      await this.testZooplaHtmlParsing();
      
      // Test 9: Full Zoopla Scraping (with timeouts)
      await this.testFullZooplaScraping();
      
      // Generate Diagnostic Report
      await this.generateDiagnosticReport();
      
    } catch (error) {
      console.error('❌ Diagnostic failed:', error);
      this.results.push({
        test: 'Diagnostic Overall',
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      await this.generateDiagnosticReport();
    }
  }

  async testEnvironment() {
    console.log('🔧 Test 1: Environment and Dependencies');
    console.log('-'.repeat(40));
    
    try {
      // Check Node.js version
      const nodeVersion = process.version;
      const isNodeVersionOk = nodeVersion.startsWith('v16') || nodeVersion.startsWith('v18') || nodeVersion.startsWith('v20');
      
      console.log(`   Node.js Version: ${nodeVersion} ${isNodeVersionOk ? '✅' : '❌'}`);
      
      // Check if we're in the right directory
      const currentDir = process.cwd();
      const isMcpSandbox = currentDir.includes('mcp-sandbox');
      console.log(`   Current Directory: ${currentDir} ${isMcpSandbox ? '✅' : '❌'}`);
      
      // Check if dist folder exists
      const distExists = fs.existsSync(path.join(currentDir, 'dist'));
      console.log(`   Dist Folder: ${distExists ? '✅' : '❌'}`);
      
      // Check package.json
      const packageJsonExists = fs.existsSync(path.join(currentDir, 'package.json'));
      console.log(`   Package.json: ${packageJsonExists ? '✅' : '❌'}`);
      
      this.results.push({
        test: 'Environment',
        success: isNodeVersionOk && isMcpSandbox && distExists && packageJsonExists,
        details: {
          nodeVersion,
          currentDir,
          distExists,
          packageJsonExists
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.log(`   ❌ Environment test failed: ${error.message}`);
      this.results.push({
        test: 'Environment',
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
    
    console.log('');
  }

  async testModuleLoading() {
    console.log('📦 Test 2: Module Loading');
    console.log('-'.repeat(40));
    
    const modules = [
      { name: 'axios', path: 'axios' },
      { name: 'cheerio', path: 'cheerio' },
      { name: 'puppeteer', path: 'puppeteer' },
      { name: 'Zoopla Scraper', path: '../dist/scrapers/zooplaScraper' },
      { name: 'Zoopla Query Parser', path: '../dist/scrapers/zooplaQueryParser' },
      { name: 'Query Parser', path: '../dist/utils/queryParser' },
      { name: 'PropertyDataMCP', path: '../dist/mcp/property-data/PropertyDataMCP' }
    ];

    for (const module of modules) {
      try {
        console.log(`   Loading ${module.name}...`);
        require(module.path);
        console.log(`   ✅ ${module.name} loaded successfully`);
        
        this.results.push({
          test: `Module Loading - ${module.name}`,
          success: true,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.log(`   ❌ ${module.name} failed: ${error.message}`);
        
        this.results.push({
          test: `Module Loading - ${module.name}`,
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    console.log('');
  }

  async testNetworkConnectivity() {
    console.log('🌐 Test 3: Network Connectivity');
    console.log('-'.repeat(40));
    
    try {
      const axios = require('axios');
      
      // Test basic internet connectivity
      console.log('   Testing basic internet connectivity...');
      const startTime = Date.now();
      const response = await axios.get('https://httpbin.org/get', { timeout: 10000 });
      const duration = Date.now() - startTime;
      
      console.log(`   ✅ Internet connectivity: ${duration}ms`);
      
      // Test Zoopla connectivity
      console.log('   Testing Zoopla connectivity...');
      const zooplaStartTime = Date.now();
      const zooplaResponse = await axios.get('https://www.zoopla.co.uk', { 
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
        }
      });
      const zooplaDuration = Date.now() - zooplaStartTime;
      
      console.log(`   ✅ Zoopla connectivity: ${zooplaDuration}ms (Status: ${zooplaResponse.status})`);
      
      this.results.push({
        test: 'Network Connectivity',
        success: true,
        details: {
          internetResponseTime: duration,
          zooplaResponseTime: zooplaDuration,
          zooplaStatus: zooplaResponse.status
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.log(`   ❌ Network test failed: ${error.message}`);
      
      this.results.push({
        test: 'Network Connectivity',
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
    
    console.log('');
  }

  async testBasicHttpRequests() {
    console.log('📡 Test 4: Basic HTTP Requests');
    console.log('-'.repeat(40));
    
    try {
      const axios = require('axios');
      
      // Test simple Zoopla search page
      const testUrl = 'https://www.zoopla.co.uk/to-rent/london/';
      console.log(`   Testing: ${testUrl}`);
      
      const startTime = Date.now();
      const response = await axios.get(testUrl, {
        timeout: 20000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        }
      });
      const duration = Date.now() - startTime;
      
      console.log(`   ✅ HTTP request successful: ${duration}ms`);
      console.log(`   Content length: ${response.data.length} characters`);
      console.log(`   Status: ${response.status}`);
      
      // Check if we got blocked
      const html = response.data.toLowerCase();
      const isBlocked = html.includes('captcha') || html.includes('unusual traffic') || html.includes('are you a human');
      console.log(`   Blocked/CAPTCHA: ${isBlocked ? '❌ YES' : '✅ NO'}`);
      
      this.results.push({
        test: 'Basic HTTP Requests',
        success: !isBlocked,
        details: {
          responseTime: duration,
          contentLength: response.data.length,
          status: response.status,
          isBlocked
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.log(`   ❌ HTTP request failed: ${error.message}`);
      
      this.results.push({
        test: 'Basic HTTP Requests',
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
    
    console.log('');
  }

  async testPuppeteerInstallation() {
    console.log('🎭 Test 5: Puppeteer Installation');
    console.log('-'.repeat(40));
    
    try {
      const puppeteer = require('puppeteer');
      console.log('   ✅ Puppeteer module loaded');
      
      // Check Puppeteer version
      const version = puppeteer.version;
      console.log(`   Puppeteer version: ${version}`);
      
      // Check if Chrome is available
      console.log('   Checking Chrome availability...');
      const executablePath = await puppeteer.executablePath;
      console.log(`   Chrome path: ${executablePath}`);
      
      const chromeExists = fs.existsSync(executablePath);
      console.log(`   Chrome executable exists: ${chromeExists ? '✅' : '❌'}`);
      
      this.results.push({
        test: 'Puppeteer Installation',
        success: chromeExists,
        details: {
          version,
          executablePath,
          chromeExists
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.log(`   ❌ Puppeteer test failed: ${error.message}`);
      
      this.results.push({
        test: 'Puppeteer Installation',
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
    
    console.log('');
  }

  async testBasicPuppeteer() {
    console.log('🎭 Test 6: Basic Puppeteer Functionality');
    console.log('-'.repeat(40));
    
    try {
      const puppeteer = require('puppeteer');
      
      console.log('   Launching Puppeteer browser...');
      const startTime = Date.now();
      
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        timeout: 30000
      });
      
      const launchTime = Date.now() - startTime;
      console.log(`   ✅ Browser launched in ${launchTime}ms`);
      
      console.log('   Creating new page...');
      const page = await browser.newPage();
      console.log('   ✅ Page created');
      
      console.log('   Navigating to test page...');
      const navStartTime = Date.now();
      await page.goto('https://httpbin.org/html', { 
        waitUntil: 'networkidle2', 
        timeout: 15000 
      });
      const navTime = Date.now() - navStartTime;
      console.log(`   ✅ Navigation completed in ${navTime}ms`);
      
      console.log('   Extracting page title...');
      const title = await page.title();
      console.log(`   ✅ Page title: "${title}"`);
      
      console.log('   Closing browser...');
      await browser.close();
      console.log('   ✅ Browser closed');
      
      this.results.push({
        test: 'Basic Puppeteer Functionality',
        success: true,
        details: {
          launchTime,
          navigationTime: navTime,
          title
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.log(`   ❌ Basic Puppeteer test failed: ${error.message}`);
      
      this.results.push({
        test: 'Basic Puppeteer Functionality',
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
    
    console.log('');
  }

  async testZooplaUrlBuilding() {
    console.log('🔗 Test 7: Zoopla URL Building');
    console.log('-'.repeat(40));
    
    try {
      const { buildZooplaUrl } = require('../dist/scrapers/zooplaQueryParser');
      const { parseSearchQuery } = require('../dist/utils/queryParser');
      
      const testQuery = '2 bedroom flat in London';
      console.log(`   Testing query: "${testQuery}"`);
      
      const parsedQuery = parseSearchQuery(testQuery);
      console.log(`   Parsed query:`, parsedQuery);
      
      const url = buildZooplaUrl(parsedQuery);
      console.log(`   Generated URL: ${url}`);
      
      // Validate URL format
      const isValidUrl = url.includes('zoopla.co.uk') && url.includes('/to-rent/');
      console.log(`   URL validation: ${isValidUrl ? '✅' : '❌'}`);
      
      this.results.push({
        test: 'Zoopla URL Building',
        success: isValidUrl,
        details: {
          query: testQuery,
          parsedQuery,
          url,
          isValidUrl
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.log(`   ❌ URL building test failed: ${error.message}`);
      
      this.results.push({
        test: 'Zoopla URL Building',
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
    
    console.log('');
  }

  async testZooplaHtmlParsing() {
    console.log('🔍 Test 8: Zoopla HTML Parsing');
    console.log('-'.repeat(40));
    
    try {
      const { parseZooplaSearchResults } = require('../dist/scrapers/zooplaScraper');
      const cheerio = require('cheerio');
      
      // Create a simple test HTML
      const testHtml = `
        <html>
          <body>
            <div data-testid="listing-details">
              <h2 data-testid="listing-title">2 Bedroom Flat in London</h2>
              <div data-testid="listing-price">£2,500 pcm</div>
              <div data-testid="listing-location">London, SW1</div>
            </div>
          </body>
        </html>
      `;
      
      console.log('   Testing HTML parsing with mock data...');
      const properties = parseZooplaSearchResults(testHtml);
      console.log(`   ✅ Parsed ${properties.length} properties from mock HTML`);
      
      if (properties.length > 0) {
        const property = properties[0];
        console.log(`   Sample property: ${property.title} - ${property.price.display}`);
      }
      
      this.results.push({
        test: 'Zoopla HTML Parsing',
        success: true,
        details: {
          propertiesFound: properties.length,
          sampleProperty: properties.length > 0 ? {
            title: properties[0].title,
            price: properties[0].price.display
          } : null
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.log(`   ❌ HTML parsing test failed: ${error.message}`);
      
      this.results.push({
        test: 'Zoopla HTML Parsing',
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
    
    console.log('');
  }

  async testFullZooplaScraping() {
    console.log('🕷️ Test 9: Full Zoopla Scraping (with timeouts)');
    console.log('-'.repeat(40));
    
    try {
      const { scrapeZooplaWithQuery } = require('../dist/scrapers/zooplaScraper');
      
      const testQuery = '2 bedroom flat in London';
      console.log(`   Testing full scraping with: "${testQuery}"`);
      console.log('   ⚠️ This test has a 60-second timeout...');
      
      // Set a timeout for the entire scraping operation
      const scrapingPromise = scrapeZooplaWithQuery(testQuery);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Scraping timeout after 60 seconds')), 60000);
      });
      
      const startTime = Date.now();
      const properties = await Promise.race([scrapingPromise, timeoutPromise]);
      const duration = Date.now() - startTime;
      
      console.log(`   ✅ Full scraping completed in ${duration}ms`);
      console.log(`   Properties found: ${properties.length}`);
      
      if (properties.length > 0) {
        const sample = properties[0];
        console.log(`   Sample: ${sample.title} - ${sample.price.display}`);
      }
      
      this.results.push({
        test: 'Full Zoopla Scraping',
        success: true,
        details: {
          duration,
          propertiesFound: properties.length,
          sampleProperty: properties.length > 0 ? {
            title: properties[0].title,
            price: properties[0].price.display
          } : null
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.log(`   ❌ Full scraping test failed: ${error.message}`);
      
      this.results.push({
        test: 'Full Zoopla Scraping',
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
    
    console.log('');
  }

  async generateDiagnosticReport() {
    console.log('📊 Diagnostic Report');
    console.log('=' .repeat(60));
    
    const totalTests = this.results.length;
    const successfulTests = this.results.filter(r => r.success).length;
    const failedTests = totalTests - successfulTests;
    const totalDuration = Date.now() - this.startTime;
    
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Successful: ${successfulTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Success Rate: ${((successfulTests / totalTests) * 100).toFixed(1)}%`);
    console.log(`Total Duration: ${totalDuration}ms`);
    console.log('');
    
    // Group results by test type
    const testGroups = {};
    this.results.forEach(result => {
      const testType = result.test.split(' - ')[0];
      if (!testGroups[testType]) {
        testGroups[testType] = [];
      }
      testGroups[testType].push(result);
    });
    
    console.log('Test Results by Category:');
    console.log('-'.repeat(40));
    
    Object.entries(testGroups).forEach(([testType, results]) => {
      const testSuccess = results.filter(r => r.success).length;
      const testTotal = results.length;
      const status = testSuccess === testTotal ? '✅' : testSuccess === 0 ? '❌' : '⚠️';
      console.log(`${status} ${testType}: ${testSuccess}/${testTotal}`);
    });
    
    console.log('');
    console.log('Detailed Results:');
    console.log('-'.repeat(40));
    
    this.results.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${result.test}`);
      
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      
      if (result.details) {
        Object.entries(result.details).forEach(([key, value]) => {
          console.log(`   ${key}: ${value}`);
        });
      }
      console.log('');
    });
    
    // Save detailed report to file
    const reportData = {
      diagnosticId: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        architecture: process.arch,
        currentDirectory: process.cwd()
      },
      summary: {
        totalTests,
        successfulTests,
        failedTests,
        successRate: (successfulTests / totalTests) * 100,
        totalDuration
      },
      results: this.results
    };
    
    const reportPath = `./zoopla-diagnostic-report-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    
    console.log(`📄 Detailed diagnostic report saved to: ${reportPath}`);
    console.log('');
    
    // Provide recommendations
    console.log('🎯 Recommendations:');
    console.log('-'.repeat(40));
    
    const failedTestsForRecommendations = this.results.filter(r => !r.success);
    if (failedTestsForRecommendations.length === 0) {
      console.log('✅ All tests passed! Zoopla scraping should work correctly.');
    } else {
      failedTestsForRecommendations.forEach(test => {
        console.log(`❌ ${test.test}: ${test.error || 'Failed'}`);
      });
      
      console.log('');
      console.log('🔧 Suggested fixes:');
      
      if (this.results.find(r => r.test === 'Puppeteer Installation' && !r.success)) {
        console.log('- Install or reinstall Puppeteer: npm install puppeteer');
      }
      
      if (this.results.find(r => r.test === 'Network Connectivity' && !r.success)) {
        console.log('- Check internet connectivity and firewall settings');
      }
      
      if (this.results.find(r => r.test === 'Full Zoopla Scraping' && !r.success)) {
        console.log('- Zoopla may be blocking requests. Try different user agents or add delays');
      }
    }
    
    console.log('');
    console.log('🎉 Diagnostic completed!');
  }
}

// Run diagnostic if this script is executed directly
if (require.main === module) {
  const diagnostic = new ZooplaDiagnostic();
  diagnostic.runDiagnostic().catch(console.error);
}

module.exports = ZooplaDiagnostic; 