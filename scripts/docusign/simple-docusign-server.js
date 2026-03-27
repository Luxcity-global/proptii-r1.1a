#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const app = express();
const PORT = 7071;

// Environment variables (these should match your .env.local but without VITE_ prefix)
const docusignConfig = {
  integrationKey: process.env.VITE_DOCUSIGN_INTEGRATION_KEY || 'f749bcec-ea3c-4757-9bc1-8f7477f635d5',
  userId: process.env.VITE_DOCUSIGN_USER_ID || 'c654630c-87b4-467a-b31d-05ea2c4fcc30',
  accountId: process.env.VITE_DOCUSIGN_ACCOUNT_ID || '6b416538-fd8b-4ec5-99e8-03d430546414',
  apiBaseUrl: process.env.VITE_DOCUSIGN_API_BASE_URL || 'https://demo.docusign.net',
  oauthBaseUrl: process.env.VITE_DOCUSIGN_OAUTH_BASE_URL || 'https://account-d.docusign.com',
  privateKey: process.env.VITE_DOCUSIGN_RSA_PRIVATE_KEY || '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCYYvI7oJFnfl2K\nuM0ZhLbvI1wEA2dseTj9PVZUgbZhs3WKHxCOUoWawkuV5esW1ZJTkqduwdJBn4GX\n9tDZZzEfg4u9gMNIqHgNWKl3XGJ8gu+wuD3qLxvSNvZPHTEk6UvHXQOLOf6o465K\nXlK4eAvUGYZyzr2lD315G/wVv1mBf3LomVV+4tnT7SdzS0X2JArtrfkDi9MHWmzd\nexDUiKqE0Fd9ZbH5ybQtO0FR8I8oeIQPV4Qa3R+WT59IhBPTef/1OvSSssnlieZH\nILNOERHbTYIuw5pnI3oW90wX8viBwVgjaIbmXaSr77YboewpgSbYk9TxK9Gd5Vkr\nOf7laQoVAgMBAAECggEAEw/diUPurGmMPfwb++M0FvnvWrkqSNFpJZR0piGLtPED\n9QEpywPbnp5LYjbej36rzTR9KUepi3fueBnxyiA0buK/qjbfNsmMKu86U6oEz9p5\nLTv+0rqN2l/xs7fNG/bq+cdS2CmrB2ljtf3SjyzFHgULYnUmF+22Hl43zGihQ6eB\nlvf7CZCKI+Y+P/HK5uwqZgkwbyLeWNyOOOmQLEEXP2yyGDKdSFJ4tZeJQ1eqA3aE\nMeW4euHvipA40M03DIAs97Irowgwdy6EZHVRHhX6l3VPQ60eGgnbGfXOsJ6PeZrJ\n3xAhJ3E85yAxe7nxmrMV+j8ygvejHTscbJ5J96egCQKBgQDpdi/VDpHSCB9jiGqC\nL/eOgJ6bOwaqbNdBopToRXiZ9G7RGE4yWwLFoGEPpDJRQSiAAlTZlxR8gamcjEG0\nJIxyD4WhONkq9qLzo9CbPaaC4eWazJDgCFBZ3WQWpso9YXxsOySCn3rMDk9C6jrh\nWSJrIITibSv+qALr/soRLufzSwKBgQCnGQ2xmrx2A6A7Qv/nKdFC9jjyOhVxrvgc\noeSQLRhS/80WEwE39LjI82UAz+BspYgcRSjQV92LxQbVjIsTP4ilEmPX9116OtDa\nMBgF+JZBXHYe7+Uas4OWBPXNwS+5D1X85kRieKZhMRwHJk2061QoSQpdTqiip/86\niBkJUcc8HwKBgQCJu3gsshPFXZVnGyv68mGSaL8pxYEBOoUj68792T51VYerRDOd\n8aOJBD0/BRfKaC6EltuII2GqsrRl7zk0FfvlrtKfcvJsLmWkZ5jCfXSm8q6KzPUL\nttvwqHRMCMp3u/OzxpCbn4rKqAaK67UhDX0Ixn6fNtklu+k9YWvFB29AUQKBgB8B\nBwltLIq5IYHdbJ33pFxIU0ieflwZmu+1GjOmKl08GVF/NTqsrZybjKIZ8Ao4rIiS\nTIBbzT+hzyLQcP2hTDlUsDHiM/X588aIJez1suttvH0BBgFuTXwIb5M9xR0RO2Mx\nVn7u4/AkrI6nDMQE5hiTdNjbP27uvOyfVAXmppEBAoGAQgsEYQQm4wYhkQwJBi+A\nIf/79EHJkWIFF6pwNo7TPls9Xq779IpHiC56mKXIBoZKLcQaYyC4BR4uWNkudqdU\nug5SwNmXMJp80CXWvOYHuiIjDto/D0mXg8mzs6yUzenR60ER4gyWMP7pVXqx2feo\nJP8RCYDSqGdLn7i96FIAfzo=\n-----END PRIVATE KEY-----'
};

const privateKey = process.env.VITE_DOCUSIGN_RSA_PRIVATE_KEY.replace(/\\n/g, '\n');

