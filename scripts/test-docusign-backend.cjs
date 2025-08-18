#!/usr/bin/env node

/**
 * Test script for DocuSign backend integration
 * Run this to verify your backend is working before testing the frontend
 */

const fetch = require('node-fetch');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:7071/api';

async function testBackendConnection() {
  console.log('🧪 Testing DocuSign Backend Connection...\n');
  
  try {
    // Test 1: Basic connectivity
    console.log('1️⃣ Testing basic connectivity...');
    const response = await fetch(`${BACKEND_URL}/docusign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'getStatus',
        data: { envelopeId: 'test-connection' }
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Backend is responding');
    console.log('   Response:', result.success ? 'Success' : 'Failed');
    
    if (!result.success) {
      console.log('   Error:', result.error);
    }

    // Test 2: Configuration check
    console.log('\n2️⃣ Testing configuration...');
    if (result.error && result.error.includes('configuration')) {
      console.log('❌ Configuration issue detected');
      console.log('   Make sure all DocuSign environment variables are set:');
      console.log('   - DOCUSIGN_INTEGRATION_KEY');
      console.log('   - DOCUSIGN_USER_ID');
      console.log('   - DOCUSIGN_ACCOUNT_ID');
      console.log('   - DOCUSIGN_RSA_PRIVATE_KEY');
      console.log('   - DOCUSIGN_BASE_URL');
    } else {
      console.log('✅ Configuration appears valid');
    }

    // Test 3: JWT generation (if config is valid)
    if (result.success || !result.error?.includes('configuration')) {
      console.log('\n3️⃣ Testing JWT generation...');
      try {
        const jwtResponse = await fetch(`${BACKEND_URL}/docusign`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'createEnvelope',
            data: {
              documentBase64: 'JVBERi0xLjQKJcOkw7zDtsO...', // Minimal base64
              documentName: 'test.pdf',
              documentId: '1',
              emailSubject: 'Test Document',
              emailBlurb: 'Test signing',
              recipients: [{
                email: 'test@example.com',
                name: 'Test User',
                recipientId: '1',
                routingOrder: 1,
                roleName: 'signer'
              }]
            }
          }),
        });

        const jwtResult = await jwtResponse.json();
        
        if (jwtResult.success) {
          console.log('✅ JWT generation and envelope creation working');
          console.log('   Envelope ID:', jwtResult.data.envelopeId);
        } else {
          console.log('❌ JWT generation failed');
          console.log('   Error:', jwtResult.error);
        }
      } catch (jwtError) {
        console.log('❌ JWT test failed');
        console.log('   Error:', jwtError.message);
      }
    }

  } catch (error) {
    console.log('❌ Backend connection failed');
    console.log('   Error:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure Azure Function is running: npm start (in api/ directory)');
    console.log('   2. Check if the backend URL is correct:', BACKEND_URL);
    console.log('   3. Verify CORS settings in the function');
    console.log('   4. Check Azure Function logs for errors');
  }

  console.log('\n📋 Summary:');
  console.log('   - Backend URL:', BACKEND_URL);
  console.log('   - If all tests pass, your frontend should work');
  console.log('   - If tests fail, check the troubleshooting steps above');
}

// Run the test
testBackendConnection().catch(console.error); 