import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { SheetsService } from '../services/sheets.service';

@Controller('sheets')
export class SheetsController {
  constructor(private readonly sheetsService: SheetsService) {}

  /** GET /api/sheets — used by frontend VITE_GOOGLE_SHEETS_API_ENDPOINT */
  @Get()
  async getDefaultSheet(@Query('sheetId') sheetId = 'waitlist') {
    return this.sheetsService.getSheetData(sheetId);
  }

  /** POST /api/sheets — append a row (waitlist / lead capture) */
  @Post()
  async appendRow(@Body() body: any, @Query('sheetId') sheetId = 'waitlist') {
    return this.sheetsService.appendRow(body.sheetId || sheetId, body);
  }

  /** GET /api/sheets/:sheetId */
  @Get(':sheetId')
  async getSheet(@Param('sheetId') sheetId: string) {
    return this.sheetsService.getSheetData(sheetId);
  }

  /** POST /api/sheets/:sheetId */
  @Post(':sheetId')
  async appendToSheet(@Param('sheetId') sheetId: string, @Body() body: any) {
    return this.sheetsService.appendRow(sheetId, body);
  }
}
