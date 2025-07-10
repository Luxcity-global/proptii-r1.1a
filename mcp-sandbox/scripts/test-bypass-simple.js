#!/usr/bin/env node

/**
 * Simple Cloudflare Bypass Test
 * Quick validation of the bypass functionality
 */

const { testCloudflareBypass } = require('../src/scrapers/zooplaCloudflareBypass');

async function simpleTest() {
  console.log('🛡️ Simple Cloudflare Bypass Test');
  console.log('=' .repeat(40));

  const testUrl = 'https://www.zoopla.co.uk/to-rent/london/';
  
  console.log(`🌐 Testing URL: ${testUrl}`);
  console.log('⏳ This may take 30-60 seconds...\n');

  try {
    const startTime = Date.now();
    const success = await testCloudflareBypass(testUrl);
    const duration = Date.now() - startTime;

    console.log(`\n${success ? '✅' : '❌'} Bypass ${success ? 'SUCCESSFUL' : 'FAILED'}`);
    console.log(`⏱️ Duration: ${duration}ms`);

    if (success) {
      console.log('🎉 Cloudflare bypass is working!');
      console.log('🚀 Ready to implement in production');
    } else {
      console.log('⚠️ Bypass failed - may need additional configuration');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('💡 This might be due to:');
    console.error('   - Network connectivity issues');
    console.error('   - Chrome/Chromium not installed');
    console.error('   - Cloudflare blocking the IP');
  }
}

// Run the test
simpleTest().catch(console.error); 