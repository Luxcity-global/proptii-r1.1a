import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from './api/controllers/errorController';
import searchRoutes from './api/routes/searchRoutes';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/v1/search', searchRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error Handling
app.use(errorHandler);

export default app;
