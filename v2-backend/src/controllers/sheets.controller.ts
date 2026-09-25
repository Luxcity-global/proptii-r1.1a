import { Controller, Get, Post, Body, Param, Query, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { SheetsService } from '../services/sheets.service';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';

@ApiTags('Sheets')
@Controller('sheets')
export class SheetsController {
  constructor(private readonly sheetsService: SheetsService) {}

  private assertAdminUser(req: any): void {
    const userEmail = req.user?.email?.trim().toLowerCase();
    const isExplicitAdmin = req.user?.role === 'admin' || req.user?.admin === true;
    if (isExplicitAdmin) return;

    const raw = `${process.env.ADMIN_EMAILS || ''},${process.env.ADMIN_EMAIL || ''}`;
    const adminEmails = raw
      .split(/[,;\s]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.length > 0 && e.includes('@'));

    if (adminEmails.length === 0 || !userEmail || !adminEmails.includes(userEmail)) {
      throw new ForbiddenException('Access denied: Administrative privileges required to read lead data.');
    }
  }

  /** GET /api/sheets — admin only (waitlist/lead retrieval) */
  @Get()
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Get sheet row data (admin only)' })
  @ApiQuery({ name: 'sheetId', required: false, schema: { default: 'waitlist' } })
  @ApiResponse({ status: 200, description: 'Sheet rows' })
  @ApiResponse({ status: 403, description: 'Forbidden if not admin' })
  async getDefaultSheet(@Req() req: any, @Query('sheetId') sheetId = 'waitlist') {
    this.assertAdminUser(req);
    return this.sheetsService.getSheetData(sheetId);
  }

  /** POST /api/sheets — append a row (waitlist / lead capture) */
  @Post()
  @ApiOperation({ summary: 'Append row to waitlist or campaign lead spreadsheet' })
  @ApiQuery({ name: 'sheetId', required: false, schema: { default: 'waitlist' } })
  @ApiResponse({ status: 201, description: 'Row appended' })
  async appendRow(@Body() body: any, @Query('sheetId') sheetId = 'waitlist') {
    return this.sheetsService.appendRow(body.sheetId || sheetId, body);
  }

  /** GET /api/sheets/:sheetId — admin only */
  @Get(':sheetId')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Get specific spreadsheet data (admin only)' })
  @ApiParam({ name: 'sheetId', description: 'Sheet identifier' })
  @ApiResponse({ status: 200, description: 'Sheet data' })
  async getSheet(@Req() req: any, @Param('sheetId') sheetId: string) {
    this.assertAdminUser(req);
    return this.sheetsService.getSheetData(sheetId);
  }

  /** POST /api/sheets/:sheetId */
  @Post(':sheetId')
  @ApiOperation({ summary: 'Append row to specific spreadsheet by ID' })
  @ApiParam({ name: 'sheetId', description: 'Sheet identifier' })
  @ApiResponse({ status: 201, description: 'Row appended' })
  async appendToSheet(@Param('sheetId') sheetId: string, @Body() body: any) {
    return this.sheetsService.appendRow(sheetId, body);
  }
}
