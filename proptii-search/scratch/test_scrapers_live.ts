import { RightmoveScraper } from './src/integrations/scrapers/RightmoveScraper';
import { OnTheMarketScraper } from './src/integrations/scrapers/OnTheMarketScraper';

async function run() {
  const query = "3 bedroom houses for sale in Manchester under 400k";
  
  console.log("--- RIGHTMOVE ---");
  const rm = new RightmoveScraper();
  try {
    const rmRes = await rm.scrape(query, {});
    console.log(`Rightmove found: ${rmRes.length}`);
  } catch (e) {
    console.log("Rightmove error:", e);
  }

  console.log("--- ONTHEMARKET ---");
  const otm = new OnTheMarketScraper();
  try {
    const otmRes = await otm.scrape(query, {});
    console.log(`OnTheMarket found: ${otmRes.length}`);
  } catch (e) {
    console.log("OnTheMarket error:", e);
  }
}
run();
