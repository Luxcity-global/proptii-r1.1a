import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import mongoose from 'mongoose';
import { Redis } from 'ioredis';
import './workers/searchWorker'; // Import to start the worker

const PORT = Number(process.env.PORT) || 3001;

// MongoDB Connection
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('❌ MONGODB_URI is not defined in environment variables');
    }
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB Connected');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1);
  }
};

import { redis } from './infrastructure/redis';
export { redis };

const startServer = async () => {
  await connectDB();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Proptii Search Server running on port ${PORT}`);
  });
};

startServer();
