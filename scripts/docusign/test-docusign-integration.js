// Test script for DocuSign integration
import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:7071/api';

async function testDocuSignIntegration() {
  console.log('Testing DocuSign Integration...\n');

  try {
    // Test 1: Check if backend is running
    console.log('1. Testing backend connectivity...');
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    if (healthResponse.ok) {
      console.log('✅ Backend is running');
    } else {
      console.log('❌ Backend is not responding');
      return;
    }

    // Test 2: Test DocuSign endpoint with mock data
    console.log('\n2. Testing DocuSign endpoint...');
    const testEnvelopeId = 'test-envelope-' + Date.now();
    
    const response = await fetch(`${API_BASE_URL}/docusign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'getStatus',
        data: { envelopeId: testEnvelopeId }
      }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ DocuSign endpoint is responding');
      console.log('Response:', JSON.stringify(result, null, 2));
    } else {
      console.log('❌ DocuSign endpoint failed');
      console.log('Status:', response.status);
      const errorText = await response.text();
      console.log('Error:', errorText);
    }

    // Test 3: Test envelope creation (will fail without real credentials)
    console.log('\n3. Testing envelope creation...');
    const createResponse = await fetch(`${API_BASE_URL}/docusign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'createEnvelope',
        data: {
          emailSubject: 'Test Document',
          emailBlurb: 'Please sign this test document',
          documents: [],
          recipients: [
            {
              email: 'test@example.com',
              name: 'Test User',
              recipientId: '1',
              routingOrder: 1,
              roleName: 'signer'
            }
          ],
          status: 'created'
        }
      }),
    });

    if (createResponse.ok) {
      const result = await createResponse.json();
      console.log('✅ Envelope creation endpoint is responding');
      console.log('Response:', JSON.stringify(result, null, 2));
    } else {
      const errorText = await createResponse.text();
      console.log('⚠️  Envelope creation failed (expected without real credentials)');
      console.log('Error:', errorText);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testDocuSignIntegration(); 