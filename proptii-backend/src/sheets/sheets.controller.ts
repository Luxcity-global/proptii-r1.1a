import { Controller, Post, Body, Res, HttpStatus, Logger } from '@nestjs/common';
import { SheetsService } from './sheets.service';
import { Response } from 'express';

@Controller('sheets')
export class SheetsController {
  private readonly logger = new Logger(SheetsController.name);

  constructor(private readonly sheetsService: SheetsService) {}

  @Post('submit')
  async submit(@Body() body: any, @Res() res: Response) {
    try {
      this.logger.log(`Received submission request: ${JSON.stringify(body)}`);
      const { spreadsheetId, data } = body;

      if (!spreadsheetId || !data) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: 'Missing spreadsheetId or data in the request body',
        });
      }

      const result = await this.sheetsService.submitData(spreadsheetId, data);
      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Data successfully added to spreadsheet',
        data: result,
      });
    } catch (error) {
      this.logger.error('Error submitting data to Google Sheets', error.stack);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to add data to spreadsheet',
        error: error.message,
      });
    }
  }
} 