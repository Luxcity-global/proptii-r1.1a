#!/usr/bin/env node

console.log('🧪 Testing DocuSign Backend Function');
console.log('====================================\n');

async function testDocuSignBackend() {
  try {
    const response = await fetch('http://localhost:7071/api/docusign', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'createEnvelope',
        data: {
          emailSubject: 'Test Document',
          emailBlurb: 'Please sign this test document',
          documents: [{
            documentBase64: 'dGVzdCBkb2N1bWVudA==', // "test document" in base64
            name: 'test.pdf',
            fileExtension: 'pdf',
            documentId: '1'
          }],
          recipients: [{
            email: 'test@example.com',
            name: 'Test User',
            recipientId: '1',
            routingOrder: 1,
            roleName: 'signer'
          }],
          status: 'created'
        }
      })
    });

    console.log('📡 Response Status:', response.status);
    console.log('📡 Response Headers:', Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const data = await response.json();
      console.log('✅ DocuSign Backend Function is working!');
      console.log('📄 Response:', JSON.stringify(data, null, 2));
      
      if (data.success) {
        console.log('🎉 DocuSign integration is functional!');
        console.log('🔗 Envelope ID:', data.data?.envelopeId || 'Mock envelope');
      } else {
        console.log('⚠️  Backend returned error:', data.error);
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Backend function failed:');
      console.log('   Status:', response.status, response.statusText);
      console.log('   Response:', errorText);
    }

  } catch (error) {
    console.log('❌ Failed to connect to backend:');
    console.log('   Error:', error.message);
    console.log('   Make sure the backend API is running on port 7071');
  }
}

testDocuSignBackend(); 