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
// Import will be done after env vars are loaded
let azureGraphService;

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables - try multiple methods
const rootEnvPath = path.join(__dirname, '..', '.env');
const serverEnvPath = path.join(__dirname, '.env');

console.log('📁 Attempting to load .env files...');
console.log('   Root .env path:', rootEnvPath);
console.log('   Root .env exists:', fs.existsSync(rootEnvPath));
console.log('   Server .env path:', serverEnvPath);
console.log('   Server .env exists:', fs.existsSync(serverEnvPath));

// Method 1: Try dotenv from root
if (fs.existsSync(rootEnvPath)) {
  const result = dotenv.config({ path: rootEnvPath });
  if (result.error) {
    console.error('❌ Error loading root .env:', result.error);
  } else {
    console.log('✅ Root .env loaded via dotenv');
  }
}

// Method 2: Try dotenv from server directory
if (fs.existsSync(serverEnvPath)) {
  const result = dotenv.config({ path: serverEnvPath, override: false });
  if (result.error) {
    console.error('❌ Error loading server .env:', result.error);
  } else {
    console.log('✅ Server .env loaded via dotenv');
  }
}

// Method 3: Manual parsing as fallback if variables still missing
if (!process.env.AZURE_AD_B2C_CLIENT_ID) {
  console.log('⚠️ Variables still missing, trying manual file read...');
  const envFile = fs.existsSync(serverEnvPath) ? serverEnvPath : rootEnvPath;
  if (fs.existsSync(envFile)) {
    try {
      const envContent = fs.readFileSync(envFile, 'utf8');
      const lines = envContent.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [key, ...valueParts] = trimmed.split('=');
          const value = valueParts.join('=').trim();
          if (key.startsWith('AZURE_AD_B2C_')) {
            process.env[key.trim()] = value;
            console.log(`   ✅ Manually set: ${key.trim()}`);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error manually reading .env:', error);
    }
  }
}

// Debug: Check if Azure AD B2C vars are loaded
console.log('🔍 Environment variables check after loading:');
console.log('  AZURE_AD_B2C_CLIENT_ID:', process.env.AZURE_AD_B2C_CLIENT_ID ? `SET (${process.env.AZURE_AD_B2C_CLIENT_ID.substring(0, 8)}...)` : 'MISSING');
console.log('  AZURE_AD_B2C_CLIENT_SECRET:', process.env.AZURE_AD_B2C_CLIENT_SECRET ? 'SET (***)' : 'MISSING');
console.log('  AZURE_AD_B2C_TENANT_ID:', process.env.AZURE_AD_B2C_TENANT_ID ? `SET (${process.env.AZURE_AD_B2C_TENANT_ID.substring(0, 8)}...)` : 'MISSING');

// Import and create the service AFTER env vars are loaded
let azureGraphServiceModule;
try {
  azureGraphServiceModule = await import('./services/azureGraphService.js');
  // Create a new instance now that env vars are loaded
  if (azureGraphServiceModule.createAzureGraphService) {
    azureGraphService = azureGraphServiceModule.createAzureGraphService();
    console.log('✅ Azure Graph Service created with fresh instance');
  } else {
    azureGraphService = azureGraphServiceModule.default;
    console.log('✅ Azure Graph Service initialized (using default export)');
  }
} catch (error) {
  console.error('❌ Error importing Azure Graph Service:', error);
  // Create a dummy service that will fail gracefully
  azureGraphService = { isConfigured: false, getAllUsers: () => Promise.reject(new Error('Service not initialized')) };
}

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

app.use(express.json({ limit: '100mb' })); // Increase limit for large base64 data
app.use(express.urlencoded({ extended: true, limit: '100mb' })); // Increase limit for large base64 data

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit per file
        files: 10 // Maximum 10 files
    }
});

