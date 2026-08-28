import './infrastructure/dnsPatch';
import 'dotenv/config';
import app from './app';
import mongoose from 'mongoose';
import { initRedis } from './infrastructure/redis';
import { startSearchWorker } from './workers/searchWorker';
import { isSrvLookupError, mongodbSrvToStandardUri } from './infrastructure/mongoUri';

const PORT = process.env.PORT || 3001;

const mongoOptions = {
  serverSelectionTimeoutMS: 20000,
  family: 4 as const,
};

const connectDB = async (): Promise<boolean> => {
  const mongoUri = process.env.MONGODB_URI?.trim();
  if (!mongoUri) {
    console.warn('⚠️ MONGODB_URI is not set — search works but listings will not persist');
    return false;
  }

  try {
    try {
      await mongoose.connect(mongoUri, mongoOptions);
    } catch (err) {
      if (!isSrvLookupError(err)) throw err;
      console.warn('⚠️ MongoDB SRV lookup failed — retrying with standard replica-set URI');
      await mongoose.disconnect().catch(() => undefined);
      const standardUri = await mongodbSrvToStandardUri(mongoUri);
      await mongoose.connect(standardUri, mongoOptions);
    }
    console.log(`✅ MongoDB Connected (${mongoose.connection.name || 'default'})`);
    return true;
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err);
    if (process.env.REQUIRE_MONGODB === 'true') {
      process.exit(1);
    }
    console.warn('⚠️ Continuing without MongoDB — search works but coordinates will not persist');
    return false;
  }
};

const startServer = async () => {
  await connectDB();
  await initRedis();
  startSearchWorker();

  app.listen(PORT, () => {
    console.log(`🚀 Proptii Search Server running on port ${PORT}`);
  });
};

startServer();
