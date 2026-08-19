import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  retryStrategy: (times) => Math.min(times * 2000, 30000),
  lazyConnect: true,
  enableOfflineQueue: false,
});

connection.on('error', (err) => {
  // Gracefully handle redis offline state without spamming uncaught error logs
});

connection.connect().catch(() => {
  // Offline fallback
});

export const searchQueue = new Queue('search-tasks', { connection });

export { connection };
