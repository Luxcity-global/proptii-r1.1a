import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export interface PropertyExtractionRequest {
  web_content?: string;
  user_query?: string;
  extraction_mode: 'single_property' | 'search_results';
}

export interface ExtractedProperty {
  id: string;
  title: string;
  price: number | null;
  price_type: string;
  location: string;
  postcode: string | null;
  property_type: string;
  bedrooms: number | null;
  bathrooms: number | null;
  description: string;
  features: string[];
  images: string[];
  agent_info: {
    name: string | null;
    phone: string | null;
    email: string | null;
  };
  source_url: string | null;
  extraction_confidence: number;
}

export interface PropertyExtractionResponse {
  properties: ExtractedProperty[];
  search_metadata: {
    total_results: number;
    query_understood: string | null;
    extraction_quality: number;
    processing_time_ms: number;
  };
}

export interface AzureAIConfig {
  endpoint: string;
  apiKey: string;
  deploymentName: string;
  apiVersion: string;
}

@Injectable()
export class PropertyExtractionService {
  private readonly logger = new Logger(PropertyExtractionService.name);
  private readonly config: AzureAIConfig;

  constructor() {
    this.config = {
      endpoint: process.env.AZURE_OPENAI_ENDPOINT,
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'proptii-gpt4-extraction',
      apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview',
    };

    this.validateConfig();
  }

