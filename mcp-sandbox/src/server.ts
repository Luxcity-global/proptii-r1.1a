import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { mcpRoutes } from './controllers/mcpRoutes';
import { errorHandler } from './middleware/errorHandler';

// Load environment variables
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
console.log('🔧 [SERVER] Environment variables loaded from:', path.resolve(process.cwd(), '.env'));
console.log('🔧 [SERVER] ENABLE_REAL_SCRAPING:', process.env.ENABLE_REAL_SCRAPING);
console.log('🔧 [SERVER] NODE_ENV:', process.env.NODE_ENV);
console.log('🔧 [SERVER] PORT:', process.env.PORT);

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'MCP Sandbox Server',
    version: '1.0.0'
  });
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
      'GET /api/mcp/agent/:id'
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