// Configure multer specifically for base64 form data (larger field size limits)
const uploadBase64 = multer({
    storage: multer.memoryStorage(),
    limits: {
        fieldSize: 100 * 1024 * 1024, // 100MB limit for form fields (base64 strings)
        fields: 10, // Maximum number of non-file fields
        fileSize: 0 // No file uploads expected
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

// Email sending route - handles both JSON and multipart/form-data
app.post('/api/email/send', (req, res, next) => {
    // Check if request has files (multipart) or is JSON
    if (req.headers['content-type']?.includes('multipart/form-data')) {
        // Use multer for multipart requests with attachments
        upload.array('attachments', 10)(req, res, next);
    } else {
        // For JSON requests, just pass through (express.json() already parsed it)
        next();
    }
}, async (req, res) => {
    try {
        console.log('Received email request:', {
            to: req.body.to,
            subject: req.body.subject,
            filesCount: req.files?.length || 0,
            bodyKeys: Object.keys(req.body),
            contentType: req.headers['content-type']
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
// Use multer to parse multipart/form-data with increased limits for large base64 strings
app.post('/api/email/send-base64', uploadBase64.none(), async (req, res) => {
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

// Azure AD B2C Users API
app.get('/api/azure-users', async (req, res) => {
    try {
        console.log('📥 Request received for /api/azure-users');
        const { search } = req.query;
        
        // Check if service is configured
        if (!azureGraphService.isConfigured) {
            console.error('❌ Azure AD B2C service is not configured');
            return res.status(500).json({
                success: false,
                error: 'Azure AD B2C is not configured',
                details: 'Please check environment variables: AZURE_AD_B2C_CLIENT_ID, AZURE_AD_B2C_CLIENT_SECRET, AZURE_AD_B2C_TENANT_ID'
            });
        }
        
        console.log('🔍 Fetching users from Azure AD B2C...');
        let users;
        if (search) {
            console.log('  Using search term:', search);
            users = await azureGraphService.searchUsers(search);
        } else {
            users = await azureGraphService.getAllUsers();
        }

        console.log(`✅ Successfully fetched ${users.length} users`);
        res.json({
            success: true,
            users: users,
            count: users.length
        });
    } catch (error) {
        console.error('❌ Error fetching Azure AD B2C users:', error);
        console.error('   Error message:', error.message);
        console.error('   Error stack:', error.stack);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch users from Azure AD B2C',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
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

// Detect if we're on a cloud platform (Render, Heroku, etc.)
const isCloudPlatform = !!(
    process.env.RENDER ||
    process.env.HEROKU_APP_NAME ||
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.K_SERVICE // Google Cloud Run
);

// Verify SMTP configuration
const requiredEnvVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM_EMAIL'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars);
    process.exit(1);
}

// Configure email transporter with cloud-optimized settings
const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;

// On cloud platforms, use port 587 with STARTTLS instead of 465 (465 is often blocked)
// Port 587 is more reliable on cloud hosting providers
const port = parseInt(smtpPort);
const usePort = isCloudPlatform && port === 465 ? 587 : port;
const isSecure = usePort === 465;

if (usePort !== port) {
    console.log(`📧 Auto-switching SMTP port from ${port} to ${usePort} for cloud compatibility`);
    console.log(`   Using STARTTLS on port ${usePort} (more reliable on cloud platforms)`);
}

const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: usePort,
    secure: isSecure, // true for 465, false for other ports
    requireTLS: !isSecure, // Require TLS for non-465 ports
    auth: {
        user: smtpUser,
        pass: smtpPass,
    },
    tls: {
        // Do not fail on invalid certificates
        rejectUnauthorized: false,
        // Explicitly set TLS version
        minVersion: 'TLSv1.2',
        // Enable SNI (Server Name Indication)
        servername: smtpHost
    },
    // Connection timeout (increased for cloud platforms)
    connectionTimeout: isCloudPlatform ? 30000 : 30000, // 30s
    // Socket timeout
    socketTimeout: isCloudPlatform ? 30000 : 30000, // 30s
    // Greeting timeout
    greetingTimeout: isCloudPlatform ? 15000 : 10000, // 15s on cloud, 10s local
    // DNS timeout
    dnsTimeout: isCloudPlatform ? 20000 : 30000, // 20s on cloud, 30s local
    // Enable connection pooling for better performance
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    // Debug mode (only in development)
    debug: process.env.NODE_ENV === 'development',
    logger: process.env.NODE_ENV === 'development'
});

// Verify email configuration on startup (non-blocking - don't exit on failure)
// This allows the server to start even if SMTP verification fails initially
// The server will still attempt to send emails and handle errors gracefully
(async () => {
    try {
        await transporter.verify();
        console.log(`✅ SMTP connection verified successfully (${smtpHost}:${usePort})`);
    } catch (error) {
        console.error('⚠️ SMTP connection verification failed:', error.message);
        console.error('   The server will continue to start, but email sending may fail.');
        console.error('   Common fixes:');
        console.error('   - Ensure SMTP credentials are correct');
        console.error('   - Check if port 465 is blocked (use 587 on cloud platforms)');
        console.error('   - Verify firewall/network allows outbound SMTP connections');
        console.error('   - For cloud platforms, consider using port 587 with STARTTLS');
        // Don't exit - allow server to start and handle errors at send time
    }
})();

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
