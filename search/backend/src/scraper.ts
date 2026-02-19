import puppeteer from 'puppeteer';
import type { LaunchOptions, Browser, Page } from 'puppeteer';
import * as cheerio from 'cheerio';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

export interface Property {
  title: string;
  price: string;
  location: string;
  bedrooms: string;
  propertyType: string;
  imageUrls: string[];
  agent: {
    name: string;
    email: string;
    website?: string;
  };
}

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// Sprint 2 Phase 3: in-memory cache for agent email results (TTL from SEARCH_OPT_EMAIL_CACHE_TTL_SEC)
const agentEmailCacheGlobal = new Map<string, { email: string | null; website?: string | null; ts: number }>();
const AGENT_CACHE_MAX_SIZE = 500;

function pruneAgentEmailCacheIfNeeded(ttlSec: number): void {
  if (agentEmailCacheGlobal.size <= AGENT_CACHE_MAX_SIZE) return;
  const now = Date.now();
  for (const [k, v] of agentEmailCacheGlobal.entries()) {
    if ((now - v.ts) / 1000 > ttlSec) agentEmailCacheGlobal.delete(k);
  }
}

import axios from 'axios';

/**
 * Helper function to get the Chrome/Chromium executable path
 * Tries multiple methods to find the browser executable
 */
export async function getChromeExecutablePath(): Promise<string | undefined> {
  // Method 1: Use Puppeteer's built-in executable path resolution
  try {
    const executablePath = puppeteer.executablePath();
    if (executablePath && fs.existsSync(executablePath)) {
      console.log('Found Chrome via Puppeteer executablePath:', executablePath);
      return executablePath;
    }
  } catch (error) {
    console.log('Puppeteer executablePath() failed, trying alternatives...');
  }

  // Method 2: Check environment variable
  if (process.env.CHROME_BIN) {
    const envPath = process.env.CHROME_BIN;
    if (fs.existsSync(envPath)) {
      console.log('Found Chrome via CHROME_BIN env var:', envPath);
      return envPath;
    }
  }

  // Method 3: Check Puppeteer environment variable
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    const puppeteerEnvPath = process.env.PUPPETEER_EXECUTABLE_PATH;
    if (fs.existsSync(puppeteerEnvPath)) {
      console.log('Found Chrome via PUPPETEER_EXECUTABLE_PATH env var:', puppeteerEnvPath);
      return puppeteerEnvPath;
    }
  }

  // Method 4: Check common Puppeteer cache locations
  const cacheDir = process.env.PUPPETEER_CACHE_DIR || path.join(os.homedir(), '.cache', 'puppeteer');
  const possiblePaths = [
    // Puppeteer v24+ structure
    path.join(cacheDir, 'chrome', 'linux-*', 'chrome-linux64', 'chrome'),
    path.join(cacheDir, 'chrome', 'linux-*', 'chrome-linux', 'chrome'),
    // Older structures
    path.join(cacheDir, 'chrome', 'chrome-linux64', 'chrome'),
    path.join(cacheDir, 'chrome-linux64', 'chrome'),
    path.join(cacheDir, 'chrome-linux', 'chrome'),
    path.join(cacheDir, 'chrome', 'chrome'),
    // Direct in cache dir
    path.join(cacheDir, 'chrome'),
  ];
  
  // Try to find any chrome executable in subdirectories
  try {
    if (fs.existsSync(cacheDir)) {
      const entries = fs.readdirSync(cacheDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const chromePath = path.join(cacheDir, entry.name, 'chrome');
          if (fs.existsSync(chromePath) && fs.statSync(chromePath).isFile()) {
            console.log('Found Chrome by scanning cache directory:', chromePath);
            return chromePath;
          }
          // Check nested directories
          try {
            const subEntries = fs.readdirSync(path.join(cacheDir, entry.name), { withFileTypes: true });
            for (const subEntry of subEntries) {
              if (subEntry.isDirectory()) {
                const nestedChromePath = path.join(cacheDir, entry.name, subEntry.name, 'chrome');
                if (fs.existsSync(nestedChromePath) && fs.statSync(nestedChromePath).isFile()) {
                  console.log('Found Chrome in nested directory:', nestedChromePath);
                  return nestedChromePath;
                }
              }
            }
          } catch {
            // Continue if subdirectory scan fails
          }
        }
      }
    }
  } catch (error) {
    console.log('Error scanning cache directory:', error);
  }

  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
      console.log('Found Chrome in cache directory:', possiblePath);
      return possiblePath;
    }
  }

  // Method 5: Try to use Puppeteer's browsers API (if available)
  try {
    // @ts-expect-error - puppeteer/browsers may not have type definitions in all versions
    const browsers = await import('puppeteer/browsers');
    if (browsers && typeof browsers.computeExecutablePath === 'function') {
      const computedPath = browsers.computeExecutablePath({
        browser: 'chrome',
        cacheDir: cacheDir
      });
      if (fs.existsSync(computedPath)) {
        console.log('Found Chrome via browsers API:', computedPath);
        return computedPath;
      }
    }
  } catch (error) {
    console.log('Browsers API not available or failed');
  }

  // Method 6: Check Playwright's chromium installation as fallback
  console.log('Checking for Playwright chromium as fallback...');
  const playwrightPath = process.env.PLAYWRIGHT_BROWSERS_PATH || path.join(os.homedir(), '.cache', 'ms-playwright');
  console.log(`Checking Playwright path: ${playwrightPath}`);
  
  try {
    if (fs.existsSync(playwrightPath)) {
      const playwrightEntries = fs.readdirSync(playwrightPath, { withFileTypes: true });
      console.log(`Found ${playwrightEntries.length} entries in Playwright path`);
      for (const entry of playwrightEntries) {
        if (entry.isDirectory() && entry.name.startsWith('chromium')) {
          console.log(`Checking chromium entry: ${entry.name}`);
          // Try common chromium executable paths
          const chromiumPaths = [
            path.join(playwrightPath, entry.name, 'chrome-linux', 'chrome'),
            path.join(playwrightPath, entry.name, 'chrome-linux', 'headless_shell'),
            path.join(playwrightPath, entry.name, 'chrome'),
          ];
          
          for (const chromiumPath of chromiumPaths) {
            console.log(`Checking path: ${chromiumPath}`);
            if (fs.existsSync(chromiumPath)) {
              console.log('Found Playwright Chromium:', chromiumPath);
              return chromiumPath;
            }
          }
        }
      }
    } else {
      console.log('Playwright path does not exist');
    }
  } catch (error) {
    console.log('Error checking Playwright browsers:', error);
  }

  console.warn('Could not find Chrome executable, Puppeteer will try to download it');
  return undefined;
}

// Enhanced email prioritization function
function prioritizeEmails(emails: string[]): string[] {
  if (emails.length === 0) return [];
  
  // Define priority categories for real estate emails
  const priorityCategories = [
    // Highest priority: Specific lettings/rental emails
    {
      keywords: ['letting', 'lettings', 'rental', 'rentals', 'rent'],
      priority: 1
    },
    // High priority: General business emails
    {
      keywords: ['info', 'enquiries', 'enquiry', 'contact', 'office'],
      priority: 2
    },
    // Medium priority: Property/estate related
    {
      keywords: ['property', 'estate', 'sales', 'agency'],
      priority: 3
    },
    // Lower priority: Generic business emails
    {
      keywords: ['hello', 'admin', 'support', 'help'],
      priority: 4
    }
  ];
  
  const categorizedEmails: { email: string; priority: number; category: string }[] = [];
  
  for (const email of emails) {
    const emailLower = email.toLowerCase();
    let assignedPriority = 999; // Default low priority
    let category = 'other';
    
    // Check each priority category
    for (const cat of priorityCategories) {
      if (cat.keywords.some(keyword => emailLower.includes(keyword))) {
        if (cat.priority < assignedPriority) {
          assignedPriority = cat.priority;
          category = cat.keywords.find(k => emailLower.includes(k)) || cat.keywords[0];
        }
      }
    }
    
    categorizedEmails.push({
      email,
      priority: assignedPriority,
      category
    });
  }
  
  // Sort by priority and return
  return categorizedEmails
    .sort((a, b) => a.priority - b.priority)
    .map(item => item.email);
}

// Enhanced email validation function
function isValidEmail(email: string): boolean {
  // Basic email format validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return false;
  }
  
  // Filter out common false positives and placeholder emails
  const invalidPatterns = [
    /example\.com$/i,
    /test\.com$/i,
    /placeholder\.com$/i,
    /sample\.com$/i,
    /demo\.com$/i,
    /noreply@/i,
    /no-reply@/i,
    /donotreply@/i,
    /do-not-reply@/i,
    /mailer-daemon@/i,
    /postmaster@/i,
    /webmaster@/i,
    /admin@/i,
    /root@/i,
    /info@localhost/i,
    /test@/i,
    /example@/i,
    /user@/i,
    /email@/i,
    /contact@/i,
    /\.png$/i,
    /\.jpg$/i,
    /\.jpeg$/i,
    /\.gif$/i,
    /\.svg$/i,
    /\.webp$/i,
    /\.bmp$/i,
    /@2x\.png$/i,
    /@2x\.json$/i,
    /\.json$/i,
    /\.xml$/i,
    /\.js$/i,
    /\.css$/i
  ];
  
  return !invalidPatterns.some(pattern => pattern.test(email));
}

