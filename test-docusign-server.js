// Simple Express server to test DocuSign integration
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';

const app = express();
const PORT = 7071;

// Middleware
app.use(cors());
app.use(express.json());

// DocuSign configuration (using environment variables or defaults)
// Note: .env.local uses VITE_ prefix, but we need to access them without the prefix
const docusignConfig = {
  integrationKey: process.env.VITE_DOCUSIGN_INTEGRATION_KEY || process.env.DOCUSIGN_INTEGRATION_KEY || 'your_integration_key_here',
  userId: process.env.VITE_DOCUSIGN_USER_ID || process.env.DOCUSIGN_USER_ID || 'your_user_id_here',
  accountId: process.env.VITE_DOCUSIGN_ACCOUNT_ID || process.env.DOCUSIGN_ACCOUNT_ID || 'your_account_id_here',
  baseUrl: process.env.VITE_DOCUSIGN_BASE_URL || process.env.DOCUSIGN_BASE_URL || 'https://demo.docusign.net',
  privateKey: process.env.VITE_DOCUSIGN_RSA_PRIVATE_KEY || process.env.DOCUSIGN_RSA_PRIVATE_KEY || '-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----'
};

// Debug: Log what we're detecting
console.log('🔍 DocuSign Configuration Detection:');
console.log('  Integration Key:', docusignConfig.integrationKey ? 'Set' : 'Not set');
console.log('  User ID:', docusignConfig.userId ? 'Set' : 'Not set');
console.log('  Account ID:', docusignConfig.accountId ? 'Set' : 'Not set');
console.log('  Base URL:', docusignConfig.baseUrl);
console.log('  Private Key:', docusignConfig.privateKey ? 'Set' : 'Not set');

// Check if we're in demo mode (no real credentials)
const isDemoMode = !docusignConfig.integrationKey || 
                  docusignConfig.integrationKey.includes('your_') ||
                  !docusignConfig.userId || 
                  docusignConfig.userId.includes('your_') ||
                  !docusignConfig.accountId || 
                  docusignConfig.accountId.includes('your_');

if (isDemoMode) {
  console.log('🎭 Running in DEMO MODE - No real DocuSign credentials configured');
  console.log('   To use real DocuSign integration, configure your credentials in .env.local');
} else {
  console.log('✅ Running in PRODUCTION MODE - Real DocuSign credentials detected');
}

// Validate configuration
function validateConfig() {
  if (isDemoMode) {
    throw new Error('DEMO_MODE: No real DocuSign credentials configured');
  }
  
  const required = ['integrationKey', 'userId', 'accountId', 'privateKey'];
  const missing = required.filter(key => !docusignConfig[key] || docusignConfig[key].includes('your_'));
  
  if (missing.length > 0) {
    throw new Error(`Missing required DocuSign configuration: ${missing.join(', ')}`);
  }
}

// Generate JWT for authentication
function generateJWT() {
  try {
    validateConfig();
    
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: docusignConfig.integrationKey,
      sub: docusignConfig.userId,
      aud: docusignConfig.baseUrl,
      iat: now,
      exp: now + 3600, // 1 hour expiration
      scope: 'signature extended impersonation'
    };

    // Clean up the private key - remove any extra formatting
    let privateKey = docusignConfig.privateKey;
    
    // If the key contains \n, convert them to actual newlines
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }
    
    // Ensure the key has proper formatting
    if (!privateKey.includes('-----BEGIN RSA PRIVATE KEY-----')) {
      throw new Error('Invalid private key format - missing BEGIN marker');
    }
    
    if (!privateKey.includes('-----END RSA PRIVATE KEY-----')) {
      throw new Error('Invalid private key format - missing END marker');
    }

    console.log('🔑 Using private key for JWT signing...');
    console.log('   Key length:', privateKey.length, 'characters');
    console.log('   Contains BEGIN marker:', privateKey.includes('-----BEGIN RSA PRIVATE KEY-----'));
    console.log('   Contains END marker:', privateKey.includes('-----END RSA PRIVATE KEY-----'));

    // Sign the JWT with the private key
    const token = jwt.sign(payload, privateKey, { 
      algorithm: 'RS256',
      header: {
        alg: 'RS256',
        typ: 'JWT'
      }
    });
    
    console.log('✅ JWT generated successfully');
    return token;
  } catch (error) {
    console.error('❌ Error generating JWT:', error.message);
    if (error.message.includes('Invalid private key')) {
      throw new Error(`Private key format error: ${error.message}`);
    } else if (error.message.includes('PEM')) {
      throw new Error('Private key PEM format error - check key formatting');
    } else {
      throw new Error(`JWT generation failed: ${error.message}`);
    }
  }
}