  private validateConfig(): void {
    const requiredVars = ['endpoint', 'apiKey'];
    const missing = requiredVars.filter(varName => !this.config[varName]);
    
    if (missing.length > 0) {
      this.logger.error(`Missing required environment variables: ${missing.join(', ')}`);
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }

  /**
   * Extract property data from web content using Azure AI Foundry
   */
  async extractProperties(request: PropertyExtractionRequest): Promise<PropertyExtractionResponse> {
    const startTime = Date.now();
    
    try {
      this.logger.log(`Starting property extraction. Mode: ${request.extraction_mode}`);
      
      const prompt = this.buildExtractionPrompt(request);
      const response = await this.callAzureAI(prompt, request);
      
      const processingTime = Date.now() - startTime;
      
      // Parse and validate the response
      const extractionResult = this.parseExtractionResponse(response, processingTime);
      
      this.logger.log(`Extraction completed. Found ${extractionResult.properties.length} properties. Quality: ${extractionResult.search_metadata.extraction_quality}`);
      
      return extractionResult;
      
    } catch (error) {
      this.logger.error('Property extraction failed:', error);
      throw new Error(`Property extraction failed: ${error.message}`);
    }
  }

  /**
   * Process natural language property search queries
   */
  async processNaturalLanguageQuery(query: string): Promise<PropertyExtractionResponse> {
    this.logger.log(`Processing natural language query: "${query}"`);
    
    return this.extractProperties({
      user_query: query,
      extraction_mode: 'search_results',
    });
  }

  /**
   * Extract single property from web content
   */
  async extractSingleProperty(webContent: string): Promise<PropertyExtractionResponse> {
    this.logger.log('Extracting single property from web content');
    
    return this.extractProperties({
      web_content: webContent,
      extraction_mode: 'single_property',
    });
  }

  /**
   * Build the extraction prompt based on the request
   */
  private buildExtractionPrompt(request: PropertyExtractionRequest): string {
    const systemPrompt = `You are a specialized property data extraction AI assistant for Proptii, a UK property platform. Your role is to:

1. Extract structured property information from web content (HTML/text)
2. Process natural language property search queries
3. Return data in a consistent JSON format
4. Handle edge cases and missing data gracefully
5. Provide confidence scores for extraction quality

## Core Capabilities:
- Property listing extraction from HTML/text content
- Natural language query understanding and processing
- UK property market knowledge (locations, property types, pricing)
- Data validation and cleaning
- Confidence scoring for extraction quality

## Output Format Requirements:
- Always return valid JSON
- Use consistent field names and data types
- Handle missing data with null values
- Provide confidence scores (0-1) for extraction quality
- Include metadata about the extraction process

## UK Property Context:
- Common property types: House, Flat, Apartment, Bungalow, Maisonette, Studio
- Price types: Sale, Rent, POA (Price on Application), Offers Over, Guide Price
- Location formats: City, Town, Area, Postcode
- Common features: Garden, Parking, Garage, En-suite, Balcony, etc.`;

    const mainPrompt = `# Property Data Extraction Task

## Input:
- Web Content: ${request.web_content || 'N/A'}
- User Query: ${request.user_query || 'N/A'}
- Extraction Mode: ${request.extraction_mode}

## Instructions:

### For Single Property Extraction (extraction_mode = "single_property"):
1. Parse the provided web content to extract property details
2. Focus on accuracy and completeness
3. Extract all available information
4. Provide high-confidence extraction

### For Search Results (extraction_mode = "search_results"):
1. Process the user's natural language query
2. Extract multiple properties if present in content
3. Focus on relevance to the query
4. Provide search metadata

## Required Output Format:

\`\`\`json
{
  "properties": [
    {
      "id": "unique_identifier_or_generated_id",
      "title": "property_title",
      "price": 250000,
      "price_type": "Sale|Rent|POA|Offers Over|Guide Price",
      "location": "City/Town/Area",
      "postcode": "POSTCODE",
      "property_type": "House|Flat|Apartment|Bungalow|Maisonette|Studio",
      "bedrooms": 3,
      "bathrooms": 2,
      "description": "detailed_property_description",
      "features": ["feature1", "feature2", "feature3"],
      "images": ["image_url1", "image_url2"],
      "agent_info": {
        "name": "agent_name",
        "phone": "phone_number",
        "email": "email_address"
      },
      "source_url": "original_page_url",
      "extraction_confidence": 0.95
    }
  ],
  "search_metadata": {
    "total_results": 1,
    "query_understood": "paraphrased_user_query",
    "extraction_quality": 0.95,
    "processing_time_ms": 1500
  }
}
\`\`\`

## Data Extraction Guidelines:

### Price Extraction:
- Extract numeric value only (remove £, commas, etc.)
- Handle ranges: "£250,000 - £275,000" → 250000
- Handle POA/Guide Price appropriately
- Confidence: High for clear prices, lower for ranges/POA

### Location Processing:
- Extract city/town/area name
- Separate postcode if present
- Handle multiple location formats
- Confidence: High for clear locations, lower for ambiguous

### Property Type Classification:
- Map to standard types: House, Flat, Apartment, etc.
- Handle variations: "2 bed flat" → "Flat"
- Confidence: High for clear types, lower for ambiguous

### Features Extraction:
- Extract amenities and features
- Standardize common terms
- Remove duplicates
- Confidence: Based on clarity and consistency

### Agent Information:
- Extract contact details when available
- Handle various formats
- Confidence: Lower than property details

## Error Handling:
- Missing data: Use null values
- Unclear data: Provide best guess with lower confidence
- Invalid content: Return empty properties array
- Always include error information in metadata

## Confidence Scoring:
- 0.9-1.0: Clear, unambiguous data
- 0.7-0.9: Good data with minor uncertainties
- 0.5-0.7: Reasonable extraction with some guesswork
- 0.3-0.5: Poor quality or missing data
- 0.0-0.3: Very poor or no usable data

## Response Requirements:
1. Always return valid JSON
2. Include all required fields (use null for missing data)
3. Provide realistic confidence scores
4. Include helpful metadata
5. Handle edge cases gracefully

Please extract the property data and return it in the specified JSON format.`;

    return `${systemPrompt}\n\n${mainPrompt}`;
  }

  /**
   * Call Azure AI Foundry API
   */
  private async callAzureAI(prompt: string, request?: PropertyExtractionRequest): Promise<string> {
    // For Azure ML Prompt Flow, use the /score endpoint directly
    const url = this.config.endpoint;

    try {
      const response: AxiosResponse = await axios.post(
        url,
        {
          web_content: request?.web_content || '',
          user_query: request?.user_query || '',
          extraction_mode: request?.extraction_mode || 'single_property',
          prompt: prompt
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`,
          },
          timeout: 30000, // 30 second timeout
        }
      );

      // The response format may differ; adjust as needed
      return typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
      
    } catch (error) {
      this.logger.error('Azure AI API call failed:', error);
      
      if (error.response) {
        throw new Error(`Azure AI API error: ${error.response.status} - ${error.response.data?.error?.message || 'Unknown error'}`);
      } else if (error.request) {
        throw new Error('Azure AI API request failed - no response received');
      } else {
        throw new Error(`Azure AI API call failed: ${error.message}`);
      }
    }
  }

  /**
   * Parse and validate the extraction response
   */
  private parseExtractionResponse(aiResponse: string, processingTime: number): PropertyExtractionResponse {
    try {
      // Extract JSON from the response (handle cases where AI includes markdown)
      const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/) || 
                       aiResponse.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('No valid JSON found in AI response');
      }

      const jsonStr = jsonMatch[1] || jsonMatch[0];
      const parsed = JSON.parse(jsonStr);

      // Validate and normalize the response
      const normalizedResponse: PropertyExtractionResponse = {
        properties: Array.isArray(parsed.properties) ? parsed.properties.map(this.normalizeProperty) : [],
        search_metadata: {
          total_results: parsed.search_metadata?.total_results || 0,
          query_understood: parsed.search_metadata?.query_understood || null,
          extraction_quality: parsed.search_metadata?.extraction_quality || 0,
          processing_time_ms: processingTime,
        },
      };

      return normalizedResponse;
      
    } catch (error) {
      this.logger.error('Failed to parse AI response:', error);
      this.logger.error('Raw AI response:', aiResponse);
      
      // Return empty response with error metadata
      return {
        properties: [],
        search_metadata: {
          total_results: 0,
          query_understood: null,
          extraction_quality: 0,
          processing_time_ms: processingTime,
        },
      };
    }
  }

  /**
   * Normalize a property object to ensure consistent structure
   */
  private normalizeProperty(property: any): ExtractedProperty {
    return {
      id: property.id || `extracted_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: property.title || 'Unknown Property',
      price: typeof property.price === 'number' ? property.price : null,
      price_type: property.price_type || 'POA',
      location: property.location || 'Unknown Location',
      postcode: property.postcode || null,
      property_type: property.property_type || 'Unknown',
      bedrooms: typeof property.bedrooms === 'number' ? property.bedrooms : null,
      bathrooms: typeof property.bathrooms === 'number' ? property.bathrooms : null,
      description: property.description || '',
      features: Array.isArray(property.features) ? property.features : [],
      images: Array.isArray(property.images) ? property.images : [],
      agent_info: {
        name: property.agent_info?.name || null,
        phone: property.agent_info?.phone || null,
        email: property.agent_info?.email || null,
      },
      source_url: property.source_url || null,
      extraction_confidence: typeof property.extraction_confidence === 'number' ? 
        Math.max(0, Math.min(1, property.extraction_confidence)) : 0.5,
    };
  }

  /**
   * Test the Azure AI connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const testResponse = await this.extractProperties({
        web_content: 'Test property: 2 bed flat in London, £300,000',
        extraction_mode: 'single_property',
      });
      
      this.logger.log('Azure AI connection test successful');
      return true;
      
    } catch (error) {
      this.logger.error('Azure AI connection test failed:', error);
      return false;
    }
  }
} 