import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { redis } from './infrastructure/redis';
import { errorHandler } from './api/controllers/errorController';
import searchRoutes from './api/routes/searchRoutes';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/v1/search', searchRoutes);

// Health check
app.get('/health', async (req: express.Request, res: express.Response) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      redis: redis.status === 'ready' ? 'connected' : 'disconnected'
    }
  };

  const isHealthy = health.services.mongodb === 'connected' && health.services.redis === 'connected';
  res.status(isHealthy ? 200 : 503).json(health);
});

// Error Handling
app.use(errorHandler as any);

export default app;
