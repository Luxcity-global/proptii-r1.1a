import { PropertyDataMCP } from './property-data/PropertyDataMCP';
import { NeighborhoodMCP } from './neighborhood/NeighborhoodMCP';

export interface SearchResult {
  properties: any[];
  marketAnalysis: any;
  neighborhoodInsights: any;
  agentRecommendations: any;
  searchQuery: string;
  timestamp: string;
  sources: string[];
}

export interface MarketAnalysis {
  averagePrice: number;
  priceTrend: 'rising' | 'falling' | 'stable';
  marketActivity: 'high' | 'medium' | 'low';
  investmentScore: number;
  rentalYield?: number;
  priceHistory: any[];
  marketPositioning: string;
  investmentBreakdown: {
    yieldScore: number;
    growthScore: number;
    riskScore: number;
    demandScore: number;
  };
  comparableProperties: Array<{
    title: string;
    price: number;
    location: string;
    bedrooms: number;
    bathrooms: number;
    propertyType: string;
  }>;
}

export interface NeighborhoodInsights {
  walkabilityScore: number;
  transportScore: number;
  schoolScore: number;
  safetyScore: number;
  amenities: string[];
  transportLinks: string[];
  schools: any[];
  crimeStats: any;
}

export interface AgentIntelligence {
  agentId: string;
  name: string;
  company: string;
  performanceScore: number;
  responseTime: number;
  clientSatisfaction: number;
  marketExpertise: string[];
  recentSales: any[];
  contactInfo: {
    phone: string;
    email: string;
    photo?: string;
  };
}

export interface QueryIntent {
  type: 'property_search' | 'neighborhood_info' | 'agent_recommendation' | 'market_analysis';
  confidence: number;
  entities: {
    location?: string;
    propertyType?: string;
    bedrooms?: number;
    priceRange?: { min: number; max: number };
    intent?: string;
  };
}

export interface OrchestratorResponse {
  success: boolean;
  data?: SearchResult;
  error?: string;
}

export class ProptiiMCPOrchestrator {
  private propertyMCP: PropertyDataMCP;
  private neighborhoodMCP: NeighborhoodMCP;

  constructor() {
    this.propertyMCP = new PropertyDataMCP();
    this.neighborhoodMCP = new NeighborhoodMCP();
  }

