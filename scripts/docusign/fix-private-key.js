#!/usr/bin/env node

import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔧 Private Key Format Fixer');
console.log('===========================\n');

// Check if .env.local exists
const envLocalPath = join(__dirname, '.env.local');

if (!fs.existsSync(envLocalPath)) {
  console.log('❌ .env.local file not found');
  console.log('Please create .env.local with your DocuSign credentials first.');
  process.exit(1);
}

try {
  // Read the current .env.local file
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  const lines = envContent.split('\n');
  
  let privateKeyLine = null;
  let privateKeyIndex = -1;
  
  // Find the private key line
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('VITE_DOCUSIGN_RSA_PRIVATE_KEY=')) {
      privateKeyLine = lines[i];
      privateKeyIndex = i;
      break;
    }
  }
  
  if (!privateKeyLine) {
    console.log('❌ VITE_DOCUSIGN_RSA_PRIVATE_KEY not found in .env.local');
    process.exit(1);
  }
  
  // Extract the private key value
  const keyValue = privateKeyLine.split('=')[1];
  
  console.log('🔍 Current private key format:');
  console.log('   Length:', keyValue.length, 'characters');
  console.log('   Contains BEGIN:', keyValue.includes('-----BEGIN RSA PRIVATE KEY-----'));
  console.log('   Contains END:', keyValue.includes('-----END RSA PRIVATE KEY-----'));
  console.log('   Contains \\n:', keyValue.includes('\\n'));
  
  // Check if the key needs formatting
  let needsFix = false;
  let fixedKey = keyValue;
  
  // If the key doesn't have proper markers, it might be in a different format
  if (!keyValue.includes('-----BEGIN RSA PRIVATE KEY-----') || !keyValue.includes('-----END RSA PRIVATE KEY-----')) {
    console.log('\n⚠️  Private key appears to be in incorrect format');
    console.log('   Expected format: -----BEGIN RSA PRIVATE KEY-----\\n...\\n-----END RSA PRIVATE KEY-----');
    
    // Try to detect the format
    if (keyValue.includes('-----BEGIN')) {
      console.log('   Detected: Key has BEGIN marker but wrong format');
    } else if (keyValue.includes('-----END')) {
      console.log('   Detected: Key has END marker but wrong format');
    } else {
      console.log('   Detected: Key appears to be raw format');
    }
    
    needsFix = true;
  } else if (keyValue.includes('\\n')) {
    // Key has escaped newlines, which is correct
    console.log('\n✅ Private key format appears correct');
    console.log('   The key contains escaped newlines (\\n) which is expected');
  } else {
    console.log('\n⚠️  Private key missing escaped newlines');
    console.log('   The key should contain \\n for newlines in .env.local');
    needsFix = true;
  }
  
  if (needsFix) {
    console.log('\n📝 To fix the private key format:');
    console.log('1. Open your .env.local file');
    console.log('2. Find the VITE_DOCUSIGN_RSA_PRIVATE_KEY line');
    console.log('3. Ensure the key looks like this:');
    console.log('');
    console.log('VITE_DOCUSIGN_RSA_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----\\nMIIEpAIBAAKCAQEA...\\n-----END RSA PRIVATE KEY-----');
    console.log('');
    console.log('   Note: Use \\n for newlines, not actual newlines');
    console.log('   The key should be on a single line with \\n separators');
  } else {
    console.log('\n✅ Private key format looks good!');
    console.log('   If you\'re still getting errors, the issue might be:');
    console.log('   1. The key content itself is invalid');
    console.log('   2. The key is not the correct RSA private key');
    console.log('   3. The key was corrupted during copy/paste');
  }
  
  console.log('\n🔧 Quick fix options:');
  console.log('1. Copy your private key from DocuSign developer portal');
  console.log('2. Replace all actual newlines with \\n');
  console.log('3. Ensure the key is on a single line in .env.local');
  console.log('4. Restart the DocuSign server');
  
} catch (error) {
  console.error('❌ Error reading .env.local:', error.message);
  process.exit(1);
} 