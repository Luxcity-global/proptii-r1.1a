import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Query,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';

@ApiTags('Campaign Leads')
@Controller('leads')
export class LeadsController {
  private readonly logger = new Logger(LeadsController.name);

  constructor(private readonly leadsService: LeadsService) {}

  /**
   * POST /api/leads
   * Public endpoint — rate-limited (5 requests per 10 min per IP).
   * Accepts form submission, stores in Firestore, returns session token.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 600000 } })
  @ApiOperation({ summary: 'Submit campaign questionnaire (public, rate-limited)' })
  async submitLead(
    @Body() dto: CreateLeadDto,
    @Req() req: Request,
  ): Promise<{ token: string; leadId: string }> {
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      undefined;
    return this.leadsService.submitLead(dto, ip);
  }

  /**
   * GET /api/leads/session?token=...
   * Public — verifies HMAC token, returns personalised data for the welcome page.
   */
  @Get('session')
  @ApiOperation({ summary: 'Verify session token and get personalised lead data (public)' })
  @ApiQuery({ name: 'token', required: true, type: String })
  async getLeadBySession(@Query('token') token: string) {
    return this.leadsService.getLeadBySession(token);
  }

  /**
   * POST /api/leads/:id/activate
   * Public — attaches email to an existing lead after the CTA modal.
   */
  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 600000 } })
  @ApiOperation({ summary: 'Attach email to a lead (public, post-CTA activation)' })
  async activateLead(
    @Param('id') id: string,
    @Body() body: { email: string },
  ): Promise<{ success: boolean }> {
    if (!body?.email || !body.email.includes('@')) {
      return { success: false };
    }
    await this.leadsService.activateLead(id, body.email);
    return { success: true };
  }

  private getAdminEmails(): string[] {
    const raw = `${process.env.ADMIN_EMAILS || ''},${process.env.ADMIN_EMAIL || ''}`;
    const emails = raw
      .split(/[,;\s]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.length > 0 && e.includes('@'));
    return Array.from(new Set(emails));
  }

  private assertAdminUser(req: Request): void {
    const adminEmails = this.getAdminEmails();
    const userEmail = (req as any).user?.email?.trim().toLowerCase();

    if (adminEmails.length === 0) {
      this.logger.warn('Neither ADMIN_EMAIL nor ADMIN_EMAILS is configured on the server. Campaign leads access blocked.');
      throw new ForbiddenException('Access denied: Server administrator email has not been configured.');
    }

    if (!userEmail || !adminEmails.includes(userEmail)) {
      this.logger.warn(`Unauthorized leads access attempt by: ${userEmail || 'unknown'}.`);
      throw new ForbiddenException('Access denied: Administrative privileges required.');
    }
  }

  /**
   * GET /api/leads/auth/check
   * Verifies whether the authenticated user is a designated system administrator.
   * Returns { isAdmin: boolean, email: string }. Does NOT reveal server ADMIN_EMAIL(S).
   */
  @Get('auth/check')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if authenticated user is the designated admin (admin only)' })
  async checkAdminAuth(@Req() req: Request): Promise<{ isAdmin: boolean; email: string }> {
    const adminEmails = this.getAdminEmails();
    const userEmail = (req as any).user?.email?.trim().toLowerCase() || '';

    const isAdmin = Boolean(userEmail && adminEmails.includes(userEmail));
    return {
      isAdmin,
      email: userEmail,
    };
  }

  /**
   * GET /api/leads
   * Admin-only — paginated list of all leads.
   */
  @Get()
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all campaign leads (admin only)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'startAfter', required: false, type: String })
  async listLeads(
    @Req() req: Request,
    @Query('limit') limit?: string,
    @Query('startAfter') startAfter?: string,
  ) {
    this.assertAdminUser(req);
    return this.leadsService.listLeads(limit ? parseInt(limit, 10) : 50, startAfter);
  }

  /**
   * GET /api/leads/export
   * Admin-only — download all leads as a CSV file.
   */
  @Get('export')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Export all leads as CSV (admin only)' })
  async exportLeadsCsv(@Req() req: Request, @Res() res: Response) {
    this.assertAdminUser(req);
    const csv = await this.leadsService.exportLeadsCsv();
    const filename = `proptii-leads-${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }

  /**
   * DELETE /api/leads/:id
   * Admin-only — delete a specific lead by ID.
   */
  @Delete(':id')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a single lead (admin only)' })
  async deleteLead(@Req() req: Request, @Param('id') id: string) {
    this.assertAdminUser(req);
    await this.leadsService.deleteLead(id);
    return { success: true, message: `Lead ${id} deleted` };
  }

  /**
   * DELETE /api/leads
   * Admin-only — clear all campaign leads.
   */
  @Delete()
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Clear all campaign leads (admin only)' })
  async clearAllLeads(@Req() req: Request) {
    this.assertAdminUser(req);
    const result = await this.leadsService.clearAllLeads();
    return { success: true, ...result };
  }
}
