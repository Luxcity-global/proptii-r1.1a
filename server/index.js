import express from 'express';
import multer from 'multer';
import nodemailer from 'nodemailer';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initializeApp, cert, applicationDefault, getApps } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from root directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();

let firebaseBucket = null;

const initializeFirebaseStorage = () => {
    if (firebaseBucket) {
        return firebaseBucket;
    }

    try {
        let serviceAccount = null;

        if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
            try {
                serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
            } catch (parseError) {
                console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', parseError);
            }
        } else {
            const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || path.join(__dirname, 'service-account.json');
            if (fs.existsSync(serviceAccountPath)) {
                try {
                    const serviceAccountRaw = fs.readFileSync(serviceAccountPath, 'utf8');
                    serviceAccount = JSON.parse(serviceAccountRaw);
                } catch (fileError) {
                    console.error('Failed to read service-account.json:', fileError);
                }
            }
        }

        if (serviceAccount?.private_key && serviceAccount.private_key.includes('\\n')) {
            serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
        }

        let credential = null;

        if (serviceAccount) {
            credential = cert(serviceAccount);
        } else {
            try {
                credential = applicationDefault();
            } catch (credentialError) {
                console.warn('Firebase application default credentials are not available:', credentialError.message);
            }
        }

        if (!credential) {
            console.warn('Firebase credentials not provided; property document uploads will be disabled.');
            return null;
        }

        const bucketName =
            process.env.FIREBASE_STORAGE_BUCKET ||
            serviceAccount?.storageBucket ||
            (serviceAccount?.project_id ? `${serviceAccount.project_id}.appspot.com` : undefined);

        if (!bucketName) {
            console.warn('Firebase storage bucket not configured; property document uploads will be disabled.');
            return null;
        }

        const apps = getApps();
        const firebaseApp = apps.length
            ? apps[0]
            : initializeApp({
                  credential,
                  storageBucket: bucketName,
              });

        firebaseBucket = getStorage(firebaseApp).bucket(bucketName);
        console.log(`Firebase Storage bucket ready: ${firebaseBucket.name}`);

        return firebaseBucket;
    } catch (error) {
        console.error('Failed to initialize Firebase Storage:', error);
        firebaseBucket = null;
        return null;
    }
};

initializeFirebaseStorage();

// Enable CORS for all routes with proper configuration for file uploads
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'], // Add your frontend URLs
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Origin', 'Accept', 'Authorization'],
    exposedHeaders: ['Content-Type', 'Content-Length']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // Increase limit for base64 data

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

// Property document upload route for landlord portal
app.post('/api/property/upload-document', upload.single('document'), async (req, res) => {
    console.log('Received property document upload request');

    if (!req.file) {
        return res.status(400).json({
            success: false,
            error: 'No document file provided',
        });
    }

    const bucket = firebaseBucket || initializeFirebaseStorage();

    if (!bucket) {
        return res.status(503).json({
            success: false,
            error: 'Document storage service is not configured',
        });
    }

    const originalName = req.file.originalname || 'document';
    const normalizedName = originalName
        .toLowerCase()
        .replace(/[^a-z0-9.\-_]/g, '-');
    const sanitizedName = normalizedName.replace(/-+/g, '-').replace(/^-+|-+$/g, '');
    const originalExtension = originalName.includes('.') ? originalName.substring(originalName.lastIndexOf('.')).toLowerCase() : '';
    const fallbackName = originalExtension ? `document${originalExtension}` : 'document.bin';
    const safeName = sanitizedName || fallbackName;
    const timestamp = Date.now();
    const destinationPath = `property-documents/${timestamp}-${safeName}`;

    try {
        const file = bucket.file(destinationPath);

        await file.save(req.file.buffer, {
            resumable: false,
            metadata: {
                contentType: req.file.mimetype || 'application/octet-stream',
                metadata: {
                    originalName,
                    uploadedAt: new Date().toISOString(),
                },
            },
        });

        let publicUrl = null;

        try {
            await file.makePublic();
            publicUrl = file.publicUrl();
        } catch (makePublicError) {
            console.warn('makePublic failed, falling back to signed URL:', makePublicError.message);
        }

        if (!publicUrl) {
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
            const [signedUrl] = await file.getSignedUrl({
                action: 'read',
                expires: expiresAt,
            });
            publicUrl = signedUrl;
        }

        res.json({
            success: true,
            document: {
                url: publicUrl,
                path: destinationPath,
                name: originalName,
                type: req.file.mimetype,
                size: req.file.size,
            },
        });
    } catch (error) {
        console.error('Error uploading property document:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to upload document',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
});

// Email sending route for base64 attachments (used by ContractsPage)
// Use multer to parse multipart/form-data (even though we're not uploading files, FormData requires multer)
app.post('/api/email/send-base64', upload.none(), async (req, res) => {
    try {
        console.log('Received base64 email request:', {
            to: req.body.to,
            subject: req.body.subject,
            hasBase64: !!req.body.attachmentBase64,
            filename: req.body.attachmentFilename,
            bodyKeys: Object.keys(req.body)
        });

        const { to, subject, html, attachmentBase64, attachmentFilename, attachmentMimeType } = req.body;

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

        // Decode base64 attachment if provided
        const attachments = [];
        if (attachmentBase64 && attachmentFilename) {
            try {
                // Remove data URL prefix if present (e.g., "data:application/pdf;base64,...")
                const base64Data = attachmentBase64.includes(',') 
                    ? attachmentBase64.split(',')[1] 
                    : attachmentBase64;
                
                const buffer = Buffer.from(base64Data, 'base64');
                attachments.push({
                    filename: attachmentFilename,
                    content: buffer,
                    contentType: attachmentMimeType || 'application/octet-stream'
                });
                console.log(`Attachment decoded: ${attachmentFilename} (${buffer.length} bytes)`);
            } catch (decodeError) {
                console.error('Error decoding base64 attachment:', decodeError);
                return res.status(400).json({
                    success: false,
                    error: 'Invalid base64 attachment',
                    details: decodeError.message
                });
            }
        }

        const mailOptions = {
            from: process.env.SMTP_FROM_EMAIL,
            to,
            subject,
            html,
            attachments
        };

        console.log('Attempting to send email with base64 attachment:', {
            from: mailOptions.from,
            to: mailOptions.to,
            subject: mailOptions.subject,
            attachmentsCount: attachments.length,
            attachmentFilename: attachmentFilename || 'none'
        });

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully with base64 attachment:', info);

        res.json({
            success: true,
            messageId: info.messageId
        });
    } catch (error) {
        console.error('Error sending email with base64:', error);
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

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API URL: http://localhost:${PORT}`);
    console.log('Environment:', process.env.NODE_ENV || 'development');
});
