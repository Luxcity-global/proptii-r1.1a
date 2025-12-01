/**
 * Browser Installation Test Script
 * 
 * This script tests if Puppeteer and Playwright browsers are properly installed
 * and can be launched successfully.
 */

const puppeteer = require('puppeteer');
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('='.repeat(60));
console.log('Browser Installation Test');
console.log('='.repeat(60));
console.log();

// Display environment information
console.log('Environment Information:');
console.log('-'.repeat(60));
console.log('Node Version:', process.version);
console.log('Platform:', process.platform);
console.log('Architecture:', process.arch);
console.log('Home Directory:', os.homedir());
console.log('Current Working Directory:', process.cwd());
console.log();

console.log('Environment Variables:');
console.log('-'.repeat(60));
console.log('CHROME_BIN:', process.env.CHROME_BIN || '(not set)');
console.log('PUPPETEER_CACHE_DIR:', process.env.PUPPETEER_CACHE_DIR || '(not set)');
console.log('PUPPETEER_EXECUTABLE_PATH:', process.env.PUPPETEER_EXECUTABLE_PATH || '(not set)');
console.log('PLAYWRIGHT_BROWSERS_PATH:', process.env.PLAYWRIGHT_BROWSERS_PATH || '(not set)');
console.log('PUPPETEER_SKIP_CHROMIUM_DOWNLOAD:', process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD || '(not set)');
console.log('PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD:', process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD || '(not set)');
console.log();

// Check Puppeteer cache directory
console.log('Checking Puppeteer Cache:');
console.log('-'.repeat(60));
const puppeteerCacheDir = process.env.PUPPETEER_CACHE_DIR || path.join(os.homedir(), '.cache', 'puppeteer');
console.log('Cache Directory:', puppeteerCacheDir);

if (fs.existsSync(puppeteerCacheDir)) {
  console.log('✓ Puppeteer cache directory exists');
  try {
    const entries = fs.readdirSync(puppeteerCacheDir, { withFileTypes: true });
    console.log(`  Found ${entries.length} entries:`);
    entries.forEach(entry => {
      console.log(`  - ${entry.name} (${entry.isDirectory() ? 'directory' : 'file'})`);
    });
  } catch (error) {
    console.log('✗ Error reading cache directory:', error.message);
  }
} else {
  console.log('✗ Puppeteer cache directory does not exist');
}
console.log();

// Check Playwright browsers
console.log('Checking Playwright Browsers:');
console.log('-'.repeat(60));
const playwrightPath = process.env.PLAYWRIGHT_BROWSERS_PATH || path.join(os.homedir(), '.cache', 'ms-playwright');
console.log('Browsers Directory:', playwrightPath);

if (fs.existsSync(playwrightPath)) {
  console.log('✓ Playwright browsers directory exists');
  try {
    const entries = fs.readdirSync(playwrightPath, { withFileTypes: true });
    console.log(`  Found ${entries.length} entries:`);
    entries.forEach(entry => {
      console.log(`  - ${entry.name} (${entry.isDirectory() ? 'directory' : 'file'})`);
    });
  } catch (error) {
    console.log('✗ Error reading browsers directory:', error.message);
  }
} else {
  console.log('✗ Playwright browsers directory does not exist');
}
console.log();

// Test Puppeteer
console.log('Testing Puppeteer:');
console.log('-'.repeat(60));

async function testPuppeteer() {
  try {
    // Try to get executable path
    try {
      const execPath = puppeteer.executablePath();
      console.log('Puppeteer executable path:', execPath);
      if (fs.existsSync(execPath)) {
        console.log('✓ Executable exists at the specified path');
      } else {
        console.log('✗ Executable does NOT exist at the specified path');
      }
    } catch (error) {
      console.log('✗ Error getting executable path:', error.message);
    }

    // Try to launch browser
    console.log('Attempting to launch Puppeteer browser...');
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    console.log('✓ Successfully launched Puppeteer browser');
    
    const version = await browser.version();
    console.log('Browser version:', version);
    
    // Test basic navigation
    const page = await browser.newPage();
    await page.goto('https://example.com');
    const title = await page.title();
    console.log('✓ Successfully navigated to test page');
    console.log('Page title:', title);
    
    await browser.close();
    console.log('✓ Puppeteer test completed successfully');
    return true;
  } catch (error) {
    console.log('✗ Puppeteer test failed:', error.message);
    return false;
  }
}

// Test Playwright
console.log();
console.log('Testing Playwright:');
console.log('-'.repeat(60));

async function testPlaywright() {
  try {
    console.log('Attempting to launch Playwright browser...');
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    console.log('✓ Successfully launched Playwright browser');
    
    const version = browser.version();
    console.log('Browser version:', version);
    
    // Test basic navigation
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('https://example.com');
    const title = await page.title();
    console.log('✓ Successfully navigated to test page');
    console.log('Page title:', title);
    
    await browser.close();
    console.log('✓ Playwright test completed successfully');
    return true;
  } catch (error) {
    console.log('✗ Playwright test failed:', error.message);
    return false;
  }
}

// Run tests
async function runTests() {
  const puppeteerResult = await testPuppeteer();
  const playwrightResult = await testPlaywright();
  
  console.log();
  console.log('='.repeat(60));
  console.log('Test Summary:');
  console.log('-'.repeat(60));
  console.log('Puppeteer:', puppeteerResult ? '✓ PASS' : '✗ FAIL');
  console.log('Playwright:', playwrightResult ? '✓ PASS' : '✗ FAIL');
  console.log('='.repeat(60));
  
  if (puppeteerResult && playwrightResult) {
    console.log('✓ All tests passed! Browsers are properly installed.');
    process.exit(0);
  } else {
    console.log('✗ Some tests failed. Please check the errors above.');
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});

