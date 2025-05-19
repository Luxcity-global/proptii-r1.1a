import * as dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import referencingRoutes from './routes/referencingRoutes.js';

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

// Test route to verify server is running
app.get('/', (req, res) => {
  res.send('Proptii Backend API is running!');
});

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
  console.log('EMAIL_SERVICE_ENDPOINT:', process.env.EMAIL_SERVICE_ENDPOINT ? 'Set' : 'Not set');
  console.log('EMAIL_SERVICE_KEY:', process.env.EMAIL_SERVICE_KEY ? 'Set' : 'Not set');
  console.log('EMAIL_FROM_ADDRESS:', process.env.EMAIL_FROM_ADDRESS ? 'Set' : 'Not set');
});