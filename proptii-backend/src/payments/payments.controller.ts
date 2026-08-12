import { Controller, Get, Put, Body, Param, Query, UseGuards, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('tenant/:tenantId')
  async getTenantPeriods(@Param('tenantId') tenantId: string) {
    const periods = await this.paymentsService.getTenantPeriods(tenantId);
    return { success: true, periods };
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('options') options: any
  ) {
    return this.paymentsService.updatePeriodStatus(id, status, options);
  }

  @Post('bulk')
  async bulkUpdate(@Body('writes') writes: any[]) {
    return this.paymentsService.bulkUpdate(writes);
  }
}
