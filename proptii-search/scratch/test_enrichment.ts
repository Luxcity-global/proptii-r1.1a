
import { AgentEnrichmentService } from '../src/core/services/AgentEnrichmentService';
import * as dotenv from 'dotenv';
dotenv.config();

async function testEnrichment() {
  const service = new AgentEnrichmentService();
  
  const mockProperties = [
    {
      title: "Test Property",
      agent: { name: "Foxtons Islington" },
      source: "Rightmove",
      url: "https://example.com"
    },
    {
      title: "Test Property 2",
      agent: { name: "Dexters London" },
      source: "OnTheMarket",
      url: "https://example.com"
    }
  ];

  console.log("--- Starting Enrichment Test ---");
  const results = await service.enrichAndFilter(mockProperties);
  
  console.log("Results after enrichment:");
  console.log(JSON.stringify(results, null, 2));

  if (results.length > 0) {
    console.log("SUCCESS: Enriched at least one agent.");
  } else {
    console.log("WARNING: No agents enriched. Check Brave API key and search logic.");
  }
}

testEnrichment();
