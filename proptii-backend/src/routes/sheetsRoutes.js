import express from 'express';
import { google } from 'googleapis';
const router = express.Router();

// Configure Google Sheets
const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_SHEETS_CREDENTIALS_PATH,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

router.post('/submit', async (req, res) => {
    try {
        console.log('Received form submission:', req.body);
        const { spreadsheetId, data } = req.body;

        if (!spreadsheetId) {
            throw new Error('Spreadsheet ID is required');
        }

        console.log('Authenticating with Google...');
        const client = await auth.getClient();
        console.log('Authentication successful');

        console.log('Creating Google Sheets instance...');
        const sheets = google.sheets({ version: 'v4', auth: client });

        // Format timestamp for better readability in spreadsheet
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

        console.log('Attempting to append values:', values);

        // Append values to the spreadsheet
        const response = await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Sheet1!A:E', // Make sure this matches your sheet name
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                values,
            },
        });

        console.log('Spreadsheet update response:', response.data);

        res.json({
            success: true,
            message: 'Data successfully added to spreadsheet',
            updateResponse: response.data
        });
    } catch (error) {
        console.error('Detailed error:', {
            message: error.message,
            stack: error.stack,
            response: error.response?.data
        });

        res.status(500).json({
            success: false,
            message: 'Failed to add data to spreadsheet',
            error: {
                message: error.message,
                details: error.response?.data || 'No additional details available'
            }
        });
    }
});

export default router; 