// Middleware
app.use(cors());
app.use(express.json());

// Generate JWT for DocuSign authentication
function generateJWT() {
  if (!docusignConfig.privateKey) {
    throw new Error('DocuSign private key is not configured. Please set DOCUSIGN_RSA_PRIVATE_KEY environment variable.');
  }

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: docusignConfig.integrationKey,
    sub: docusignConfig.userId,
    aud: docusignConfig.oauthBaseUrl, // FIXED
    iat: now,
    exp: now + 3600, // 1 hour
    scope: 'signature extended impersonation'
  };

  return jwt.sign(payload, docusignConfig.privateKey, { 
    algorithm: 'RS256',
    header: { alg: 'RS256', typ: 'JWT' }
  });
}

// Get DocuSign access token
async function getAccessToken() {
  try {
    const jwtToken = generateJWT();
    
    const response = await fetch(`${docusignConfig.oauthBaseUrl}/oauth/token`, {
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
      throw new Error(`Failed to get access token: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error getting access token:', error);
    throw error;
  }
}

// DocuSign API endpoint
app.post('/api/docusign', async (req, res) => {
  try {
    const { action, data } = req.body;
    
    console.log(`Processing DocuSign action: ${action}`);

    switch (action) {
      case 'createEnvelope':
        // Create envelope logic
        const accessToken = await getAccessToken();
        
        const envelopeDefinition = {
          emailSubject: data.emailSubject || 'Document for Signature',
          emailBlurb: data.emailBlurb || 'Please sign this document',
          documents: data.documents || [],
          recipients: {
            signers: data.recipients?.map((recipient) => ({
              email: recipient.email,
              name: recipient.name,
              recipientId: recipient.recipientId || '1',
              routingOrder: recipient.routingOrder || 1,
              roleName: recipient.roleName || 'signer'
            })) || []
          },
          status: data.status || 'created'
        };

        const createResponse = await fetch(
          `${docusignConfig.apiBaseUrl}/restapi/v2.1/accounts/${docusignConfig.accountId}/envelopes`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(envelopeDefinition),
          }
        );

        if (!createResponse.ok) {
          const errorText = await createResponse.text();
          throw new Error(`Failed to create envelope: ${createResponse.status} ${errorText}`);
        }

        const envelopeResult = await createResponse.json();
        
        res.json({
          success: true,
          data: {
            envelopeId: envelopeResult.envelopeId,
            status: envelopeResult.status,
            created: envelopeResult.created,
            lastModified: envelopeResult.lastModified,
            uri: envelopeResult.uri
          }
        });
        break;

      case 'getSigningUrl':
        // Get embedded signing URL
        const signingAccessToken = await getAccessToken();
        
        const recipientViewRequest = {
          returnUrl: data.returnUrl || 'http://localhost:5173/contracts',
          authenticationMethod: data.authenticationMethod || 'none',
          clientUserId: data.clientUserId || '1000',
          email: data.email || 'user@example.com',
          userName: data.userName || 'User Name'
        };

        const signingResponse = await fetch(
          `${docusignConfig.apiBaseUrl}/restapi/v2.1/accounts/${docusignConfig.accountId}/envelopes/${data.envelopeId}/views/recipient`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${signingAccessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(recipientViewRequest),
          }
        );

        if (!signingResponse.ok) {
          const errorText = await signingResponse.text();
          throw new Error(`Failed to get signing URL: ${signingResponse.status} ${errorText}`);
        }

        const signingResult = await signingResponse.json();
        
        res.json({
          success: true,
          data: signingResult.url
        });
        break;

      case 'getStatus':
        // Get envelope status
        const statusAccessToken = await getAccessToken();
        
        const statusResponse = await fetch(`${docusignConfig.apiBaseUrl}/restapi/v2.1/accounts/${docusignConfig.accountId}/envelopes`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${statusAccessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!statusResponse.ok) {
          const errorText = await statusResponse.text();
          throw new Error(`Failed to get status: ${statusResponse.status} ${errorText}`);
        }

        const statusResult = await statusResponse.json();
        
        res.json({
          success: true,
          data: {
            envelopeId: statusResult.envelopeId,
            status: statusResult.status,
            created: statusResult.created,
            lastModified: statusResult.lastModified,
            uri: statusResult.uri
          }
        });
        break;

      default:
        res.status(400).json({
          success: false,
          error: `Unknown action: ${action}`
        });
    }

  } catch (error) {
    console.error('DocuSign API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// DocuSign GET endpoint for browser testing
app.get('/api/docusign', (req, res) => {
  res.json({ 
    message: 'DocuSign API endpoint is running',
    usage: 'Send POST requests to this endpoint with action and data',
    example: {
      method: 'POST',
      body: {
        action: 'createEnvelope',
        data: { emailSubject: 'Test Document' }
      }
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 DocuSign API Server running on http://localhost:${PORT}`);
  console.log(`📄 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔗 DocuSign endpoint: http://localhost:${PORT}/api/docusign`);
}).on('error', (err) => {
  console.error('❌ Server failed to start:', err);
  process.exit(1);
}); 