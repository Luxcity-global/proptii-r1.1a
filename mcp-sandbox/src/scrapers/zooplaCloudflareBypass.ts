/**
 * Zoopla Cloudflare Bypass Scraper
 * Advanced scraper using puppeteer-extra with stealth plugins to bypass Cloudflare protection
 */

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Browser, Page } from 'puppeteer';
import { ParsedQuery, parseSearchQuery } from '../utils/queryParser';
import { buildZooplaUrl } from './zooplaQueryParser';
import { ZooplaProperty, transformZooplaProperties } from './zooplaSchemaTransformer';

// Add stealth plugin
puppeteer.use(StealthPlugin());

// Enhanced user agent pool
const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36'
];

class ZooplaCloudflareBypass {
  private browser: Browser | null = null;
  private sessionId: string;
  private userAgent: string;

  constructor() {
    this.sessionId = Math.random().toString(36).substr(2, 9);
    this.userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  }

  /**
   * Initialize browser with stealth configuration
   */
  async initializeBrowser(): Promise<Browser> {
    console.log(`🔧 [CLOUDFLARE_BYPASS] [${this.sessionId}] Initializing stealth browser...`);

    const browser = await puppeteer.launch({
      headless: false, // May need to be false for some challenges
      args: this.getStealthArgs(),
      defaultViewport: {
        width: 1920 + Math.floor(Math.random() * 100),
        height: 1080 + Math.floor(Math.random() * 100),
        deviceScaleFactor: 1,
        hasTouch: false,
        isLandscape: false,
        isMobile: false
      }
    });

    this.browser = browser;
    return browser;
  }

  /**
   * Create a new page with stealth measures
   */
  async createStealthPage(): Promise<Page> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const page = await this.browser.newPage();

    // Set user agent
    await page.setUserAgent(this.userAgent);

    // Add additional stealth measures
    await page.evaluateOnNewDocument(() => {
      // Override webdriver property
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });

      // Override plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });

