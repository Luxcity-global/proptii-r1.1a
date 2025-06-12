import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';

@Injectable()
export class SheetsService {
    private readonly logger = new Logger(SheetsService.name);
    private sheets: any;

    constructor() {
        this.init();
    }

    private async init() {
        try {
            const auth = new google.auth.GoogleAuth({
                keyFile: process.env.GOOGLE_SHEETS_CREDENTIALS_PATH,
                scopes: ['https://www.googleapis.com/auth/spreadsheets'],
            });
            const client = await auth.getClient();
            this.sheets = google.sheets({ version: 'v4', auth: client });
            this.logger.log('Google Sheets API initialized successfully');
        } catch (error) {
            this.logger.error('Failed to initialize Google Sheets API', error.stack);
        }
    }

    async submitData(spreadsheetId: string, data: any): Promise<any> {
        if (!this.sheets) {
            throw new Error('Google Sheets API not initialized');
        }

        try {
            this.logger.log(`Submitting data to spreadsheet: ${spreadsheetId}`);
            const formattedTimestamp = new Date(data.timestamp).toLocaleString();
            const values = [
                [
                    formattedTimestamp,
                    data.subject,
                    data.heading,
                    data.body,
                    data.userEmail,
                ],
            ];

            const response = await this.sheets.spreadsheets.values.append({
                spreadsheetId,
                range: 'Sheet1!A:E',
                valueInputOption: 'USER_ENTERED',
                insertDataOption: 'INSERT_ROWS',
                resource: {
                    values,
                },
            });

            this.logger.log('Data submitted successfully');
            return response.data;
        } catch (error) {
            this.logger.error('Failed to submit data to spreadsheet', error.stack);
            throw error;
        }
    }
} 