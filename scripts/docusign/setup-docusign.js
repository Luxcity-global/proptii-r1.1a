#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 DocuSign Setup Script');
console.log('========================\n');

// Check if .env.local exists
const envLocalPath = path.join(__dirname, '.env.local');
const envTemplatePath = path.join(__dirname, 'env.local.template');

if (fs.existsSync(envLocalPath)) {
  console.log('✅ .env.local file already exists');
  console.log('If you need to update your DocuSign configuration, edit the .env.local file manually.\n');
} else {
  console.log('📝 Creating .env.local file from template...');
  
  if (fs.existsSync(envTemplatePath)) {
    fs.copyFileSync(envTemplatePath, envLocalPath);
    console.log('✅ .env.local file created successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Edit .env.local and replace the placeholder values with your real DocuSign credentials');
    console.log('2. Get your credentials from: https://developers.docusign.com/');
    console.log('3. Restart your development server after making changes');
  } else {
    console.log('❌ env.local.template not found');
    console.log('Creating basic .env.local file...');
    
    const basicEnvContent = `# DocuSign Configuration
VITE_DOCUSIGN_INTEGRATION_KEY=your_integration_key_here
VITE_DOCUSIGN_USER_ID=your_user_id_here
VITE_DOCUSIGN_ACCOUNT_ID=your_account_id_here
VITE_DOCUSIGN_BASE_URL=https://demo.docusign.net
VITE_DOCUSIGN_RSA_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----\\n...\\n-----END RSA PRIVATE KEY-----
VITE_DOCUSIGN_REDIRECT_URI=http://localhost:5173/docusign/callback

# Backend API URL
VITE_API_URL=http://localhost:7071/api
`;
    
    fs.writeFileSync(envLocalPath, basicEnvContent);
    console.log('✅ Basic .env.local file created!');
  }
}

// Check backend configuration
const apiSettingsPath = path.join(__dirname, 'api', 'local.settings.json');

if (fs.existsSync(apiSettingsPath)) {
  console.log('\n🔍 Checking backend configuration...');
  const settings = JSON.parse(fs.readFileSync(apiSettingsPath, 'utf8'));
  
  const hasDocuSignConfig = settings.Values && 
    settings.Values.DOCUSIGN_INTEGRATION_KEY && 
    settings.Values.DOCUSIGN_USER_ID && 
    settings.Values.DOCUSIGN_ACCOUNT_ID;
  
  if (hasDocuSignConfig && !settings.Values.DOCUSIGN_INTEGRATION_KEY.includes('your_')) {
    console.log('✅ Backend DocuSign configuration appears to be set up');
  } else {
    console.log('⚠️  Backend DocuSign configuration needs to be updated');
    console.log('   Edit api/local.settings.json and add your DocuSign credentials');
  }
} else {
  console.log('⚠️  Backend settings file not found at api/local.settings.json');
}

console.log('\n📚 Documentation:');
console.log('- DocuSign Developer Portal: https://developers.docusign.com/');
console.log('- Setup Guide: DOCUSIGN_SETUP_GUIDE.md');
console.log('- Test Integration: node test-docusign-integration.js');

console.log('\n🚀 Ready to test!');
console.log('1. Start the backend: cd api && npm start');
console.log('2. Start the frontend: npm run dev');
console.log('3. Test the integration: node test-docusign-integration.js'); 