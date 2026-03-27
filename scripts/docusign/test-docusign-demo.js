#!/usr/bin/env node

import express from 'express';
import cors from 'cors';

console.log('🎭 DocuSign Demo Mode Server');
console.log('============================\n');

const app = express();
const PORT = 7072;

app.use(cors());
app.use(express.json());

// Demo mode endpoints
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        mode: 'demo',
        message: 'DocuSign Demo Server is running',
        timestamp: new Date().toISOString()
    });
});

app.post('/api/docusign', (req, res) => {
    const { action, data } = req.body;
    
    console.log(`🎭 Demo: Processing ${action}`);
    
    switch (action) {
        case 'createEnvelope':
            // Simulate envelope creation
            const envelopeId = 'demo-envelope-' + Date.now();
            res.json({
                success: true,
                mode: 'demo',
                envelopeId,
                message: 'Demo envelope created successfully',
                data: {
                    envelopeId,
                    status: 'created',
                    uri: `https://demo.docusign.net/restapi/v2.1/accounts/demo/envelopes/${envelopeId}`,
                    signingUrl: `https://demo.docusign.net/Member/PowerFormSigning.aspx?PowerFormId=demo&Signer=demo&EnvelopeId=${envelopeId}`
                }
            });
            break;
            
        case 'getStatus':
            // Simulate envelope status
            res.json({
                success: true,
                mode: 'demo',
                status: 'sent',
                message: 'Demo envelope status retrieved',
                data: {
                    envelopeId: data?.envelopeId || 'demo-envelope-123',
                    status: 'sent',
                    statusChangedDateTime: new Date().toISOString(),
                    recipients: {
                        signers: [
                            {
                                email: 'demo@example.com',
                                name: 'Demo Signer',
                                status: 'sent',
                                recipientId: '1'
                            }
                        ]
                    }
                }
            });
            break;
            
        case 'getSigningUrl':
            // Simulate signing URL generation
            res.json({
                success: true,
                mode: 'demo',
                signingUrl: 'https://demo.docusign.net/Member/PowerFormSigning.aspx?PowerFormId=demo&Signer=demo&EnvelopeId=demo-envelope-123',
                message: 'Demo signing URL generated'
            });
            break;
            
        default:
            res.status(400).json({
                success: false,
                mode: 'demo',
                error: `Unknown action: ${action}`,
                supportedActions: ['createEnvelope', 'getStatus', 'getSigningUrl']
            });
    }
});

app.listen(PORT, () => {
    console.log(`🎭 DocuSign Demo Server running on http://localhost:${PORT}`);
    console.log('Available endpoints:');
    console.log(`  GET  http://localhost:${PORT}/api/health`);
    console.log(`  POST http://localhost:${PORT}/api/docusign`);
    console.log('\n🎭 DEMO MODE - No real DocuSign credentials required');
    console.log('🎭 All responses are simulated for testing purposes');
    console.log('\n📝 To test the frontend:');
    console.log('1. Update your .env.local to use: VITE_API_URL=http://localhost:7072/api');
    console.log('2. Restart your frontend development server');
    console.log('3. Test the DocuSign integration in your app');
}); 