  async processQuery(query: string, filters?: any): Promise<OrchestratorResponse> {
    console.log(`🎯 Processing query: "${query}"`);

    try {
      if (!query || !query.trim()) {
        return {
          success: false,
          error: 'Query cannot be empty'
        };
      }

      // Analyze the intent of the query
      const intent = this.analyzeIntent(query);
      console.log(`🧠 Detected intent: ${intent.type} (confidence: ${intent.confidence})`);

      // Process based on intent
      switch (intent.type) {
        case 'property_search':
          return await this.handlePropertySearch(query, intent, filters);
        case 'neighborhood_info':
          return await this.handleNeighborhoodQuery(query, intent);
        case 'agent_recommendation':
          return await this.handleAgentQuery(query, intent);
        case 'market_analysis':
          return await this.handleMarketQuery(query, intent);
        default:
          return await this.handlePropertySearch(query, intent, filters);
      }
    } catch (error) {
      console.error('❌ Query processing error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  analyzeIntent(query: string): QueryIntent {
    const lowerQuery = query.toLowerCase();
    
    // Property search patterns
    const propertyPatterns = [
      /\d+\s*bed/i,
      /flat|apartment|house|studio|penthouse/i,
      /for\s+(rent|sale|let)/i,
      /under\s*£?\d+/i,
      /over\s*£?\d+/i,
      /between\s*£?\d+\s*and\s*£?\d+/i
    ];

    // Neighborhood patterns
    const neighborhoodPatterns = [
      /what\s+is\s+.+\s+like/i,
      /neighborhood|area|location/i,
      /schools|transport|amenities/i,
      /safety|crime|walkability/i
    ];

    // Agent patterns
    const agentPatterns = [
      /agent|realtor|broker/i,
      /best\s+agent/i,
      /recommend.*agent/i,
      /contact.*agent/i
    ];

    // Market patterns
    const marketPatterns = [
      /market|price|trend/i,
      /investment|yield/i,
      /demand|supply/i
    ];

    // Calculate confidence scores
    const propertyScore = propertyPatterns.reduce((score, pattern) => 
      score + (pattern.test(query) ? 0.3 : 0), 0);
    
    const neighborhoodScore = neighborhoodPatterns.reduce((score, pattern) => 
      score + (pattern.test(query) ? 0.4 : 0), 0);
    
    const agentScore = agentPatterns.reduce((score, pattern) => 
      score + (pattern.test(query) ? 0.5 : 0), 0);
    
    const marketScore = marketPatterns.reduce((score, pattern) => 
      score + (pattern.test(query) ? 0.3 : 0), 0);

    // Extract entities
    const entities = this.extractEntities(query);

    // Determine primary intent
    const scores = [
      { type: 'property_search' as const, score: propertyScore },
      { type: 'neighborhood_info' as const, score: neighborhoodScore },
      { type: 'agent_recommendation' as const, score: agentScore },
      { type: 'market_analysis' as const, score: marketScore }
    ];

    const primaryIntent = scores.reduce((max, current) => 
      current.score > max.score ? current : max);

    return {
      type: primaryIntent.type,
      confidence: Math.min(primaryIntent.score, 1.0),
      entities
    };
  }

  private extractEntities(query: string): QueryIntent['entities'] {
    const entities: QueryIntent['entities'] = {};
    const lowerQuery = query.toLowerCase();

    // Extract location
    const locationPatterns = [
      /in\s+([a-zA-Z\s]+)/i,
      /near\s+([a-zA-Z\s]+)/i,
      /around\s+([a-zA-Z\s]+)/i,
      /at\s+([a-zA-Z\s]+)/i
    ];

    for (const pattern of locationPatterns) {
      const match = query.match(pattern);
      if (match) {
        entities.location = match[1].trim();
        break;
      }
    }

    // Extract bedrooms
    const bedroomMatch = query.match(/(\d+)\s*bed/i);
    if (bedroomMatch) {
      entities.bedrooms = parseInt(bedroomMatch[1]);
    }

    // Extract property type
    if (lowerQuery.includes('flat') || lowerQuery.includes('apartment')) {
      entities.propertyType = 'apartment';
    } else if (lowerQuery.includes('house')) {
      entities.propertyType = 'house';
    } else if (lowerQuery.includes('studio')) {
      entities.propertyType = 'studio';
    } else if (lowerQuery.includes('penthouse')) {
      entities.propertyType = 'penthouse';
    }

    // Extract price range
    const underMatch = query.match(/under\s*£?([\d,]+)/i);
    const overMatch = query.match(/over\s*£?([\d,]+)/i);
    const betweenMatch = query.match(/between\s*£?([\d,]+)\s*and\s*£?([\d,]+)/i);

    if (betweenMatch) {
      entities.priceRange = {
        min: parseInt(betweenMatch[1].replace(/,/g, '')),
        max: parseInt(betweenMatch[2].replace(/,/g, ''))
      };
    } else if (underMatch) {
      entities.priceRange = {
        min: 0,
        max: parseInt(underMatch[1].replace(/,/g, ''))
      };
    } else if (overMatch) {
      entities.priceRange = {
        min: parseInt(overMatch[1].replace(/,/g, '')),
        max: 10000000
      };
    }

    return entities;
  }

  private async handlePropertySearch(query: string, intent: QueryIntent, filters?: any): Promise<OrchestratorResponse> {
    const searchResult = await this.processSearch(query, filters);
    return {
      success: true,
      data: searchResult
    };
  }

  private async handleNeighborhoodQuery(query: string, intent: QueryIntent): Promise<OrchestratorResponse> {
    const location = intent.entities.location || 'London';
    const neighborhoodData = await this.neighborhoodMCP.getNeighborhoodData(location);
    
    return {
      success: true,
      data: {
        properties: [],
        marketAnalysis: null,
        neighborhoodInsights: neighborhoodData,
        agentRecommendations: [],
        searchQuery: query,
        timestamp: new Date().toISOString(),
        sources: ['neighborhood_data']
      }
    };
  }

  private async handleAgentQuery(query: string, intent: QueryIntent): Promise<OrchestratorResponse> {
    const location = intent.entities.location || 'London';
    const propertyType = intent.entities.propertyType || 'any';
    const agentRecommendations = await this.getAgentRecommendations(location, propertyType);
    
    return {
      success: true,
      data: {
        properties: [],
        marketAnalysis: null,
        neighborhoodInsights: null,
        agentRecommendations,
        searchQuery: query,
        timestamp: new Date().toISOString(),
        sources: ['agent_data']
      }
    };
  }

  private async handleMarketQuery(query: string, intent: QueryIntent): Promise<OrchestratorResponse> {
    const location = intent.entities.location || 'London';
    const propertyType = intent.entities.propertyType || 'any';
    const marketAnalysis = await this.getMarketAnalysis(location, propertyType);
    
    return {
      success: true,
      data: {
        properties: [],
        marketAnalysis,
        neighborhoodInsights: null,
        agentRecommendations: [],
        searchQuery: query,
        timestamp: new Date().toISOString(),
        sources: ['market_data']
      }
    };
  }

  async synthesizeIntelligence(properties: any[]): Promise<{
    marketAnalysis: MarketAnalysis;
    neighborhoodInsights: NeighborhoodInsights | null;
    agentRecommendations: AgentIntelligence[];
  }> {
    console.log(`🧠 Synthesizing intelligence for ${properties.length} properties`);

    try {
      // Extract common location and property type
      const locations = [...new Set(properties.map(p => p.location?.area || p.location?.city).filter(Boolean))];
      const propertyTypes = [...new Set(properties.map(p => p.specifications?.propertyType).filter(Boolean))];
      
      const primaryLocation = locations[0] || 'London';
      const primaryPropertyType = propertyTypes[0] || 'any';

      // Parallel intelligence gathering
      const [marketAnalysis, neighborhoodData, agentRecommendations] = await Promise.all([
        this.getMarketAnalysis(primaryLocation, primaryPropertyType),
        this.neighborhoodMCP.getNeighborhoodData(primaryLocation),
        this.getAgentRecommendations(primaryLocation, primaryPropertyType)
      ]);

      let neighborhoodInsights: NeighborhoodInsights | null = null;
      if (neighborhoodData) {
        neighborhoodInsights = {
          walkabilityScore: neighborhoodData.walkabilityScore,
          transportScore: neighborhoodData.transportScore,
          schoolScore: neighborhoodData.schoolScore,
          safetyScore: neighborhoodData.safetyScore,
          amenities: neighborhoodData.amenities.nearby,
          transportLinks: [
            ...neighborhoodData.transportLinks.tube,
            ...neighborhoodData.transportLinks.bus,
            ...neighborhoodData.transportLinks.train,
            ...neighborhoodData.transportLinks.cycle
          ],
          schools: neighborhoodData.schools,
          crimeStats: neighborhoodData.crimeStats
        };
      }

      return {
        marketAnalysis,
        neighborhoodInsights,
        agentRecommendations
      };
    } catch (error) {
      console.error('❌ Intelligence synthesis error:', error);
      throw error;
    }
  }

  async processSearch(query: string, filters?: any): Promise<SearchResult> {
    const searchId = Math.random().toString(36).substr(2, 9);
    const searchStartTime = Date.now();
    
    console.log(`🎯 [ORCHESTRATOR] [${searchId}] Starting search orchestration for: "${query}"`);
    console.log(`🔍 [ORCHESTRATOR] [${searchId}] Filters:`, filters);

    try {
      // Extract location and intent from query
      console.log(`🧠 [ORCHESTRATOR] [${searchId}] Parsing query...`);
      const parseStartTime = Date.now();
      const { location, intent, propertyType } = this.parseQuery(query);
      const parseEndTime = Date.now();
      
      console.log(`✅ [ORCHESTRATOR] [${searchId}] Query parsed in:`, parseEndTime - parseStartTime, 'ms');
      console.log(`📍 [ORCHESTRATOR] [${searchId}] Extracted:`, { location, intent, propertyType });
      
      // Parallel data gathering
      console.log(`🚀 [ORCHESTRATOR] [${searchId}] Starting parallel data gathering...`);
      const parallelStartTime = Date.now();
      
      const [properties, marketAnalysis, neighborhoodData, agentRecommendations] = await Promise.all([
        this.propertyMCP.searchProperties(query, filters),
        this.getMarketAnalysis(location, propertyType),
        this.neighborhoodMCP.getNeighborhoodData(location),
        this.getAgentRecommendations(location, propertyType)
      ]);
      
      const parallelEndTime = Date.now();
      console.log(`✅ [ORCHESTRATOR] [${searchId}] Parallel data gathering completed in:`, parallelEndTime - parallelStartTime, 'ms');
      
      console.log(`📊 [ORCHESTRATOR] [${searchId}] Data gathered:`, {
        propertiesCount: properties?.length || 0,
        hasMarketAnalysis: !!marketAnalysis,
        hasNeighborhoodData: !!neighborhoodData,
        agentRecommendationsCount: agentRecommendations?.length || 0
      });

      let neighborhoodInsights: NeighborhoodInsights | null = null;
      if (neighborhoodData) {
        console.log(`🏘️ [ORCHESTRATOR] [${searchId}] Processing neighborhood insights...`);
        neighborhoodInsights = {
          walkabilityScore: neighborhoodData.walkabilityScore,
          transportScore: neighborhoodData.transportScore,
          schoolScore: neighborhoodData.schoolScore,
          safetyScore: neighborhoodData.safetyScore,
          amenities: neighborhoodData.amenities.nearby,
          transportLinks: [
            ...neighborhoodData.transportLinks.tube,
            ...neighborhoodData.transportLinks.bus,
            ...neighborhoodData.transportLinks.train,
            ...neighborhoodData.transportLinks.cycle
          ],
          schools: neighborhoodData.schools,
          crimeStats: neighborhoodData.crimeStats
        };
        console.log(`✅ [ORCHESTRATOR] [${searchId}] Neighborhood insights processed`);
      } else {
        console.log(`⚠️ [ORCHESTRATOR] [${searchId}] No neighborhood data available`);
      }

      const result = {
        properties,
        marketAnalysis,
        neighborhoodInsights,
        agentRecommendations,
        searchQuery: query,
        timestamp: new Date().toISOString(),
        sources: ['rightmove', 'zoopla', 'openrent']
      };
      
      const searchEndTime = Date.now();
      console.log(`✅ [ORCHESTRATOR] [${searchId}] Search orchestration completed in:`, searchEndTime - searchStartTime, 'ms');
      console.log(`📋 [ORCHESTRATOR] [${searchId}] Final result structure:`, {
        hasProperties: 'properties' in result,
        hasMarketAnalysis: 'marketAnalysis' in result,
        hasNeighborhoodInsights: 'neighborhoodInsights' in result,
        hasAgentRecommendations: 'agentRecommendations' in result,
        propertiesCount: result.properties?.length || 0,
        resultKeys: Object.keys(result)
      });
      
      return result;
    } catch (error) {
      const searchEndTime = Date.now();
      console.error(`❌ [ORCHESTRATOR] [${searchId}] Orchestrator error after:`, searchEndTime - searchStartTime, 'ms');
      console.error(`❌ [ORCHESTRATOR] [${searchId}] Error details:`, error);
      console.error(`❌ [ORCHESTRATOR] [${searchId}] Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
      throw error;
    }
  }

  private parseQuery(query: string): { location: string; intent: string; propertyType: string } {
    // Simple query parsing - in a real implementation, this would use NLP
    const lowerQuery = query.toLowerCase();
    
    // Extract location (simple pattern matching)
    const locationPatterns = [
      /in\s+([a-zA-Z\s]+)/i,
      /near\s+([a-zA-Z\s]+)/i,
      /around\s+([a-zA-Z\s]+)/i
    ];
    
    let location = 'London'; // Default
    for (const pattern of locationPatterns) {
      const match = query.match(pattern);
      if (match) {
        location = match[1].trim();
        break;
      }
    }

    // Determine intent
    let intent = 'buy';
    if (lowerQuery.includes('rent') || lowerQuery.includes('let')) {
      intent = 'rent';
    }

    // Determine property type
    let propertyType = 'any';
    if (lowerQuery.includes('flat') || lowerQuery.includes('apartment')) {
      propertyType = 'apartment';
    } else if (lowerQuery.includes('house')) {
      propertyType = 'house';
    }

    return { location, intent, propertyType };
  }

  async getMarketAnalysis(location: string, propertyType: string): Promise<MarketAnalysis> {
    console.log(`📊 Analyzing market for ${propertyType} in ${location}`);
    // Mock base values
    const basePrice = propertyType === 'apartment' ? 450000 : 650000;
    const variation = (Math.random() - 0.5) * 0.2; // ±10% variation
    const priceTrend = Math.random() > 0.5 ? 'rising' : (Math.random() > 0.5 ? 'falling' : 'stable');
    const marketActivity = Math.random() > 0.7 ? 'high' : (Math.random() > 0.4 ? 'medium' : 'low');
    const investmentScore = Math.round(Math.random() * 100);
    const rentalYield = Math.round((Math.random() * 3 + 2) * 100) / 100;
    const priceHistory = Array.from({ length: 12 }, (_, i) => ({
      month: new Date(Date.now() - (11 - i) * 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 7),
      price: Math.round(basePrice * (1 + variation + (i - 6) * 0.01 + (Math.random() - 0.5) * 0.03))
    }));
    // Market positioning
    const positionings = ['Prime location', 'Above average', 'Below average', 'Emerging area', 'Stable area', 'High growth'];
    const marketPositioning = positionings[Math.floor(Math.random() * positionings.length)];
    // Investment breakdown
    const investmentBreakdown = {
      yieldScore: Math.round(Math.random() * 100),
      growthScore: Math.round(Math.random() * 100),
      riskScore: Math.round(Math.random() * 100),
      demandScore: Math.round(Math.random() * 100)
    };
    // Comparable properties (mocked)
    const propertyTypes = ['Apartment', 'House', 'Studio', 'Penthouse'];
    const areas = ['Chelsea', 'Islington', 'Camden', 'Hackney', 'Kensington', 'Edgbaston'];
    const comparableProperties = Array.from({ length: 4 }, (_, i) => {
      const type = propertyTypes[Math.floor(Math.random() * propertyTypes.length)];
      const area = areas[Math.floor(Math.random() * areas.length)];
      const price = Math.round(basePrice * (1 + (Math.random() - 0.5) * 0.15));
      return {
        title: `${type} in ${area}`,
        price,
        location: area,
        bedrooms: Math.floor(Math.random() * 3) + 1,
        bathrooms: Math.floor(Math.random() * 2) + 1,
        propertyType: type
      };
    });
    return {
      averagePrice: Math.round(basePrice * (1 + variation)),
      priceTrend,
      marketActivity,
      investmentScore,
      rentalYield,
      priceHistory,
      marketPositioning,
      investmentBreakdown,
      comparableProperties
    };
  }

  async getAgentRecommendations(location: string, propertyType: string): Promise<AgentIntelligence[]> {
    console.log(`👥 Getting agent recommendations for ${location}`);
    
    // Mock agent recommendations
    const agents = [
      {
        agentId: 'agent-001',
        name: 'Sarah Johnson',
        company: 'Foxtons',
        performanceScore: 95,
        responseTime: 2.5,
        clientSatisfaction: 4.8,
        marketExpertise: [location, propertyType, 'investment'],
        recentSales: [
          { propertyId: 'prop-001', price: 450000, date: '2024-01-15' },
          { propertyId: 'prop-002', price: 520000, date: '2024-01-10' }
        ],
        contactInfo: {
          phone: '+44 20 7123 4567',
          email: 'sarah.johnson@foxtons.com',
          photo: '/images/agents/sarah.jpg'
        }
      },
      {
        agentId: 'agent-002',
        name: 'David Brown',
        company: 'Knight Frank',
        performanceScore: 92,
        responseTime: 3.1,
        clientSatisfaction: 4.7,
        marketExpertise: [location, 'luxury', propertyType],
        recentSales: [
          { propertyId: 'prop-003', price: 750000, date: '2024-01-12' }
        ],
        contactInfo: {
          phone: '+44 20 7123 4568',
          email: 'david.brown@knightfrank.com',
          photo: '/images/agents/david.jpg'
        }
      }
    ];

    return agents;
  }

  async getAgentIntelligence(agentId: string): Promise<AgentIntelligence | null> {
    console.log(`🔍 Getting intelligence for agent: ${agentId}`);
    
    // Mock agent intelligence - in real implementation, this would fetch from database
    const agents = await this.getAgentRecommendations('London', 'any');
    return agents.find(agent => agent.agentId === agentId) || null;
  }
} 