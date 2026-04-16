
import { RightmoveScraper } from '../src/integrations/scrapers/RightmoveScraper';
import { OnTheMarketScraper } from '../src/integrations/scrapers/OnTheMarketScraper';

// Mock a minimal environment if needed, but these scrapers use fetch which is available in Node 18+

async function testScrapers() {
  const rm = new RightmoveScraper();
  const otm = new OnTheMarketScraper();

  const query = "2 bed flat in London under £2000 pcm";
  
  console.log("--- Testing Rightmove ---");
  try {
    const rmResults = await rm.scrape(query, {});
    console.log(`Rightmove found ${rmResults.length} properties.`);
    if (rmResults.length > 0) {
      console.log("First Result:", JSON.stringify(rmResults[0], null, 2));
    }
  } catch (e) {
    console.error("Rightmove failed:", e);
  }

  console.log("\n--- Testing OnTheMarket ---");
  try {
    const otmResults = await otm.scrape(query, {});
    console.log(`OnTheMarket found ${otmResults.length} properties.`);
    if (otmResults.length > 0) {
      console.log("First Result:", JSON.stringify(otmResults[0], null, 2));
    }
  } catch (e) {
    console.error("OnTheMarket failed:", e);
  }
}

testScrapers();
