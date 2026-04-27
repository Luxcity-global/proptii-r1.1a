import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL) {
  console.error('❌ REDIS_URL is not defined in environment variables');
  process.exit(1);
}

export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null, // Required for BullMQ
});

redis.on('connect', () => console.log('✅ Redis Connected'));
redis.on('error', (err) => console.error('❌ Redis error:', err));

export default redis;
