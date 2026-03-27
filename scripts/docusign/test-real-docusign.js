#!/usr/bin/env node

import fetch from 'node-fetch';

console.log('🧪 Testing Real DocuSign Server');
console.log('===============================\n');

async function testServer() {
    try {
        // Test health endpoint
        console.log('1. Testing health endpoint...');
        const healthResponse = await fetch('http://localhost:7071/api/health');
        const healthData = await healthResponse.json();
        console.log('✅ Health check:', healthData);
        
        // Test DocuSign endpoint
        console.log('\n2. Testing DocuSign endpoint...');
        const docusignResponse = await fetch('http://localhost:7071/api/docusign', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'createEnvelope',
                data: {
                    subject: 'Test Document',
                    emailBlurb: 'Please sign this test document'
                }
            })
        });
        
        const docusignData = await docusignResponse.json();
        console.log('✅ DocuSign response:', docusignData);
        
        if (docusignData.success) {
            console.log('\n🎉 Real DocuSign integration is working!');
            console.log('You can now test it in your frontend app.');
        } else {
            console.log('\n❌ DocuSign integration failed:', docusignData.error);
        }
        
    } catch (error) {
        console.log('❌ Error testing server:', error.message);
    }
}

testServer(); 