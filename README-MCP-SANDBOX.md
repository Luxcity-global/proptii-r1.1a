# MCP-Sandbox for Openrent Integration

## Overview

This feature branch contains a comprehensive MCP (Model Context Protocol) sandbox implementation for property data orchestration, specifically designed for Openrent integration with Zoopla orchestration capabilities.

## 🚀 Key Features

### MCP Sandbox Architecture

- **PropertyDataMCP**: Central orchestrator for property data from multiple sources
- **Schema Transformer**: Unified data format conversion
- **Cache Layer**: Redis-based caching for performance optimization
- **API Layer**: RESTful endpoints for frontend integration
- **Frontend Integration**: React-based UI with intelligent search capabilities

### Openrent Integration

- **Scraper**: Robust web scraping with anti-bot detection
- **Query Parser**: Natural language to structured query conversion
- **Data Extraction**: Comprehensive property data extraction
- **Pagination Support**: Efficient handling of large result sets

### Zoopla Orchestration (In Progress)

- **Query Parser**: Zoopla-specific query parsing
- **Schema Transformer**: Zoopla to MCP format conversion
- **Hybrid Scraping**: Cheerio + Puppeteer approach
- **Anti-Bot Measures**: User-agent rotation, delays, proxy support

## 📁 Project Structure

```
mcp-sandbox/
├── src/
│   ├── mcp/
│   │   ├── property-data/
│   │   │   ├── PropertyDataMCP.ts          # Main orchestrator
│   │   │   └── PropertyDataMCP.test.ts     # Test suite
│   │   └── neighborhood/
│   │       └── NeighborhoodMCP.ts          # Neighborhood data
│   ├── scrapers/
│   │   ├── openrentScraper.ts              # Openrent scraper
│   │   ├── zooplaScraper.ts                # Zoopla scraper
│   │   ├── zooplaQueryParser.ts            # Zoopla query parser
│   │   └── zooplaSchemaTransformer.ts      # Zoopla schema transformer
│   ├── utils/
│   │   ├── queryParser.ts                  # Generic query parser
│   │   └── schemaTransformer.ts            # Generic schema transformer
│   ├── controllers/
│   │   └── mcpRoutes.ts                    # API routes
│   ├── frontend/                           # React frontend
│   └── test/                               # Test fixtures and setup
├── scripts/                                # Test and validation scripts
├── docs/                                   # Documentation
└── frontend/                               # Standalone frontend
```

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 18+
- npm or yarn
- Redis (for caching)

### Installation

1. **Clone and navigate to MCP Sandbox:**

   ```bash
   cd mcp-sandbox
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   # or use the restart script
   ./restart-mcp-sandbox.sh
   ```

### Environment Variables

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Scraping Configuration
SCRAPER_TIMEOUT=30000
SCRAPER_DELAY=1000
USER_AGENT_ROTATION=true

# API Configuration
API_BASE_URL=http://localhost:3001
CORS_ORIGIN=http://localhost:5173
```

## 🧪 Testing

### Run All Tests

```bash
npm test
```

### Run Specific Test Suites

```bash
# PropertyDataMCP tests
npm test -- PropertyDataMCP

# Zoopla integration tests
npm test -- zoopla-integration

# Static parser tests only
npm test -- --testPathPattern="zoopla-integration.test.ts"
```

### Manual Testing Scripts

```bash
# Test basic Zoopla functionality
node scripts/test-zoopla-basic.js

# Test full Zoopla integration
node scripts/test-zoopla-integration.js

# Run diagnostic tests
node scripts/zoopla-diagnostic.js
```

## 📊 Current Status

### ✅ Completed Features

- [x] PropertyDataMCP orchestrator implementation
- [x] Openrent scraper with comprehensive data extraction
- [x] Generic query parser and schema transformer
- [x] Zoopla query parser and schema transformer
- [x] Zoopla scraper with Cheerio and Puppeteer support
- [x] Test infrastructure with Vitest
- [x] Static HTML fixture for stable testing
- [x] Anti-bot measures (user-agent rotation, delays)
- [x] Error handling and logging
- [x] Frontend integration components

### 🔄 In Progress

- [ ] Live Zoopla scraping validation
- [ ] Advanced data extraction features
- [ ] Performance optimization
- [ ] Production deployment preparation

### 📋 Planned Features

- [ ] Market intelligence integration
- [ ] User experience enhancements
- [ ] Alert and notification system
- [ ] Property recommendations
- [ ] Advanced caching strategies

## 🚨 Known Issues

1. **Zoopla Anti-Bot Protection**: The scraper may encounter 403 Forbidden errors due to Zoopla's anti-bot measures
2. **Puppeteer Dependencies**: Chrome/Chromium executable may need manual installation
3. **Network Timeouts**: Some requests may timeout during peak hours

## 🔧 Troubleshooting

### Common Issues

1. **Puppeteer Launch Failures**

   ```bash
   # Install Chrome dependencies
   npm install puppeteer
   # or use system Chrome
   export PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome
   ```

2. **Redis Connection Issues**

   ```bash
   # Start Redis locally
   redis-server
   # or use Docker
   docker run -d -p 6379:6379 redis:alpine
   ```

3. **Test Failures**
   ```bash
   # Clear test cache
   npm test -- --clearCache
   # Run with verbose output
   npm test -- --verbose
   ```

## 📚 Documentation

- [App Initialization Guide](docs/best-practices/01-App-Initialisation-Instructions-090725.md)
- [Zoopla Integration Plan](docs/AI-search-improvement-190625/02%20MCP%20-%20Zoopla%20Orchestration/Zoopla-Integration-Implementation-Plan.md)
- [Sprint 1 - Production Readiness](docs/AI-search-improvement-190625/02%20MCP%20-%20Zoopla%20Orchestration/01-Zoopla-Orch-Sprint-1-Production-Readiness.md)
- [Sprint 2 - Feature Enhancement](docs/AI-search-improvement-190625/02%20MCP%20-%20Zoopla%20Orchestration/02-Zoopla-Orch-Sprint-2-Feature-Enhancement.md)

## 🤝 Contributing

1. Create a feature branch from `feature/mcp-sandbox-openrent`
2. Make your changes
3. Add tests for new functionality
4. Run the test suite
5. Submit a pull request

## 📄 License

This project is part of the Proptii platform. See the main repository for license information.

## 🔗 Links

- [Main Repository](https://github.com/Luxcity-global/proptii-r1.1a)
- [Live Demo](https://proptii-r1-1a.vercel.app)
- [Documentation](docs/)

---

**Branch**: `feature/mcp-sandbox-openrent`  
**Last Updated**: January 2025  
**Status**: Active Development
