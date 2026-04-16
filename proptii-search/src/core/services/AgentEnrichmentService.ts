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
    console.log(`[Enrichment] Starting enrichment for ${properties.length} properties...`);
    
    // Process in parallel to maintain speed
    const enrichedResults = await Promise.all(
      properties.map(async (p) => {
        try {
          const enriched = await this.enrichSingle(p);
          if (enriched?.agent?.email) {
            console.log(`[Enrichment] ✅ Found email for ${p.agent.name}: ${enriched.agent.email}`);
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
    
    console.log(`[Enrichment] Summary: ${filtered.length}/${properties.length} listings kept.`);
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
    console.log(`[Enrichment] Starting streaming enrichment for ${properties.length} properties...`);
    
    // Process in parallel with concurrency limit (optional, but Promise.all is fine for batches of 25-50)
    await Promise.all(
      properties.map(async (p) => {
        try {
          const enriched = await this.enrichSingle(p);
          if (enriched) {
            console.log(`[Enrichment] ✅ Streaming enriched result for ${p.agent?.name || 'Unknown'}`);
            onResult(enriched);
          }
        } catch (e) {
          console.warn(`[Enrichment] ❌ Failed for ${p.agent.name}`);
        }
      })
    );
    
    console.log(`[Enrichment] Streaming enrichment finished.`);
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
        params: { q: `${agencyName} estate agents official website UK`, count: 3 },
        headers: { 
          'X-Subscription-Token': this.apiKey,
          'Accept': 'application/json'
        }
      });

      const results = searchRes.data?.web?.results || [];
      const website = this.pickBestWebsite(results, agencyName);
      
      if (!website) return { email: null };

      // Step B: Scrape Website for Emails
      const email = await this.scrapeEmail(website);
      return { email, website };

    } catch (err: any) {
      // Log error silently unless required
      return { email: null };
    }
  }

  private pickBestWebsite(results: any[], agencyName: string): string | null {
    const skip = ['rightmove.co.uk', 'zoopla.co.uk', 'onthemarket.com', 'openrent.co.uk', 'facebook.com'];
    const nameLower = agencyName.toLowerCase();

    for (const res of results) {
      const url = res.url.toLowerCase();
      if (skip.some(s => url.includes(s))) continue;
      
      // Heuristic: URL contains agency name
      const nameSlug = nameLower.replace(/\s+/g, '');
      if (url.includes(nameSlug)) return res.url;
    }
    
    return results[0]?.url || null;
  }

  private async scrapeEmail(url: string): Promise<string | null> {
    try {
      const res = await axios.get(url, { timeout: 5000, headers: { 'User-Agent': 'Mozilla/5.0' } });
      const html = res.data;
      const $ = cheerio.load(html);
      
      // 1. Search for mailto links
      const mailto = $('a[href^="mailto:"]').first().attr('href');
      if (mailto) return mailto.replace('mailto:', '').split('?')[0];

      // 2. Regex fallback on text - improved to avoid false positives like @2x.png
      const emailRegex = /\b[a-zA-Z0-9._%+-]+@(?!(?:sentry|example|test|2x)\.)[a-zA-Z0-9.-]+\.(?!png|jpg|jpeg|gif|webp|svg)[a-zA-Z]{2,}\b/gi;
      const matches = html.match(emailRegex);
      if (matches) {
        // Prioritize common business emails
        const best = matches.find((e: string) => 
          e.toLowerCase().includes('lettings') || 
          e.toLowerCase().includes('info') || 
          e.toLowerCase().includes('enquiries') ||
          e.toLowerCase().includes('hello')
        );
        return best || matches[0];
      }

      return null;
    } catch (err) {
      return null;
    }
  }

  private cleanAgencyName(name: string): string {
    return name
      .replace(/Marketed by/i, '')
      .replace(/-.*/, '')
      .trim();
  }
}
