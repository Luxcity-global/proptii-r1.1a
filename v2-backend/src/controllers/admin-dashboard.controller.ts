import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';
import { AdminGuard } from '../guards/admin.guard';
import { AdminDashboardService } from '../services/admin-dashboard.service';

export class AddAdminNoteDto {
  @ApiProperty({ description: 'Note content' })
  @IsString()
  @MinLength(1)
  note: string;

  @ApiProperty({ required: false, description: 'Optional categorical tag' })
  @IsOptional()
  @IsString()
  tag?: string;
}

@ApiTags('Admin Dashboard')
@ApiBearerAuth('bearer')
@Controller('admin')
@UseGuards(FirebaseAuthGuard, AdminGuard)
export class AdminDashboardController {
  constructor(private readonly adminDashboard: AdminDashboardService) {}

  @Get('me')
  @ApiOperation({ summary: 'Verify admin session status and role' })
  @ApiResponse({ status: 200, description: 'Admin session verification response' })
  @ApiResponse({ status: 403, description: 'Forbidden if not admin' })
  me(@Req() req: any) {
    return { ok: true, email: req.user?.email, role: 'staff' };
  }

  @Get('customers')
  @ApiOperation({ summary: 'List customer accounts with enriched subscription and billing statuses' })
  @ApiResponse({ status: 200, description: 'Customer list with cache generation timestamp' })
  listCustomers(@Req() req: any) {
    return this.adminDashboard.listCustomers(req.user?.email || 'unknown');
  }

  @Get('customers/:id')
  @ApiOperation({ summary: 'Get detailed customer profile, subscriptions, notes, and activity timeline' })
  @ApiParam({ name: 'id', description: 'Customer User ID' })
  @ApiResponse({ status: 200, description: 'Customer detail object' })
  getCustomer(@Req() req: any, @Param('id') id: string) {
    return this.adminDashboard.getCustomer(req.user?.email || 'unknown', id);
  }

  @Post('customers/:id/notes')
  @ApiOperation({ summary: 'Add administrative note to customer profile' })
  @ApiParam({ name: 'id', description: 'Customer User ID' })
  @ApiResponse({ status: 201, description: 'Note added' })
  addNote(@Req() req: any, @Param('id') id: string, @Body() body: AddAdminNoteDto) {
    return this.adminDashboard.addNote(
      req.user?.email || 'unknown',
      id,
      body.note,
      body.tag,
    );
  }

  @Get('overview')
  @ApiOperation({ summary: 'Get aggregated system overview metrics and funnels' })
  @ApiResponse({ status: 200, description: 'Aggregated overview metrics' })
  overview(@Req() req: any) {
    return this.adminDashboard.overview(req.user?.email || 'unknown');
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Get administrative alert summaries' })
  @ApiResponse({ status: 200, description: 'Alert summaries' })
  alerts(@Req() req: any) {
    return this.adminDashboard.alerts(req.user?.email || 'unknown');
  }

  @Get('partners')
  @ApiOperation({ summary: 'Get partner landlords and agents metrics' })
  @ApiResponse({ status: 200, description: 'Partner metrics' })
  partners(@Req() req: any) {
    return this.adminDashboard.partners(req.user?.email || 'unknown');
  }
}