      // Override languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
      });

      // Override permissions
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission }) :
          originalQuery(parameters)
      );

      // Override chrome runtime
      if (window.chrome) {
        Object.defineProperty(window.chrome, 'runtime', {
          get: () => undefined,
        });
      }

      // Override automation properties
      delete (window as any).navigator.__proto__.webdriver;
    });

    // Set extra headers
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Sec-Ch-Ua': '"Chromium";v="124", "Not(A:Brand";v="24", "Google Chrome";v="124"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"macOS"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1'
    });

    return page;
  }

  /**
   * Solve Cloudflare challenge
   */
  async solveCloudflareChallenge(page: Page): Promise<boolean> {
    try {
      console.log(`🛡️ [CLOUDFLARE_BYPASS] [${this.sessionId}] Checking for Cloudflare challenge...`);

      // Wait for challenge to appear
      const challengeSelectors = [
        '#challenge-form',
        '.cf-browser-verification',
        '[data-testid="challenge-form"]',
        '#cf-please-wait',
        '.cf-wrapper'
      ];

      let challengeDetected = false;
      for (const selector of challengeSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 3000 });
          challengeDetected = true;
          console.log(`🛡️ [CLOUDFLARE_BYPASS] [${this.sessionId}] Challenge detected with selector: ${selector}`);
          break;
        } catch (e) {
          // Continue to next selector
        }
      }

      if (!challengeDetected) {
        console.log(`✅ [CLOUDFLARE_BYPASS] [${this.sessionId}] No challenge detected`);
        return true;
      }

      console.log(`🛡️ [CLOUDFLARE_BYPASS] [${this.sessionId}] Solving Cloudflare challenge...`);

      // Wait for challenge to complete
      await page.waitForFunction(() => {
        const body = document.querySelector('body');
        if (!body) return false;

        const hasChallenge = body.querySelector('#challenge-form') || 
                           body.querySelector('.cf-browser-verification') ||
                           body.querySelector('#cf-please-wait') ||
                           body.querySelector('.cf-wrapper');

        const titleIsChallenge = document.title === 'Just a moment...';

        return !hasChallenge && !titleIsChallenge;
      }, { timeout: 30000 });

      // Additional wait for page to stabilize
      await page.waitForTimeout(3000);

      console.log(`✅ [CLOUDFLARE_BYPASS] [${this.sessionId}] Cloudflare challenge solved successfully`);
      return true;

    } catch (error) {
      console.error(`❌ [CLOUDFLARE_BYPASS] [${this.sessionId}] Failed to solve Cloudflare challenge:`, error);
      return false;
    }
  }

  /**
   * Navigate to URL with challenge solving
   */
  async navigateWithBypass(page: Page, url: string): Promise<boolean> {
    try {
      console.log(`🌐 [CLOUDFLARE_BYPASS] [${this.sessionId}] Navigating to: ${url}`);

      // Navigate to the page
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Solve Cloudflare challenge if present
      const challengeSolved = await this.solveCloudflareChallenge(page);
      if (!challengeSolved) {
        console.error(`❌ [CLOUDFLARE_BYPASS] [${this.sessionId}] Failed to solve challenge`);
        return false;
      }

      // Wait for content to load
      await page.waitForTimeout(2000);

      // Check if we got the actual content
      const title = await page.title();
      const bodyText = await page.evaluate(() => document.body.innerText);

      if (title === 'Just a moment...' || bodyText.includes('Just a moment')) {
        console.error(`❌ [CLOUDFLARE_BYPASS] [${this.sessionId}] Still on challenge page`);
        return false;
      }

      console.log(`✅ [CLOUDFLARE_BYPASS] [${this.sessionId}] Successfully navigated to content`);
      return true;

    } catch (error) {
      console.error(`❌ [CLOUDFLARE_BYPASS] [${this.sessionId}] Navigation failed:`, error);
      return false;
    }
  }

  /**
   * Extract property data from Zoopla page
   */
  async extractPropertyData(page: Page): Promise<ZooplaProperty[]> {
    try {
      console.log(`📊 [CLOUDFLARE_BYPASS] [${this.sessionId}] Extracting property data...`);

      // Wait for property listings to load
      const listingSelectors = [
        '[data-testid="listing-details"]',
        '.listing-details',
        '.property-card',
        '.search-result',
        '[data-testid="property-card"]'
      ];

      let listingsFound = false;
      for (const selector of listingSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 5000 });
          console.log(`✅ [CLOUDFLARE_BYPASS] [${this.sessionId}] Found listings with selector: ${selector}`);
          listingsFound = true;
          break;
        } catch (e) {
          // Continue to next selector
        }
      }

      if (!listingsFound) {
        console.warn(`⚠️ [CLOUDFLARE_BYPASS] [${this.sessionId}] No listings found with any selector`);
        return [];
      }

      // Extract HTML content
      const html = await page.content();
      
      // Use existing parser to extract properties
      const properties = this.parseZooplaSearchResults(html);
      
      console.log(`✅ [CLOUDFLARE_BYPASS] [${this.sessionId}] Extracted ${properties.length} properties`);
      return properties;

    } catch (error) {
      console.error(`❌ [CLOUDFLARE_BYPASS] [${this.sessionId}] Data extraction failed:`, error);
      return [];
    }
  }

  /**
   * Main scraping function with Cloudflare bypass
   */
  async scrapeZooplaWithBypass(query: string, filters?: any): Promise<ZooplaProperty[]> {
    console.log(`🏠 [CLOUDFLARE_BYPASS] [${this.sessionId}] Starting Zoopla scraping with bypass for: "${query}"`);

    let browser: Browser | null = null;
    let page: Page | null = null;

    try {
      // Initialize browser
      browser = await this.initializeBrowser();
      
      // Create stealth page
      page = await this.createStealthPage();

      // Build URL
      const parsedQuery = parseSearchQuery(query);
      const url = buildZooplaUrl(parsedQuery, filters?.page || 1);

      // Navigate with bypass
      const navigationSuccess = await this.navigateWithBypass(page, url);
      if (!navigationSuccess) {
        console.error(`❌ [CLOUDFLARE_BYPASS] [${this.sessionId}] Navigation failed`);
        return [];
      }

      // Extract property data
      const properties = await this.extractPropertyData(page);

      console.log(`✅ [CLOUDFLARE_BYPASS] [${this.sessionId}] Scraping completed: ${properties.length} properties`);
      return properties;

    } catch (error) {
      console.error(`❌ [CLOUDFLARE_BYPASS] [${this.sessionId}] Scraping failed:`, error);
      return [];
    } finally {
      // Clean up
      if (page) {
        try {
          await page.close();
        } catch (e) {
          console.error('Error closing page:', e);
        }
      }
      if (browser) {
        try {
          await browser.close();
        } catch (e) {
          console.error('Error closing browser:', e);
        }
      }
    }
  }

  /**
   * Parse Zoopla search results (reuse existing logic)
   */
  private parseZooplaSearchResults(html: string): ZooplaProperty[] {
    // Import and use existing parser
    const { parseZooplaSearchResults } = require('./zooplaScraper');
    return parseZooplaSearchResults(html);
  }

  /**
   * Get stealth browser arguments
   */
  private getStealthArgs(): string[] {
    return [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-field-trial-config',
      '--disable-ipc-flooding-protection',
      '--no-default-browser-check',
      '--disable-default-apps',
      '--disable-extensions',
      '--disable-sync',
      '--disable-translate',
      '--hide-scrollbars',
      '--mute-audio',
      '--safebrowsing-disable-auto-update',
      '--ignore-certificate-errors',
      '--ignore-ssl-errors',
      '--ignore-certificate-errors-spki-list',
      '--disable-blink-features=AutomationControlled',
      '--disable-features=TranslateUI',
      '--disable-component-extensions-with-background-pages',
      '--disable-background-networking',
      '--disable-background-timer-throttling',
      '--disable-client-side-phishing-detection',
      '--disable-default-apps',
      '--disable-domain-reliability',
      '--disable-features=AudioServiceOutOfProcess',
      '--disable-hang-monitor',
      '--disable-ipc-flooding-protection',
      '--disable-popup-blocking',
      '--disable-prompt-on-repost',
      '--disable-renderer-backgrounding',
      '--disable-sync',
      '--force-color-profile=srgb',
      '--metrics-recording-only',
      '--no-first-run',
      '--password-store=basic',
      '--use-mock-keychain',
      '--disable-features=TranslateUI',
      '--disable-ipc-flooding-protection',
      '--disable-renderer-backgrounding',
      '--disable-features=TranslateUI',
      '--disable-ipc-flooding-protection',
      '--disable-renderer-backgrounding'
    ];
  }
}

// Export functions
export const zooplaCloudflareBypass = new ZooplaCloudflareBypass();

export async function scrapeZooplaWithCloudflareBypass(query: string, filters?: any): Promise<ZooplaProperty[]> {
  return zooplaCloudflareBypass.scrapeZooplaWithBypass(query, filters);
}

export async function testCloudflareBypass(url: string): Promise<boolean> {
  const bypass = new ZooplaCloudflareBypass();
  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    browser = await bypass.initializeBrowser();
    page = await bypass.createStealthPage();
    
    const success = await bypass.navigateWithBypass(page, url);
    return success;
  } finally {
    if (page) await page.close();
    if (browser) await browser.close();
  }
} 