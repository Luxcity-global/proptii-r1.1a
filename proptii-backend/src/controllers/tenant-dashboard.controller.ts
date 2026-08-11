import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { TenantDashboardService } from '../services/tenant-dashboard.service';

@Controller('tenant-dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TenantDashboardController {
  constructor(private readonly tenantDashboardService: TenantDashboardService) {}

  @Get('summary')
  async getDashboardSummary(@Req() req: any) {
    const userId = req.user?.sub;
    const email = req.user?.emails?.[0] || req.user?.email || req.user?.preferred_username || '';
    
    const data = await this.tenantDashboardService.getDashboardSummary(userId, email);
    return { success: true, data };
  }
}
