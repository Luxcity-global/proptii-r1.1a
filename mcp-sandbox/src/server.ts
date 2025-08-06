import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { mcpRoutes } from './controllers/mcpRoutes';
import { errorHandler } from './middleware/errorHandler';

// Load environment variables
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Environment validation
const requiredEnvVars = {
  PORT: process.env.PORT || '3002',
  NODE_ENV: process.env.NODE_ENV || 'development',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5180',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info'
};

const optionalEnvVars = {
  ENABLE_REAL_SCRAPING: process.env.ENABLE_REAL_SCRAPING || 'true',
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3002',
  SCRAPING_RATE_LIMIT: process.env.SCRAPING_RATE_LIMIT || '2000',
  MAX_SCRAPING_PAGES: process.env.MAX_SCRAPING_PAGES || '4',
  SCRAPING_TIMEOUT: process.env.SCRAPING_TIMEOUT || '30000',
  CACHE_EXPIRY: process.env.CACHE_EXPIRY || '3600',
  REDIS_ENABLED: process.env.REDIS_ENABLED || 'false'
};

console.log('🔧 [SERVER] Environment variables loaded from:', path.resolve(process.cwd(), '.env'));
console.log('🔧 [SERVER] Required Variables:');
Object.entries(requiredEnvVars).forEach(([key, value]) => {
  console.log(`   ${key}: ${value}`);
});
console.log('🔧 [SERVER] Optional Variables:');
Object.entries(optionalEnvVars).forEach(([key, value]) => {
  console.log(`   ${key}: ${value}`);
});

// Validate critical environment variables
const missingRequired = Object.entries(requiredEnvVars).filter(([key, value]) => !value);
if (missingRequired.length > 0) {
  console.error('❌ [SERVER] Missing required environment variables:', missingRequired.map(([key]) => key));
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'MCP Sandbox Server',
    version: '1.0.0',
    environment: {
      nodeEnv: process.env.NODE_ENV,
      port: PORT,
      corsOrigin: process.env.CORS_ORIGIN
    },
    features: {
      realScraping: process.env.ENABLE_REAL_SCRAPING === 'true',
      redisEnabled: process.env.REDIS_ENABLED === 'true',
      cacheExpiry: process.env.CACHE_EXPIRY,
      scrapingSettings: {
        rateLimit: process.env.SCRAPING_RATE_LIMIT,
        maxPages: process.env.MAX_SCRAPING_PAGES,
        timeout: process.env.SCRAPING_TIMEOUT
      }
    },
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    endpoints: {
      health: 'GET /health',
      docs: 'GET /api/mcp/docs',
      search: 'POST /api/mcp/search',
      property: 'GET /api/mcp/property/:id',
      neighborhood: 'GET /api/mcp/neighborhood/:postcode',
      agent: 'GET /api/mcp/agent/:id',
      areaInsights: 'POST /api/mcp/area-insights',
      areaInsightsCache: 'GET/DELETE /api/mcp/area-insights/cache'
    }
  };

  res.json(healthStatus);
});

// API documentation endpoint
app.get('/api/mcp/docs', (req, res) => {
  res.json({
    name: 'Proptii MCP AI Search Sandbox',
    version: '1.0.0',
    description: 'MCP server for intelligent property search and analysis',
    endpoints: {
      health: 'GET /health',
      search: 'POST /api/mcp/search',
      property: 'GET /api/mcp/property/:id',
      neighborhood: 'GET /api/mcp/neighborhood/:postcode',
      agent: 'GET /api/mcp/agent/:id',
      docs: 'GET /api/mcp/docs'
    },
    features: [
      'Property data extraction from multiple sources',
      'Neighborhood intelligence and analysis',
      'Agent intelligence and recommendations',
      'Real-time market analysis',
      'Intelligent search orchestration'
    ]
  });
});

// MCP API routes
app.use('/api/mcp', mcpRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    availableEndpoints: [
      'GET /health',
      'GET /api/mcp/docs',
      'POST /api/mcp/search',
      'GET /api/mcp/property/:id',
      'GET /api/mcp/neighborhood/:postcode',
      'GET /api/mcp/agent/:id',
      'POST /api/mcp/area-insights',
      'GET /api/mcp/area-insights/cache',
      'DELETE /api/mcp/area-insights/cache'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 MCP Sandbox Server running on http://localhost:${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api/mcp/docs`);
  console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
});

export default app; 