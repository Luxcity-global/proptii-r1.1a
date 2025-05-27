import * as dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import referencingRoutes from './routes/referencingRoutes.js';
import sheetsRoutes from './routes/sheetsRoutes.js';
import { emailService } from './services/emailService.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3002;

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'], // Add both development and production URLs
  credentials: true
}));

// Increase payload size limit for file uploads
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// API routes
app.use('/api/referencing', referencingRoutes);
app.use('/api/sheets', sheetsRoutes);

// Test route to verify server is running
app.get('/', (req, res) => {
  res.send('Proptii Backend API is running!');
});

// Verify email configuration on startup
try {
  await emailService.verifyConnection();
} catch (error) {
  console.error('Failed to verify email configuration:', error);
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: err.message
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log('Environment variables loaded:');
  console.log('SMTP_HOST:', process.env.SMTP_HOST ? 'Set' : 'Not set');
  console.log('SMTP_PORT:', process.env.SMTP_PORT ? 'Set' : 'Not set');
  console.log('SMTP_USER:', process.env.SMTP_USER ? 'Set' : 'Not set');
  console.log('SMTP_FROM_EMAIL:', process.env.SMTP_FROM_EMAIL ? 'Set' : 'Not set');
});