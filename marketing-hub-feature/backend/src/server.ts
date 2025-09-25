import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Import routes
import userRoutes from './routes/userRoutes';
import campaignRoutes from './routes/campaignRoutes';
import contentRoutes from './routes/contentRoutes';
import assetRoutes from './routes/assetRoutes';
import propertyRoutes from './routes/propertyRoutes';
import kpiRoutes from './routes/kpiRoutes';
import welcomeRoutes from './routes/welcomeRoutes';
import dashboardRoutes from './routes/dashboardRoutes';

// Import new V2 routes
import assetsV2Routes from '../routes/assets';
import templatesV2Routes from '../routes/templates';
import canvasV2Routes from '../routes/canvas';
// Note: crewai route is temporarily disabled due to CommonJS/ES Module compatibility
// import crewaiRoutes from '../routes/crewai';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8201;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:8181',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Error reporting endpoint
app.post('/api/v1/errors', (req, res) => {
  console.error('Frontend Error Report:', {
    timestamp: new Date().toISOString(),
    userAgent: req.headers['user-agent'],
    referer: req.headers.referer,
    error: req.body
  });
  
  res.status(200).json({
    success: true,
    message: 'Error report received',
    timestamp: new Date().toISOString()
  });
});

// Placeholder image endpoint
app.get('/api/v1/placeholder/:width/:height?', (req, res) => {
  const { width, height = width } = req.params;
  const color = req.query.color || 'cccccc';
  const text = req.query.text || `${width}×${height}`;
  
  // Generate SVG placeholder
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#${color}"/>
    <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="14" 
          fill="#666" text-anchor="middle" dy=".3em">${text}</text>
  </svg>`;
  
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(svg);
});

// API routes
console.log('Registering API routes...');
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/campaigns', campaignRoutes);
app.use('/api/v1/content', contentRoutes);
app.use('/api/v1/assets', assetRoutes);
app.use('/api/v1/properties', propertyRoutes);
app.use('/api/v1/kpis', kpiRoutes);
app.use('/api/v1/welcome', welcomeRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

// V2 Social Media Module routes
app.use('/api/v1/v2/assets', assetsV2Routes);
app.use('/api/v1/v2/templates', templatesV2Routes);
app.use('/api/v1/v2/canvas', canvasV2Routes);

// CrewAI Integration routes (temporarily disabled)
// app.use('/api/v1/crewai', crewaiRoutes);
console.log('All API routes registered successfully');

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', err);
  
  const statusCode = (err as any).status || (err as any).statusCode || 500;
  
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Marketing Hub API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API base URL: http://localhost:${PORT}/api/v1`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
