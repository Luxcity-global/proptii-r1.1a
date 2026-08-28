import { Worker, Job } from 'bullmq';
import { getBullMqConnection, getRedis } from '../infrastructure/redis';
import { ScraperManager } from '../integrations/ScraperManager';
import { persistProperties, type PersistableProperty } from '../utils/persistProperty';

const scraperManager = new ScraperManager();

export function startSearchWorker(): Worker | null {
  const connection = getBullMqConnection();
  if (!connection) {
    console.log('ℹ️ Search worker skipped — Redis not available');
    return null;
  }

  const redis = getRedis();
  const searchWorker = new Worker('search-tasks', async (job: Job) => {
    const { query, filters } = job.data;
    console.log(`[Worker] Processing search job: ${query}`);

    try {
      const results = await scraperManager.scrapeAll(query, filters, async (provider, providerResults) => {
        console.log(`[Worker] Found ${providerResults.length} properties from ${provider}. Publishing...`);

        const saved = await persistProperties(providerResults as unknown as PersistableProperty[]);
        const channel = `search:events:${query.toLowerCase().trim()}`;
        await redis.publish(
          channel,
          JSON.stringify({
            type: 'results',
            provider,
            data: saved,
          }),
        );
      });

      if (results.length > 0) {
        const cacheKey = `search:${query.toLowerCase().trim()}`;
        const metaKey = `meta:${cacheKey}`;

        await redis.set(cacheKey, JSON.stringify(results), 'EX', 86400);
        await redis.set(metaKey, JSON.stringify({ timestamp: Date.now() }), 'EX', 86400);

        console.log(`[Worker] Final sync completed for: ${query}`);
      }
    } catch (err) {
      console.error(`[Worker] Error processing job ${job.id}:`, err);
      throw err;
    }
  }, { connection });

  searchWorker.on('completed', (job: Job) => console.log(`[Worker] Job ${job.id} completed`));
  searchWorker.on('failed', (job: Job | undefined, err: Error) =>
    console.error(`[Worker] Job ${job?.id} failed:`, err),
  );

  return searchWorker;
}
