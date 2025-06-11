import { Controller, Post, Body, Logger } from '@nestjs/common';
import { SheetsService } from './sheets.service';

interface SheetSubmissionDto {
    spreadsheetId: string;
    data: {
        timestamp: string;
        subject: string;
        heading: string;
        body: string;
        userEmail: string;
    };
}

@Controller('api/sheets')
export class SheetsController {
    private readonly logger = new Logger(SheetsController.name);

    constructor(private readonly sheetsService: SheetsService) {}

    @Post('submit')
    async submitToSheet(@Body() submission: SheetSubmissionDto) {
        this.logger.log('Received sheet submission request:', submission);
        const result = await this.sheetsService.submitToSheet(
            submission.spreadsheetId,
            submission.data
        );
        return {
            success: true,
            message: 'Data successfully added to spreadsheet',
            updateResponse: result
        };
    }
} 