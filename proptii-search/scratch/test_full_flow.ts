
import { RightmoveScraper } from '../src/integrations/scrapers/RightmoveScraper';
import { OnTheMarketScraper } from '../src/integrations/scrapers/OnTheMarketScraper';
import { AgentEnrichmentService } from '../src/core/services/AgentEnrichmentService';
import * as dotenv from 'dotenv';
dotenv.config();

async function fullFlowTest() {
  const rm = new RightmoveScraper();
  const otm = new OnTheMarketScraper();
  const enrichment = new AgentEnrichmentService();

  const query = "2 bed flat in London under £2000 pcm";
  
  console.log("1. Scraping Rightmove...");
  const rmResults = await rm.scrape(query, {});
  
  console.log("2. Scraping OnTheMarket...");
  const otmResults = await otm.scrape(query, {});
  
  const allResults = [...rmResults.slice(0, 5), ...otmResults.slice(0, 5)];
  console.log(`3. Total properties to enrich: ${allResults.length}`);

  console.log("4. Enriching and Filtering...");
  const finalResults = await enrichment.enrichAndFilter(allResults);

  console.log(`\n--- Final Results (${finalResults.length}) ---`);
  finalResults.forEach((p, i) => {
    console.log(`${i+1}. ${p.title} - ${p.agent.name} (${p.agent.email})`);
  });
}

fullFlowTest();