// Function to clean and validate company name for better search results
function cleanCompanyName(companyName: string): string {
  if (!companyName || typeof companyName !== 'string') {
    return '';
  }
  
  let cleaned = companyName.trim();
  
  // Remove common suffixes and prefixes
  cleaned = cleaned
    .replace(/\s+(Ltd|Limited|LLP|PLC|Inc|Corp|Corporation|LLC|Ltd\.|Limited\.|LLP\.|PLC\.|Inc\.|Corp\.|Corporation\.|LLC\.)\s*$/i, '')
    .replace(/^The\s+/i, '')
    .replace(/\s+and\s+/gi, ' & ')
    .replace(/\s+&\s+/g, ' & ')
    .replace(/\s+/g, ' ') // Normalize multiple spaces
    .trim();
  
  // Remove special characters that might interfere with search
  cleaned = cleaned.replace(/[^\w\s&-]/g, '');
  
  // Ensure it's not too short or too long
  if (cleaned.length < 2) {
    return companyName.trim(); // Return original if cleaned is too short
  }
  
  if (cleaned.length > 50) {
    cleaned = cleaned.substring(0, 50).trim();
  }
  
  return cleaned;
}

async function scrapeEmailsFromWebsite(url: string, browser: Browser): Promise<string[]> {
  let page;
  try {
    // Basic check if browser is connected
    if (!browser.isConnected()) {
      console.error('Browser is disconnected, cannot scrape emails');
      return [];
    }
    
    page = await browser.newPage();
    
    // Set a shorter default timeout
    page.setDefaultNavigationTimeout(15000);
    page.setDefaultTimeout(15000);
    
    // Block resources to save memory and improve stability
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      try {
        const resourceType = req.resourceType();
        if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
          req.abort().catch(() => {});
        } else {
          req.continue().catch(() => {});
        }
      } catch (e) {
        // Ignore errors during request interception to prevent crashes
      }
    });

    // Handle dialogs automatically (alerts, prompts)
    page.on('dialog', async dialog => {
      try {
        await dialog.dismiss();
      } catch (e) {}
    });

    console.log(`Navigating to ${url} for email scraping...`);
    try {
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      
      // Check for non-HTML content
      if (response) {
        const contentType = response.headers()['content-type'];
        if (contentType && !contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
          console.log(`Skipping non-HTML content: ${contentType}`);
          return [];
        }
      }
    } catch (navError) {
      console.log(`Navigation to ${url} failed or timed out:`, navError);
      return [];
    }

    // Quick check for content
    const content = await page.content();
    
    // Limit content size to avoid Regex DOS or memory issues on huge pages
    const truncatedContent = content.length > 1000000 ? content.substring(0, 1000000) : content;
    
    const emails = truncatedContent.match(EMAIL_REGEX);
    const emailList = emails ? Array.from(new Set(emails)) : [];
    
    // Filter out invalid emails and use enhanced prioritization
    const validEmails = emailList.filter(isValidEmail);
    return prioritizeEmails(validEmails);
  } catch (e) {
    console.error(`Error scraping emails from ${url}:`, e);
    return [];
  } finally {
    if (page) {
      try {
        // Navigate to about:blank to free resources before closing
        await page.goto('about:blank').catch(() => {});
        await page.close().catch(() => {});
      } catch (e) {
        // Ignore error on close
      }
    }
  }
}

