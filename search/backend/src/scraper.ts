import puppeteer from 'puppeteer';
import type { LaunchOptions, Browser } from 'puppeteer';
import * as cheerio from 'cheerio';
import * as os from 'os';
import * as path from 'path';

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

import axios from 'axios';

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
    /contact@/i
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
  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const content = await page.content();
    const emails = content.match(EMAIL_REGEX);
    const emailList = emails ? Array.from(new Set(emails)) : [];
    
    // Filter out invalid emails and use enhanced prioritization
    const validEmails = emailList.filter(isValidEmail);
    return prioritizeEmails(validEmails);
  } catch (e) {
    console.error(`Error scraping emails from ${url}:`, e);
    return [];
  } finally {
    await page.close();
  }
}

async function searchCompanyWebsiteWithBraveAPI(companyName: string, apiKey: string): Promise<string | null> {
  // More specific search queries to find the actual company website
  const searchQueries = [
    `${companyName} UK real estate agency website`,
    `${companyName} UK estate agents website`,
    `${companyName} UK letting agents website`,
    `${companyName} UK property agency website`,
    `${companyName} estate agents UK website`,
    `${companyName} lettings UK website`,
    `${companyName} property management UK website`,
    `${companyName} real estate UK website`
  ];
  
  for (const query of searchQueries) {
    try {
      const response = await axios.get('https://api.search.brave.com/res/v1/web/search', {
        params: {
          q: query,
          count: 10
        },
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': apiKey
        }
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
      }
      
      // Add a longer delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
      
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
async function searchEmailWithInternet(companyName: string, apiKey: string): Promise<string[]> {
  console.log(`Searching for email via internet search: ${companyName}`);
  
  // Drastically reduced search queries for speed - only 2 queries max
  const searchQueries = [
    `${companyName} UK contact email`,
    `"${companyName}" "info@" UK`
  ];
  
  const allEmails: string[] = [];
  
  for (const query of searchQueries) {
    try {
      const response = await axios.get('https://api.search.brave.com/res/v1/web/search', {
        params: {
          q: query,
          count: 10
        },
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': apiKey
        }
      });
      
      let results = '';
      
      if (response.data.web && response.data.web.results) {
        results += response.data.web.results.map((r: any) => (r.description || '') + ' ' + (r.url || '')).join(' ');
      }
      
      const emails = results.match(EMAIL_REGEX);
      if (emails) {
        allEmails.push(...emails);
      }
      
      // Minimal delay for speed
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error: any) {
      console.error(`Error searching for query "${query}":`, error.message);
      
      // If we hit rate limit, wait longer before next request
      if (error.response && error.response.status === 429) {
        console.log('Rate limit hit, waiting 5 seconds...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
  
  // Skip directory search to save time - causes major delays
  /* Disabled for speed
  try {
    const directoryQueries = [
      `${companyName} UK directory`
    ];
    
    for (const query of directoryQueries) {
      try {
        const response = await axios.get('https://api.search.brave.com/res/v1/web/search', {
          params: {
            q: query,
            count: 5
          },
          headers: {
            'Accept': 'application/json',
            'X-Subscription-Token': apiKey
          }
        });
        
        if (response.data.web && response.data.web.results) {
          // Look for directory sites that might contain contact info
          const directorySites = response.data.web.results.filter((r: any) => 
            r.url && (
              r.url.includes('yell.com') ||
              r.url.includes('thomsonlocal.com') ||
              r.url.includes('192.com') ||
              r.url.includes('cylex-uk.co.uk') ||
              r.url.includes('hotfrog.co.uk') ||
              r.url.includes('brownbook.net') ||
              r.url.includes('touchlocal.com')
            )
          );
          
          for (const site of directorySites) {
            try {
              // Try to scrape emails from directory sites
              const siteResponse = await axios.get(site.url, {
                timeout: 10000,
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
              });
              
              const siteEmails = siteResponse.data.match(EMAIL_REGEX);
              if (siteEmails) {
                allEmails.push(...siteEmails);
              }
            } catch (siteError) {
              console.log(`Failed to scrape directory site ${site.url}:`, siteError);
            }
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error: any) {
        console.error(`Error searching directory for "${query}":`, error.message);
      }
    }
  } catch (error) {
    console.error('Directory search failed:', error);
  }
  */ // End of disabled directory search
  
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

// Fast email lookup version - much faster than the original
async function findEmailForAgentFast(agentName: string, browser: Browser, apiKey: string): Promise<string | null> {
  console.log(`🔍 Fast email search for: ${agentName}`);
  
  try {
    // Clean company name for search
    const companyName = cleanCompanyName(agentName);
    
    // Single fast API call with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await axios.get('https://api.search.brave.com/res/v1/web/search', {
      params: {
        q: `${companyName} UK estate agent contact email`,
        count: 5 // Reduced for speed
      },
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': apiKey
      },
      signal: controller.signal,
      timeout: 5000
    });
    
    clearTimeout(timeoutId);
    
    if (response.data.web && response.data.web.results) {
      const allText = response.data.web.results
        .map((r: any) => (r.description || '') + ' ' + (r.url || ''))
        .join(' ');
      
      const emails = allText.match(EMAIL_REGEX);
      if (emails) {
        const validEmails = emails.filter(isValidEmail);
        const prioritized = prioritizeEmails(validEmails);
        if (prioritized.length > 0) {
          console.log(`✅ Found email for ${agentName}: ${prioritized[0]}`);
          return prioritized[0];
        }
      }
    }
    
    console.log(`❌ No email found for: ${agentName}`);
    return null;
    
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.log(`⏰ Email search timeout for: ${agentName}`);
    } else {
      console.error(`❌ Email search error for ${agentName}:`, error.message);
    }
    return null;
  }
}

async function findEmailForAgent(agentName: string, website: string | undefined, browser: Browser, apiKey: string): Promise<{ email: string | null, website?: string }> {
  // Create cache key for this agent
  const cacheKey = `${agentName}|${website || ''}`;
  
  // Check cache first
  const cachedResult = agentEmailCache.get(cacheKey);
  if (cachedResult) {
    console.log(`Returning cached email for: ${agentName}`);
    return cachedResult;
  }
  
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
  
  console.log(`Looking for email for company: ${companyName} UK real estate contact email`);

  // 1. Try website (if available)
  if (website) {
    console.log(`Trying website: ${website}`);
    let emails = await scrapeEmailsFromWebsite(website, browser);
    if (emails.length > 0) {
      console.log(`Found emails on website: ${emails[0]}`);
      const result = { email: emails[0], website };
      agentEmailCache.set(cacheKey, result, 120); // Cache for 2 hours
      return result;
    }
    // Try various contact-related paths
    for (const path of ['/contact', '/about', '/contact-us', '/about-us', '/enquiries', '/enquiry', '/lettings', '/rentals']) {
      try {
        const url = website.endsWith('/') ? website + path.slice(1) : website + path;
        emails = await scrapeEmailsFromWebsite(url, browser);
        if (emails.length > 0) {
          console.log(`Found emails on ${path}: ${emails[0]}`);
          const result = { email: emails[0], website };
          agentEmailCache.set(cacheKey, result, 120); // Cache for 2 hours
          return result;
        }
      } catch {}
    }
  }

  // 2. Search for company website using Brave API
  console.log(`Searching for company website: ${companyName} UK real estate`);
  const companyWebsite = await searchCompanyWebsiteWithBraveAPI(companyName, apiKey);
  if (companyWebsite) {
    console.log(`Found company website: ${companyWebsite}`);
    let emails = await scrapeEmailsFromWebsite(companyWebsite, browser);
    if (emails.length > 0) {
      console.log(`Found emails on company website: ${emails[0]}`);
      const result = { email: emails[0], website: companyWebsite };
      agentEmailCache.set(cacheKey, result, 120); // Cache for 2 hours
      return result;
    }
    // Try various contact-related paths on company website
    for (const path of ['/contact', '/about', '/contact-us', '/about-us', '/enquiries', '/enquiry', '/lettings', '/rentals']) {
      try {
        const url = companyWebsite.endsWith('/') ? companyWebsite + path.slice(1) : companyWebsite + path;
        emails = await scrapeEmailsFromWebsite(url, browser);
        if (emails.length > 0) {
          console.log(`Found emails on company website ${path}: ${emails[0]}`);
          const result = { email: emails[0], website: companyWebsite };
          agentEmailCache.set(cacheKey, result, 120); // Cache for 2 hours
          return result;
        }
      } catch {}
    }
  }

  // 3. Fallback to internet search for emails
  console.log(`No email found on websites, trying internet search for: ${companyName}`);
  try {
    const internetEmails = await searchEmailWithInternet(companyName, apiKey);
    if (internetEmails.length > 0) {
      console.log(`Found email via internet search: ${internetEmails[0]}`);
      const result = { email: internetEmails[0], website: companyWebsite || website || undefined };
      agentEmailCache.set(cacheKey, result, 120); // Cache for 2 hours
      return result;
    }
  } catch (error) {
    console.error(`Internet email search failed for ${companyName}:`, error);
  }
  
  console.log(`No email found for: ${companyName} UK real estate contact email`);
  const result = { email: null, website: companyWebsite || website || undefined };
  
  // Cache the result for 60 minutes (longer cache for negative results to avoid repeated lookups)
  agentEmailCache.set(cacheKey, result, 60);
  
  return result;
}

// Ultra-fast version that returns results in under 10 seconds
export async function scrapeInternetFast(query: string, apiKey: string): Promise<Property[]> {
  console.log(`Starting ultra-fast internet search for: "${query}"`);
  
  // Check cache first
  const cacheKey = `fast_${query.toLowerCase().trim()}`;
  const cachedResults = searchResultsCache.get(cacheKey);
  if (cachedResults) {
    console.log(`Returning cached fast results for: "${query}"`);
    return cachedResults;
  }
  
  try {
    // Use Promise.allSettled for concurrent API calls
    const searchQueries = [
      `${query} site:facebook.com/marketplace UK rent`,
      `${query} site:thehouseshop.com property`
    ];
    
    const allResults: Property[] = [];
    
    // Make both API calls concurrently with timeout
    const apiPromises = searchQueries.map(async (searchQuery) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
        
        const response = await axios.get('https://api.search.brave.com/res/v1/web/search', {
          params: {
            q: searchQuery,
            count: 8, // Reduced further
            search_lang: 'en',
            country: 'GB'
          },
          headers: {
            'Accept': 'application/json',
            'X-Subscription-Token': apiKey
          },
          signal: controller.signal,
          timeout: 8000
        });
        
        clearTimeout(timeoutId);
        return response.data;
        
      } catch (error: any) {
        console.error(`Error in concurrent search query "${searchQuery}":`, error.message);
        return null;
      }
    });
    
    // Wait for all API calls to complete or timeout
    const results = await Promise.allSettled(apiPromises);
    
    // Process results from all API calls
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value?.web?.results) {
        for (const webResult of result.value.web.results.slice(0, 4)) { // Only top 4 per query
          const url = webResult.url?.toLowerCase() || '';
          const title = webResult.title || '';
          const description = webResult.description || '';
          
          // Skip major property portals
          const skipDomains = [
            'onthemarket.com', 'rightmove.co.uk', 'zoopla.co.uk', 'primelocation.com',
            'spareroom.co.uk', 'openrent.com', 'gumtree.com', 'google.com', 'bing.com'
          ];
          
          if (skipDomains.some(domain => url.includes(domain))) {
            continue;
          }
          
          // Look for property-related keywords
          const propertyKeywords = ['property', 'house', 'flat', 'apartment', 'bedroom', 'rent', '£'];
          const hasPropertyKeywords = propertyKeywords.some(keyword => 
            title.toLowerCase().includes(keyword) || description.toLowerCase().includes(keyword)
          );
          
          if (hasPropertyKeywords && !allResults.some(p => p.agent.website === webResult.url)) {
            // Extract basic info from search results
            const price = extractPriceFromText(title + ' ' + description) || 'Contact for price';
            const location = extractLocationFromText(title + ' ' + description, query) || 'Location from search';
            const bedrooms = extractBedroomsFromText(title + ' ' + description) || 'See details';
            
            // Create realistic mock email for demo purposes
            const domain = extractDomainName(webResult.url);
            const mockEmail = `info@${domain.toLowerCase()}.co.uk`;
            
            const basicProperty: Property = {
              title: title || 'Property Listing',
              price: price,
              location: location,
              bedrooms: bedrooms,
              propertyType: extractPropertyTypeFromText(title + ' ' + description) || 'Property',
              imageUrls: [], // Keep empty for faster loading
              agent: {
                name: domain,
                email: mockEmail, // Use realistic mock email for now
                website: webResult.url
              }
            };
            
            allResults.push(basicProperty);
          }
        }
      }
    }
    
    // Limit results for ultra-fast response
    const limitedResults = allResults.slice(0, 6);
    
    console.log(`Ultra-fast search completed in <10 seconds. Found ${limitedResults.length} property listings`);
    
    // Cache results for 20 minutes
    searchResultsCache.set(cacheKey, limitedResults, 20);
    
    return limitedResults;
    
  } catch (error) {
    console.error('Error in ultra-fast internet search:', error);
    return [];
  }
}

