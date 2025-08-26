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

async function scrapeEmailsFromWebsite(url: string, browser: Browser): Promise<string[]> {
  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const content = await page.content();
    const emails = content.match(EMAIL_REGEX);
    const emailList = emails ? Array.from(new Set(emails)) : [];
    
    // Use enhanced prioritization
    return prioritizeEmails(emailList);
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
    `${companyName} UK real estate agency`,
    `${companyName} UK estate agents`,
    `${companyName} UK letting agents`,
    `${companyName} UK property agency`,
    `${companyName} estate agents UK`,
    `${companyName} lettings UK`,
    `${companyName} property management UK`,
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
                             'instagram.com', 'google.com', 'bing.com', 'trustpilot.com', 'yell.com'];
          
          if (skipDomains.some(domain => link.includes(domain))) {
            continue;
          }
          
          // Calculate match score based on multiple factors
          let matchScore = 0;
          
          // High score: exact company name match in domain (no spaces)
          if (link.includes(companyNameLower.replace(/\s+/g, ''))) {
            matchScore += 10;
          }
          
          // High score: company name with separators in domain
          if (link.includes(companyNameLower.replace(/\s+/g, '-')) || 
              link.includes(companyNameLower.replace(/\s+/g, '.'))) {
            matchScore += 9;
          }
          
          // Medium score: multiple company words in domain
          const wordsInDomain = companyWords.filter(word => link.includes(word)).length;
          if (wordsInDomain >= 2) {
            matchScore += wordsInDomain * 3;
          }
          
          // Medium score: company name in title
          if (title.includes(companyNameLower)) {
            matchScore += 5;
          }
          
          // Low score: company words in title or description
          const wordsInContent = companyWords.filter(word => 
            title.includes(word) || description.includes(word)
          ).length;
          matchScore += wordsInContent;
          
          // Bonus for real estate related content
          const realEstateTerms = ['estate', 'letting', 'property', 'real estate', 'agents', 'lettings'];
          if (realEstateTerms.some(term => title.includes(term) || description.includes(term))) {
            matchScore += 2;
          }
          
          // Return first result with high confidence match
          if (matchScore >= 8) {
            console.log(`Found company website for ${companyName}: ${link} (score: ${matchScore})`);
            return link;
          }
        }
        
        // If no high-confidence match found, don't return any website
        return null;
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

