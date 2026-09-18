import axios from 'axios';
import { connection as redis } from '../../infrastructure/queue';
import * as cheerio from 'cheerio';
import { AgencyPatternEngine } from './AgencyPatternEngine';

const ENRICH_CACHE_TTL = 86400 * 7; // 7 days

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
   * STRICT MODE: Strictly drops any property where a valid email could NOT be found.
   * Returns only properties with a verified non-empty agent.email.
   */
  async enrichStrict(properties: any[]): Promise<any[]> {
    console.log(`[Enrichment] Running STRICT email enrichment for ${properties.length} properties...`);

    const enrichedList = await Promise.all(
      properties.map(async (p) => {
        try {
          return await this.enrichSingle(p);
        } catch (e) {
          console.warn(`[Enrichment] ❌ Failed for ${p.agent?.name || 'Unknown'}:`, e);
          return null;
        }
      })
    );

    const strictList = enrichedList.filter(
      p => p && p.agent?.email && typeof p.agent.email === 'string' && p.agent.email.includes('@')
    );

    console.log(`[Enrichment] STRICT summary: ${strictList.length}/${properties.length} listings kept with verified email.`);
    return strictList;
  }

  /**
   * Backward compatible enrichAndFilter
   */
  async enrichAndFilter(properties: any[]): Promise<any[]> {
    return this.enrichStrict(properties);
  }

  /**
   * Enriches properties and triggers a callback for each successful one.
   */
  async enrichAndStream(
    properties: any[], 
    onResult: (p: any) => void
  ): Promise<void> {
    console.log(`[Enrichment] Starting streaming enrichment for ${properties.length} properties...`);

    await Promise.all(
      properties.map(async (p) => {
        try {
          const enriched = await this.enrichSingle(p);
          if (enriched?.agent?.email && enriched.agent.email.includes('@')) {
            console.log(`[Enrichment] ✅ Streaming enriched result for ${p.agent?.name || 'Unknown'} (${enriched.agent.email})`);
            onResult(enriched);
          } else {
            console.log(`[Enrichment] ⏭️ Skipping ${p.agent?.name || 'Unknown'} (No email found)`);
          }
        } catch (e) {
          console.warn(`[Enrichment] ❌ Failed for ${p.agent?.name || 'Unknown'}`);
        }
      })
    );

    console.log(`[Enrichment] Streaming enrichment finished.`);
  }

  public async enrichSingle(property: any): Promise<any | null> {
    // 1. If property already has a valid email, return as-is
    if (property.agent?.email && typeof property.agent.email === 'string' && property.agent.email.includes('@')) {
      return property;
    }

    // 2. Check property description/summary for raw email
    const textToScan = `${property.description || ''} ${property.summary || ''} ${property.title || ''}`;
    const directEmailMatch = textToScan.match(/\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/i);
    if (directEmailMatch) {
      const email = directEmailMatch[0];
      // Filter out dummy/noise domains
      if (!email.match(/@(sentry|example|test|2x|graphics|schema|w3)\./i) && !email.match(/\.(png|jpg|jpeg|gif|svg)$/i)) {
        console.log(`[Enrichment] 🎯 Found direct email in listing text: ${email}`);
        return { ...property, agent: { ...property.agent, email } };
      }
    }

    const agencyName = this.cleanAgencyName(property.agent?.name);
    if (!agencyName) return property;

    // 3. Check AgencyPatternEngine (Top 50 UK agency chain patterns - instantaneous <1ms)
    const patternResult = AgencyPatternEngine.resolvePatternEmail(
      property.agent?.name || agencyName, 
      property.town || property.city || property.location
    );
    if (patternResult?.email) {
      console.log(`[Enrichment] ⚡ Pattern Engine matched ${agencyName}: ${patternResult.email}`);
      return { 
        ...property, 
        agent: { 
          ...property.agent, 
          email: patternResult.email, 
          website: property.agent?.website || patternResult.website 
        } 
      };
    }

    // 4. Check Redis Cache
    const cacheKey = `agent_contact:${agencyName.toLowerCase().replace(/\s+/g, '_')}`;
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        const contact = JSON.parse(cached);
        if (contact.email) {
          return { ...property, agent: { ...property.agent, ...contact } };
        }
      }
    } catch (e) {
      console.warn(`[Enrichment] Redis error:`, e);
    }

    // 5. Live Search Engine & Web Scraping (Brave Search API)
    try {
      const contact = await this.discoverContact(agencyName);
      if (contact.email) {
        // Save valid found contact to Cache
        await redis.set(cacheKey, JSON.stringify(contact), 'EX', ENRICH_CACHE_TTL);
        return { ...property, agent: { ...property.agent, ...contact } };
      }
    } catch (err) {
      console.error(`[Enrichment] Discovery failed for ${agencyName}:`, err);
    }

    return property;
  }

  private async discoverContact(agencyName: string): Promise<AgentContact> {
    console.log(`[Enrichment] Discovering contact for: "${agencyName}"`);
    if (!this.apiKey) {
      console.warn('[Enrichment] BRAVE_API_KEY missing');
      return { email: null };
    }

    try {
      // Step A: Search for agency contact / lettings email directly
      const searchRes = await axios.get('https://api.search.brave.com/res/v1/web/search', {
        params: { 
          q: `"${agencyName}" estate agent UK ("lettings email" OR "contact email" OR "@")`, 
          count: 3 
        },
        headers: { 
          'X-Subscription-Token': this.apiKey,
          'Accept': 'application/json'
        },
        timeout: 4000
      });

      const results = searchRes.data?.web?.results || [];
      console.log(`[Enrichment] Brave found ${results.length} results for "${agencyName}"`);

      // Step B: Check search snippets for direct email matches
      for (const item of results) {
        const snippetText = `${item.title || ''} ${item.description || ''}`;
        const snippetEmails = snippetText.match(/\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g);
        if (snippetEmails) {
          const valid = snippetEmails.find(e => 
            !e.match(/@(sentry|example|test|2x|graphics|schema|w3)\./i) &&
            !e.match(/\.(png|jpg|jpeg|gif|svg)$/i)
          );
          if (valid) {
            console.log(`[Enrichment] 🔍 Discovered email directly in search snippet: ${valid}`);
            return { email: valid, website: item.url };
          }
        }
      }

      // Step C: Scrape official agency website
      const website = this.pickBestWebsite(results, agencyName);
      if (!website) return { email: null };

      let email = await this.scrapeEmail(website);

      // Step D: If home page has no email, inspect contact page
      if (!email && website) {
        const contactUrl = website.endsWith('/') ? `${website}contact` : `${website}/contact`;
        email = await this.scrapeEmail(contactUrl);
      }

      console.log(`[Enrichment] Final email for ${agencyName}: ${email || 'NOT_FOUND'}`);
      return { email, website };

    } catch (err: any) {
      console.error(`[Enrichment] Discovery error for ${agencyName}:`, err?.message || err);
      return { email: null };
    }
  }

  private pickBestWebsite(results: any[], agencyName: string): string | null {
    const skip = [
      'rightmove.co.uk', 'zoopla.co.uk', 'onthemarket.com', 'openrent.co.uk',
      'facebook.com', 'linkedin.com', 'twitter.com', 'instagram.com', 'youtube.com',
      'yell.com', 'trustpilot.com', 'checkatrade.com'
    ];
    const nameLower = agencyName.toLowerCase();
    const nameSlug = nameLower.replace(/\s+/g, '');

    const filtered = results.filter(res => {
      const url = res.url?.toLowerCase() || '';
      return !skip.some(s => url.includes(s));
    });

    if (filtered.length === 0) return null;

    for (const res of filtered) {
      const url = res.url.toLowerCase();
      if (url.includes(nameSlug)) return res.url;
    }

    return filtered[0].url;
  }

  private decodeCfEmail(encoded: string): string {
    try {
      const k = parseInt(encoded.substr(0, 2), 16);
      let email = '';
      for (let n = 2; n < encoded.length; n += 2) {
        email += String.fromCharCode(parseInt(encoded.substr(n, 2), 16) ^ k);
      }
      return email;
    } catch {
      return '';
    }
  }

  private async scrapeEmail(url: string): Promise<string | null> {
    try {
      const res = await axios.get(url, { 
        timeout: 4000,
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-GB,en-US;q=0.9'
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

      // 2. Decode Cloudflare obfuscated email if present
      const cfMatch = $('[data-cfemail]').first().attr('data-cfemail') || 
                      $('a[href*="email-protection#"]').first().attr('href')?.split('#')[1];
      if (cfMatch) {
        const decoded = this.decodeCfEmail(cfMatch);
        if (decoded && decoded.includes('@')) {
          console.log(`[Enrichment] 🔓 Decoded Cloudflare email: ${decoded}`);
          return decoded;
        }
      }

      // 3. Regex fallback on text
      const emailRegex = /\b[a-zA-Z0-9._%+-]+@(?!(?:sentry|example|test|2x|graphics|schema|w3)\.)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/gi;
      const matches = html.match(emailRegex);
      if (matches) {
        const filtered = matches.filter(e => !e.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i));

        const best = filtered.find((e: string) => 
          e.toLowerCase().includes('lettings') || 
          e.toLowerCase().includes('info') || 
          e.toLowerCase().includes('enquiries') || 
          e.toLowerCase().includes('hello') ||
          e.toLowerCase().includes('sales')
        );
        return best || filtered[0] || null;
      }

      return null;
    } catch (err: any) {
      console.warn(`[Enrichment] Scrape failed for ${url}: ${err?.message || err}`);
      return null;
    }
  }

  private cleanAgencyName(name: string): string {
    if (!name || typeof name !== 'string') return '';
    return name
      .replace(/Marketed by/i, '')
      .replace(/\(.*\)/g, '')
      .replace(/,.*/g, '')
      .replace(/-.*/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
