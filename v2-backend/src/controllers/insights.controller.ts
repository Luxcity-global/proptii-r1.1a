import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { InsightsService } from '../services/insights.service';

@ApiTags('Insights')
@Controller('insights')
export class InsightsController {
  constructor(private readonly insightsService: InsightsService) {}

  /** GET /api/insights — general market insights */
  @Get()
  @ApiOperation({ summary: 'Get general property market insights' })
  @ApiQuery({ name: 'q', required: false, description: 'Search query' })
  @ApiQuery({ name: 'location', required: false, description: 'Location name or postcode' })
  @ApiResponse({ status: 200, description: 'Market insights data' })
  async getInsights(@Query('q') q?: string, @Query('location') location?: string) {
    return this.insightsService.getMarketInsights(q, location);
  }

  /** GET /api/insights/market — alias */
  @Get('market')
  @ApiOperation({ summary: 'Get market insights (alias)' })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'location', required: false })
  @ApiResponse({ status: 200, description: 'Market insights data' })
  async getMarket(@Query('q') q?: string, @Query('location') location?: string) {
    return this.insightsService.getMarketInsights(q, location);
  }

  /** GET /api/insights/active — alias used by the frontend dashboard */
  @Get('active')
  @ApiOperation({ summary: 'Get active market insights (frontend alias)' })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'location', required: false })
  @ApiResponse({ status: 200, description: 'Active market insights' })
  async getActive(@Query('q') q?: string, @Query('location') location?: string) {
    return this.insightsService.getMarketInsights(q, location);
  }

  /** GET /api/insights/price-trends */
  @Get('price-trends')
  @ApiOperation({ summary: 'Get rental and sale price trends by postcode' })
  @ApiQuery({ name: 'postcode', required: false, description: 'UK postcode district' })
  @ApiResponse({ status: 200, description: 'Price trends data' })
  async getPriceTrends(@Query('postcode') postcode?: string) {
    return this.insightsService.getPriceTrends(postcode);
  }

  /** GET /api/insights/demand */
  @Get('demand')
  @ApiOperation({ summary: 'Get rental demand and tenant metrics by location' })
  @ApiQuery({ name: 'location', required: false, description: 'Location name' })
  @ApiResponse({ status: 200, description: 'Demand metrics data' })
  async getDemand(@Query('location') location?: string) {
    return this.insightsService.getDemandMetrics(location);
  }
}
