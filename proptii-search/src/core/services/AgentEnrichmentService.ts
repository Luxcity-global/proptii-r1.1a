import axios from 'axios';
import { connection as redis } from '../../infrastructure/queue';
import * as cheerio from 'cheerio';

const ENRICH_CACHE_TTL = 86400; // 24 hours
// Removed top-level BRAVE_API_KEY assignment to avoid race condition with dotenv

export interface AgentContact {
  email: string | null;
  website?: string;
  phone?: string;
}

export class AgentEnrichmentService {
  private get apiKey() {
    return process.env.BRAVE_API_KEY;
  }
  /**
   * Enriches a list of properties with agent emails.
   * Only returns properties where an email was successfully found.
   */
  async enrichAndFilter(properties: any[]): Promise<any[]> {
    
    // Process in parallel to maintain speed
    const enrichedResults = await Promise.all(
      properties.map(async (p) => {
        try {
          const enriched = await this.enrichSingle(p);
          if (enriched?.agent?.email) {
          }
          return enriched;
        } catch (e) {
          console.warn(`[Enrichment] ❌ Failed for ${p.agent.name}`);
          return null;
        }
      })
    );

    // Strict filter: User wants ONLY results with email
    const filtered = enrichedResults.filter(p => p && p.agent.email);
    
    return filtered;
  }

  /**
   * Enriches properties and triggers a callback for each successful one.
   * Useful for SSE streaming to provide immediate user feedback.
   */
  async enrichAndStream(
    properties: any[], 
    onResult: (p: any) => void
  ): Promise<void> {
    
    // Process in parallel with concurrency limit (optional, but Promise.all is fine for batches of 25-50)
    await Promise.all(
      properties.map(async (p) => {
        try {
          const enriched = await this.enrichSingle(p);
          if (enriched?.agent?.email) {
            onResult(enriched);
          } else {
          }
        } catch (e) {
          console.warn(`[Enrichment] ❌ Failed for ${p.agent.name}`);
        }
      })
    );
    
  }

  private async enrichSingle(property: any): Promise<any | null> {
    const agencyName = this.cleanAgencyName(property.agent.name);
    if (!agencyName) return null;

    const cacheKey = `agent_contact:${agencyName.toLowerCase().replace(/\s+/g, '_')}`;
    
    // 1. Check Redis Cache
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        const contact = JSON.parse(cached);
        return { ...property, agent: { ...property.agent, ...contact } };
      }
    } catch (e) {
      console.warn(`[Enrichment] Redis error:`, e);
    }

    // 2. Perform Enrichment
    try {
      const contact = await this.discoverContact(agencyName);
      
      // Save to Cache
      await redis.set(cacheKey, JSON.stringify(contact), 'EX', ENRICH_CACHE_TTL);
      
      return { ...property, agent: { ...property.agent, ...contact } };
    } catch (err) {
      console.error(`[Enrichment] Failed for ${agencyName}:`, err);
      return property; 
    }
  }

  private async discoverContact(agencyName: string): Promise<AgentContact> {
    if (!this.apiKey) {
      console.warn('[Enrichment] BRAVE_API_KEY missing');
      return { email: null };
    }

    try {
      // Step A: Find Agency Website
      const searchRes = await axios.get('https://api.search.brave.com/res/v1/web/search', {
        params: { q: `${agencyName} estate agents official website UK`, count: 3 }, // Reduced count for speed
        headers: { 
          'X-Subscription-Token': this.apiKey,
          'Accept': 'application/json'
        }
      });

      const results = searchRes.data?.web?.results || [];
      
      const website = this.pickBestWebsite(results, agencyName);
      
      if (!website) return { email: null };

      // Step B: Scrape Website for Emails
      let email = await this.scrapeEmail(website);
      
      // Step C: Try contact page if home page fails
      if (!email && website) {
        const contactUrl = website.endsWith('/') ? `${website}contact` : `${website}/contact`;
        email = await this.scrapeEmail(contactUrl);
      }

      return { email, website };

    } catch (err: any) {
      console.error(`[Enrichment] Discovery error for ${agencyName}:`, err.message);
      return { email: null };
    }
  }

  private pickBestWebsite(results: any[], agencyName: string): string | null {
    const skip = ['rightmove.co.uk', 'zoopla.co.uk', 'onthemarket.com', 'openrent.co.uk', 'facebook.com', 'linkedin.com', 'twitter.com', 'instagram.com'];
    const nameLower = agencyName.toLowerCase();
    const nameSlug = nameLower.replace(/\s+/g, '');

    const filtered = results.filter(res => {
      const url = res.url.toLowerCase();
      return !skip.some(s => url.includes(s));
    });

    if (filtered.length === 0) return null;

    for (const res of filtered) {
      const url = res.url.toLowerCase();
      // Heuristic: URL contains agency name slug
      if (url.includes(nameSlug)) return res.url;
    }
    
    return filtered[0].url;
  }

  private async scrapeEmail(url: string): Promise<string | null> {
    try {
      const res = await axios.get(url, { 
        timeout: 5000, // Reduced from 8000
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9'
        } 
      });
      const html = res.data;
      if (typeof html !== 'string') return null;

      const $ = cheerio.load(html);
      
      // 1. Search for mailto links
      const mailto = $('a[href^="mailto:"]').first().attr('href');
      if (mailto) {
        const cleaned = mailto.replace('mailto:', '').split('?')[0].trim();
        if (cleaned && cleaned.includes('@')) return cleaned;
      }

      // 2. Regex fallback on text
      const emailRegex = /\b[a-zA-Z0-9._%+-]+@(?!(?:sentry|example|test|2x|graphics)\.)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/gi;
      const matches = html.match(emailRegex);
      if (matches) {
        // Filter out obvious noise
        const filtered = matches.filter(e => !e.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i));
        
        // Prioritize common business emails
        const best = filtered.find((e: string) => 
          e.toLowerCase().includes('lettings') || 
          e.toLowerCase().includes('info') || 
          e.toLowerCase().includes('enquiries') || 
          e.toLowerCase().includes('hello') ||
          e.toLowerCase().includes('sales')
        );
        return best || filtered[0];
      }

      return null;
    } catch (err: any) {
      console.warn(`[Enrichment] Scrape failed for ${url}: ${err.message}`);
      return null;
    }
  }


  private cleanAgencyName(name: string): string {
    return name
      .replace(/Marketed by/i, '')
      .replace(/\(.*\)/g, '') // Remove parentheses and content within
      .replace(/,.*/g, '')    // Remove after comma
      .replace(/-.*/g, '')    // Remove after dash
      .replace(/\s+/g, ' ')   // Normalize spaces
      .trim();
  }
}
