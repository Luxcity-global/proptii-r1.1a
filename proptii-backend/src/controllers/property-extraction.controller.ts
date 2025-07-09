import { Controller, Post, Body, Get, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { PropertyExtractionService, PropertyExtractionRequest, PropertyExtractionResponse } from '../services/property-extraction.service';

export class NaturalLanguageQueryDto {
  query: string;
}

export class WebContentExtractionDto {
  web_content: string;
}

export class PropertyExtractionDto {
  web_content?: string;
  user_query?: string;
  extraction_mode: 'single_property' | 'search_results';
}

@Controller('property-extraction')
export class PropertyExtractionController {
  private readonly logger = new Logger(PropertyExtractionController.name);

  constructor(private readonly propertyExtractionService: PropertyExtractionService) {}

  /**
   * Process natural language property search queries
   * POST /api/property-extraction/natural-language
   */
  @Post('natural-language')
  async processNaturalLanguageQuery(@Body() dto: NaturalLanguageQueryDto): Promise<PropertyExtractionResponse> {
    try {
      this.logger.log(`Processing natural language query: "${dto.query}"`);
      
      if (!dto.query || dto.query.trim().length === 0) {
        throw new HttpException('Query is required', HttpStatus.BAD_REQUEST);
      }

      const result = await this.propertyExtractionService.processNaturalLanguageQuery(dto.query);
      
      this.logger.log(`Natural language query processed successfully. Found ${result.properties.length} properties.`);
      
      return result;
      
    } catch (error) {
      this.logger.error('Natural language query processing failed:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        `Failed to process natural language query: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Extract property data from web content
   * POST /api/property-extraction/web-content
   */
  @Post('web-content')
  async extractFromWebContent(@Body() dto: WebContentExtractionDto): Promise<PropertyExtractionResponse> {
    try {
      this.logger.log('Extracting property data from web content');
      
      if (!dto.web_content || dto.web_content.trim().length === 0) {
        throw new HttpException('Web content is required', HttpStatus.BAD_REQUEST);
      }

      const result = await this.propertyExtractionService.extractSingleProperty(dto.web_content);
      
      this.logger.log(`Web content extraction completed. Found ${result.properties.length} properties.`);
      
      return result;
      
    } catch (error) {
      this.logger.error('Web content extraction failed:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        `Failed to extract property data from web content: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * General property extraction endpoint
   * POST /api/property-extraction/extract
   */
  @Post('extract')
  async extractProperties(@Body() dto: PropertyExtractionDto): Promise<PropertyExtractionResponse> {
    try {
      this.logger.log(`Extracting properties. Mode: ${dto.extraction_mode}`);
      
      // Validate request
      if (dto.extraction_mode === 'single_property' && !dto.web_content) {
        throw new HttpException('Web content is required for single property extraction', HttpStatus.BAD_REQUEST);
      }
      
      if (dto.extraction_mode === 'search_results' && !dto.user_query) {
        throw new HttpException('User query is required for search results', HttpStatus.BAD_REQUEST);
      }

      const request: PropertyExtractionRequest = {
        web_content: dto.web_content,
        user_query: dto.user_query,
        extraction_mode: dto.extraction_mode,
      };

      const result = await this.propertyExtractionService.extractProperties(request);
      
      this.logger.log(`Property extraction completed. Found ${result.properties.length} properties.`);
      
      return result;
      
    } catch (error) {
      this.logger.error('Property extraction failed:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        `Failed to extract properties: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Test Azure AI connection
   * GET /api/property-extraction/test
   */
  @Get('test')
  async testConnection(): Promise<{ status: string; message: string; timestamp: string }> {
    try {
      this.logger.log('Testing Azure AI connection');
      
      const isConnected = await this.propertyExtractionService.testConnection();
      
      if (isConnected) {
        this.logger.log('Azure AI connection test successful');
        return {
          status: 'success',
          message: 'Azure AI connection is working properly',
          timestamp: new Date().toISOString(),
        };
      } else {
        throw new Error('Connection test failed');
      }
      
    } catch (error) {
      this.logger.error('Azure AI connection test failed:', error);
      
      throw new HttpException(
        {
          status: 'error',
          message: `Azure AI connection test failed: ${error.message}`,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Health check endpoint
   * GET /api/property-extraction/health
   */
  @Get('health')
  async healthCheck(): Promise<{ status: string; service: string; timestamp: string }> {
    return {
      status: 'healthy',
      service: 'property-extraction',
      timestamp: new Date().toISOString(),
    };
  }
} 