async function searchCompanyWebsiteWithBraveAPI(companyName: string, apiKey: string): Promise<string | null> {
  // Optimized: Only use the most effective query to save time
  const searchQueries = [
    `"${companyName}" UK estate agents website`,
    `${companyName} UK letting agents`
  ];
  
  for (const query of searchQueries) {
    try {
      const response = await axios.get('https://api.search.brave.com/res/v1/web/search', {
        params: {
          q: query,
          count: 5 // Reduced from 10 to 5 for speed
        },
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': apiKey
        },
        timeout: 10000 // 10 second timeout
      });

      if (response.data.web && response.data.web.results && response.data.web.results.length > 0) {
        // Look for the most likely company website with improved matching
        for (const result of response.data.web.results) {
          const link = result.url;
          const title = result.title?.toLowerCase() || '';
          const description = result.description?.toLowerCase() || '';
          const companyNameLower = companyName.toLowerCase();
          const companyWords = companyNameLower.split(/\s+/).filter(word => word.length > 2);
          
          // Skip common real estate portals and directories
          const skipDomains = ['onthemarket.com', 'rightmove.co.uk', 'zoopla.co.uk', 'primelocation.com', 
                             'spareroom.co.uk', 'openrent.com', 'facebook.com', 'linkedin.com', 'twitter.com',
                             'instagram.com', 'google.com', 'bing.com', 'trustpilot.com', 'yell.com',
                             'zoopla.com', 'primelocation.co.uk', 'gumtree.com', 'shpock.com'];
          
          if (skipDomains.some(domain => link.includes(domain))) {
            continue;
          }
          
          // Calculate match score based on multiple factors
          let matchScore = 0;
          
          // High score: exact company name match in domain (no spaces)
          if (link.includes(companyNameLower.replace(/\s+/g, ''))) {
            matchScore += 15;
          }
          
          // High score: company name with separators in domain
          if (link.includes(companyNameLower.replace(/\s+/g, '-')) || 
              link.includes(companyNameLower.replace(/\s+/g, '.'))) {
            matchScore += 12;
          }
          
          // Medium score: multiple company words in domain
          const wordsInDomain = companyWords.filter(word => link.includes(word)).length;
          if (wordsInDomain >= 2) {
            matchScore += wordsInDomain * 4;
          }
          
          // Medium score: company name in title
          if (title.includes(companyNameLower)) {
            matchScore += 8;
          }
          
          // Low score: company words in title or description
          const wordsInContent = companyWords.filter(word => 
            title.includes(word) || description.includes(word)
          ).length;
          matchScore += wordsInContent * 2;
          
          // Bonus for real estate related content
          const realEstateTerms = ['estate', 'letting', 'property', 'real estate', 'agents', 'lettings'];
          if (realEstateTerms.some(term => title.includes(term) || description.includes(term))) {
            matchScore += 3;
          }
          
          // Bonus for contact/about pages
          if (link.includes('/contact') || link.includes('/about') || link.includes('/enquiries')) {
            matchScore += 2;
          }
          
          // Return first result with high confidence match
          if (matchScore >= 10) {
            console.log(`Found company website for ${companyName}: ${link} (score: ${matchScore})`);
            return link;
          }
        }
        
        // If we found any results but no high-confidence match, return the first one
        if (response.data.web.results.length > 0) {
          const firstResult = response.data.web.results[0];
          const link = firstResult.url;
          const skipDomains = ['onthemarket.com', 'rightmove.co.uk', 'zoopla.co.uk', 'primelocation.com', 
                             'spareroom.co.uk', 'openrent.com', 'facebook.com', 'linkedin.com', 'twitter.com',
                             'instagram.com', 'google.com', 'bing.com', 'trustpilot.com', 'yell.com',
                             'zoopla.com', 'primelocation.co.uk', 'gumtree.com', 'shpock.com'];
          
          if (!skipDomains.some(domain => link.includes(domain))) {
            console.log(`Returning best-guess website for ${companyName}: ${link}`);
            return link;
          }
        }
      }
      
      // Reduced delay between requests for speed
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error: any) {
      console.error(`Error searching for company website with query "${query}":`, error.message);
      
      // If we hit rate limit, wait longer before next request
      if (error.response && error.response.status === 429) {
        console.log('Rate limit hit, waiting 5 seconds...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
  
  return null;
}

// Remove the searchEmailWithBraveAPI function as it can return false positives
// We only want emails found on actual company websites

// New function to search for emails using internet search
async function searchEmailWithInternet(companyName: string, apiKey: string, maxQueries: number = 3): Promise<string[]> {
  console.log(`Searching for email via internet search: ${companyName}`);
  
  // Optimized: Only use most effective queries to save time and API calls
  const searchQueries = [
    `"${companyName}" contact email UK estate agents`,
    `"${companyName}" lettings email UK`,
    `${companyName} UK real estate contact email`
  ];
  
  const allEmails: string[] = [];
  let queriesAttempted = 0;
  const limit = Math.min(maxQueries, searchQueries.length);
  
  for (const query of searchQueries) {
    if (queriesAttempted >= limit) break;
    
    try {
      const response = await axios.get('https://api.search.brave.com/res/v1/web/search', {
        params: {
          q: query,
          count: 10
        },
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': apiKey
        },
        timeout: 10000 // 10 second timeout
      });
      
      queriesAttempted++;
      
      let results = '';
      
      if (response.data.web && response.data.web.results) {
        results += response.data.web.results.map((r: any) => (r.description || '') + ' ' + (r.url || '')).join(' ');
      }
      
      const emails = results.match(EMAIL_REGEX);
      if (emails) {
        allEmails.push(...emails);
        // If we found emails, no need to continue searching
        if (allEmails.length > 0) {
          console.log(`Found ${allEmails.length} emails after ${queriesAttempted} queries`);
          break;
        }
      }
      
      // Reduced delay between requests for speed
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error: any) {
      console.error(`Error searching for query "${query}":`, error.message);
      
      // If we hit rate limit, wait longer before next request
      if (error.response && error.response.status === 429) {
        console.log('Rate limit hit, waiting 5 seconds...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      // For timeouts or other errors, just continue to next query
    }
  }
  
  // Remove duplicates and filter for valid emails
  const uniqueEmails = Array.from(new Set(allEmails));
  const validEmails = uniqueEmails.filter(isValidEmail);
  
  // Additional validation: Check if emails are likely to be from the company
  const companyNameLower = companyName.toLowerCase();
  const companyWords = companyNameLower.split(/\s+/).filter(word => word.length > 2);
  
  const relevantEmails = validEmails.filter(email => {
    const emailLower = email.toLowerCase();
    const domain = emailLower.split('@')[1] || '';
    
    // Check if email domain contains company name words
    const hasCompanyWords = companyWords.some(word => domain.includes(word));
    
    // Check if email is from a real estate related domain
    const realEstateDomains = ['estate', 'letting', 'property', 'real', 'agency', 'agents'];
    const hasRealEstateDomain = realEstateDomains.some(term => domain.includes(term));
    
    // Check if email is from a generic business domain (less relevant)
    const genericDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com'];
    const isGenericDomain = genericDomains.some(gen => domain.includes(gen));
    
    // Prioritize emails that have company words in domain or are from real estate domains
    // But don't exclude generic domains entirely as they might be legitimate
    return hasCompanyWords || hasRealEstateDomain || !isGenericDomain;
  });
  
  console.log(`Internet search found ${validEmails.length} valid emails, ${relevantEmails.length} relevant for ${companyName}`);
  return prioritizeEmails(relevantEmails.length > 0 ? relevantEmails : validEmails);
}

async function findEmailForAgent(
  agentName: string,
  website: string | undefined,
  browser: Browser,
  apiKey: string,
  options?: { maxQueries?: number }
): Promise<{ email: string | null; website?: string }> {
  const maxQueries = options?.maxQueries ?? 3;
  // Extract company name from agent name (usually the part after "Marketed by" or similar)
  // Format: "Marketed by Company Name - Location Phone Email"
  let companyMatch = agentName.match(/Marketed by\s+([^-]+?)(?:\s*-\s*|$)/i);
  if (!companyMatch) {
    // Fallback: try to extract any text that looks like a company name
    // Updated regex to handle numbers and special characters in company names
    companyMatch = agentName.match(/([A-Z][A-Za-z0-9&]+(?:\s+[A-Za-z0-9&]+)*)/);
  }
  
  // Use the full company name without modification
  let companyName = companyMatch ? companyMatch[1].trim() : agentName.trim();
  
  // Clean up company name for better search results
  companyName = cleanCompanyName(companyName);
  
  console.log(`Looking for email for company: ${companyName}`);

  // STRATEGY: Prioritize fast internet search over slow website scraping
  // This avoids timeout issues and is more reliable
  
  // 1. First, try internet search (fastest and most reliable)
  console.log(`Searching internet for contact email: ${companyName}`);
  try {
    const internetEmails = await searchEmailWithInternet(companyName, apiKey, maxQueries);
    if (internetEmails.length > 0) {
      console.log(`Found email via internet search: ${internetEmails[0]}`);
      // Still try to get the official website for reference
      const companyWebsite = await searchCompanyWebsiteWithBraveAPI(companyName, apiKey);
      return { email: internetEmails[0], website: companyWebsite || website || undefined };
    }
  } catch (error) {
    console.error(`Internet email search failed for ${companyName}:`, error);
  }

  // 2. If internet search fails, try the provided website (if not OTM)
  if (website && !website.includes('onthemarket.com')) {
    console.log(`Trying provided website: ${website}`);
    // Only try homepage and /contact to save time
    const quickPaths = ['', '/contact'];
    for (const path of quickPaths) {
      try {
        const url = path ? (website.endsWith('/') ? website + path.slice(1) : website + path) : website;
        const emails = await scrapeEmailsFromWebsite(url, browser);
        if (emails.length > 0) {
          console.log(`Found emails on website ${path || '/'}: ${emails[0]}`);
          return { email: emails[0], website };
        }
      } catch {}
    }
  }

  // 3. Search for company website and try scraping
  console.log(`Searching for company website: ${companyName}`);
  const companyWebsite = await searchCompanyWebsiteWithBraveAPI(companyName, apiKey);
  if (companyWebsite) {
    console.log(`Found company website: ${companyWebsite}`);
    // Only try homepage and /contact to save time
    const quickPaths = ['', '/contact'];
    for (const path of quickPaths) {
      try {
        const url = path ? (companyWebsite.endsWith('/') ? companyWebsite + path.slice(1) : companyWebsite + path) : companyWebsite;
        const emails = await scrapeEmailsFromWebsite(url, browser);
        if (emails.length > 0) {
          console.log(`Found emails on company website ${path || '/'}: ${emails[0]}`);
          return { email: emails[0], website: companyWebsite };
        }
      } catch {}
    }
  }
  
  console.log(`No email found for: ${companyName}`);
  return { email: null, website: companyWebsite || website || undefined };
}

export async function scrapeInternet(query: string, apiKey: string): Promise<Property[]> {
  console.log(`Starting internet search for: "${query}"`);
  
  try {
    // Optimized search for speed - focus on most productive sources
    const searchQueries = [
      // Facebook marketplace variants (prioritized - most likely to have quality results)
      `${query} site:facebook.com/marketplace UK rent`,
      `${query} site:facebook.com/marketplace/rentals`,
      // High-quality property sites only
      `${query} site:thehouseshop.com property`,
      `${query} site:propertyheads.com property`,
      // Generic but targeted
      `${query} UK property listings -site:rightmove.co.uk -site:zoopla.co.uk -site:onthemarket.com -site:openrent.com -site:primelocation.com -site:gumtree.com`
    ];
    
    const allResults: Property[] = [];
    
    for (const searchQuery of searchQueries) {
      try {
        console.log(`Searching for: ${searchQuery}`);
        
        const response = await axios.get('https://api.search.brave.com/res/v1/web/search', {
          params: {
            q: searchQuery,
            count: 20,
            search_lang: 'en',
            country: 'GB'
          },
          headers: {
            'Accept': 'application/json',
            'X-Subscription-Token': apiKey
          }
        });
        
        if (response.data.web && response.data.web.results) {
          for (const result of response.data.web.results) {
            // Filter for property-related websites
            const url = result.url?.toLowerCase() || '';
            const title = result.title || '';
            const description = result.description || '';
            
            // Skip major property portals and focus on alternative platforms
            const skipDomains = [
              'onthemarket.com',
              'rightmove.co.uk',
              'zoopla.co.uk',
              'primelocation.com',
              'spareroom.co.uk',
              'openrent.com',
              'openrent.co.uk',
              'purplebricks.co.uk',
              'boomin.com',
              'yopa.co.uk',
              'strike.co.uk',
              'rentmyhome.co.uk',
              'nestoria.co.uk',
              'gumtree.com', // exclude Gumtree as requested
              'oneroof.co.nz', // safety
              // generic non-listing domains
              'google.com', 'bing.com', 'wikipedia.org', 'linkedin.com', 'twitter.com', 'instagram.com', 'youtube.com'
            ];
            
            // Prioritize Facebook and alternative platforms (excluding Gumtree)
            const priorityDomains = [
              'facebook.com',
              'preloved.co.uk',
              'freeads.co.uk',
              'adzuna.co.uk',
              'thehouseshop.com',
              'propertyheads.com',
              'rentola.co.uk'
            ];
            
            if (skipDomains.some(domain => url.includes(domain))) {
              continue;
            }
            
            // Look for property-related keywords
            const propertyKeywords = ['property', 'estate', 'house', 'flat', 'apartment', 'home', 
                                    'bedroom', 'rent', 'sale', 'buy', 'letting', 'pcm', '£'];
            
            const hasPropertyKeywords = propertyKeywords.some(keyword => 
              title.toLowerCase().includes(keyword) || description.toLowerCase().includes(keyword)
            );
            
            if (hasPropertyKeywords) {
              // Store URL for actual scraping later
              const propertyUrl = result.url;
              if (propertyUrl && !allResults.some(p => p.agent.website === propertyUrl)) {
                // Prioritize Facebook and alternative platforms
                const isPriority = priorityDomains.some(domain => url.includes(domain));
                
                const basicProperty: Property = {
                  title: title || 'Property Listing',
                  price: 'Loading...',
                  location: 'Loading...',
                  bedrooms: 'Loading...',
                  propertyType: 'Property',
                  imageUrls: [],
                  agent: {
                    name: isPriority ? `${extractDomainName(url)} (Priority)` : extractDomainName(url),
                    email: '', // Don't set placeholder email
                    website: propertyUrl
                  }
                };
                
                // Add priority listings to the front
                if (isPriority) {
                  allResults.unshift(basicProperty);
                } else {
                  allResults.push(basicProperty);
                }
              }
            }
          }
        }
        
        // Reduced delay between API calls for speed
        await new Promise(resolve => setTimeout(resolve, 500)); // Reduced from 1000 to 500
        
      } catch (error: any) {
        console.error(`Error in internet search query "${searchQuery}":`, error.message);
        if (error.response && error.response.status === 429) {
          console.log('Rate limit hit, waiting 5 seconds...');
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
    }
    
    // Remove duplicates and limit URLs to scrape for speed
    const uniqueUrls = Array.from(new Map(
      allResults.map(property => [property.agent.website, property])
    ).values()).slice(0, 12); // Reduced from 25 to 12 for faster processing
    
    console.log(`Found ${uniqueUrls.length} property URLs to scrape. Starting detailed scraping...`);
    
    // Now actually scrape each URL for detailed information
    const scrapedProperties: Property[] = [];
    let browser: Browser | undefined;
    
    try {
      // Get Chrome executable path dynamically
      const chromeExecutablePath = await getChromeExecutablePath();
      if (chromeExecutablePath) {
        console.log('Using Chrome executable for scrapeInternet:', chromeExecutablePath);
      }
      
      const launchOptions: LaunchOptions = {
        headless: true,
        timeout: 60000, // Increased timeout
        executablePath: chromeExecutablePath,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          "--no-first-run",
          "--no-zygote",
          '--disable-gpu',
          '--disable-gpu-sandbox',
          '--disable-software-rasterizer',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-features=TranslateUI',
          '--disable-ipc-flooding-protection',
          '--disable-background-networking',
          '--disable-client-side-phishing-detection',
          '--disable-sync',
          '--disable-default-apps',
          '--window-size=1920x1080',
          '--user-data-dir=' + path.join(os.tmpdir(), 'puppeteer_dev_chrome_profile-' + Math.random().toString(36).substr(2, 9))
        ]
      };

      // Try to launch browser with retry logic
      let browserLaunchRetries = 3;
      while (browserLaunchRetries > 0) {
        try {
          browser = await puppeteer.launch(launchOptions);
          break;
        } catch (error) {
          console.error(`Browser launch failed, retries left: ${browserLaunchRetries - 1}`, error);
          browserLaunchRetries--;
          if (browserLaunchRetries === 0) {
            throw new Error(`Failed to launch browser after 3 attempts: ${error}`);
          }
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
        }
      }
      
      for (let i = 0; i < uniqueUrls.length; i++) {
        const propertyInfo = uniqueUrls[i];
        const url = propertyInfo.agent.website!;
        
        console.log(`Scraping property ${i + 1}/${uniqueUrls.length}: ${url}`);
        
        try {
          const page = await browser!.newPage();
          await page.setViewport({ width: 1920, height: 1080 });
          await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
          
          // Navigate to the property page with faster settings
          await page.goto(url, { 
            waitUntil: 'domcontentloaded', 
            timeout: 8000 // Reduced from 15000 to 8000
          });
          
          // Reduced wait time for content to load
          await new Promise(resolve => setTimeout(resolve, 1000)); // Reduced from 2000 to 1000
          
          // Get page content and extract property information
          const content = await page.content();
          const $ = cheerio.load(content);
          
          // Extract detailed property information
          const scrapedProperty = extractPropertyFromPage($, url, propertyInfo.agent.name);
          
          if (scrapedProperty) {
            scrapedProperties.push(scrapedProperty);
          }
          
          await page.close();
          
          // Reduced delay between requests for speed
          await new Promise(resolve => setTimeout(resolve, 500)); // Reduced from 2000 to 500
          
        } catch (error) {
          console.error(`Error scraping ${url}:`, error);
          // Keep the basic info if scraping fails
          scrapedProperties.push(propertyInfo);
        }
      }

      // Enrich emails for small agencies and filter results
      const filtered: Property[] = [];
      const emailCache: Record<string, { email: string | null; website?: string }> = {};
      const bigBrandDomains = [
        'onthemarket.com',
        'rightmove.co.uk',
        'zoopla.co.uk',
        'primelocation.com',
        'spareroom.co.uk',
        'openrent.com',
        'openrent.co.uk',
        'purplebricks.co.uk',
        'boomin.com',
        'yopa.co.uk',
        'strike.co.uk',
        'rentmyhome.co.uk',
        'nestoria.co.uk'
      ];

      for (const prop of scrapedProperties) {
        const website = prop.agent.website || '';
        let host = '';
        try { host = new URL(website).hostname.toLowerCase(); } catch {}

        if (bigBrandDomains.some(d => host.includes(d))) {
          continue; // never show big brands
        }

        if (host.includes('facebook.com')) {
          // For Facebook, we still need to find a valid email for the agent
          const cacheKey = `${prop.agent.name}|${prop.agent.website || ''}`;
          if (!emailCache[cacheKey]) {
            try {
              if (browser) {
                const result = await findEmailForAgent(prop.agent.name, prop.agent.website, browser, apiKey);
                emailCache[cacheKey] = result;
              } else {
                emailCache[cacheKey] = { email: null };
              }
            } catch {
              emailCache[cacheKey] = { email: null };
            }
          }

          const found = emailCache[cacheKey];
          if (found && found.email && isValidEmail(found.email)) {
            prop.agent.email = found.email;
            if (found.website) prop.agent.website = found.website;
            filtered.push(prop);
          } else {
            console.log(`Excluding Facebook property from ${prop.agent.name} - no valid email found`);
          }
          continue;
        }

        if (host.includes('rentola.co.uk')) {
          // Rentola properties already have the correct email, no need to search
          prop.agent.email = 'info@rentola.co.uk';
          filtered.push(prop);
          continue;
        }

        // For small estate companies, require a contact email on their site
        const existingEmail = prop.agent.email || '';
        const hasInlineEmail = !!existingEmail.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);

        if (hasInlineEmail && isValidEmail(existingEmail)) {
          filtered.push(prop);
          continue;
        }

        // Try to find email using company name/website
        const cacheKey = `${prop.agent.name}|${prop.agent.website || ''}`;
        if (!emailCache[cacheKey]) {
          try {
            if (browser) {
              const result = await findEmailForAgent(prop.agent.name, prop.agent.website, browser, apiKey);
              emailCache[cacheKey] = result;
            } else {
              emailCache[cacheKey] = { email: null };
            }
          } catch {
            emailCache[cacheKey] = { email: null };
          }
        }

        const found = emailCache[cacheKey];
        if (found && found.email && isValidEmail(found.email)) {
          prop.agent.email = found.email;
          if (found.website) prop.agent.website = found.website;
          filtered.push(prop);
        } else {
          console.log(`Excluding property from ${prop.agent.name} - no valid email found`);
        }
      }

      // Replace scrapedProperties with the filtered list
      scrapedProperties.length = 0;
      scrapedProperties.push(...filtered);
    } catch (error) {
      console.error('Error launching browser for internet scraping:', error);
      return uniqueUrls; // Return basic info if browser fails
    } finally {
      if (browser) {
        try {
          console.log('Closing browser...');
          await browser.close();
          
                  // Note: Puppeteer should clean up its own processes automatically
        } catch (closeError) {
          console.error('Error closing browser:', closeError);
        }
      }
    }
    
    console.log(`Internet scraping completed. Successfully scraped ${scrapedProperties.length} properties`);
    return scrapedProperties;
    
  } catch (error) {
    console.error('Error in internet search:', error);
    return [];
  }
}

// Helper functions for extracting information from text
function extractPriceFromText(text: string): string | null {
  const pricePatterns = [
    /£([\d,]+(?:\.\d{2})?)\s*(?:k|thousand)/gi,
    /£([\d,]+(?:\.\d{2})?)\s*(?:pcm|per calendar month|per month)/gi,
    /£([\d,]+(?:\.\d{2})?)\s*(?:pw|per week)/gi,
    /£([\d,]+(?:\.\d{2})?)/g
  ];
  
  for (const pattern of pricePatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0];
    }
  }
  return null;
}

function extractLocationFromText(text: string, query: string): string | null {
  // Try to extract location from the original query
  const locationMatch = query.match(/in\s+([a-zA-Z\s,]+)/i);
  if (locationMatch) {
    return locationMatch[1].trim();
  }
  
  // Look for UK city/area names in the text
  const ukCities = ['London', 'Manchester', 'Birmingham', 'Leeds', 'Liverpool', 'Sheffield', 
                   'Bristol', 'Newcastle', 'Nottingham', 'Leicester', 'Coventry', 'Bradford'];
  
  for (const city of ukCities) {
    if (text.toLowerCase().includes(city.toLowerCase())) {
      return city;
    }
  }
  
  return null;
}

function extractBedroomsFromText(text: string): string | null {
  const bedroomMatch = text.match(/(\d+)\s*(?:bed|bedroom)/i);
  return bedroomMatch ? `${bedroomMatch[1]} bedrooms` : null;
}

function extractPropertyTypeFromText(text: string): string | null {
  const types = ['house', 'flat', 'apartment', 'bungalow', 'cottage', 'villa', 'townhouse'];
  
  for (const type of types) {
    if (text.toLowerCase().includes(type)) {
      return type.charAt(0).toUpperCase() + type.slice(1);
    }
  }
  
  return null;
}

function extractDomainName(url: string): string {
  try {
    const domain = new URL(url).hostname;
    return domain.replace('www.', '').split('.')[0];
  } catch {
    return 'Property Website';
  }
}

function extractPropertyFromPage($: cheerio.Root, url: string, agentName: string): Property | null {
  try {
    console.log(`Extracting property data from: ${url}`);
    
    // Different selectors for different types of websites
    let title = '';
    let price = '';
    let location = '';
    let bedrooms = '';
    let propertyType = '';
    const imageUrls: string[] = [];
    
    // Extract title - try multiple selectors
    title = $('h1').first().text().trim() ||
            $('title').text().trim() ||
            $('[class*="title"]').first().text().trim() ||
            $('[class*="heading"]').first().text().trim() ||
            'Property Listing';
    
    // Extract price - try multiple patterns
    const priceSelectors = [
      '[class*="price"]',
      '[class*="cost"]',
      '[class*="rent"]',
      '[data-testid*="price"]',
      '.price',
      '.cost',
      '.rent'
    ];
    
    for (const selector of priceSelectors) {
      const priceText = $(selector).first().text().trim();
      if (priceText && priceText.includes('£')) {
        price = priceText;
        break;
      }
    }
    
    // If no price found in selectors, search in all text
    if (!price) {
      const pageText = $('body').text();
      const priceMatch = pageText.match(/£[\d,]+(?:\.\d{2})?(?:\s*(?:k|pcm|per month|pw|per week))?/gi);
      if (priceMatch) {
        price = priceMatch[0];
      }
    }
    
    // Extract location - try multiple approaches
    const locationSelectors = [
      '[class*="location"]',
      '[class*="address"]',
      '[class*="area"]',
      '.location',
      '.address',
      '.area'
    ];
    
    for (const selector of locationSelectors) {
      const locationText = $(selector).first().text().trim();
      if (locationText && locationText.length > 2) {
        location = locationText;
        break;
      }
    }
    
    // Extract bedrooms
    const pageText = $('body').text();
    const bedroomMatch = pageText.match(/(\d+)\s*(?:bed|bedroom)/i);
    bedrooms = bedroomMatch ? `${bedroomMatch[1]} bedrooms` : 'Not specified';
    
    // Extract property type
    const propertyTypes = ['house', 'flat', 'apartment', 'bungalow', 'cottage', 'villa', 'townhouse', 'studio'];
    for (const type of propertyTypes) {
      if (pageText.toLowerCase().includes(type)) {
        propertyType = type.charAt(0).toUpperCase() + type.slice(1);
        break;
      }
    }
    
    // Extract images - try multiple selectors
    const imageSelectors = [
      'img[src*="property"]',
      'img[src*="photo"]',
      'img[src*="image"]',
      'img[data-src*="property"]',
      'img[data-src*="photo"]',
      '[class*="gallery"] img',
      '[class*="image"] img',
      '[class*="photo"] img',
      'img'
    ];
    
    const processedUrls = new Set<string>();
    
    for (const selector of imageSelectors) {
      $(selector).each((_index, element) => {
        const src = $(element).attr('src') || $(element).attr('data-src') || $(element).attr('data-lazy');
        if (src && !processedUrls.has(src)) {
          let fullUrl = src;
          
          // Convert relative URLs to absolute
          if (src.startsWith('//')) {
            fullUrl = 'https:' + src;
          } else if (src.startsWith('/')) {
            try {
              const baseUrl = new URL(url);
              fullUrl = baseUrl.origin + src;
            } catch {
              fullUrl = src;
            }
          }
          
          // Filter out logos, icons, etc.
          const skipPatterns = ['logo', 'icon', 'avatar', 'placeholder', 'thumb', 'profile'];
          if (!skipPatterns.some(pattern => fullUrl.toLowerCase().includes(pattern))) {
            imageUrls.push(fullUrl);
            processedUrls.add(src);
          }
        }
      });
      
      // Stop if we have enough images
      if (imageUrls.length >= 10) break;
    }
    
    // Try to extract agent/contact information
    let agentEmail = ''; // Don't set placeholder email
    const emailMatch = $('body').text().match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch && isValidEmail(emailMatch[0])) {
      agentEmail = emailMatch[0];
    }
    
    // Extract price from title if not found elsewhere
    let extractedPrice = null;
    if (!price || price === 'Price on request') {
      // Try multiple price patterns that might appear in the title
      const pricePatterns = [
        /(\d+)\s*£\s*\/\s*month/i,
        /(\d+)\s*£\s*pcm/i,
        /(\d+)\s*£\s*per\s*month/i,
        /£\s*(\d+)\s*\/\s*month/i,
        /£\s*(\d+)\s*pcm/i,
        /£\s*(\d+)\s*per\s*month/i,
        /(\d+)\s*pound\s*per\s*month/i,
        /(\d+)\s*pound\s*\/\s*month/i
      ];
      
      for (const pattern of pricePatterns) {
        const titlePriceMatch = title.match(pattern);
        if (titlePriceMatch) {
          const priceValue = titlePriceMatch[1];
          extractedPrice = `£${priceValue} / month`;
          // Remove the price from the title using the original match
          title = title.replace(titlePriceMatch[0], '').trim();
          break;
        }
      }
    }

    // Clean up extracted data
    title = title.substring(0, 200); // Limit title length
    price = extractedPrice || price || 'Price on request';
    location = location || extractLocationFromURL(url) || 'Location not specified';
    propertyType = propertyType || 'Property';
    
    const property: Property = {
      title,
      price,
      location,
      bedrooms,
      propertyType,
      imageUrls: imageUrls.slice(0, 8), // Limit to 8 images
      agent: {
        name: agentName,
        email: agentEmail,
        website: url
      }
    };
    
    console.log(`Successfully extracted property: ${title} - ${price} - ${imageUrls.length} images`);
    return property;
    
  } catch (error) {
    console.error(`Error extracting property from ${url}:`, error);
    return null;
  }
}

function extractLocationFromURL(url: string): string | null {
  // Try to extract location from URL path
  try {
    const pathname = new URL(url).pathname;
    const ukCities = ['london', 'manchester', 'birmingham', 'leeds', 'liverpool', 'sheffield', 
                     'bristol', 'newcastle', 'nottingham', 'leicester', 'coventry', 'bradford'];
    
    for (const city of ukCities) {
      if (pathname.toLowerCase().includes(city)) {
        return city.charAt(0).toUpperCase() + city.slice(1);
      }
    }
  } catch {
    return null;
  }
  return null;
}

// Sprint 1 + Sprint 2: config from env (defaults = current behavior for safe rollback)
function getSearchOptConfig() {
  const requestBlocking = process.env.SEARCH_OPT_REQUEST_BLOCKING === 'true';
  const selectorWaitMs = Math.max(10000, parseInt(process.env.SEARCH_OPT_SELECTOR_WAIT_MS ?? '60000', 10) || 60000);
  const navRetryDelayMs = parseInt(process.env.SEARCH_OPT_NAV_RETRY_DELAY_MS ?? '5000', 10) || 5000;
  const postClickWaitMs = parseInt(process.env.SEARCH_OPT_POST_CLICK_WAIT_MS ?? '1000', 10) || 1000;
  // Sprint 2 Phase 2
  const disableScrolling = process.env.SEARCH_OPT_DISABLE_SCROLLING === 'true';
  const disableCarouselTriggers = process.env.SEARCH_OPT_DISABLE_CAROUSEL_TRIGGERS === 'true';
  // Sprint 2 Phase 3
  const parallelEmailLookup = process.env.SEARCH_OPT_PARALLEL_EMAIL_LOOKUP === 'true';
  const agentCap = Math.max(1, Math.min(20, parseInt(process.env.SEARCH_OPT_AGENT_CAP ?? '10', 10) || 10));
  const emailQueriesPerAgent = Math.max(1, Math.min(5, parseInt(process.env.SEARCH_OPT_EMAIL_QUERIES_PER_AGENT ?? '3', 10) || 3));
  const emailCacheTtlSec = Math.max(0, parseInt(process.env.SEARCH_OPT_EMAIL_CACHE_TTL_SEC ?? '0', 10) || 0);
  // Sprint 3 Phase 4
  const warmBrowser = process.env.SEARCH_OPT_WARM_BROWSER === 'true';
  return {
    requestBlocking,
    selectorWaitMs,
    navRetryDelayMs,
    postClickWaitMs,
    disableScrolling,
    disableCarouselTriggers,
    parallelEmailLookup,
    agentCap,
    emailQueriesPerAgent,
    emailCacheTtlSec,
    warmBrowser
  };
}

// Sprint 3 Phase 4: warm browser pool (OTM path only)
const WARM_POOL_MAX_PAGES_PER_BROWSER = 50;
const WARM_POOL_MAX_BROWSER_AGE_MS = 30 * 60 * 1000; // 30 min
let warmPoolCachedChromePath: string | null = null;
let warmPool: { browser: Browser; createdAt: number; pagesCreated: number } | null = null;

function buildLaunchOptions(executablePath: string | null): LaunchOptions {
  return {
    headless: true,
    timeout: 60000,
    executablePath: executablePath ?? undefined,
    ignoreDefaultArgs: ['--enable-automation'],
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--disable-gpu-sandbox',
      '--disable-software-rasterizer',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-features=TranslateUI,VizDisplayCompositor',
      '--disable-ipc-flooding-protection',
      '--disable-background-networking',
      '--disable-client-side-phishing-detection',
      '--disable-sync',
      '--disable-default-apps',
      '--disable-extensions',
      '--disable-plugins',
      '--disable-images',
      '--disable-web-security',
      '--disable-speech-api',
      '--disable-notifications',
      '--window-size=1920x1080',
      '--single-process',
      '--data-path=/tmp/puppeteer_data',
      '--homedir=/tmp',
      '--disk-cache-dir=/tmp/puppeteer_cache',
      '--media-cache-dir=/tmp/puppeteer_media_cache',
      '--aggressive-cache-discard',
      '--memory-pressure-off'
    ],
    pipe: true
  };
}

