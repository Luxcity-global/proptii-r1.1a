import { Worker, Job } from 'bullmq';
import { connection as redis } from '../infrastructure/queue';
import { ScraperManager } from '../integrations/ScraperManager';
import Property from '../models/Property';

const scraperManager = new ScraperManager();

export const searchWorker = new Worker('search-tasks', async (job: Job) => {
  const { query, filters } = job.data;
  console.log(`[Worker] Processing search job: ${query}`);

  try {
    const results = await scraperManager.scrapeAll(query, filters, async (provider, providerResults) => {
      console.log(`[Worker] Found ${providerResults.length} properties from ${provider}. Publishing...`);
      
      // 1. Save to MongoDB incrementally
      const savePromises = providerResults.map(p => {
        // Double check types before Mongoose persistence to avoid CastErrors
        const sanitized = {
          ...p,
          bedrooms: (typeof p.bedrooms === 'number') ? p.bedrooms : (p.bedrooms ? parseInt(p.bedrooms as any) : null),
          bathrooms: (typeof p.bathrooms === 'number') ? p.bathrooms : (p.bathrooms ? parseInt(p.bathrooms as any) : null),
          scrapedAt: new Date()
        };

        return Property.findOneAndUpdate(
          { url: p.url },
          sanitized,
          { upsert: true, returnDocument: 'after' }
        );
      });
      await Promise.all(savePromises);

      // 2. Publish to Redis for real-time UI
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