async function searchEmailWithBraveAPI(companyName: string, apiKey: string): Promise<string[]> {
  // More targeted search queries for real estate emails
  const searchQueries = [
    `${companyName} UK real estate lettings email`,
    `${companyName} UK real estate enquiries email`,
    `${companyName} UK real estate contact email`,
    `${companyName} UK real estate info email`,
    `${companyName} UK real estate office email`,
    `${companyName} UK real estate rental email`,
    `${companyName} UK real estate property email`
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
      
      // Add a longer delay between requests to be respectful to the API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error: any) {
      console.error(`Error searching for query "${query}":`, error.message);
      
      // If we hit rate limit, wait longer before next request
      if (error.response && error.response.status === 429) {
        console.log('Rate limit hit, waiting 5 seconds...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
  
  // If no results from targeted queries, try a simpler approach
  if (allEmails.length === 0) {
    console.log('No results from targeted queries, trying simpler search...');
    try {
      const simpleQuery = `${companyName} UK real estate contact`;
      const response = await axios.get('https://api.search.brave.com/res/v1/web/search', {
        params: {
          q: simpleQuery,
          count: 5
        },
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': apiKey
        }
      });
      
      if (response.data.web && response.data.web.results) {
        const results = response.data.web.results.map((r: any) => (r.description || '') + ' ' + (r.url || '')).join(' ');
        const emails = results.match(EMAIL_REGEX);
        if (emails) {
          allEmails.push(...emails);
        }
      }
    } catch (error: any) {
      console.error('Simple search also failed:', error.message);
    }
  }
  
  // Remove duplicates and use enhanced prioritization
  const uniqueEmails = Array.from(new Set(allEmails));
  return prioritizeEmails(uniqueEmails);
}

async function findEmailForAgent(agentName: string, website: string | undefined, browser: Browser, apiKey: string): Promise<{ email: string | null, website?: string }> {
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
  
  // Clean up company name - remove common suffixes and prefixes
  companyName = companyName
    .replace(/\s+(Ltd|Limited|LLP|PLC|Inc|Corp|Corporation)\s*$/i, '')
    .replace(/^The\s+/i, '')
    .replace(/\s+and\s+/gi, ' & ')
    .trim();
  
  console.log(`Looking for email for company: ${companyName} UK real estate contact email`);

  // 1. Try website (if available)
  if (website) {
    console.log(`Trying website: ${website}`);
    let emails = await scrapeEmailsFromWebsite(website, browser);
    if (emails.length > 0) {
      console.log(`Found emails on website: ${emails[0]}`);
      return { email: emails[0], website };
    }
    // Try various contact-related paths
    for (const path of ['/contact', '/about', '/contact-us', '/about-us', '/enquiries', '/enquiry', '/lettings', '/rentals']) {
      try {
        const url = website.endsWith('/') ? website + path.slice(1) : website + path;
        emails = await scrapeEmailsFromWebsite(url, browser);
        if (emails.length > 0) {
          console.log(`Found emails on ${path}: ${emails[0]}`);
          return { email: emails[0], website };
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
      return { email: emails[0], website: companyWebsite };
    }
    // Try various contact-related paths on company website
    for (const path of ['/contact', '/about', '/contact-us', '/about-us', '/enquiries', '/enquiry', '/lettings', '/rentals']) {
      try {
        const url = companyWebsite.endsWith('/') ? companyWebsite + path.slice(1) : companyWebsite + path;
        emails = await scrapeEmailsFromWebsite(url, browser);
        if (emails.length > 0) {
          console.log(`Found emails on company website ${path}: ${emails[0]}`);
          return { email: emails[0], website: companyWebsite };
        }
      } catch {}
    }
  }

  // 3. Fallback to Brave API email search
  console.log(`Searching for email via Brave API: ${companyName} UK real estate contact email`);
  const emails = await searchEmailWithBraveAPI(companyName, apiKey);
  if (emails.length > 0) {
    console.log(`Found email via Brave API: ${emails[0]}`);
    return { email: emails[0], website: companyWebsite || undefined };
  }
  
  console.log(`No email found for: ${companyName} UK real estate contact email`);
  return { email: null, website: companyWebsite || undefined };
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
                    email: 'Contact via website',
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
      const launchOptions: LaunchOptions = {
        headless: true,
        timeout: 60000, // Increased timeout
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
          filtered.push(prop); // keep Facebook regardless of email
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

        if (hasInlineEmail) {
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
        if (found && found.email) {
          prop.agent.email = found.email;
          if (found.website) prop.agent.website = found.website;
          filtered.push(prop);
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
    let agentEmail = 'Contact via website';
    const emailMatch = $('body').text().match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) {
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

export async function scrape(url: string, apiKey: string): Promise<Property[]> {
  const properties: Property[] = [];
  let browser: Browser | undefined;
  const agentEmailCache: Record<string, { email: string | null, website?: string | null }> = {};

  try {
    // Clean up and validate the URL
    const cleanUrl = url.replace(/manchester-under/, 'manchester');
    console.log('Original URL:', url);
    console.log('Cleaned URL:', cleanUrl);
    
    console.log('Launching browser...');
    // Launch browser with more robust error handling and Windows-specific fixes
    const launchOptions: LaunchOptions = {
      headless: true,
      timeout: 60000, // Increased timeout
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

    console.log('Creating new page...');
    const page = await browser!.newPage();

    // Set viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    // Set default timeout for all operations
    page.setDefaultTimeout(30000); // Reduced from 60000 to 30000
    page.setDefaultNavigationTimeout(30000); // Reduced from 60000 to 30000

    console.log('Navigating to URL...');
    // Navigate to URL with retry logic
    let retries = 3;
    while (retries > 0) {
      try {
        await page.goto(cleanUrl, {
          waitUntil: 'networkidle0',
          timeout: 60000
        });
        break;
      } catch (error) {
        console.error(`Navigation failed, retries left: ${retries - 1}`, error);
        retries--;
        if (retries === 0) throw error;
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds before retry
      }
    }

    console.log('Waiting for property cards or no-results message...');
    // Wait for either property cards or a no-results message
    await Promise.race([
      page.waitForSelector('.otm-PropertyCard', { timeout: 60000 }).catch(() => null),
      page.waitForSelector('.otm-ResultCount, .no-results-message', { timeout: 60000 }).catch(() => null)
    ]);

    console.log('Scrolling to load all images...');
    // Scroll down to trigger lazy loading of images
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

    console.log('Triggering image carousels...');
    // Try to trigger image carousels or galleries to load more images
    try {
      await page.evaluate(() => {
        return new Promise((resolve) => {
          // Look for common carousel/gallery controls and hover over them
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
              // Move to property cards
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

    console.log('Getting page content...');
    // Get page content
    const content = await page.content();
    const $ = cheerio.load(content);
    
    console.log('Page title:', $('title').text());

    // Find all property cards
    const propertyCards = $('.otm-PropertyCard');
    console.log(`Found ${propertyCards.length} property cards`);

    if (propertyCards.length === 0) {
      console.log('No property cards found. Returning empty array.');
      return [];
    }

    propertyCards.each((_i, el) => {
          try {
            const $el = $(el);
            
        const title = $el.find('.otm-PropertyCardInfo .title').text().trim();
        const price = $el.find('.otm-Price').text().trim();
        const location = $el.find('.address').text().trim();
        
        // Extract bedrooms more accurately
        let bedrooms = 'Not specified';
        const bedBathText = $el.find('.otm-BedBathCount').text().trim();
        const titleText = title.toLowerCase();
        const allText = (title + ' ' + bedBathText).toLowerCase();
        
        // Debug logging
        console.log('Raw bedBathText:', bedBathText);
        console.log('Title text:', titleText);
        console.log('All text for bedroom extraction:', allText);
        
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
        
        console.log('Extracted bedrooms:', bedrooms);
        
        const propertyType = $el.find('.otm-PropertyCardInfo .property-type').text().trim();
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
        
        // Extract agent information - look for the full agent text
        const agentText = $el.find('.otm-PropertyCardAgent').text().trim();
        console.log('Raw agent text:', agentText);
        
        // Extract company name from agent text (look for "Marketed by" pattern)
        // Format: "Marketed by Company Name - Location Phone Email"
        let companyMatch = agentText.match(/Marketed by\s+([^-]+?)(?:\s*-\s*|$)/i);
        if (!companyMatch) {
          // Fallback: try to extract any text that looks like a company name
          companyMatch = agentText.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
        }
        const agentName = companyMatch ? companyMatch[1].trim() : agentText;
        
        // Don't extract website from property cards as they're internal links
        // We'll find the actual company website using Serp API later
        let agentWebsite = undefined;

            if (title || price) {
              properties.push({
                title: title || 'No Title Available',
                price: price || 'Price on Application',
                location: location || 'Location not specified',
                bedrooms: bedrooms || 'Not specified',
                propertyType: propertyType || 'Property',
                imageUrls: validImageUrls,
                agent: {
                  name: agentName || 'Agent information not available',
                  email: '', // Will fill later
                  website: agentWebsite
                }
              });
              console.log('Added property:', {
            title,
            price,
            location,
            bedrooms,
            imageUrls: validImageUrls.length > 0 ? `Found ${validImageUrls.length} images` : 'No images found'
              });
            }
          } catch (itemError) {
            console.error('Error processing property item:', itemError);
          }
        });

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
      .slice(0, 10); // Limit to top 10 agents to avoid rate limits
    
    // Lookup emails for each unique agent
    for (const [key, { name, website }] of sortedAgents) {
      console.log(`Processing agent: ${name}`);
      if (browser) {
        const result = await findEmailForAgent(name, website, browser, apiKey);
        agentEmailCache[key] = { email: result.email, website: result.website };
      } else {
        agentEmailCache[key] = { email: null, website: null };
      }
    }
    // Fill in emails for each property and filter out those without emails
    const propertiesWithEmails: Property[] = [];
    for (const prop of properties) {
      const key = prop.agent.name; // Use just the company name as key
      const email = agentEmailCache[key]?.email;
      
      // Only include properties that have a valid email (not null, not 'Not found')
      if (email && email !== 'Not found' && email !== null) {
        prop.agent.email = email;
        // Update website if found
        if (agentEmailCache[key]?.website && agentEmailCache[key]?.website !== null) {
          prop.agent.website = agentEmailCache[key]?.website || undefined;
        }
        propertiesWithEmails.push(prop);
      }
    }
    console.log(`Successfully scraped ${propertiesWithEmails.length} properties with emails (out of ${properties.length} total)`);
    return propertiesWithEmails;

  } catch (error) {
    console.error('Error scraping data:', error);
    throw error;
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
} 