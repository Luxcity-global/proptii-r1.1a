import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';

@Injectable()
export class SheetsService {
    private readonly logger = new Logger(SheetsService.name);

    private async getAuthClient() {
        try {
            const auth = new google.auth.GoogleAuth({
                credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS_JSON),
                scopes: ['https://www.googleapis.com/auth/spreadsheets'],
            });
            return await auth.getClient();
        } catch (error) {
            this.logger.error('Error getting Google auth client:', error);
            throw error;
        }
    }

    async submitToSheet(spreadsheetId: string, data: any) {
        try {
            this.logger.log('Attempting to submit data to spreadsheet:', { spreadsheetId });
            
            const client = await this.getAuthClient();
            const sheets = google.sheets({ version: 'v4', auth: client });

            // Format timestamp for better readability
            const formattedTimestamp = new Date(data.timestamp).toLocaleString();

            // Prepare values to append
            const values = [
                [
                    formattedTimestamp,
                    data.subject,
                    data.heading,
                    data.body,
                    data.userEmail
                ]
            ];

            this.logger.log('Appending values to spreadsheet:', values);

            const response = await sheets.spreadsheets.values.append({
                spreadsheetId,
                range: 'Sheet1!A:E',
                valueInputOption: 'USER_ENTERED',
                insertDataOption: 'INSERT_ROWS',
                requestBody: {
                    values,
                },
            });

            this.logger.log('Successfully appended data to spreadsheet:', response.data);
            return response.data;
        } catch (error) {
            this.logger.error('Error submitting to Google Sheet:', error);
            throw error;
        }
    }
} 