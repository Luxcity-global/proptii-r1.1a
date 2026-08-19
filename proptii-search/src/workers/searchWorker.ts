import { Worker, Job } from 'bullmq';
import { connection as redis } from '../infrastructure/queue';
import { ScraperManager } from '../integrations/ScraperManager';

const scraperManager = new ScraperManager();

export const searchWorker = new Worker('search-tasks', async (job: Job) => {
  const { query, filters } = job.data;
  console.log(`[Worker] Processing search job: ${query}`);

  try {
    const results = await scraperManager.scrapeAll(query, filters, async (provider, providerResults) => {
      console.log(`[Worker] Found ${providerResults.length} properties from ${provider}. Publishing...`);

      const channel = `search:events:${query.toLowerCase().trim()}`;
      try {
        await redis.publish(channel, JSON.stringify({
          type: 'results',
          provider,
          data: providerResults
        }));
      } catch (e) {
        // Redis offline fallback
      }
    });
    
    if (results.length > 0) {
      const cacheKey = `search:${query.toLowerCase().trim()}`;
      const metaKey = `meta:${cacheKey}`;
      
      try {
        await redis.set(cacheKey, JSON.stringify(results), 'EX', 86400); // 24h
        await redis.set(metaKey, JSON.stringify({ timestamp: Date.now() }), 'EX', 86400);
      } catch (e) {
        // Redis offline fallback
      }
      
      console.log(`[Worker] Final sync completed for: ${query}`);
    }
  } catch (err) {
    console.error(`[Worker] Error processing job ${job.id}:`, err);
    throw err;
  }
}, { connection: redis });

searchWorker.on('completed', (job: Job) => console.log(`[Worker] Job ${job.id} completed`));
searchWorker.on('failed', (job: Job | undefined, err: Error) => console.error(`[Worker] Job ${job?.id} failed:`, err));
searchWorker.on('error', (err) => {
  // worker connection error fallback
});
