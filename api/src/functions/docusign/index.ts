import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import * as jwt from 'jsonwebtoken';

interface DocuSignRequest {
  action: 'createEnvelope' | 'getSigningUrl' | 'getStatus';
  data: any;
}

interface DocuSignResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// Get frontend base URL from environment (never hardcode localhost)
const FRONTEND_URL = (process.env.FRONTEND_URL ?? 'https://proptii.co').replace(/\/$/, '');
const docusignConfig = {
  integrationKey: process.env.DOCUSIGN_INTEGRATION_KEY,
  userId: process.env.DOCUSIGN_USER_ID,
  accountId: process.env.DOCUSIGN_ACCOUNT_ID,
  baseUrl: process.env.DOCUSIGN_BASE_URL || 'https://demo.docusign.net',
  privateKey: process.env.DOCUSIGN_RSA_PRIVATE_KEY
};

// Validate configuration
function validateConfig() {
  const required = ['integrationKey', 'userId', 'accountId', 'privateKey'];
  const missing = required.filter(key => !docusignConfig[key as keyof typeof docusignConfig]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required DocuSign configuration: ${missing.join(', ')}`);
  }
}

// Get JWT access token
async function getAccessToken(): Promise<string> {
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

// Generate JWT for authentication
function generateJWT(): string {
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

    // Sign the JWT with the private key
    return jwt.sign(payload, docusignConfig.privateKey!, { 
      algorithm: 'RS256',
      header: {
        alg: 'RS256',
        typ: 'JWT'
      }
    });
  } catch (error) {
    console.error('Error generating JWT:', error);
    throw new Error('Failed to generate JWT token');
  }
}

// Create envelope
async function createEnvelope(envelopeData: any): Promise<any> {
  try {
    const accessToken = await getAccessToken();
    
    const envelopeDefinition = {
      emailSubject: envelopeData.emailSubject || 'Document for Signature',
      emailBlurb: envelopeData.emailBlurb || 'Please sign this document',
      documents: envelopeData.documents || [],
      recipients: {
        signers: envelopeData.recipients?.map((recipient: any) => ({
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
async function getEmbeddedSigningUrl(request: any): Promise<string> {
  try {
    const accessToken = await getAccessToken();
    
    const recipientViewRequest = {
      returnUrl: request.returnUrl || `${FRONTEND_URL}/contracts`,
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
async function getEnvelopeStatus(envelopeId: string): Promise<any> {
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

app.http('docusign', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    // Add CORS headers
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return {
        status: 200,
        headers
      };
    }

    try {
      // Validate request
      if (!request.body) {
        return {
          status: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Request body is required'
          })
        };
      }

      const body = await request.json() as DocuSignRequest;
      const { action, data } = body;

      if (!action) {
        return {
          status: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Action is required'
          })
        };
      }

      console.log(`Processing DocuSign action: ${action}`);

      let result: any;

      // Route to appropriate function based on action
      switch (action) {
        case 'createEnvelope':
          result = await createEnvelope(data);
          break;
        case 'getSigningUrl':
          result = await getEmbeddedSigningUrl(data);
          break;
        case 'getStatus':
          result = await getEnvelopeStatus(data.envelopeId);
          break;
        default:
          return {
            status: 400,
            headers,
            body: JSON.stringify({
              success: false,
              error: `Unknown action: ${action}`
            })
          };
      }

      return {
        status: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: result
        })
      };

    } catch (error) {
      console.error('DocuSign API error:', error);
      return {
        status: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      };
    }
  }
}); 

// ---------------------------------------------------------------------------
// DocuSign Connect Webhook — POST /api/docusign/webhook
//
// Receives envelope status change notifications from DocuSign Connect.
// When an envelope is completed, updates the matching contract in Firestore.
//
// Setup: In the DocuSign Admin console, create a Connect configuration
//   pointing to <FUNCTIONS_URL>/api/docusign/webhook with HMAC enabled.
//   Set the secret as process.env.DOCUSIGN_WEBHOOK_SECRET.
//   Run: npm install firebase-admin --save  (in the api/ directory)
// ---------------------------------------------------------------------------

import * as crypto from 'crypto';

/** Lazy-initialize Firebase Admin (safe to call multiple times). */
async function getAdminFirestore() {
  // Dynamic import keeps this optional — the function still runs if firebase-admin
  // is not yet installed; it will just skip the Firestore update.
  try {
    const { getFirestore } = await import('firebase-admin/firestore');
    const { initializeApp, getApps, cert } = await import('firebase-admin/app');

    if (!getApps().length) {
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
      if (serviceAccount) {
        initializeApp({ credential: cert(JSON.parse(serviceAccount)) });
      } else {
        initializeApp(); // Application Default Credentials
      }
    }
    return getFirestore();
  } catch {
    return null; // firebase-admin not installed — webhook still returns 200
  }
}

/**
 * Validate the HMAC-SHA256 signature sent by DocuSign Connect.
 * Returns true if the secret is not configured (allows local dev without it).
 */
function validateDocuSignHmac(body: string, signature: string | null): boolean {
  const secret = process.env.DOCUSIGN_WEBHOOK_SECRET;
  if (!secret) return true; // no secret configured — skip validation (dev only)
  if (!signature) return false;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('base64');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

app.http('docusign-webhook', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'docusign/webhook',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const rawBody = await request.text();
      const hmacSignature = request.headers.get('x-docusign-signature-1');

      if (!validateDocuSignHmac(rawBody, hmacSignature)) {
        context.warn('DocuSign webhook HMAC validation failed');
        return { status: 401, body: 'Invalid signature' };
      }

      const event = JSON.parse(rawBody) as any;
      const envelopeId: string = event?.data?.envelopeId ?? event?.envelopeId ?? '';
      const status: string = (event?.data?.envelopeSummary?.status ?? event?.status ?? '').toLowerCase();

      context.log(`DocuSign webhook: envelopeId=${envelopeId} status=${status}`);

      // Only act on completed envelopes
      if (status === 'completed' && envelopeId) {
        const db = await getAdminFirestore();
        if (db) {
          try {
            for (const collectionName of ['contracts', 'signedContracts']) {
              const snap = await db
                .collection(collectionName)
                .where('envelopeId', '==', envelopeId)
                .limit(1)
                .get();

              if (!snap.empty) {
                await snap.docs[0].ref.update({
                  status: 'signed',
                  signedDate: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                });
                context.log(`Updated ${collectionName}/${snap.docs[0].id} to signed`);
                break;
              }
            }
          } catch (dbErr) {
            context.error('Failed to update contract status in Firestore:', dbErr);
          }
        }
      }

      return { status: 200, body: 'OK' };
    } catch (error) {
      context.error('DocuSign webhook error:', error);
      return { status: 200, body: 'OK' }; // always 200 to prevent DocuSign retries
    }
  },
});