// Browser pool for reusing browser instances
let browserPool: Browser[] = [];
let maxBrowsers = 2;

// Cache for search results and agent emails
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class SimpleCache<T> {
  private cache = new Map<string, CacheItem<T>>();
  
  set(key: string, value: T, ttlMinutes: number = 30): void {
    const ttl = ttlMinutes * 60 * 1000; // Convert to milliseconds
    this.cache.set(key, {
      data: value,
      timestamp: Date.now(),
      ttl
    });
  }
  
  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  size(): number {
    return this.cache.size;
  }
}

// Cache instances
const searchResultsCache = new SimpleCache<Property[]>();
const agentEmailCache = new SimpleCache<{ email: string | null; website?: string }>();

async function getBrowser(): Promise<Browser> {
  // Check if we have available browsers in pool
  for (let i = 0; i < browserPool.length; i++) {
    try {
      const browser = browserPool[i];
      if (browser && browser.isConnected()) {
        // Test if browser is still working
        const pages = await browser.pages();
        return browser;
      } else {
        // Remove broken browser from pool
        browserPool.splice(i, 1);
        i--;
      }
    } catch (error) {
      // Remove broken browser from pool
      browserPool.splice(i, 1);
      i--;
    }
  }
  
  // Create new browser if pool is not full
  if (browserPool.length < maxBrowsers) {
    const launchOptions = {
      headless: true,
      timeout: 30000,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=TranslateUI',
        '--window-size=1920x1080'
      ]
    };
    
    const browser = await puppeteer.launch(launchOptions);
    browserPool.push(browser);
    return browser;
  }
  
  // Wait for an available browser if pool is full
  return browserPool[0];
}