function closeWarmPool(): void {
  if (warmPool) {
    try {
      if (warmPool.browser.connected) warmPool.browser.close().catch(() => {});
    } catch (_) {}
    warmPool = null;
  }
}

async function acquireWarmBrowser(): Promise<{ browser: Browser; page: Page; fromPool: boolean }> {
  if (warmPool) {
    if (!warmPool.browser.connected) {
      warmPool = null;
    } else if (
      warmPool.pagesCreated >= WARM_POOL_MAX_PAGES_PER_BROWSER ||
      Date.now() - warmPool.createdAt > WARM_POOL_MAX_BROWSER_AGE_MS
    ) {
      try {
        await warmPool.browser.close();
      } catch (_) {}
      warmPool = null;
    }
  }
  if (warmPool && warmPool.browser.connected) {
    const page = await warmPool.browser.newPage();
    warmPool.pagesCreated += 1;
    return { browser: warmPool.browser, page, fromPool: true };
  }
  if (!warmPoolCachedChromePath) {
    warmPoolCachedChromePath = (await getChromeExecutablePath()) ?? null;
  }
  const launchOptions = buildLaunchOptions(warmPoolCachedChromePath);
  let browserLaunchRetries = 3;
  while (browserLaunchRetries > 0) {
    try {
      const browser = await puppeteer.launch(launchOptions);
      warmPool = { browser, createdAt: Date.now(), pagesCreated: 1 };
      const page = await browser.newPage();
      return { browser, page, fromPool: true };
    } catch (error) {
      console.error(`Warm pool browser launch failed, retries left: ${browserLaunchRetries - 1}`, error);
      browserLaunchRetries--;
      if (browserLaunchRetries === 0) throw error;
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  throw new Error('Warm pool acquire failed');
}

async function releaseWarmBrowser(browser: Browser, page: Page): Promise<void> {
  try {
    await page.close();
  } catch (_) {}
  if (warmPool && warmPool.browser === browser) {
    if (
      warmPool.pagesCreated >= WARM_POOL_MAX_PAGES_PER_BROWSER ||
      Date.now() - warmPool.createdAt > WARM_POOL_MAX_BROWSER_AGE_MS
    ) {
      try {
        await browser.close();
      } catch (_) {}
      warmPool = null;
    }
  }
}

export async function scrape(url: string, apiKey: string, correlationId?: string): Promise<Property[]> {
  const properties: Property[] = [];
  let browser: Browser | undefined;
  let page: Page | null = null;
  let fromPool = false;
  const agentEmailCache: Record<string, { email: string | null, website?: string | null }> = {};
  const timings: Record<string, number> = {};
  const startTotal = Date.now();
  const config = getSearchOptConfig();

  try {
    // Clean up and validate the URL
    const cleanUrl = url.replace(/manchester-under/, 'manchester');
    console.log('Original URL:', url);
    console.log('Cleaned URL:', cleanUrl);
    
    if (config.warmBrowser) {
      const tBrowserStart = Date.now();
      const acquired = await acquireWarmBrowser();
      browser = acquired.browser;
      page = acquired.page;
      fromPool = true;
      timings.browserLaunch = Date.now() - tBrowserStart;
    } else {
      console.log('Launching browser...');
      console.log('Environment variables:');
      console.log('CHROME_BIN:', process.env.CHROME_BIN);
      console.log('PUPPETEER_CACHE_DIR:', process.env.PUPPETEER_CACHE_DIR);
      console.log('Current working directory:', process.cwd());
      const chromeExecutablePath = await getChromeExecutablePath();
      if (chromeExecutablePath) {
        console.log('Using Chrome executable:', chromeExecutablePath);
      } else {
        console.log('No Chrome executable found, Puppeteer will use default');
      }
      const launchOptions = buildLaunchOptions(chromeExecutablePath ?? null);
      const tBrowserStart = Date.now();
      let browserLaunchRetries = 3;
      while (browserLaunchRetries > 0) {
        try {
          browser = await puppeteer.launch(launchOptions);
          break;
        } catch (error) {
          console.error(`Browser launch failed, retries left: ${browserLaunchRetries - 1}`, error);
          browserLaunchRetries--;
          if (browserLaunchRetries === 0) {
            throw new Error(`Failed to launch browser after 3 attempts: ${error}`);
          }
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      timings.browserLaunch = Date.now() - tBrowserStart;
      console.log('Creating new page...');
      page = await browser!.newPage();
    }
    if (!page) throw new Error('No page available');

    // Set viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    // Sprint 1: optional request blocking (images/fonts/media/stylesheet) when flag is on
    if (config.requestBlocking) {
      try {
        await page.setRequestInterception(true);
        page.on('request', (req) => {
          try {
            const resourceType = req.resourceType();
            if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
              req.abort().catch(() => {});
            } else {
              req.continue().catch(() => {});
            }
          } catch {
            // ignore
          }
        });
      } catch {}
    }

    // Set default timeout for all operations
    page.setDefaultTimeout(30000); // Reduced from 60000 to 30000
    page.setDefaultNavigationTimeout(30000); // Reduced from 60000 to 30000

    console.log('Navigating to URL...');
    const tNavStart = Date.now();
    let retries = 3;
    while (retries > 0) {
      try {
        await page.goto(cleanUrl, {
          waitUntil: 'domcontentloaded',
          timeout: 30000
        });
        break;
      } catch (error) {
        console.error(`Navigation failed, retries left: ${retries - 1}`, error);
        retries--;
        if (retries === 0) throw error;
        await new Promise(resolve => setTimeout(resolve, config.navRetryDelayMs));
      }
    }
    timings.navigation = Date.now() - tNavStart;

    console.log('Waiting for property cards or no-results message...');
    const tSelectorStart = Date.now();
    await Promise.race([
      page.waitForSelector('.otm-PropertyCard', { timeout: config.selectorWaitMs }).catch(() => null),
      page.waitForSelector('article', { timeout: config.selectorWaitMs }).catch(() => null),
      page.waitForSelector('.otm-ResultCount, .no-results-message', { timeout: config.selectorWaitMs }).catch(() => null)
    ]);
    timings.selectorWait = Date.now() - tSelectorStart;

    const tCookieModalStart = Date.now();
    // Try to handle cookie consent if present
    try {
      console.log('Checking for cookie consent...');
      const clicked = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const acceptBtn = buttons.find(b => b.textContent && b.textContent.includes('Accept All'));
        if (acceptBtn) {
          (acceptBtn as HTMLElement).click();
          return true;
        }
        return false;
      });
      
      if (clicked) {
        console.log('Clicking Accept All cookies...');
        await new Promise(resolve => setTimeout(resolve, config.postClickWaitMs));
      }
    } catch (e) {
      console.log('Cookie consent handling failed (non-fatal):', e);
    }

    // Try to handle generic modals (like "Sign in to continue" or "Alerts")
    try {
      const closeButton = await page.$('button[aria-label="Close"], button[class*="close"], .modal-close');
      if (closeButton) {
        console.log('Closing modal...');
        await closeButton.click();
        await new Promise(resolve => setTimeout(resolve, config.postClickWaitMs));
      }
    } catch (e) {
      // Ignore
    }
    timings.cookieModal = Date.now() - tCookieModalStart;

    const tScrollCarouselStart = Date.now();
    if (config.disableScrolling && config.disableCarouselTriggers) {
      // Sprint 2 Phase 2: skip scroll and carousel to save ~10s
      timings.scrollCarousel = 0;
    } else {
      if (!config.disableScrolling) {
        console.log('Scrolling to load all images...');
        await page.evaluate(() => {
          return new Promise((resolve) => {
            let scrollCount = 0;
            const maxScrolls = 10;
            const scrollInterval = setInterval(() => {
              window.scrollBy(0, window.innerHeight);
              scrollCount++;
              if (scrollCount >= maxScrolls) {
                clearInterval(scrollInterval);
                window.scrollTo(0, 0);
                setTimeout(() => resolve(undefined), 1000);
              }
            }, 800);
          });
        });
      }
      if (!config.disableCarouselTriggers) {
        console.log('Triggering image carousels...');
        try {
          await page.evaluate(() => {
            return new Promise((resolve) => {
              const carouselSelectors = [
                '.otm-PropertyCard .carousel-next',
                '.otm-PropertyCard .carousel-prev', 
                '.otm-PropertyCard .gallery-next',
                '.otm-PropertyCard .gallery-prev',
                '.otm-PropertyCard [class*="next"]',
                '.otm-PropertyCard [class*="prev"]',
                '.otm-PropertyCard [class*="arrow"]',
                '.otm-PropertyCard .image-controls button'
              ];
              
              let selectorIndex = 0;
              const processNextSelector = () => {
                if (selectorIndex >= carouselSelectors.length) {
                  const propertyCards = Array.from(document.querySelectorAll('.otm-PropertyCard'));
                  let cardIndex = 0;
                  const processNextCard = () => {
                    if (cardIndex >= propertyCards.length) {
                      resolve(undefined);
                      return;
                    }
                    const card = propertyCards[cardIndex];
                    const event = new MouseEvent('mouseover', {
                      view: window,
                      bubbles: true,
                      cancelable: true
                    });
                    card.dispatchEvent(event);
                    cardIndex++;
                    setTimeout(processNextCard, 100);
                  };
                  processNextCard();
                  return;
                }
                
                const selector = carouselSelectors[selectorIndex];
                const elements = Array.from(document.querySelectorAll(selector));
                let elementIndex = 0;
                
                const processNextElement = () => {
                  if (elementIndex >= elements.length) {
                    selectorIndex++;
                    setTimeout(processNextSelector, 100);
                    return;
                  }
                  const element = elements[elementIndex];
                  const event = new MouseEvent('mouseover', {
                    view: window,
                    bubbles: true,
                    cancelable: true
                  });
                  element.dispatchEvent(event);
                  elementIndex++;
                  setTimeout(processNextElement, 200);
                };
                processNextElement();
              };
              processNextSelector();
            });
          });
        } catch (error) {
          console.log('Error triggering carousels:', error);
        }
      }
      timings.scrollCarousel = Date.now() - tScrollCarouselStart;
    }

    const tParseStart = Date.now();
    console.log('Getting page content...');
    // Get page content
    const content = await page.content();
    const $ = cheerio.load(content);
    
    console.log('Page title:', $('title').text());

    // Find all property cards
    let propertyCards = $('.otm-PropertyCard');
    
    // Fallback to generic article selector if specific class not found
    if (propertyCards.length === 0) {
      console.log('No .otm-PropertyCard found, trying article tag...');
      propertyCards = $('article');
    }
    
    // Fallback to data-testid or list items
    if (propertyCards.length === 0) {
      console.log('No article found, trying list items...');
      propertyCards = $('li:has(a[href*="/details/"])');
    }

    console.log(`Found ${propertyCards.length} property cards`);

    if (propertyCards.length === 0) {
      timings.parse = Date.now() - tParseStart;
      timings.total = Date.now() - startTotal;
      console.log('[SCRAPE_TIMINGS]', JSON.stringify({ correlationId: correlationId ?? null, ...timings }));
      console.log('No property cards found. Returning empty array.');
      console.log('Page HTML excerpt:', $('body').html()?.substring(0, 500));
      return [];
    }

    propertyCards.each((_i, el) => {
          try {
            const $el = $(el);
            
        // Extract title - try multiple selectors
        let title = $el.find('.otm-PropertyCardInfo .title').text().trim() ||
                    $el.find('.title').text().trim() ||
                    $el.find('h2').text().trim() ||
                    $el.find('h3').text().trim() ||
                    $el.find('.property-title').text().trim() ||
                    $el.find('a[href*="/details/"]').first().text().trim() ||
                    $el.find('a').first().text().trim();
        
        // Clean title (sometimes it includes "View details for...")
        if (title && title.includes('View the details for')) {
          title = title.replace('View the details for', '').trim();
        }
        
        // Extract price - try multiple selectors and patterns
        let price = $el.find('.otm-Price').text().trim() ||
                    $el.find('.price').text().trim() ||
                    $el.find('[class*="price"]').text().trim();
        
        if (!price) {
          // Fallback: search text for price pattern
          const text = $el.text();
          const priceMatch = text.match(/£[\d,]+(?:\s*(?:pcm|pw|per month|per week))?/i);
          if (priceMatch) price = priceMatch[0];
        }

        // Extract location - improved strategy
        let location = $el.find('.address').text().trim() ||
                       $el.find('.location').text().trim() ||
                       $el.find('[class*="address"]').text().trim();
        
        if (!location) {
           // Try to find address-like text by iterating all elements
           const addressKeywords = ['Road', 'Street', 'Lane', 'Avenue', 'Close', 'Way', 'Drive', 'Gardens', 'Place', 'Court', 'Terrace', 'Hill', 'Walk', 'Square', 'Crescent', 'Apartment', 'Flat', 'House', 'Leeds', 'London', 'Manchester', 'Birmingham'];
           const ukPostcodeRegex = /[A-Z]{1,2}[0-9][0-9A-Z]?\s*[0-9][A-Z]{2}/i;
           
           // traverse all elements to find one that contains address but isn't the full card text
           const candidates: string[] = [];
           $el.find('*').each((_, child) => {
             // Get direct text of this element (not children)
             const directText = $(child).clone().children().remove().end().text().trim();
             if (directText.length > 5 && directText.length < 100) {
               if (ukPostcodeRegex.test(directText) || addressKeywords.some(kw => directText.includes(kw))) {
                 // Filter out price/bed info and common UI text
                 if (!directText.toLowerCase().includes('pcm') && 
                     !directText.toLowerCase().includes('bedroom') && 
                     !directText.toLowerCase().includes('tenancy info') &&
                     !directText.includes('3D tour')) {
                    candidates.push(directText);
                 }
               }
             }
           });
           
           if (candidates.length > 0) {
             // Prioritize candidates that have commas (common in addresses)
             const withComma = candidates.find(c => c.includes(','));
             location = withComma || candidates[0]; 
           }
        }
        
        // If title is missing but we have location/price, construct a title
        if (!title && location && price) {
           title = `Property in ${location}`;
        }

        // Extract bedrooms more accurately
        let bedrooms = 'Not specified';
        const bedBathText = $el.find('.otm-BedBathCount').text().trim();
        const titleText = title ? title.toLowerCase() : '';
        const allText = (titleText + ' ' + bedBathText + ' ' + $el.text()).toLowerCase();
        
        // Debug logging
        // console.log('Raw bedBathText:', bedBathText);
        
        // Try multiple patterns to extract bedroom count
        const bedroomPatterns = [
          /(\d+)\s*bed/i,
          /(\d+)\s*bedroom/i,
          /bedroom\s*(\d+)/i,
          /(\d+)\s*bd/i
        ];
        
        for (const pattern of bedroomPatterns) {
          const match = allText.match(pattern);
          if (match) {
            const count = parseInt(match[1]);
            if (count >= 1 && count <= 10) { // Reasonable bedroom count
              bedrooms = count === 1 ? '1 bedroom' : `${count} bedrooms`;
              break;
            }
          }
        }
        
        // Check for studio
        if (bedrooms === 'Not specified' && allText.includes('studio')) {
          bedrooms = 'Studio';
        }
        
        // console.log('Extracted bedrooms:', bedrooms);
        
        const propertyType = $el.find('.otm-PropertyCardInfo .property-type').text().trim() || 'Property';
        
        // Extract multiple images for each property
        const imageUrls: string[] = [];
        
        // Try multiple selectors for image extraction
        const $mediaImages = $el.find('.otm-PropertyCardMedia img');
        $mediaImages.each((_imgIndex, imgEl) => {
          const imgSrc = $(imgEl).attr('src');
          if (imgSrc && !imageUrls.includes(imgSrc)) {
            imageUrls.push(imgSrc);
          }
        });
        
        // If no images found in media section, try other selectors
        if (imageUrls.length === 0) {
          const $propertyImages = $el.find('img[src*="property"], img[src*="photo"], img[src*="image"]');
          $propertyImages.each((_imgIndex, imgEl) => {
            const imgSrc = $(imgEl).attr('src');
            if (imgSrc && !imageUrls.includes(imgSrc)) {
              imageUrls.push(imgSrc);
            }
          });
        }
        
        // Final fallback: get all images in the property card
        if (imageUrls.length === 0) {
          const $allImages = $el.find('img');
          $allImages.each((_imgIndex, imgEl) => {
            const imgSrc = $(imgEl).attr('src');
            if (imgSrc && !imageUrls.includes(imgSrc)) {
              imageUrls.push(imgSrc);
            }
          });
        }
        
        // Clean and validate image URLs
        const validImageUrls = imageUrls
          .filter(url => url && url.trim() !== '')
          .map(url => {
            // Convert relative URLs to absolute URLs
            if (url.startsWith('//')) {
              return 'https:' + url;
            } else if (url.startsWith('/')) {
              return 'https://www.onthemarket.com' + url;
            }
            return url;
          })
          .filter(url => {
            // Filter out common non-property images
            const urlLower = url.toLowerCase();
            return !urlLower.includes('logo') && 
                   !urlLower.includes('icon') && 
                   !urlLower.includes('avatar') &&
                   !urlLower.includes('placeholder');
          });
        
        // Extract agent information - improved strategy
        let agentName = $el.find('.otm-PropertyCardAgent').text().trim();
        
        // If no specific agent class, try to find agent-like text or image alt
        if (!agentName) {
           const agentImg = $el.find('.agent-logo img, img[alt*="agent"], img[alt*="Agent"]');
           if (agentImg.length > 0) {
             agentName = agentImg.attr('alt') || '';
           } else {
             // Try to find any image that looks like a logo (small, in footer)
             const possibleLogos = $el.find('img').filter((_, img) => {
                const src = $(img).attr('src') || '';
                const alt = $(img).attr('alt') || '';
                return (src.includes('logo') || src.includes('agency') || src.includes('branch')) && 
                       alt.length > 2 && !alt.includes('bedroom');
             });
             if (possibleLogos.length > 0) {
               agentName = possibleLogos.first().attr('alt') || '';
             }
           }
        }
        
        // Fallback extraction from text if we see "Marketed by" or "Added" context
        if (!agentName) {
           const text = $el.text();
           const marketedMatch = text.match(/Marketed by\s+([^-]+?)(?:\s*-\s*|\s*Added|$)/i);
           if (marketedMatch) {
             agentName = marketedMatch[1].trim();
           } else {
             // Look for text next to "Added < x days" which usually contains agent name in OTM
             // Structure seen: "Added < 7 daysCBRE - LondonAdded < 7 days"
             const addedRegex = /Added\s*<\s*\d+\s*days\s*([^-]+?)(?:\s*-\s*|\s*Added|\d{3}|$)/i;
             const addedMatch = text.match(addedRegex);
             if (addedMatch) {
                const possibleAgent = addedMatch[1].trim();
                // heuristic to check if it looks like a name
                // Filter out "London", "Leeds" etc if they appear alone
                const cityNames = ['London', 'Leeds', 'Manchester', 'Birmingham', 'Liverpool', 'Bristol', 'Sheffield', 'Nottingham'];
                
                if (possibleAgent.length > 2 && possibleAgent.length < 50 && !/\d/.test(possibleAgent) && 
                    !cityNames.includes(possibleAgent)) {
                  agentName = possibleAgent;
                }
             }
           }
        }
        
        // Refine agent name if it looks like "CBRE - London" -> "CBRE"
        if (agentName && agentName.includes(' - ')) {
           const parts = agentName.split(' - ');
           if (parts.length > 0) {
             // If the second part is a city name, take the first part
             const cityNames = ['London', 'Leeds', 'Manchester', 'Birmingham', 'Liverpool', 'Bristol', 'Sheffield', 'Nottingham', 'Nationwide'];
             if (cityNames.some(city => parts[1].includes(city))) {
               agentName = parts[0].trim();
             } else {
               agentName = parts[0].trim(); // Default to first part anyway usually
             }
           }
        }
        
        // Extract company name from agent text (look for "Marketed by" pattern)
        // Format: "Marketed by Company Name - Location Phone Email"
        let companyMatch = agentName.match(/Marketed by\s+([^-]+?)(?:\s*-\s*|$)/i);
        if (!companyMatch) {
          // Fallback: try to extract any text that looks like a company name
          companyMatch = agentName.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
        }
        const cleanAgentName = companyMatch ? companyMatch[1].trim() : (agentName || 'OnTheMarket Agent');
        
        // Extract website/link
        let agentWebsite: string | undefined = undefined;
        const link = $el.find('a').first().attr('href');
        if (link) {
           // OTM internal links usually start with /details/ or /agents/
           // We don't want to use these as the "company website" for scraping contact info
           // unless we can't find anything else.
           if (link.startsWith('http')) {
             agentWebsite = link;
           } else {
             // Store the OTM link but mark it as internal so we know to prioritize external search
             agentWebsite = `https://www.onthemarket.com${link}`;
           }
        }

            if (price) {
              properties.push({
                title: title || 'Property Listing',
                price: price || 'Price on Application',
                location: location || 'Location not specified',
                bedrooms: bedrooms || 'Not specified',
                propertyType: propertyType,
                imageUrls: validImageUrls,
                agent: {
                  name: cleanAgentName,
                  email: '', // Will fill later
                  website: agentWebsite
                }
              });
              console.log('Added property:', {
            title,
            price,
            location
              });
            }
          } catch (itemError) {
            console.error('Error processing property item:', itemError);
          }
        });

    timings.parse = Date.now() - tParseStart;

    // Find unique agents
    const uniqueAgents = new Map<string, { name: string, website?: string }>();
    for (const prop of properties) {
      const key = prop.agent.name; // Use just the company name as key
      if (!uniqueAgents.has(key)) {
        uniqueAgents.set(key, { name: prop.agent.name, website: prop.agent.website });
      }
    }
    
    // Sort agents by frequency (most common first) and limit to top 10 to avoid rate limits
    const agentFrequency = new Map<string, number>();
    for (const prop of properties) {
      const key = prop.agent.name;
      agentFrequency.set(key, (agentFrequency.get(key) || 0) + 1);
    }
    
    const sortedAgents = Array.from(uniqueAgents.entries())
      .sort((a, b) => (agentFrequency.get(b[0]) || 0) - (agentFrequency.get(a[0]) || 0))
      .slice(0, config.agentCap); // Sprint 2 Phase 3: configurable cap

    const tEmailStart = Date.now();
    const CONCURRENCY = 4; // Sprint 2 Phase 3: parallel email lookup concurrency cap

    const processOneAgent = async ([key, { name, website }]: [string, { name: string; website?: string }]): Promise<void> => {
      if (config.emailCacheTtlSec > 0) {
        const cached = agentEmailCacheGlobal.get(key);
        if (cached && (Date.now() - cached.ts) / 1000 <= config.emailCacheTtlSec) {
          agentEmailCache[key] = { email: cached.email, website: cached.website };
          return;
        }
      }
      if (!browser || !browser.isConnected()) {
        agentEmailCache[key] = { email: null, website: null };
        return;
      }
      try {
        const result = await findEmailForAgent(name, website, browser, apiKey, {
          maxQueries: config.emailQueriesPerAgent
        });
        agentEmailCache[key] = { email: result.email, website: result.website };
        if (config.emailCacheTtlSec > 0) {
          agentEmailCacheGlobal.set(key, {
            email: result.email,
            website: result.website ?? null,
            ts: Date.now()
          });
          pruneAgentEmailCacheIfNeeded(config.emailCacheTtlSec);
        }
      } catch (agentError) {
        console.error(`Error processing agent ${name}:`, agentError);
        agentEmailCache[key] = { email: null, website: null };
      }
    };

    if (config.parallelEmailLookup) {
      // Run with concurrency limit to avoid Brave rate limits
      let idx = 0;
      const runNext = async (): Promise<void> => {
        while (idx < sortedAgents.length) {
          const i = idx++;
          const [key, entry] = sortedAgents[i];
          console.log(`Processing agent: ${entry.name}`);
          await processOneAgent([key, entry]);
        }
      };
      await Promise.all(
        Array.from({ length: Math.min(CONCURRENCY, sortedAgents.length) }, () => runNext())
      );
    } else {
      for (const [key, { name, website }] of sortedAgents) {
        console.log(`Processing agent: ${name}`);
        if (browser) {
          try {
            if (!browser.isConnected()) {
              console.log('Browser disconnected, stopping email scraping');
              break;
            }
            if (config.emailCacheTtlSec > 0) {
              const cached = agentEmailCacheGlobal.get(key);
              if (cached && (Date.now() - cached.ts) / 1000 <= config.emailCacheTtlSec) {
                agentEmailCache[key] = { email: cached.email, website: cached.website };
                continue;
              }
            }
            const result = await findEmailForAgent(name, website, browser, apiKey, {
              maxQueries: config.emailQueriesPerAgent
            });
            agentEmailCache[key] = { email: result.email, website: result.website };
            if (config.emailCacheTtlSec > 0) {
              agentEmailCacheGlobal.set(key, {
                email: result.email,
                website: result.website ?? null,
                ts: Date.now()
              });
              pruneAgentEmailCacheIfNeeded(config.emailCacheTtlSec);
            }
          } catch (agentError) {
            console.error(`Error processing agent ${name}:`, agentError);
            agentEmailCache[key] = { email: null, website: null };
          }
        } else {
          agentEmailCache[key] = { email: null, website: null };
        }
      }
    }
    timings.emailEnrichment = Date.now() - tEmailStart;

    // Fill in emails for each property and filter out those without emails
    const propertiesWithEmails: Property[] = [];
    for (const prop of properties) {
      const key = prop.agent.name; // Use just the company name as key
      const email = agentEmailCache[key]?.email;
      
      // Only include properties that have a valid email (not null, not empty, and passes validation)
      if (email && email !== 'Not found' && email !== null && email !== '' && isValidEmail(email)) {
        prop.agent.email = email;
        // Update website if found
        if (agentEmailCache[key]?.website && agentEmailCache[key]?.website !== null) {
          prop.agent.website = agentEmailCache[key]?.website || undefined;
        }
        propertiesWithEmails.push(prop);
      } else {
        console.log(`Excluding property from ${prop.agent.name} - no valid email found`);
      }
    }
    console.log(`Successfully scraped ${propertiesWithEmails.length} properties with valid emails (out of ${properties.length} total)`);
    timings.total = Date.now() - startTotal;
    console.log('[SCRAPE_TIMINGS]', JSON.stringify({ correlationId: correlationId ?? null, ...timings }));
    return propertiesWithEmails;

  } catch (error) {
    timings.total = Date.now() - startTotal;
    console.log('[SCRAPE_TIMINGS]', JSON.stringify({ correlationId: correlationId ?? null, ...timings, error: String(error) }));
    console.error('Error scraping data:', error);
    throw error;
  } finally {
    if (browser && page) {
      if (config.warmBrowser && fromPool) {
        try {
          await releaseWarmBrowser(browser, page);
        } catch (closeError) {
          console.error('Error releasing warm browser page:', closeError);
        }
      } else {
        try {
          console.log('Closing browser...');
          await browser.close();
        } catch (closeError) {
          console.error('Error closing browser:', closeError);
        }
      }
    }
  }
} 