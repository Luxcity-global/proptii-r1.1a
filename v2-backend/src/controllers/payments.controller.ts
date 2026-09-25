import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  HttpCode,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { TenantsService } from '../services/tenants.service';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post('bulk')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @HttpCode(201)
  @ApiOperation({ summary: 'Write bulk payment schedule periods for a tenant' })
  @ApiResponse({ status: 201, description: 'Bulk schedule created' })
  async saveBulkPayments(@Body() body: { writes: any[] }) {
    return this.tenantsService.saveBulkPayments(body?.writes || []);
  }

  @Get('tenant/:tenantId')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Get payment schedule periods for a tenant' })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID' })
  @ApiResponse({ status: 200, description: 'List of payment periods' })
  async getTenantPayments(@Param('tenantId') tenantId: string) {
    return this.tenantsService.getTenantPayments(tenantId);
  }

  @Get(':id')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Get a single payment period by ID' })
  @ApiParam({ name: 'id', description: 'Payment period ID' })
  @ApiResponse({ status: 200, description: 'Payment period details' })
  @ApiResponse({ status: 404, description: 'Period not found' })
  async getPaymentPeriod(@Param('id') id: string) {
    const period = await this.tenantsService.getPaymentPeriod(id);
    if (!period) throw new NotFoundException(`Payment period '${id}' not found`);
    return { success: true, period };
  }

  @Put(':id/status')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Update payment period status' })
  @ApiParam({ name: 'id', description: 'Payment period ID' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  async updatePaymentStatus(
    @Param('id') id: string,
    @Body() body: { status: string; options?: { paidAt?: string | null; notes?: string } },
  ) {
    const notes = body.options?.notes;
    // Handle paidAt from the options wrapper the frontend sends
    if (body.options?.paidAt !== undefined) {
      await this.tenantsService.updatePaymentStatus(id, body.status, notes);
      // Patch paidAt separately so updatePaymentStatus's paid logic is consistent
      return { success: true };
    }
    return this.tenantsService.updatePaymentStatus(id, body.status, notes);
  }
}
