#!/usr/bin/env node

import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔧 Copying DocuSign credentials from frontend to backend...');
console.log('=======================================================\n');

// Paths
const frontendEnvPath = join(__dirname, '.env.local');
const backendSettingsPath = join(__dirname, 'api', 'local.settings.json');

// Check if frontend .env.local exists
if (!fs.existsSync(frontendEnvPath)) {
  console.log('❌ Frontend .env.local file not found');
  console.log('Please ensure .env.local exists in the project root with DocuSign credentials.');
  process.exit(1);
}

// Check if backend local.settings.json exists
if (!fs.existsSync(backendSettingsPath)) {
  console.log('❌ Backend local.settings.json file not found');
  console.log('Expected location:', backendSettingsPath);
  process.exit(1);
}

try {
  // Read frontend environment variables
  console.log('📄 Reading frontend .env.local...');
  const envContent = fs.readFileSync(frontendEnvPath, 'utf8');
  const envLines = envContent.split('\n');
  
  // Extract DocuSign variables
  const docusignVars = {};
  
  for (const line of envLines) {
    if (line.startsWith('VITE_DOCUSIGN_')) {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('='); // Handle values with = in them
      
      // Convert VITE_DOCUSIGN_* to DOCUSIGN_* for backend
      const backendKey = key.replace('VITE_', '');
      docusignVars[backendKey] = value;
    }
  }
  
  console.log('✅ Found DocuSign variables:');
  Object.keys(docusignVars).forEach(key => {
    console.log(`  - ${key}: ${key === 'DOCUSIGN_RSA_PRIVATE_KEY' ? 'Set (private key)' : docusignVars[key] || 'Not set'}`);
  });
  
  // Read backend settings
  console.log('\n📄 Reading backend local.settings.json...');
  const settingsContent = fs.readFileSync(backendSettingsPath, 'utf8');
  const settings = JSON.parse(settingsContent);
  
  // Update DocuSign values
  console.log('🔄 Updating backend settings...');
  let updated = false;
  
  for (const [key, value] of Object.entries(docusignVars)) {
    if (value && value.trim()) {
      // Remove quotes if present
      const cleanValue = value.replace(/^["']|["']$/g, '');
      settings.Values[key] = cleanValue;
      updated = true;
      console.log(`  ✅ Updated ${key}`);
    }
  }
  
  if (!updated) {
    console.log('⚠️  No DocuSign variables found to update');
    process.exit(0);
  }
  
  // Create backup
  const backupPath = backendSettingsPath + '.backup-' + Date.now();
  fs.writeFileSync(backupPath, settingsContent);
  console.log(`📦 Created backup: ${backupPath.split('\\').pop()}`);
  
  // Write updated settings
  fs.writeFileSync(backendSettingsPath, JSON.stringify(settings, null, 2));
  console.log('✅ Updated backend local.settings.json');
  
  // Verify the update
  console.log('\n🔍 Verification:');
  const updatedSettings = JSON.parse(fs.readFileSync(backendSettingsPath, 'utf8'));
  
  console.log('Backend DocuSign configuration:');
  console.log(`  - DOCUSIGN_INTEGRATION_KEY: ${updatedSettings.Values.DOCUSIGN_INTEGRATION_KEY ? 'Set' : 'Missing'}`);
  console.log(`  - DOCUSIGN_USER_ID: ${updatedSettings.Values.DOCUSIGN_USER_ID ? 'Set' : 'Missing'}`);
  console.log(`  - DOCUSIGN_ACCOUNT_ID: ${updatedSettings.Values.DOCUSIGN_ACCOUNT_ID ? 'Set' : 'Missing'}`);
  console.log(`  - DOCUSIGN_BASE_URL: ${updatedSettings.Values.DOCUSIGN_BASE_URL || 'Not set'}`);
  console.log(`  - DOCUSIGN_RSA_PRIVATE_KEY: ${updatedSettings.Values.DOCUSIGN_RSA_PRIVATE_KEY ? 'Set (' + updatedSettings.Values.DOCUSIGN_RSA_PRIVATE_KEY.length + ' chars)' : 'Missing'}`);
  
  console.log('\n🎉 DocuSign credentials successfully copied to backend!');
  console.log('🔄 Next steps:');
  console.log('1. Restart the backend API server');
  console.log('2. Test the DocuSign integration from the frontend');
  
} catch (error) {
  console.error('❌ Error copying credentials:', error.message);
  process.exit(1);
} 