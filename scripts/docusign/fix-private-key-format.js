#!/usr/bin/env node

import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔧 DocuSign Private Key Format Fixer');
console.log('====================================\n');

// Check if .env.local exists
const envLocalPath = join(__dirname, '.env.local');

if (!fs.existsSync(envLocalPath)) {
  console.log('❌ .env.local file not found');
  console.log('Please create .env.local with your DocuSign credentials first.');
  console.log('You can copy from env.local.template and fill in your values.');
  process.exit(1);
}

function isValidBase64(str) {
  // Remove any whitespace
  const cleanStr = str.replace(/\s/g, '');
  // Check if it's valid base64
  return /^[A-Za-z0-9+/]*={0,2}$/.test(cleanStr);
}

function cleanPrivateKey(keyString) {
  // Remove quotes if present
  let cleanKey = keyString.replace(/^["']|["']$/g, '');
  
  // Handle different newline formats
  cleanKey = cleanKey.replace(/\\n/g, '\n');
  
  return cleanKey;
}

function formatPrivateKeyForEnv(keyString) {
  // Clean the key first
  const cleanKey = cleanPrivateKey(keyString);
  
  // Replace actual newlines with \n escape sequences
  const formatted = cleanKey.replace(/\n/g, '\\n');
  
  return formatted;
}

function validatePrivateKey(keyString) {
  const cleanKey = cleanPrivateKey(keyString);
  const lines = cleanKey.split('\n');
  
  const errors = [];
  const warnings = [];
  
  // Check for proper headers
  if (!cleanKey.includes('-----BEGIN PRIVATE KEY-----') && !cleanKey.includes('-----BEGIN RSA PRIVATE KEY-----')) {
    errors.push('Missing BEGIN header');
  }
  
  if (!cleanKey.includes('-----END PRIVATE KEY-----') && !cleanKey.includes('-----END RSA PRIVATE KEY-----')) {
    errors.push('Missing END header');
  }
  
  // Get key content lines (exclude headers)
  const keyLines = lines.filter(line => 
    !line.includes('-----BEGIN') && 
    !line.includes('-----END') && 
    line.trim().length > 0
  );
  
  if (keyLines.length < 10) {
    warnings.push('Unusually short private key (expected 20+ lines)');
  }
  
  // Check if key content is valid base64
  const invalidLines = keyLines.filter(line => !isValidBase64(line.trim()));
  if (invalidLines.length > 0) {
    errors.push(`Invalid base64 content in ${invalidLines.length} lines`);
  }
  
  return { errors, warnings, keyLines: keyLines.length };
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
    console.log('\nTo add the private key:');
    console.log('1. Get your RSA private key from DocuSign Developer Account');
    console.log('2. Add this line to .env.local:');
    console.log('VITE_DOCUSIGN_RSA_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\\n...\\n-----END RSA PRIVATE KEY-----"');
    process.exit(1);
  }
  
  // Extract the private key value
  const keyValue = privateKeyLine.split('=')[1];
  
  console.log('🔍 Current private key analysis:');
  console.log('--------------------------------');
  console.log('   Raw length:', keyValue.length, 'characters');
  console.log('   Has quotes:', keyValue.startsWith('"') || keyValue.startsWith("'"));
  console.log('   Contains \\n:', keyValue.includes('\\n'));
  
  // Validate the key
  const validation = validatePrivateKey(keyValue);
  
  console.log('\n📊 Validation results:');
  console.log('----------------------');
  console.log('   Key content lines:', validation.keyLines);
  console.log('   Errors:', validation.errors.length);
  console.log('   Warnings:', validation.warnings.length);
  
  if (validation.errors.length > 0) {
    console.log('\n❌ Errors found:');
    validation.errors.forEach(error => console.log('   -', error));
  }
  
  if (validation.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    validation.warnings.forEach(warning => console.log('   -', warning));
  }
  
  // Try to fix the key format
  if (validation.errors.length > 0) {
    console.log('\n🔧 Attempting to fix the private key format...');
    
    // Create a backup
    const backupPath = join(__dirname, '.env.local.backup');
    fs.writeFileSync(backupPath, envContent);
    console.log('✅ Created backup at .env.local.backup');
    
    // Format the key properly
    const formattedKey = formatPrivateKeyForEnv(keyValue);
    
    // Replace the line in the env file
    lines[privateKeyIndex] = `VITE_DOCUSIGN_RSA_PRIVATE_KEY="${formattedKey}"`;
    
    // Write the updated content
    const updatedContent = lines.join('\n');
    fs.writeFileSync(envLocalPath, updatedContent);
    
    console.log('✅ Updated .env.local with properly formatted private key');
    
    // Validate again
    const newValidation = validatePrivateKey(formattedKey);
    if (newValidation.errors.length === 0) {
      console.log('✅ Private key validation passed!');
    } else {
      console.log('❌ Private key still has issues after formatting:');
      newValidation.errors.forEach(error => console.log('   -', error));
      console.log('\n📝 Manual steps needed:');
      console.log('1. Get a fresh RSA private key from DocuSign Developer Portal');
      console.log('2. Ensure it\'s in PKCS#1 or PKCS#8 format');
      console.log('3. Copy the entire key including BEGIN/END markers');
      console.log('4. Replace the value in .env.local');
    }
  } else {
    console.log('\n✅ Private key format looks correct!');
    console.log('If you\'re still getting errors, the issue might be:');
    console.log('1. The private key content is corrupted');
    console.log('2. The key doesn\'t match your DocuSign application');
    console.log('3. Network connectivity issues');
  }
  
  console.log('\n🔄 Next steps:');
  console.log('1. Restart your development server');
  console.log('2. Test the DocuSign integration');
  console.log('3. Check the browser console for any remaining errors');
  
} catch (error) {
  console.error('❌ Error processing private key:', error.message);
  process.exit(1);
} 