#!/usr/bin/env node

/**
 * Zoopla Live Validation Script
 * Tests Zoopla scraping with real website data
 * Part of Sprint 1: Production Readiness
 */

const { PropertyDataMCP } = require('../dist/mcp/property-data/PropertyDataMCP');
const { scrapeZooplaWithQuery } = require('../dist/scrapers/zooplaScraper');
const { buildZooplaUrl } = require('../dist/scrapers/zooplaQueryParser');
const { parseSearchQuery } = require('../dist/utils/queryParser');

class ZooplaLiveValidator {
  constructor() {
    this.propertyMCP = new PropertyDataMCP();
    this.validationResults = [];
    this.startTime = Date.now();
  }

  async runValidation() {
    console.log('🔍 Starting Zoopla Live Validation');
    console.log('=' .repeat(60));
    
    const validationId = Math.random().toString(36).substr(2, 9);
    console.log(`Validation ID: ${validationId}`);
    console.log(`Start Time: ${new Date().toISOString()}`);
    console.log('');

    try {
      // Test 1: Basic Search Query
      await this.testBasicSearchQuery();
      
      // Test 2: URL Building Validation
      await this.testUrlBuilding();
      
      // Test 3: Direct Scraper Testing
      await this.testDirectScraper();
      
      // Test 4: PropertyDataMCP Integration
      await this.testPropertyDataMCPIntegration();
      
      // Test 5: Error Handling
      await this.testErrorHandling();
      
      // Generate Validation Report
      await this.generateValidationReport();
      
    } catch (error) {
      console.error('❌ Validation failed:', error);
      process.exit(1);
    }
  }