// Get JWT access token
async function getAccessToken() {
  try {
    validateConfig();
    
    const jwtToken = generateJWT();
    const response = await fetch(`${docusignConfig.baseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwtToken,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DocuSign OAuth error:', errorText);
      throw new Error(`Failed to get access token: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error getting access token:', error);
    throw error;
  }
}

// Demo mode functions
function createDemoEnvelope(data) {
  const demoEnvelope = {
    envelopeId: `demo-envelope-${Date.now()}`,
    status: 'created',
    created: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    uri: `/envelopes/demo-envelope-${Date.now()}`
  };
  
  console.log('🎭 Created demo envelope:', demoEnvelope);
  return demoEnvelope;
}

function getDemoSigningUrl(envelopeId) {
  const demoUrl = `https://demo.docusign.net/Signing/?ti=${envelopeId}&returnUrl=${encodeURIComponent('http://localhost:5173/contract')}`;
  console.log('🎭 Generated demo signing URL:', demoUrl);
  return demoUrl;
}

function getDemoEnvelopeStatus(envelopeId) {
  const demoStatus = {
    envelopeId,
    status: 'sent',
    created: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    uri: `/envelopes/${envelopeId}`
  };
  console.log('🎭 Demo envelope status:', demoStatus);
  return demoStatus;
}

// Create envelope
async function createEnvelope(envelopeData) {
  if (isDemoMode) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    return createDemoEnvelope(envelopeData);
  }

  try {
    const accessToken = await getAccessToken();
    
    const envelopeDefinition = {
      emailSubject: envelopeData.emailSubject || 'Document for Signature',
      emailBlurb: envelopeData.emailBlurb || 'Please sign this document',
      documents: envelopeData.documents || [],
      recipients: {
        signers: envelopeData.recipients?.map((recipient) => ({
          email: recipient.email,
          name: recipient.name,
          recipientId: recipient.recipientId || '1',
          routingOrder: recipient.routingOrder || 1,
          roleName: recipient.roleName || 'signer'
        })) || []
      },
      status: envelopeData.status || 'created'
    };

    console.log('Creating envelope with definition:', JSON.stringify(envelopeDefinition, null, 2));

    const response = await fetch(`${docusignConfig.baseUrl}/restapi/v2.1/accounts/${docusignConfig.accountId}/envelopes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(envelopeDefinition),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DocuSign envelope creation error:', errorText);
      throw new Error(`Failed to create envelope: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Envelope created successfully:', data);
    
    return {
      envelopeId: data.envelopeId,
      status: data.status,
      created: data.created,
      lastModified: data.lastModified,
      uri: data.uri
    };
  } catch (error) {
    console.error('Error creating envelope:', error);
    throw error;
  }
}

// Get embedded signing URL
async function getEmbeddedSigningUrl(request) {
  if (isDemoMode) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return getDemoSigningUrl(request.envelopeId);
  }

  try {
    const accessToken = await getAccessToken();
    
    const recipientViewRequest = {
      returnUrl: request.returnUrl || 'http://localhost:5173/contract',
      authenticationMethod: request.authenticationMethod || 'none',
      clientUserId: request.clientUserId || '1000',
      email: request.email || 'user@example.com',
      userName: request.userName || 'User Name'
    };

    console.log('Getting signing URL for envelope:', request.envelopeId);

    const response = await fetch(
      `${docusignConfig.baseUrl}/restapi/v2.1/accounts/${docusignConfig.accountId}/envelopes/${request.envelopeId}/views/recipient`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recipientViewRequest),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DocuSign signing URL error:', errorText);
      throw new Error(`Failed to get embedded signing URL: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Signing URL generated successfully');
    return data.url || '';
  } catch (error) {
    console.error('Error getting signing URL:', error);
    throw error;
  }
}

// Get envelope status
async function getEnvelopeStatus(envelopeId) {
  if (isDemoMode) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    return getDemoEnvelopeStatus(envelopeId);
  }

  try {
    const accessToken = await getAccessToken();
    
    const response = await fetch(
      `${docusignConfig.baseUrl}/restapi/v2.1/accounts/${docusignConfig.accountId}/envelopes/${envelopeId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DocuSign status check error:', errorText);
      throw new Error(`Failed to get envelope status: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return {
      envelopeId: data.envelopeId,
      status: data.status,
      created: data.created,
      lastModified: data.lastModified,
      uri: data.uri
    };
  } catch (error) {
    console.error('Error getting envelope status:', error);
    throw error;
  }
}

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'DocuSign test server is running',
    mode: isDemoMode ? 'demo' : 'production',
    configStatus: isDemoMode ? 'missing_credentials' : 'configured'
  });
});

// DocuSign endpoint
app.post('/api/docusign', async (req, res) => {
  try {
    const { action, data } = req.body;

    if (!action) {
      return res.status(400).json({
        success: false,
        error: 'Action is required'
      });
    }

    console.log(`Processing DocuSign action: ${action}${isDemoMode ? ' (DEMO MODE)' : ''}`);

    let result;

    switch (action) {
      case 'createEnvelope':
        try {
          result = await createEnvelope(data);
        } catch (error) {
          if (isDemoMode && error.message.includes('DEMO_MODE')) {
            // In demo mode, create a mock envelope
            result = createDemoEnvelope(data);
          } else {
            throw error;
          }
        }
        break;

      case 'getSigningUrl':
        try {
          result = await getEmbeddedSigningUrl(data);
        } catch (error) {
          if (isDemoMode && error.message.includes('DEMO_MODE')) {
            // In demo mode, return a mock URL
            result = getDemoSigningUrl(data.envelopeId);
          } else {
            throw error;
          }
        }
        break;

      case 'getStatus':
        try {
          result = await getEnvelopeStatus(data.envelopeId);
        } catch (error) {
          if (isDemoMode && error.message.includes('DEMO_MODE')) {
            // In demo mode, return mock status
            result = getDemoEnvelopeStatus(data.envelopeId);
          } else {
            throw error;
          }
        }
        break;

      default:
        return res.status(400).json({
          success: false,
          error: `Unknown action: ${action}`
        });
    }

    return res.json({
      success: true,
      data: result,
      mode: isDemoMode ? 'demo' : 'production'
    });

  } catch (error) {
    console.error('DocuSign API error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      mode: isDemoMode ? 'demo' : 'production'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`DocuSign test server running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log(`  GET  http://localhost:${PORT}/api/health`);
  console.log(`  POST http://localhost:${PORT}/api/docusign`);
  console.log(`\nMode: ${isDemoMode ? 'DEMO' : 'PRODUCTION'}`);
  if (isDemoMode) {
    console.log('Note: Running in demo mode. Configure real credentials in .env.local for production use.');
  }
}); 