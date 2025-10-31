import express from 'express';
import multer from 'multer';
import nodemailer from 'nodemailer';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import admin from 'firebase-admin';

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from root directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Initialize Firebase Admin SDK
let firebaseInitialized = false;
try {
    // Try to load service account from local file first
    const serviceAccountPath = path.join(__dirname, 'service-account.json');
    let serviceAccount = null;
    
    try {
        serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
        console.log('📁 Loaded service account from local file');
    } catch (fileError) {
        // Try environment variable as fallback
        if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
            serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
            console.log('📝 Loaded service account from environment variable');
        }
    }
    
    if (serviceAccount) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'proptii-16946.firebasestorage.app'
        });
        firebaseInitialized = true;
        console.log('✅ Firebase Admin initialized with service account');
    } else {
        console.warn('⚠️  Firebase Admin not initialized - property image uploads will use temporary storage');
        console.warn('   Add service-account.json file or FIREBASE_SERVICE_ACCOUNT_KEY env var');
    }
} catch (error) {
    console.warn('⚠️  Firebase Admin initialization failed:', error.message);
    console.warn('   Property images will be temporarily stored on the server');
}

const app = express();

// Enable CORS for all routes with proper configuration for file uploads
app.use(cors({
    origin: [
        'http://localhost:5173', 
        'http://localhost:3000',
        'http://localhost:5176',  // Landlord app port
        'http://localhost:5176/landlord/index.html'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    // Only header names are allowed here (not MIME types)
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
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

// Email sending route with base64 attachment (avoids CORS issues)
app.post('/api/email/send-base64', upload.none(), async (req, res) => {
    try {
        console.log('Received email request with base64 attachment:', {
            to: req.body.to,
            subject: req.body.subject,
            hasAttachment: !!req.body.attachmentBase64
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
        if (attachmentBase64 && attachmentFilename && attachmentMimeType) {
            try {
                const attachmentBuffer = Buffer.from(attachmentBase64, 'base64');
                attachments.push({
                    filename: attachmentFilename,
                    content: attachmentBuffer,
                    contentType: attachmentMimeType
                });
                console.log('Decoded base64 attachment:', {
                    filename: attachmentFilename,
                    size: attachmentBuffer.length,
                    mimeType: attachmentMimeType
                });
            } catch (decodeError) {
                console.error('Error decoding base64 attachment:', decodeError);
                return res.status(400).json({
                    success: false,
                    error: 'Invalid base64 attachment data'
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

// Property image upload endpoint
app.post('/api/property/upload-images', upload.array('images', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No images provided'
            });
        }

        console.log(`Received ${req.files.length} images for upload`);

        const uploadResults = [];
        const bucket = firebaseInitialized ? admin.storage().bucket() : null;

        for (let i = 0; i < req.files.length; i++) {
            const file = req.files[i];
            const timestamp = Date.now();
            const fileName = `properties/${timestamp}_${i}_${file.originalname}`;

            try {
                let fileUrl;
                
                if (bucket) {
                    // Upload to Firebase Storage via Admin SDK (no CORS issues)
                    const fileRef = bucket.file(fileName);
                    await fileRef.save(file.buffer, {
                        metadata: {
                            contentType: file.mimetype,
                            cacheControl: 'public, max-age=31536000'
                        }
                    });
                    
                    // Make file publicly accessible
                    await fileRef.makePublic();
                    
                    // Get public URL
                    fileUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
                    
                    console.log(`✅ Uploaded image ${i + 1}/${req.files.length} to Firebase: ${fileUrl}`);
                } else {
                    // Fallback: Return temporary URL (stored in memory)
                    // In production, you'd want to save these to disk or use another storage service
                    fileUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
                    console.warn(`⚠️  Using temporary storage for image ${i + 1} (Firebase not configured)`);
                }

                uploadResults.push({
                    id: `photo-${timestamp}-${i}`,
                    url: fileUrl,
                    filename: file.originalname,
                    isCover: i === 0,
                    room: i === 0 ? 'Exterior' : undefined
                });
            } catch (error) {
                console.error(`❌ Error uploading image ${i + 1}:`, error);
                // Continue with other images even if one fails
                uploadResults.push({
                    id: `photo-${timestamp}-${i}`,
                    url: null,
                    filename: file.originalname,
                    error: error.message
                });
            }
        }

        const successCount = uploadResults.filter(r => r.url).length;
        console.log(`Upload complete: ${successCount}/${req.files.length} images uploaded successfully`);

        res.json({
            success: successCount > 0,
            photos: uploadResults,
            uploaded: successCount,
            total: req.files.length
        });
    } catch (error) {
        console.error('Error in property image upload:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Property document upload endpoint (via backend to avoid CORS)
app.post('/api/property/upload-document', upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No document provided'
            });
        }

        console.log('Received document for upload:', req.file.originalname);

        const uploadResult = {};
        const bucket = firebaseInitialized ? admin.storage().bucket() : null;

        try {
            let fileUrl;
            
            if (bucket) {
                // Upload to Firebase Storage via Admin SDK (no CORS issues)
                const timestamp = Date.now();
                const fileName = `property-documents/${timestamp}_${req.file.originalname}`;
                const fileRef = bucket.file(fileName);
                
                await fileRef.save(req.file.buffer, {
                    metadata: {
                        contentType: req.file.mimetype,
                        cacheControl: 'public, max-age=31536000'
                    }
                });
                
                // Make file publicly accessible
                await fileRef.makePublic();
                
                // Get public URL
                fileUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
                
                console.log('✅ Uploaded document to Firebase:', fileUrl);
                
                uploadResult.url = fileUrl;
                uploadResult.filename = req.file.originalname;
                uploadResult.success = true;
            } else {
                // Fallback: Return base64 data URL
                fileUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
                console.warn('⚠️  Using temporary storage (Firebase not configured)');
                
                uploadResult.url = fileUrl;
                uploadResult.filename = req.file.originalname;
                uploadResult.success = true;
            }

            res.json({
                success: true,
                document: uploadResult
            });
        } catch (error) {
            console.error('❌ Error uploading document:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    } catch (error) {
        console.error('Error in property document upload:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Delete property (Firestore Admin)
app.delete('/api/property/:id', async (req, res) => {
    try {
        if (!firebaseInitialized) {
            return res.status(500).json({ success: false, error: 'Firebase Admin not initialized' });
        }
        const { id } = req.params;
        const db = admin.firestore();
        await db.collection('properties').doc(id).delete();
        console.log('✅ Deleted property via admin:', id);
        res.json({ success: true, id });
    } catch (error) {
        console.error('Error deleting property via admin:', error);
        res.status(500).json({ success: false, error: error.message });
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
