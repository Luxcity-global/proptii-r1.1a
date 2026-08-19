// Compatibility shim for older Node.js versions lacking process.getBuiltinModule (required by recent bson/mongodb versions)
if (typeof globalThis.process !== 'undefined' && !globalThis.process.getBuiltinModule) {
  (globalThis.process as any).getBuiltinModule = (name: string) => {
    try {
      return require(name);
    } catch {
      return {};
    }
  };
}

import app from './app';
import mongoose from 'mongoose';
import { Redis } from 'ioredis';
import './workers/searchWorker'; // Import to start the worker

const PORT = process.env.PORT || 3001;

// MongoDB Connection
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/proptii-search';
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
    console.log('✅ MongoDB Connected');
  } catch (err: any) {
    console.warn('⚠️ MongoDB Connection warning for proptii-search (running in fallback mode):', err?.message || err);
  }
};

// Redis Connection Check
export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 1,
  retryStrategy: () => null,
  lazyConnect: true,
  enableOfflineQueue: false,
});
redis.on('error', (err) => {
  // Handled
});
redis.connect()
  .then(() => console.log('✅ Redis Connected'))
  .catch((err) => console.warn('⚠️ Redis connection warning for proptii-search (running without Redis cache):', err?.message || err));

const startServer = async () => {
  await connectDB();
  
  app.listen(PORT, () => {
    console.log(`🚀 Proptii Search Server running on port ${PORT}`);
  });
};

startServer();
