import { Controller, Get, UseGuards, Req, Logger, HttpCode, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from '../services/analytics.service';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);

  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('portfolio')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get portfolio analytics for the logged in landlord' })
  async getPortfolioAnalytics(@Req() req) {
    // The user's ID is available in req.user due to the JwtAuthGuard
    const landlordId = req.user.userId || req.user.sub || req.user.id;
    return await this.analyticsService.getPortfolioAnalytics(landlordId);
  }

  @Get('property/:id/market-insights')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get market insights for a specific property' })
  async getPropertyMarketInsights(@Param('id') propertyId: string) {
    return await this.analyticsService.getPropertyMarketInsights(propertyId);
  }
}
