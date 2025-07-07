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
            if (!process.env.GOOGLE_SHEETS_CREDENTIALS_JSON) {
                this.logger.error(
                    'GOOGLE_SHEETS_CREDENTIALS_JSON environment variable not set.',
                );
                return;
            }

            const credentials = JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS_JSON);

            const auth = new google.auth.GoogleAuth({
                credentials,
                scopes: ['https://www.googleapis.com/auth/spreadsheets'],
            });

            this.sheets = google.sheets({ version: 'v4', auth });
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
            this.logger.log(`Data received: ${JSON.stringify(data)}`);
            
            const formattedTimestamp = new Date(data.timestamp).toLocaleString();
            let values: any[][] = [];
            let range: string = '';

            // Detect data type and format accordingly
            if (data.rating !== undefined) {
                // Review data format
                values = [
                    [
                        formattedTimestamp,
                        data.rating,
                        data.feedback || 'No feedback provided',
                        data.userType || 'Unknown',
                        data.userId || 'Anonymous',
                        data.source || 'Unknown'
                    ]
                ];
                range = 'Sheet1!A:F'; // 6 columns for review data
                this.logger.log('Processing as review data');
            } else {
                // Help form data format (existing)
                values = [
                    [
                        formattedTimestamp,
                        data.subject,
                        data.heading,
                        data.body,
                        data.userEmail,
                    ],
                ];
                range = 'Sheet1!A:E'; // 5 columns for help form data
                this.logger.log('Processing as help form data');
            }

            const response = await this.sheets.spreadsheets.values.append({
                spreadsheetId,
                range,
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