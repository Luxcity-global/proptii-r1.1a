import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiProperty, ApiQuery } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';
import { AdminGuard } from '../guards/admin.guard';
import { AdminDashboardService } from '../services/admin-dashboard.service';
import { BackupService } from '../services/backup.service';
import { GdprPurgeService } from '../services/gdpr-purge.service';
import { UserProfileService } from '../services/user-profile.service';

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
  constructor(
    private readonly adminDashboard: AdminDashboardService,
    private readonly backupService: BackupService,
    private readonly gdprPurgeService: GdprPurgeService,
    private readonly userProfileService: UserProfileService,
  ) {}

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

  @Get('signups-by-channel')
  @ApiOperation({ summary: 'Sign-ups by channel and partner code, from account_created events' })
  @ApiQuery({ name: 'weeks', required: false, description: 'Weeks in the weekly breakdown (1-52, default 12)' })
  @ApiResponse({ status: 200, description: 'Totals, per-channel and per-code counts, and weekly breakdown' })
  signupsByChannel(@Req() req: any, @Query('weeks') weeks?: string) {
    const n = Number.parseInt(weeks || '', 10);
    return this.adminDashboard.signupsByChannel(req.user?.email || 'unknown', Number.isFinite(n) ? n : 12);
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

  /** C1 — read-only list of landlord verification submissions */
  @Get('verifications')
  @ApiOperation({ summary: 'List landlord account verification submissions (photo ID / proof of address)' })
  @ApiResponse({ status: 200, description: 'Read-only verification submission rows' })
  listVerifications() {
    return this.userProfileService.listVerificationSubmissions(200);
  }

  // ── Phase 5: Disaster Recovery & Backup ───────────────────────────────────
  @Post('backup/export')
  @ApiOperation({ summary: 'Create full disaster recovery snapshot of core collections' })
  @ApiResponse({ status: 201, description: 'Backup export manifest' })
  createBackup(@Req() req: any) {
    return this.backupService.createBackup(req.user?.email || 'admin');
  }

  @Get('backup/list')
  @ApiOperation({ summary: 'List all available disaster recovery backups' })
  @ApiResponse({ status: 200, description: 'List of backup manifests' })
  listBackups() {
    return this.backupService.listBackups();
  }

  // ── Phase 5: GDPR Right-to-be-Forgotten Compliance ─────────────────────────
  @Delete('users/:id/gdpr-purge')
  @ApiOperation({ summary: 'Cascading purge of all user records, documents, and storage objects' })
  @ApiParam({ name: 'id', description: 'User ID to permanently delete' })
  @ApiResponse({ status: 200, description: 'GDPR purge result and audit log ID' })
  purgeUser(@Req() req: any, @Param('id') id: string) {
    return this.gdprPurgeService.purgeUserData(id, req.user?.email || 'admin');
  }
}