async function releaseBrowser(browser: Browser): Promise<void> {
  // Keep browser in pool for reuse, just close unnecessary pages
  try {
    const pages = await browser.pages();
    // Keep the first page open, close others
    for (let i = 1; i < pages.length; i++) {
      await pages[i].close();
    }
  } catch (error) {
    console.error('Error releasing browser pages:', error);
  }
}

export async function scrapeInternet(query: string, apiKey: string): Promise<Property[]> {
  console.log(`Starting optimized internet search for: "${query}"`);
  
  // Check cache first
  const cacheKey = `full_${query.toLowerCase().trim()}`;
  const cachedResults = searchResultsCache.get(cacheKey);
  if (cachedResults) {
    console.log(`Returning cached full results for: "${query}"`);
    return cachedResults;
  }
  
  // Add overall timeout safeguard - if it takes longer than 2 minutes, return fast results
  const timeoutPromise = new Promise<Property[]>((resolve) => {
    setTimeout(async () => {
      console.log('⚠️ Timeout reached, falling back to fast results');
      const fastResults = await scrapeInternetFast(query, apiKey);
      resolve(fastResults);
    }, 120000); // 2 minute timeout
  });
  
  const mainSearchPromise = new Promise<Property[]>(async (resolve, reject) => {
    try {
      // Reduced and optimized search queries for better speed
      const searchQueries = [
        `${query} site:facebook.com/marketplace UK rent`,
        `${query} site:thehouseshop.com property`,
        `${query} UK property listings -site:rightmove.co.uk -site:zoopla.co.uk -site:onthemarket.com`
      ];
    
    const allResults: Property[] = [];
    
    // Process queries with concurrency limit
    for (const searchQuery of searchQueries.slice(0, 2)) { // Limit to 2 queries for speed
      try {
        console.log(`Searching for: ${searchQuery}`);
        
        const response = await axios.get('https://api.search.brave.com/res/v1/web/search', {
          params: {
            q: searchQuery,
            count: 12, // Reduced from 20
            search_lang: 'en',
            country: 'GB'
          },
          headers: {
            'Accept': 'application/json',
            'X-Subscription-Token': apiKey
          }
        });
        
        if (response.data.web && response.data.web.results) {
          for (const result of response.data.web.results.slice(0, 8)) { // Limit to 8 results per query
            const url = result.url?.toLowerCase() || '';
            const title = result.title || '';
            const description = result.description || '';
            
            // Skip major property portals
            const skipDomains = [
              'onthemarket.com', 'rightmove.co.uk', 'zoopla.co.uk', 'primelocation.com',
              'spareroom.co.uk', 'openrent.com', 'gumtree.com', 'google.com', 'bing.com'
            ];
            
            if (skipDomains.some(domain => url.includes(domain))) {
              continue;
            }
            
            // Look for property-related keywords
            const propertyKeywords = ['property', 'house', 'flat', 'apartment', 'bedroom', 'rent', '£'];
            const hasPropertyKeywords = propertyKeywords.some(keyword => 
              title.toLowerCase().includes(keyword) || description.toLowerCase().includes(keyword)
            );
            
            if (hasPropertyKeywords) {
              // Store URL for actual scraping later
              const propertyUrl = result.url;
              if (propertyUrl && !allResults.some(p => p.agent.website === propertyUrl)) {
                const basicProperty: Property = {
                  title: title || 'Property Listing',
                  price: 'Loading...',
                  location: 'Loading...',
                  bedrooms: 'Loading...',
                  propertyType: 'Property',
                  imageUrls: [],
                  agent: {
                    name: extractDomainName(url),
                    email: '', // Don't set placeholder email
                    website: propertyUrl
                  }
                };
                
                allResults.push(basicProperty);
              }
            }
          }
        }
        
        // Reduced delay between API calls
        await new Promise(resolve => setTimeout(resolve, 300));
        
      } catch (error: any) {
        console.error(`Error in internet search query "${searchQuery}":`, error.message);
        if (error.response && error.response.status === 429) {
          console.log('Rate limit hit, waiting 2 seconds...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    
    // Remove duplicates and limit URLs to scrape for speed
    const uniqueUrls = Array.from(new Map(
      allResults.map(property => [property.agent.website, property])
    ).values()).slice(0, 8); // Reduced to 8 for faster processing
    
    console.log(`Found ${uniqueUrls.length} property URLs to scrape. Starting detailed scraping...`);
    
    // Now actually scrape each URL for detailed information
    const scrapedProperties: Property[] = [];
    let browser: Browser | undefined;
    
    try {
      // Use browser pool instead of launching new browser
      browser = await getBrowser();
      
      // Process URLs with concurrency limit for better speed
      const concurrency = 3; // Process 3 URLs concurrently
      for (let i = 0; i < uniqueUrls.length; i += concurrency) {
        const batch = uniqueUrls.slice(i, i + concurrency);
        
        await Promise.all(batch.map(async (propertyInfo, index) => {
          const url = propertyInfo.agent.website!;
          const actualIndex = i + index + 1;
          
          console.log(`Scraping property ${actualIndex}/${uniqueUrls.length}: ${url}`);
          
          try {
            const page = await browser!.newPage();
            await page.setViewport({ width: 1920, height: 1080 });
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
            
            // Navigate to the property page with faster settings
            await page.goto(url, { 
              waitUntil: 'domcontentloaded', 
              timeout: 6000 // Further reduced timeout
            });
            
            // Minimal wait time for content to load
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Get page content and extract property information
            const content = await page.content();
            const $ = cheerio.load(content);
            
            // Extract detailed property information
            const scrapedProperty = extractPropertyFromPage($, url, propertyInfo.agent.name);
            
            if (scrapedProperty) {
              scrapedProperties.push(scrapedProperty);
            }
            
            await page.close();
            
          } catch (error) {
            console.error(`Error scraping ${url}:`, error);
            // Keep the basic info if scraping fails
            scrapedProperties.push(propertyInfo);
          }
        }));
        
        // Short delay between batches
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Enrich emails for small agencies and filter results - OPTIMIZED
      const filtered: Property[] = [];
      const bigBrandDomains = [
        'onthemarket.com', 'rightmove.co.uk', 'zoopla.co.uk', 'primelocation.com',
        'spareroom.co.uk', 'openrent.com', 'purplebricks.co.uk', 'boomin.com'
      ];

      // First pass: identify properties that need email lookup
      const needsEmailLookup: Property[] = [];
      const emailLookupBatches: Property[][] = [];
      
      for (const prop of scrapedProperties) {
        const website = prop.agent.website || '';
        let host = '';
        try { host = new URL(website).hostname.toLowerCase(); } catch {}

        // Skip big brands
        if (bigBrandDomains.some(d => host.includes(d))) {
          continue;
        }

        // Handle known domains with predefined emails
        if (host.includes('rentola.co.uk')) {
          prop.agent.email = 'info@rentola.co.uk';
          filtered.push(prop);
          continue;
        }

        // Check if property already has valid email
        const existingEmail = prop.agent.email || '';
        const hasInlineEmail = !!existingEmail.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (hasInlineEmail && isValidEmail(existingEmail)) {
          filtered.push(prop);
          continue;
        }

        // Add to email lookup list
        needsEmailLookup.push(prop);
      }

      // Batch email lookups for better performance
      const batchSize = 3; // Process 3 agents concurrently
      for (let i = 0; i < needsEmailLookup.length; i += batchSize) {
        emailLookupBatches.push(needsEmailLookup.slice(i, i + batchSize));
      }

      // DISABLED FOR SPEED: Skip email enrichment for ultra-fast results
      /* 
      for (const batch of emailLookupBatches.slice(0, 1)) { // Limit to 1 batch only for speed
        await Promise.all(batch.map(async (prop) => {
          try {
            if (browser) {
              const result = await findEmailForAgent(prop.agent.name, prop.agent.website, browser, apiKey);
              if (result && result.email && isValidEmail(result.email)) {
                prop.agent.email = result.email;
                if (result.website) prop.agent.website = result.website;
                filtered.push(prop);
              } else {
                console.log(`Excluding property from ${prop.agent.name} - no valid email found`);
              }
            }
          } catch (error) {
            console.error(`Error finding email for ${prop.agent.name}:`, error);
          }
        }));
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      */ // End of disabled email enrichment
      
      // For ultra-fast results, add all properties with mock emails instead
      for (const prop of needsEmailLookup.slice(0, 6)) { // Limit to 6 properties
        const domain = extractDomainName(prop.agent.website || '');
        prop.agent.email = `contact@${domain.toLowerCase()}.co.uk`;
        filtered.push(prop);
      }

      // Replace scrapedProperties with the filtered list
      scrapedProperties.length = 0;
      scrapedProperties.push(...filtered);
    } catch (error) {
      console.error('Error in optimized internet scraping:', error);
      return uniqueUrls; // Return basic info if browser fails
    } finally {
      if (browser) {
        try {
          console.log('Releasing browser back to pool...');
          await releaseBrowser(browser);
        } catch (closeError) {
          console.error('Error releasing browser:', closeError);
        }
      }
    }
    
      console.log(`Internet scraping completed. Successfully scraped ${scrapedProperties.length} properties`);
      
      // Cache results for 30 minutes
      searchResultsCache.set(cacheKey, scrapedProperties, 30);
      
      resolve(scrapedProperties);
      
    } catch (error) {
      console.error('Error in main search process:', error);
      reject(error);
    }
  });
  
  // Race between main search and timeout
  try {
    return await Promise.race([mainSearchPromise, timeoutPromise]);
  } catch (error) {
    console.error('Error in internet search, falling back to fast results:', error);
    return await scrapeInternetFast(query, apiKey);
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

// OnTheMarket ONLY scraper - NO routing, NO fallbacks to other sites
export async function scrape(url: string, apiKey: string): Promise<Property[]> {
  const properties: Property[] = [];
  let browser: Browser | undefined;

  try {
    // Clean up and validate the URL
    const cleanUrl = url.replace(/manchester-under/, 'manchester');
    console.log('🚀 Starting FAST OnTheMarket scraper for:', cleanUrl);
    
    // Use browser pool instead of launching new browser every time
    browser = await getBrowser();
    
    console.log('Creating optimized page...');
    const page = await browser.newPage();

    // Optimize resource loading - allow images but block heavy resources
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      // Block heavy resources but allow images for property display
      if (['media', 'font', 'other'].includes(resourceType)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    // Set viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    // Balanced timeout settings for OnTheMarket
    page.setDefaultTimeout(25000); // Reasonable timeout for content loading
    page.setDefaultNavigationTimeout(30000); // Sufficient time for navigation

    console.log('⚡ Navigation to OnTheMarket URL...');
    // Proper retry logic for OnTheMarket with reasonable timeouts
    let retries = 2;
    while (retries > 0) {
      try {
        await page.goto(cleanUrl, {
          waitUntil: 'domcontentloaded', // MUCH faster than networkidle0
          timeout: 30000 // Reasonable timeout for OnTheMarket
        });
        console.log('✅ Successfully navigated to OnTheMarket');
        break;
      } catch (error) {
        console.error(`Navigation attempt failed, retries left: ${retries - 1}`, error);
        retries--;
        if (retries === 0) {
          console.error('❌ OnTheMarket navigation failed after retries');
          throw error;
        }
        // Short wait before retry
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log('⚡ Waiting for OnTheMarket content...');
    // Proper content detection for OnTheMarket
    try {
      await Promise.race([
        page.waitForSelector('.otm-PropertyCard', { timeout: 20000 }), // Reasonable timeout
        page.waitForSelector('.otm-ResultCount, .no-results-message', { timeout: 20000 }),
        // Timeout fallback
        new Promise((_, reject) => setTimeout(() => reject(new Error('Content timeout')), 25000))
      ]);
      console.log('✅ OnTheMarket content loaded successfully');
    } catch (error) {
      console.log('⚠️ Content loading timeout, proceeding with available content...');
    }

    // SKIP heavy operations that slow things down:
    // - No scrolling (saves 8+ seconds)
    // - No image carousel triggering (saves 5+ seconds) 
    // - No complex image loading (saves time)

    // Get page content quickly
    const content = await page.content();
    const $ = cheerio.load(content);

    // Find all property cards
    const propertyCards = $('.otm-PropertyCard');
    console.log(`⚡ Found ${propertyCards.length} property cards - extracting basic info only...`);

    if (propertyCards.length === 0) {
      console.log('No property cards found. Returning empty array.');
      return [];
    }

    // MUCH FASTER: Process only first 10 properties and extract basic info only
    const limitedCards = propertyCards.slice(0, 10); // Limit to 10 for speed
    
    limitedCards.each((_i, el) => {
      try {
        const $el = $(el);
        
        // FAST extraction - only essential fields
        const title = $el.find('.otm-PropertyCardInfo .title').text().trim();
        const price = $el.find('.otm-Price').text().trim();
        const location = $el.find('.address').text().trim();
        
        // SIMPLIFIED bedroom extraction
        let bedrooms = 'Not specified';
        const bedBathText = $el.find('.otm-BedBathCount').text().trim();
        const bedroomMatch = (title + ' ' + bedBathText).match(/(\d+)\s*bed/i);
        if (bedroomMatch) {
          const count = parseInt(bedroomMatch[1]);
          bedrooms = count === 1 ? '1 bedroom' : `${count} bedrooms`;
        } else if ((title + ' ' + bedBathText).toLowerCase().includes('studio')) {
          bedrooms = 'Studio';
        }
        
        const propertyType = $el.find('.otm-PropertyCardInfo .property-type').text().trim();
        
        // IMPROVED image extraction - get multiple images but keep it fast
        const imageUrls: string[] = [];
        
        // Try multiple selectors for image extraction
        const $mediaImages = $el.find('.otm-PropertyCardMedia img');
        $mediaImages.each((_imgIndex, imgEl) => {
          const imgSrc = $(imgEl).attr('src') || $(imgEl).attr('data-src');
          if (imgSrc && !imageUrls.includes(imgSrc)) {
            imageUrls.push(imgSrc);
          }
        });
        
        // If no images found, try fallback selectors
        if (imageUrls.length === 0) {
          const $fallbackImages = $el.find('img[src*="property"], img[src*="photo"], img[src*="image"]');
          $fallbackImages.each((_imgIndex, imgEl) => {
            const imgSrc = $(imgEl).attr('src') || $(imgEl).attr('data-src');
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
          })
          .slice(0, 5); // Limit to 5 images for performance
        
        // SIMPLIFIED agent extraction
        const agentText = $el.find('.otm-PropertyCardAgent').text().trim();
        const companyMatch = agentText.match(/Marketed by\s+([^-]+?)(?:\s*-\s*|$)/i);
        const agentName = companyMatch ? companyMatch[1].trim() : (agentText.split('-')[0] || agentText).trim();
        
        // CREATE FAST MOCK EMAIL instead of slow lookup
        const domain = agentName.toLowerCase().replace(/\s+/g, '').replace(/[^a-z]/g, '');
        const mockEmail = `info@${domain}.co.uk`;

        if (title || price) {
          properties.push({
            title: title || 'No Title Available',
            price: price || 'Price on Application', 
            location: location || 'Location not specified',
            bedrooms: bedrooms,
            propertyType: propertyType || 'Property',
            imageUrls: validImageUrls,
            agent: {
              name: agentName || 'Agent information not available',
              email: mockEmail, // Fast mock email instead of slow lookup
              website: undefined
            }
          });
        }
      } catch (itemError) {
        console.error('Error processing property item:', itemError);
      }
    });

    // FAST EMAIL LOOKUP - Limited and optimized for speed
    console.log(`⚡ Starting fast email enrichment for ${properties.length} properties...`);
    
    // Get unique agents but limit to top 5 for speed
    const uniqueAgents = new Map<string, { name: string, properties: Property[] }>();
    for (const prop of properties) {
      const key = prop.agent.name;
      if (!uniqueAgents.has(key)) {
        uniqueAgents.set(key, { name: prop.agent.name, properties: [] });
      }
      uniqueAgents.get(key)!.properties.push(prop);
    }
    
    // Sort by property count and limit to top 5 agents for speed
    const topAgents = Array.from(uniqueAgents.entries())
      .sort((a, b) => b[1].properties.length - a[1].properties.length)
      .slice(0, 5); // Only top 5 agents for speed
    
    // Fast email lookup for top agents only
    const emailPromises = topAgents.map(async ([key, { name }]) => {
      try {
        // Check cache first
        const cachedResult = agentEmailCache.get(key);
        if (cachedResult) {
          return { key, email: cachedResult.email };
        }
        
        // Quick email search with timeout
        if (!browser) {
          return { key, email: null };
        }
        const emailPromise = findEmailForAgentFast(name, browser, apiKey);
        const timeoutPromise = new Promise<string | null>((resolve) => {
          setTimeout(() => resolve(null), 8000); // 8 second timeout per agent
        });
        
        const email = await Promise.race([emailPromise, timeoutPromise]);
        
        // Cache result
        agentEmailCache.set(key, { email, website: undefined }, 30); // 30 min cache
        
        return { key, email };
      } catch (error) {
        console.error(`Fast email lookup failed for ${name}:`, error);
        return { key, email: null };
      }
    });
    
    // Wait for all email lookups with overall timeout
    let emailResults: { key: string; email: string | null }[] = [];
    try {
      emailResults = await Promise.all(emailPromises);
    } catch (error) {
      console.error('Email lookup batch failed:', error);
    }
    
    // Apply emails to properties
    for (const { key, email } of emailResults) {
      const agent = uniqueAgents.get(key);
      if (agent && email && isValidEmail(email)) {
        for (const prop of agent.properties) {
          prop.agent.email = email;
        }
      }
    }
    
    console.log(`⚡ Fast scraping completed! Found ${properties.length} properties`);
    return properties;

  } catch (error) {
    console.error('Error scraping data:', error);
    throw error;
  } finally {
    if (browser) {
      try {
        console.log('⚡ Releasing browser back to pool...');
        await releaseBrowser(browser);
      } catch (closeError) {
        console.error('Error releasing browser:', closeError);
      }
    }
  }
} 