import { Controller, Post, Body, UseGuards, UseInterceptors, Logger, HttpException, HttpStatus, Get } from '@nestjs/common';
import { SearchService } from './search.service';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SearchDto } from './dto/search.dto';

@ApiTags('search')
@Controller('search')
@UseGuards(ThrottlerGuard)
export class SearchController {
  private readonly logger = new Logger(SearchController.name);

  constructor(private readonly searchService: SearchService) {}

  @Get('health')
  @ApiOperation({ summary: 'Check search service health' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @ApiResponse({ status: 500, description: 'Service is unhealthy' })
  async healthCheck() {
    try {
      await this.searchService.checkHealth();
      return { status: 'ok', message: 'Search service is healthy' };
    } catch (error) {
      this.logger.error('Health check failed:', error);
      throw new HttpException({
        status: 'error',
        message: 'Search service is unhealthy',
        details: error.message
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post()
  @ApiOperation({ summary: 'Search properties or get suggestions' })
  @ApiResponse({ status: 200, description: 'Search results returned successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async search(@Body() searchDto: SearchDto) {
    try {
      this.logger.log(`Received search request: ${JSON.stringify(searchDto)}`);
      
      if (searchDto.type === 'suggestions') {
        const suggestions = await this.searchService.getSuggestions(searchDto.query);
        this.logger.log(`Returning ${suggestions.length} suggestions`);
        return suggestions;
      }
      
      const results = await this.searchService.searchProperties(searchDto.query);
      this.logger.log(`Returning ${results.length} property results`);
      return results;
    } catch (error) {
      this.logger.error('Search request failed:', {
        error: error.message,
        stack: error.stack,
        response: error.response?.data,
        request: error.request
      });

      // If it's already an HttpException, rethrow it
      if (error instanceof HttpException) {
        throw error;
      }

      // Create a detailed error response
      const errorResponse = {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        error: error.message,
        details: error.response?.data || error.stack,
        timestamp: new Date().toISOString(),
      };

      throw new HttpException(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
} 