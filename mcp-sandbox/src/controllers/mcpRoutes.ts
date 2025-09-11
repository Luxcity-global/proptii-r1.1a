import { Router, Request, Response, RequestHandler } from 'express';
import { ProptiiMCPOrchestrator } from '../mcp/ProptiiMCPOrchestrator';
import { PropertyDataMCP } from '../mcp/property-data/PropertyDataMCP';
import { NeighborhoodMCP } from '../mcp/neighborhood/NeighborhoodMCP';
import { areaInsightService, AreaInsightRequest } from '../services/areaInsightService';

const router = Router();
const orchestrator = new ProptiiMCPOrchestrator();
const propertyMCP = new PropertyDataMCP();
const neighborhoodMCP = new NeighborhoodMCP();

// Enhanced search endpoint with MCP orchestration
const searchHandler: RequestHandler = async (req, res) => {
  const requestStartTime = Date.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  
  console.log(`🚀 [BACKEND] [${requestId}] Search request received`);
  console.log(`📊 [BACKEND] [${requestId}] Request method: ${req.method}`);
  console.log(`📊 [BACKEND] [${requestId}] Request URL: ${req.url}`);
  console.log(`📊 [BACKEND] [${requestId}] Request headers:`, req.headers);
  console.log(`📊 [BACKEND] [${requestId}] Request body:`, req.body);
  
  try {
    const { query, filters } = req.body;
    
    console.log(`🔍 [BACKEND] [${requestId}] Processing search query: "${query}"`);
    console.log(`🔍 [BACKEND] [${requestId}] Filters:`, filters);
    
    if (!query || !query.trim()) {
      console.log(`⚠️ [BACKEND] [${requestId}] Empty query received`);
      res.status(400).json({
        success: false,
        error: 'Query cannot be empty',
        requestId: requestId
      });
      return;
    }
    
    console.log(`🎯 [BACKEND] [${requestId}] Calling orchestrator.processSearch...`);
    const orchestratorStartTime = Date.now();
    
    // Use orchestrator to coordinate all MCPs
    const result = await orchestrator.processSearch(query, filters);
    
    const orchestratorEndTime = Date.now();
    console.log(`✅ [BACKEND] [${requestId}] Orchestrator completed in:`, orchestratorEndTime - orchestratorStartTime, 'ms');
    console.log(`📋 [BACKEND] [${requestId}] Orchestrator result structure:`, {
      hasProperties: 'properties' in result,
      hasMarketAnalysis: 'marketAnalysis' in result,
      hasNeighborhoodInsights: 'neighborhoodInsights' in result,
      hasAgentRecommendations: 'agentRecommendations' in result,
      propertiesCount: result.properties?.length || 0,
      resultKeys: Object.keys(result)
    });
    
    const responseData = {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
      query: query,
      sources: ['rightmove', 'zoopla', 'openrent'],
      intelligence: {
        marketAnalysis: result.marketAnalysis,
        neighborhoodInsights: result.neighborhoodInsights,
        agentRecommendations: result.agentRecommendations
      },
      requestId: requestId
    };
    
    console.log(`📤 [BACKEND] [${requestId}] Sending response...`);
    console.log(`📊 [BACKEND] [${requestId}] Response data structure:`, {
      hasSuccess: 'success' in responseData,
      hasData: 'data' in responseData,
      hasProperties: 'data' in responseData && 'properties' in responseData.data,
      propertiesCount: responseData.data?.properties?.length || 0
    });
    
    res.json(responseData);
    
    const requestEndTime = Date.now();
    console.log(`✅ [BACKEND] [${requestId}] Request completed successfully in:`, requestEndTime - requestStartTime, 'ms');
    return;
  } catch (error) {
    const requestEndTime = Date.now();
    console.error(`❌ [BACKEND] [${requestId}] Search error after:`, requestEndTime - requestStartTime, 'ms');
    console.error(`❌ [BACKEND] [${requestId}] Error details:`, error);
    console.error(`❌ [BACKEND] [${requestId}] Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
    
    res.status(500).json({
      success: false,
      error: 'Search failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      requestId: requestId
    });
    return;
  }
};

// Property details endpoint
const propertyHandler: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const property = await propertyMCP.getPropertyById(id);
    
    if (!property) {
      res.status(404).json({
        success: false,
        error: 'Property not found'
      });
      return;
    }
    
    res.json({
      success: true,
      data: property,
      timestamp: new Date().toISOString()
    });
    return;
  } catch (error) {
    console.error('❌ Property details error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch property details',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
    return;
  }
};

// Neighborhood intelligence endpoint
const neighborhoodHandler: RequestHandler = async (req, res) => {
  try {
    const { postcode } = req.params;
    const neighborhoodData = await neighborhoodMCP.getNeighborhoodData(postcode);
    
    res.json({
      success: true,
      data: neighborhoodData,
      timestamp: new Date().toISOString(),
      postcode: postcode
    });
    return;
  } catch (error) {
    console.error('❌ Neighborhood data error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch neighborhood data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
    return;
  }
};

// Agent intelligence endpoint
const agentHandler: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const agentData = await orchestrator.getAgentIntelligence(id);
    
    res.json({
      success: true,
      data: agentData,
      timestamp: new Date().toISOString(),
      agentId: id
    });
    return;
  } catch (error) {
    console.error('❌ Agent intelligence error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch agent intelligence',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
    return;
  }
};

// Market analysis endpoint
const marketAnalysisHandler: RequestHandler = async (req, res) => {
  try {
    const { location, propertyType } = req.query;
    const analysis = await orchestrator.getMarketAnalysis(
      location as string, 
      propertyType as string
    );
    
    res.json({
      success: true,
      data: analysis,
      timestamp: new Date().toISOString(),
      location: location,
      propertyType: propertyType
    });
    return;
  } catch (error) {
    console.error('❌ Market analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch market analysis',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
    return;
  }
};

// ===== PHASE 2.2: ENHANCED API ENDPOINTS =====

// Enhanced search with real data support
const enhancedSearchHandler: RequestHandler = async (req, res) => {
  const requestStartTime = Date.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  
  console.log(`🚀 [ENHANCED_API] [${requestId}] Enhanced search request received`);
  
  try {
    const { query, filters, useRealData = false } = req.body;
    
    console.log(`🔍 [ENHANCED_API] [${requestId}] Query: "${query}", Real Data: ${useRealData}`);
    console.log(`🔍 [ENHANCED_API] [${requestId}] Filters:`, filters);
    
    if (!query || !query.trim()) {
      res.status(400).json({
        success: false,
        error: 'Query cannot be empty',
        requestId: requestId
      });
      return;
    }
    
    const searchStartTime = Date.now();
    const results = await propertyMCP.searchPropertiesWithRealData(query, filters, useRealData);
    const searchEndTime = Date.now();
    
    console.log(`✅ [ENHANCED_API] [${requestId}] Enhanced search completed in:`, searchEndTime - searchStartTime, 'ms');
    console.log(`📊 [ENHANCED_API] [${requestId}] Results: ${results.length} properties`);
    
    res.json({
      success: true,
      data: {
        properties: results,
        searchStats: {
          totalResults: results.length,
          searchTime: searchEndTime - searchStartTime,
          dataSource: useRealData ? 'real' : 'mock',
          filters: filters || {}
        }
      },
      timestamp: new Date().toISOString(),
      query: query,
      useRealData: useRealData,
      requestId: requestId
    });
    
    const requestEndTime = Date.now();
    console.log(`✅ [ENHANCED_API] [${requestId}] Request completed in:`, requestEndTime - requestStartTime, 'ms');
    
  } catch (error) {
    const requestEndTime = Date.now();
    console.error(`❌ [ENHANCED_API] [${requestId}] Enhanced search error:`, error);
    
    res.status(500).json({
      success: false,
      error: 'Enhanced search failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      requestId: requestId
    });
  }
};

// Direct scraping endpoint
const scrapingHandler: RequestHandler = async (req, res) => {
  const requestStartTime = Date.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  
  console.log(`🏠 [SCRAPING_API] [${requestId}] Scraping request received`);
  
  try {
    const { source = 'openrent', query, pages = 4 } = req.body;
    
    console.log(`🔍 [SCRAPING_API] [${requestId}] Source: ${source}, Query: "${query}", Pages: ${pages}`);
    
    if (!query || !query.trim()) {
      res.status(400).json({
        success: false,
        error: 'Query cannot be empty',
        requestId: requestId
      });
      return;
    }
    
    const scrapingStartTime = Date.now();
    const results = await propertyMCP.scrapeWithPagination(source, query, pages);
    const scrapingEndTime = Date.now();
    
    console.log(`✅ [SCRAPING_API] [${requestId}] Scraping completed in:`, scrapingEndTime - scrapingStartTime, 'ms');
    console.log(`📊 [SCRAPING_API] [${requestId}] Results: ${results.length} properties`);
    
    res.json({
      success: true,
      data: {
        properties: results,
        scrapingStats: {
          source: source,
          totalResults: results.length,
          pagesScraped: pages,
          scrapingTime: scrapingEndTime - scrapingStartTime,
          averageTimePerPage: (scrapingEndTime - scrapingStartTime) / pages
        }
      },
      timestamp: new Date().toISOString(),
      source: source,
      query: query,
      pages: pages,
      requestId: requestId
    });
    
    const requestEndTime = Date.now();
    console.log(`✅ [SCRAPING_API] [${requestId}] Request completed in:`, requestEndTime - requestStartTime, 'ms');
    
  } catch (error) {
    const requestEndTime = Date.now();
    console.error(`❌ [SCRAPING_API] [${requestId}] Scraping error:`, error);
    
    res.status(500).json({
      success: false,
      error: 'Scraping failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      requestId: requestId
    });
  }
};

// Cache management endpoint
const cacheHandler: RequestHandler = async (req, res) => {
  const requestStartTime = Date.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  
  console.log(`💾 [CACHE_API] [${requestId}] Cache request received`);
  
  try {
    const { action, source, properties } = req.body;
    
    console.log(`🔧 [CACHE_API] [${requestId}] Action: ${action}, Source: ${source}`);
    
    switch (action) {
      case 'update':
        if (!source || !properties) {
          res.status(400).json({
            success: false,
            error: 'Source and properties are required for update action',
            requestId: requestId
          });
          return;
        }
        
        await propertyMCP.updatePropertyCache(source, properties);
        console.log(`✅ [CACHE_API] [${requestId}] Cache updated for source: ${source}`);
        
        res.json({
          success: true,
          message: 'Cache updated successfully',
          source: source,
          propertiesCount: properties.length,
          timestamp: new Date().toISOString(),
          requestId: requestId
        });
        break;
        
      case 'status':
        const status = await propertyMCP.getScrapingStatus();
        res.json({
          success: true,
          data: status,
          timestamp: new Date().toISOString(),
          requestId: requestId
        });
        break;
        
      default:
        res.status(400).json({
          success: false,
          error: 'Invalid action. Supported actions: update, status',
          requestId: requestId
        });
    }
    
    const requestEndTime = Date.now();
    console.log(`✅ [CACHE_API] [${requestId}] Request completed in:`, requestEndTime - requestStartTime, 'ms');
    
  } catch (error) {
    const requestEndTime = Date.now();
    console.error(`❌ [CACHE_API] [${requestId}] Cache error:`, error);
    
    res.status(500).json({
      success: false,
      error: 'Cache operation failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      requestId: requestId
    });
  }
};

// Health and monitoring endpoint
const healthHandler: RequestHandler = async (req, res) => {
  const requestStartTime = Date.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  
  console.log(`🏥 [HEALTH_API] [${requestId}] Health check request received`);
  
  try {
    const scrapingStatus = await propertyMCP.getScrapingStatus();
    
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        propertyMCP: {
          status: 'operational',
          realScrapingEnabled: scrapingStatus.realScrapingEnabled,
          scrapingEnabled: scrapingStatus.scrapingEnabled,
          cacheEnabled: scrapingStatus.cacheEnabled,
          redisEnabled: scrapingStatus.redisEnabled
        },
        orchestrator: {
          status: 'operational'
        },
        neighborhoodMCP: {
          status: 'operational'
        }
      },
      performance: {
        responseTime: Date.now() - requestStartTime,
        uptime: process.uptime()
      },
      version: '2.2.0',
      features: {
        realScraping: scrapingStatus.realScrapingEnabled,
        enhancedSearch: true,
        pagination: true,
        caching: true,
        filtering: true
      }
    };
    
    res.json({
      success: true,
      data: healthData,
      requestId: requestId
    });
    
    console.log(`✅ [HEALTH_API] [${requestId}] Health check completed`);
    
  } catch (error) {
    console.error(`❌ [HEALTH_API] [${requestId}] Health check error:`, error);
    
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      requestId: requestId
    });
  }
};

// Register routes (all paths are relative, no full URLs)
router.post('/search', searchHandler);
router.get('/property/:id', propertyHandler);
router.get('/neighborhood/:postcode', neighborhoodHandler);
router.get('/agent/:id', agentHandler);
router.get('/market-analysis', marketAnalysisHandler);

// ===== PHASE 2.2: NEW ENHANCED ROUTES =====
router.post('/enhanced-search', enhancedSearchHandler);
router.post('/scraping', scrapingHandler);
router.get('/scraping/status', async (req, res) => {
  try {
    const status = await propertyMCP.getScrapingStatus();
    res.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get scraping status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
router.get('/cache', async (req, res) => {
  try {
    const cacheInfo = await propertyMCP.getCacheInfo();
    res.json({
      success: true,
      data: cacheInfo,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get cache info',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
router.delete('/cache', async (req, res) => {
  try {
    const { source } = req.query;
    await propertyMCP.clearCache(source as string);
    res.json({
      success: true,
      message: 'Cache cleared successfully',
      source: source || 'all',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to clear cache',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
router.post('/cache', cacheHandler);
router.get('/health', healthHandler);
router.get('/sources', async (req, res) => {
  try {
    const sources = await propertyMCP.getDataSources();
    res.json({
      success: true,
      data: sources,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get data sources',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ===== PHASE 2: AREA INSIGHT ROUTES =====
const areaInsightHandler: RequestHandler = async (req, res) => {
  const requestId = Math.random().toString(36).substr(2, 9);
  const requestStartTime = Date.now();
  
  console.log(`🏘️ [AREA-INSIGHT] [${requestId}] Area insight request received`);
  console.log(`📊 [AREA-INSIGHT] [${requestId}] Request body:`, req.body);
  
  try {
    const { location, propertyType, bedrooms } = req.body;
    
    if (!location || !location.trim()) {
      console.log(`⚠️ [AREA-INSIGHT] [${requestId}] Empty location received`);
      res.status(400).json({
        success: false,
        error: 'Location cannot be empty',
        requestId: requestId
      });
      return;
    }
    
    console.log(`🔍 [AREA-INSIGHT] [${requestId}] Fetching area insight for: "${location}"`);
    
    const areaInsightRequest: AreaInsightRequest = {
      location: location.trim(),
      propertyType,
      bedrooms
    };
    
    const areaInsight = await areaInsightService.getAreaInsight(areaInsightRequest);
    
    if (!areaInsight) {
      console.log(`⚠️ [AREA-INSIGHT] [${requestId}] No area insight found for: "${location}"`);
      res.status(404).json({
        success: false,
        error: 'Area insight not found',
        location: location,
        requestId: requestId
      });
      return;
    }
    
    const responseData = {
      success: true,
      data: {
        areaInsight: areaInsight
      },
      timestamp: new Date().toISOString(),
      location: location,
      requestId: requestId
    };
    
    console.log(`✅ [AREA-INSIGHT] [${requestId}] Area insight fetched successfully`);
    console.log(`📊 [AREA-INSIGHT] [${requestId}] Response structure:`, {
      hasAreaInsight: 'areaInsight' in responseData.data,
      location: responseData.data.areaInsight?.location,
      hasAmenities: responseData.data.areaInsight?.amenities?.length > 0,
      hasTransport: responseData.data.areaInsight?.transport?.length > 0
    });
    
    res.json(responseData);
    
    const requestEndTime = Date.now();
    console.log(`✅ [AREA-INSIGHT] [${requestId}] Request completed in:`, requestEndTime - requestStartTime, 'ms');
    
  } catch (error) {
    const requestEndTime = Date.now();
    console.error(`❌ [AREA-INSIGHT] [${requestId}] Error after:`, requestEndTime - requestStartTime, 'ms');
    console.error(`❌ [AREA-INSIGHT] [${requestId}] Error details:`, error);
    
    res.status(500).json({
      success: false,
      error: 'Area insight fetch failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      requestId: requestId
    });
  }
};

const areaInsightCacheHandler: RequestHandler = async (req, res) => {
  const requestId = Math.random().toString(36).substr(2, 9);
  
  try {
    const { location } = req.query;
    
    if (req.method === 'DELETE') {
      await areaInsightService.clearCache(location as string);
      res.json({
        success: true,
        message: 'Area insight cache cleared successfully',
        location: location || 'all',
        timestamp: new Date().toISOString(),
        requestId: requestId
      });
    } else {
      const cacheStats = await areaInsightService.getCacheStats();
      res.json({
        success: true,
        data: cacheStats,
        timestamp: new Date().toISOString(),
        requestId: requestId
      });
    }
  } catch (error) {
    console.error(`❌ [AREA-INSIGHT-CACHE] [${requestId}] Error:`, error);
    res.status(500).json({
      success: false,
      error: 'Area insight cache operation failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      requestId: requestId
    });
  }
};

// Register area insight routes
router.post('/area-insights', areaInsightHandler);
router.get('/area-insights/cache', areaInsightCacheHandler);
router.delete('/area-insights/cache', areaInsightCacheHandler);

export { router as mcpRoutes }; 