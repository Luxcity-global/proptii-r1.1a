#!/usr/bin/env node

import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔧 Setting up Simple DocuSign Server');
console.log('====================================\n');

try {
  // Read frontend .env.local
  const envLocalPath = join(__dirname, '.env.local');
  
  if (!fs.existsSync(envLocalPath)) {
    console.log('❌ .env.local file not found');
    console.log('Please ensure .env.local exists with DocuSign credentials.');
    process.exit(1);
  }

  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  const envLines = envContent.split('\n');
  
  // Extract DocuSign variables
  const config = {};
  
  for (const line of envLines) {
    if (line.startsWith('VITE_DOCUSIGN_')) {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=').replace(/^["']|["']$/g, ''); // Remove quotes
      
      // Convert VITE_DOCUSIGN_* to environment variables
      const envKey = key.replace('VITE_', '');
      config[envKey] = value;
    }
  }

  console.log('✅ Found DocuSign configuration:');
  console.log('   Integration Key:', config.DOCUSIGN_INTEGRATION_KEY ? 'Set' : 'Missing');
  console.log('   User ID:', config.DOCUSIGN_USER_ID ? 'Set' : 'Missing');
  console.log('   Account ID:', config.DOCUSIGN_ACCOUNT_ID ? 'Set' : 'Missing');
  console.log('   Base URL:', config.DOCUSIGN_BASE_URL || 'Missing');
  console.log('   Private Key:', config.DOCUSIGN_RSA_PRIVATE_KEY ? `Set (${config.DOCUSIGN_RSA_PRIVATE_KEY.length} chars)` : 'Missing');

  // Update the simple server file with the credentials
  const serverPath = join(__dirname, 'simple-docusign-server.js');
  let serverContent = fs.readFileSync(serverPath, 'utf8');

  // Replace the placeholder credentials
  serverContent = serverContent.replace(
    /integrationKey: process\.env\.DOCUSIGN_INTEGRATION_KEY \|\| '[^']*'/,
    `integrationKey: process.env.DOCUSIGN_INTEGRATION_KEY || '${config.DOCUSIGN_INTEGRATION_KEY}'`
  );
  
  serverContent = serverContent.replace(
    /userId: process\.env\.DOCUSIGN_USER_ID \|\| '[^']*'/,
    `userId: process.env.DOCUSIGN_USER_ID || '${config.DOCUSIGN_USER_ID}'`
  );
  
  serverContent = serverContent.replace(
    /accountId: process\.env\.DOCUSIGN_ACCOUNT_ID \|\| '[^']*'/,
    `accountId: process.env.DOCUSIGN_ACCOUNT_ID || '${config.DOCUSIGN_ACCOUNT_ID}'`
  );
  
  serverContent = serverContent.replace(
    /baseUrl: process\.env\.DOCUSIGN_BASE_URL \|\| '[^']*'/,
    `baseUrl: process.env.DOCUSIGN_BASE_URL || '${config.DOCUSIGN_BASE_URL}'`
  );

  // Replace the private key (this is trickier due to multiline)
  const privateKeyRegex = /privateKey: process\.env\.DOCUSIGN_RSA_PRIVATE_KEY \|\| `[^`]*`/s;
  serverContent = serverContent.replace(
    privateKeyRegex,
    `privateKey: process.env.DOCUSIGN_RSA_PRIVATE_KEY || \`${config.DOCUSIGN_RSA_PRIVATE_KEY}\``
  );

  fs.writeFileSync(serverPath, serverContent);
  
  console.log('\n✅ Simple DocuSign server configured!');
  console.log('\n🚀 Next steps:');
  console.log('1. Install dependencies: npm install --package-lock-only');
  console.log('2. Start the server: node simple-docusign-server.js');
  console.log('3. Test at: http://localhost:7071/api/health');

} catch (error) {
  console.error('❌ Error setting up server:', error.message);
  process.exit(1);
} 