import { Controller, Get, Post, Put, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { InsightsService } from './insights.service';

@ApiTags('insights')
@Controller('insights')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InsightsController {
  constructor(private readonly insightsService: InsightsService) {}

  private getUserId(req: any): string {
    return req.user?.sub || req.user?.oid || req.user?.id;
  }

  @Get('active')
  async getActiveInsights(@Req() req: any) {
    const userId = this.getUserId(req);
    const insights = await this.insightsService.getActiveInsights(userId);
    return { success: true, insights };
  }

  @Put(':id/dismiss')
  async dismissInsight(@Req() req: any, @Param('id') id: string) {
    const userId = this.getUserId(req);
    return this.insightsService.dismissInsight(id, userId);
  }

  @Post('bulk-create')
  async bulkCreate(@Body('insights') insights: any[]) {
    return this.insightsService.bulkCreate(insights);
  }
}