  async testBasicSearchQuery() {
    console.log('📋 Test 1: Basic Search Query Validation');
    console.log('-'.repeat(40));
    
    const testQueries = [
      '2 bedroom flat in London',
      '3 bedroom house in Manchester',
      '1 bedroom apartment in Birmingham',
      'studio flat in Edinburgh'
    ];

    for (const query of testQueries) {
      try {
        console.log(`Testing query: "${query}"`);
        
        const startTime = Date.now();
        const properties = await scrapeZooplaWithQuery(query);
        const duration = Date.now() - startTime;
        
        const result = {
          test: 'Basic Search Query',
          query,
          success: true,
          propertiesFound: properties.length,
          duration,
          timestamp: new Date().toISOString()
        };
        
        console.log(`✅ Found ${properties.length} properties in ${duration}ms`);
        
        if (properties.length > 0) {
          const sample = properties[0];
          console.log(`   Sample: ${sample.title} - ${sample.price.display}`);
        }
        
        this.validationResults.push(result);
        
        // Rate limiting between tests
        await this.delay(2000);
        
      } catch (error) {
        console.log(`❌ Failed: ${error.message}`);
        
        this.validationResults.push({
          test: 'Basic Search Query',
          query,
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    console.log('');
  }

  async testUrlBuilding() {
    console.log('🔗 Test 2: URL Building Validation');
    console.log('-'.repeat(40));
    
    const testCases = [
      {
        query: '2 bedroom flat in London under 2000',
        expected: { location: 'london', bedrooms: 2, propertyType: 'flat', priceRange: { max: 2000 } }
      },
      {
        query: '3 bedroom house in Manchester',
        expected: { location: 'manchester', bedrooms: 3, propertyType: 'house' }
      },
      {
        query: 'property in Birmingham between 1000 and 3000',
        expected: { location: 'birmingham', priceRange: { min: 1000, max: 3000 } }
      }
    ];

    for (const testCase of testCases) {
      try {
        console.log(`Testing URL building for: "${testCase.query}"`);
        
        const parsedQuery = parseSearchQuery(testCase.query);
        const url = buildZooplaUrl(parsedQuery);
        
        console.log(`   Parsed:`, parsedQuery);
        console.log(`   URL: ${url}`);
        
        // Validate URL format
        const isValidUrl = this.validateZooplaUrl(url);
        console.log(`   Valid URL: ${isValidUrl ? '✅' : '❌'}`);
        
        this.validationResults.push({
          test: 'URL Building',
          query: testCase.query,
          success: isValidUrl,
          url,
          parsedQuery,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.log(`❌ URL building failed: ${error.message}`);
        
        this.validationResults.push({
          test: 'URL Building',
          query: testCase.query,
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    console.log('');
  }

  async testDirectScraper() {
    console.log('🕷️ Test 3: Direct Scraper Testing');
    console.log('-'.repeat(40));
    
    const testQuery = '2 bedroom flat in London';
    
    try {
      console.log(`Testing direct scraper with: "${testQuery}"`);
      
      const startTime = Date.now();
      const properties = await scrapeZooplaWithQuery(testQuery);
      const duration = Date.now() - startTime;
      
      console.log(`✅ Direct scraper found ${properties.length} properties in ${duration}ms`);
      
      if (properties.length > 0) {
        // Validate property structure
        const sample = properties[0];
        const structureValidation = this.validatePropertyStructure(sample);
        
        console.log('   Property structure validation:');
        console.log(`     - Has ID: ${structureValidation.hasId ? '✅' : '❌'}`);
        console.log(`     - Has Title: ${structureValidation.hasTitle ? '✅' : '❌'}`);
        console.log(`     - Has Price: ${structureValidation.hasPrice ? '✅' : '❌'}`);
        console.log(`     - Has Location: ${structureValidation.hasLocation ? '✅' : '❌'}`);
        console.log(`     - Has Details: ${structureValidation.hasDetails ? '✅' : '❌'}`);
        console.log(`     - Has Images: ${structureValidation.hasImages ? '✅' : '❌'}`);
        console.log(`     - Has Agent: ${structureValidation.hasAgent ? '✅' : '❌'}`);
        
        this.validationResults.push({
          test: 'Direct Scraper',
          query: testQuery,
          success: true,
          propertiesFound: properties.length,
          duration,
          structureValidation,
          sampleProperty: {
            id: sample.id,
            title: sample.title,
            price: sample.price.display,
            location: sample.location.address
          },
          timestamp: new Date().toISOString()
        });
      }
      
    } catch (error) {
      console.log(`❌ Direct scraper failed: ${error.message}`);
      
      this.validationResults.push({
        test: 'Direct Scraper',
        query: testQuery,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
    
    console.log('');
  }

  async testPropertyDataMCPIntegration() {
    console.log('🏗️ Test 4: PropertyDataMCP Integration');
    console.log('-'.repeat(40));
    
    const testQuery = '2 bedroom flat in London';
    
    try {
      console.log(`Testing PropertyDataMCP integration with: "${testQuery}"`);
      
      const startTime = Date.now();
      const properties = await this.propertyMCP.scrapeZoopla(testQuery);
      const duration = Date.now() - startTime;
      
      console.log(`✅ PropertyDataMCP found ${properties.length} properties in ${duration}ms`);
      
      if (properties.length > 0) {
        // Check if properties are in MCP format
        const sample = properties[0];
        const mcpFormatValidation = this.validateMCPFormat(sample);
        
        console.log('   MCP format validation:');
        console.log(`     - Has MCP ID: ${mcpFormatValidation.hasMcpId ? '✅' : '❌'}`);
        console.log(`     - Has Specifications: ${mcpFormatValidation.hasSpecifications ? '✅' : '❌'}`);
        console.log(`     - Has Metadata: ${mcpFormatValidation.hasMetadata ? '✅' : '❌'}`);
        console.log(`     - Source is Zoopla: ${mcpFormatValidation.sourceIsZoopla ? '✅' : '❌'}`);
        
        this.validationResults.push({
          test: 'PropertyDataMCP Integration',
          query: testQuery,
          success: true,
          propertiesFound: properties.length,
          duration,
          mcpFormatValidation,
          sampleProperty: {
            id: sample.id,
            title: sample.title,
            price: sample.price.display,
            specifications: sample.specifications,
            metadata: sample.metadata
          },
          timestamp: new Date().toISOString()
        });
      }
      
    } catch (error) {
      console.log(`❌ PropertyDataMCP integration failed: ${error.message}`);
      
      this.validationResults.push({
        test: 'PropertyDataMCP Integration',
        query: testQuery,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
    
    console.log('');
  }

  async testErrorHandling() {
    console.log('⚠️ Test 5: Error Handling Validation');
    console.log('-'.repeat(40));
    
    const errorTestCases = [
      'invalid-location-xyz-123',
      'property in nonexistent-city-999',
      '0 bedroom house in London',
      'property with invalid price range'
    ];

    for (const query of errorTestCases) {
      try {
        console.log(`Testing error handling with: "${query}"`);
        
        const startTime = Date.now();
        const properties = await scrapeZooplaWithQuery(query);
        const duration = Date.now() - startTime;
        
        console.log(`   Result: ${properties.length} properties found in ${duration}ms`);
        
        // This is actually good - it should handle invalid queries gracefully
        this.validationResults.push({
          test: 'Error Handling',
          query,
          success: true,
          propertiesFound: properties.length,
          duration,
          gracefulHandling: true,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.log(`   Error caught: ${error.message}`);
        
        this.validationResults.push({
          test: 'Error Handling',
          query,
          success: false,
          error: error.message,
          gracefulHandling: true,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    console.log('');
  }

  validateZooplaUrl(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname === 'www.zoopla.co.uk' && 
             urlObj.pathname.includes('/to-rent/');
    } catch {
      return false;
    }
  }

  validatePropertyStructure(property) {
    return {
      hasId: !!property.id,
      hasTitle: !!property.title,
      hasPrice: !!(property.price && property.price.amount),
      hasLocation: !!(property.location && property.location.address),
      hasDetails: !!(property.details && property.details.bedrooms !== undefined),
      hasImages: !!(property.images && Array.isArray(property.images)),
      hasAgent: !!(property.agent && property.agent.name)
    };
  }

  validateMCPFormat(property) {
    return {
      hasMcpId: !!property.id && property.id.startsWith('zoopla-'),
      hasSpecifications: !!(property.specifications && property.specifications.bedrooms !== undefined),
      hasMetadata: !!(property.metadata && property.metadata.source),
      sourceIsZoopla: property.metadata?.source === 'zoopla'
    };
  }

  async generateValidationReport() {
    console.log('📊 Validation Report');
    console.log('=' .repeat(60));
    
    const totalTests = this.validationResults.length;
    const successfulTests = this.validationResults.filter(r => r.success).length;
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
    this.validationResults.forEach(result => {
      if (!testGroups[result.test]) {
        testGroups[result.test] = [];
      }
      testGroups[result.test].push(result);
    });
    
    Object.entries(testGroups).forEach(([testName, results]) => {
      const testSuccess = results.filter(r => r.success).length;
      const testTotal = results.length;
      console.log(`${testName}: ${testSuccess}/${testTotal} (${((testSuccess / testTotal) * 100).toFixed(1)}%)`);
    });
    
    console.log('');
    console.log('Detailed Results:');
    console.log('-'.repeat(40));
    
    this.validationResults.forEach((result, index) => {
      console.log(`${index + 1}. ${result.test}: ${result.success ? '✅' : '❌'}`);
      if (result.query) {
        console.log(`   Query: "${result.query}"`);
      }
      if (result.propertiesFound !== undefined) {
        console.log(`   Properties: ${result.propertiesFound}`);
      }
      if (result.duration) {
        console.log(`   Duration: ${result.duration}ms`);
      }
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      console.log('');
    });
    
    // Save detailed report to file
    const reportData = {
      validationId: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      summary: {
        totalTests,
        successfulTests,
        failedTests,
        successRate: (successfulTests / totalTests) * 100,
        totalDuration
      },
      results: this.validationResults
    };
    
    const fs = require('fs');
    const reportPath = `./validation-report-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    
    console.log(`📄 Detailed report saved to: ${reportPath}`);
    console.log('');
    console.log('🎉 Validation completed!');
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run validation if this script is executed directly
if (require.main === module) {
  const validator = new ZooplaLiveValidator();
  validator.runValidation().catch(console.error);
}

module.exports = ZooplaLiveValidator; 