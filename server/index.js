import express from 'express';
import multer from 'multer';
import nodemailer from 'nodemailer';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from root directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();

// Enable CORS for all routes with proper configuration for file uploads
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'], // Add your frontend URLs
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'multipart/form-data', 'Origin', 'Accept'],
    exposedHeaders: ['Content-Type', 'Content-Length']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit per file
        files: 10 // Maximum 10 files
    }
});

// In-memory storage for referencing data
const storage = {
    identityData: new Map(),
    employmentData: new Map(),
    residentialData: new Map(),
    financialData: new Map(),
    guarantorData: new Map(),
    agentData: new Map()
};

// Referencing routes
app.post('/api/referencing/:userId/agent', async (req, res) => {
    try {
        const { userId } = req.params;
        const data = req.body;
        storage.agentData.set(userId, { ...data, updatedAt: new Date() });
        res.json({ success: true, message: 'Agent details saved successfully' });
    } catch (err) {
        console.error('Error saving agent details:', err);
        res.status(500).json({ error: err.message });
    }
});

// Email sending route with file upload middleware
app.post('/api/email/send', upload.array('attachments', 10), async (req, res) => {
    try {
        console.log('Received email request:', {
            to: req.body.to,
            subject: req.body.subject,
            filesCount: req.files?.length || 0,
            bodyKeys: Object.keys(req.body)
        });

        const { to, subject, html } = req.body;

        if (!to || !subject || !html) {
            return res.status(400).json({
                success: false,
                error: 'Missing required email fields',
                details: {
                    to: !!to,
                    subject: !!subject,
                    html: !!html,
                    receivedFields: Object.keys(req.body)
                }
            });
        }

        // Log the files received
        console.log('Files received:', req.files?.map(f => ({
            originalname: f.originalname,
            mimetype: f.mimetype,
            size: f.size
        })) || []);

        const attachments = (req.files || []).map(file => ({
            filename: file.originalname,
            content: file.buffer,
            contentType: file.mimetype
        }));

        const mailOptions = {
            from: process.env.SMTP_FROM_EMAIL,
            to,
            subject,
            html,
            attachments
        };

        console.log('Attempting to send email with options:', {
            from: mailOptions.from,
            to: mailOptions.to,
            subject: mailOptions.subject,
            attachmentsCount: mailOptions.attachments.length
        });

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info);

        res.json({
            success: true,
            messageId: info.messageId
        });
    } catch (error) {
        console.error('Error sending email:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            success: false,
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? {
                stack: error.stack,
                smtp: {
                    host: process.env.SMTP_HOST,
                    port: process.env.SMTP_PORT,
                    user: process.env.SMTP_USER ? '***@' + process.env.SMTP_USER.split('@')[1] : undefined,
                    fromEmail: process.env.SMTP_FROM_EMAIL
                }
            } : undefined
        });
    }
});

// Basic route to check if server is running
app.get('/', (req, res) => {
    res.json({ message: 'Email server is running' });
});

// Debug route to check environment variables
app.get('/debug/config', (req, res) => {
    if (process.env.NODE_ENV === 'development') {
        res.json({
            smtp: {
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT,
                user: process.env.SMTP_USER ? '***@' + process.env.SMTP_USER.split('@')[1] : undefined,
                fromEmail: process.env.SMTP_FROM_EMAIL
            },
            environment: process.env.NODE_ENV,
            port: process.env.PORT
        });
    } else {
        res.status(403).json({ message: 'Debug endpoint not available in production' });
    }
});

// Verify SMTP configuration
const requiredEnvVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM_EMAIL'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars);
    process.exit(1);
}

// Configure email transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_PORT === '465',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    debug: true, // Enable debug output
    logger: true // Log information into console
});

// Verify email configuration on startup
try {
    await transporter.verify();
    console.log('SMTP connection verified successfully');
} catch (error) {
    console.error('SMTP connection verification failed:', error);
    process.exit(1);
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API URL: http://localhost:${PORT}`);
    console.log('Environment:', process.env.NODE_ENV || 'development');
});
