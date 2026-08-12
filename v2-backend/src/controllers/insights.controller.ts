import { Controller, Get, Query } from '@nestjs/common';
import { InsightsService } from '../services/insights.service';

@Controller('insights')
export class InsightsController {
  constructor(private readonly insightsService: InsightsService) {}

  /** GET /api/insights — general market insights */
  @Get()
  async getInsights(@Query('q') q?: string, @Query('location') location?: string) {
    return this.insightsService.getMarketInsights(q, location);
  }

  /** GET /api/insights/market — alias */
  @Get('market')
  async getMarket(@Query('q') q?: string, @Query('location') location?: string) {
    return this.insightsService.getMarketInsights(q, location);
  }

  /** GET /api/insights/price-trends */
  @Get('price-trends')
  async getPriceTrends(@Query('postcode') postcode?: string) {
    return this.insightsService.getPriceTrends(postcode);
  }

  /** GET /api/insights/demand */
  @Get('demand')
  async getDemand(@Query('location') location?: string) {
    return this.insightsService.getDemandMetrics(location);
  }
}
