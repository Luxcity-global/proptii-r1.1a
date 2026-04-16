import { IScraper, PropertyData } from './Scraper';
import { RightmoveScraper } from './scrapers/RightmoveScraper';
import { OnTheMarketScraper } from './scrapers/OnTheMarketScraper';

const SCRAPER_TIMEOUT_MS = 60_000; 

export class ScraperManager {
  private scrapers: IScraper[] = [
    new RightmoveScraper(),
    new OnTheMarketScraper(),
  ];

  getProviderNames(): string[] {
    return this.scrapers.map(s => s.name);
  }

  async scrapeAll(
    query: string,
    filters: any,
    onResults?: (provider: string, data: PropertyData[]) => Promise<void> | void
  ): Promise<PropertyData[]> {
    console.log(`[ScraperManager] Starting scrape for: "${query}"`);

    const tasks = this.scrapers.map(scraper =>
      this.runWithTimeout(scraper, query, filters, onResults)
    );

    const settled = await Promise.allSettled(tasks);
    const flat: PropertyData[] = [];

    for (const result of settled) {
      if (result.status === 'fulfilled' && result.value.length > 0) {
        flat.push(...result.value);
      }
    }

    console.log(`[ScraperManager] Total: ${flat.length} properties across all providers`);
    return flat;
  }

  private async runWithTimeout(
    scraper: IScraper,
    query: string,
    filters: any,
    onResults?: (provider: string, data: PropertyData[]) => Promise<void> | void
  ): Promise<PropertyData[]> {
    console.log(`[ScraperManager] Running scraper: ${scraper.name}`);

    const timeout = new Promise<PropertyData[]>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${SCRAPER_TIMEOUT_MS}ms`)), SCRAPER_TIMEOUT_MS)
    );

    try {
      const results = await Promise.race([scraper.scrape(query, filters), timeout]);
      if (onResults && results.length > 0) {
        await onResults(scraper.name, results);
      }
      return results;
    } catch (err: any) {
      console.error(`[ScraperManager] Scraper "${scraper.name}" failed: ${err.message || err}`);
      if (onResults) onResults(scraper.name, []);
      return [];
    }
  }
}
