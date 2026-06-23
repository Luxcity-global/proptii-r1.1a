import { Worker, Job } from 'bullmq';
import { connection as redis } from '../infrastructure/queue';
import { ScraperManager } from '../integrations/ScraperManager';
// Note: Property model intentionally not imported here.
// Scraped properties are only persisted to MongoDB when a tenant sends a message.
// See: api/src/shared/services/ConversationService.ts -> getOrCreateConversation()

const scraperManager = new ScraperManager();

export const searchWorker = new Worker('search-tasks', async (job: Job) => {
  const { query, filters } = job.data;
  console.log(`[Worker] Processing search job: ${query}`);

  try {
    const results = await scraperManager.scrapeAll(query, filters, async (provider, providerResults) => {
      console.log(`[Worker] Found ${providerResults.length} properties from ${provider}. Publishing...`);

      // Publish to Redis for real-time SSE — scraped properties are NOT saved to
      // MongoDB here. They are persisted on-demand when a tenant sends a message.
      // See ConversationService.getOrCreateConversation() for the upsert logic.
      const channel = `search:events:${query.toLowerCase().trim()}`;
      await redis.publish(channel, JSON.stringify({
        type: 'results',
        provider,
        data: providerResults
      }));
    });
    
    if (results.length > 0) {
      // Final cache update for the whole set
      const cacheKey = `search:${query.toLowerCase().trim()}`;
      const metaKey = `meta:${cacheKey}`;
      
      await redis.set(cacheKey, JSON.stringify(results), 'EX', 86400); // 24h
      await redis.set(metaKey, JSON.stringify({ timestamp: Date.now() }), 'EX', 86400);
      
      console.log(`[Worker] Final sync completed for: ${query}`);
    }
  } catch (err) {
    console.error(`[Worker] Error processing job ${job.id}:`, err);
    throw err;
  }
}, { connection: redis });

searchWorker.on('completed', (job: Job) => console.log(`[Worker] Job ${job.id} completed`));
searchWorker.on('failed', (job: Job | undefined, err: Error) => console.error(`[Worker] Job ${job?.id} failed:`, err));
