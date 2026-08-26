import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from './api/controllers/errorController';
import searchRoutes from './api/routes/searchRoutes';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://proptii.co',
      'https://www.proptii.co',
      'https://proptii-frontend.onrender.com',
      'https://proptii-r1-1a-5347.onrender.com',
      'http://localhost:5173',
      'http://localhost:4173',
      'http://localhost:3000',
    ];
    if (!origin || allowedOrigins.includes(origin) || /\.onrender\.com$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/v1/search', searchRoutes);

app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    service: 'proptii-search',
    status: 'ok',
    health: '/health',
    search: 'POST /api/v1/search',
  });
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error Handling
app.use(errorHandler as any);

export default app;
