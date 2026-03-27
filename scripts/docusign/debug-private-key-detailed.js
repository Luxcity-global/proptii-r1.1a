#!/usr/bin/env node

import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Detailed DocuSign Private Key Debugger');
console.log('=========================================\n');

// Check if .env.local exists
const envLocalPath = join(__dirname, '.env.local');

if (!fs.existsSync(envLocalPath)) {
  console.log('❌ .env.local file not found');
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
  
  console.log('📄 Raw Private Key Analysis:');
  console.log('============================');
  console.log('Full line length:', privateKeyLine.length);
  console.log('Key value length:', keyValue.length);
  console.log('Has quotes:', keyValue.startsWith('"') || keyValue.startsWith("'"));
  console.log('Contains \\n:', keyValue.includes('\\n'));
  console.log('Contains actual newlines:', keyValue.includes('\n'));
  console.log('Contains \\r:', keyValue.includes('\\r'));
  console.log('Contains tabs:', keyValue.includes('\t'));
  
  // Show first and last 100 characters
  console.log('\n📝 Key Content Preview:');
  console.log('=======================');
  console.log('First 100 chars:', JSON.stringify(keyValue.substring(0, 100)));
  console.log('Last 100 chars:', JSON.stringify(keyValue.substring(keyValue.length - 100)));
  
  // Check for standard markers
  console.log('\n🏷️  Marker Analysis:');
  console.log('====================');
  console.log('Contains BEGIN RSA PRIVATE KEY:', keyValue.includes('-----BEGIN RSA PRIVATE KEY-----'));
  console.log('Contains END RSA PRIVATE KEY:', keyValue.includes('-----END RSA PRIVATE KEY-----'));
  console.log('Contains BEGIN PRIVATE KEY:', keyValue.includes('-----BEGIN PRIVATE KEY-----'));
  console.log('Contains END PRIVATE KEY:', keyValue.includes('-----END PRIVATE KEY-----'));
  
  // Try to clean and parse the key
  console.log('\n🧹 Key Cleaning Process:');
  console.log('=========================');
  
  // Remove quotes if present
  let cleanKey = keyValue.replace(/^["']|["']$/g, '');
  console.log('After removing quotes:', cleanKey.length, 'chars');
  
  // Handle different newline formats
  cleanKey = cleanKey.replace(/\\n/g, '\n');
  console.log('After processing \\n:', cleanKey.length, 'chars');
  
  // Split into lines
  const keyLines = cleanKey.split('\n');
  console.log('Number of lines:', keyLines.length);
  
  // Show each line
  console.log('\n📋 Line-by-Line Analysis:');
  console.log('==========================');
  keyLines.forEach((line, index) => {
    console.log(`Line ${index + 1} (${line.length} chars): ${JSON.stringify(line.substring(0, 50))}${line.length > 50 ? '...' : ''}`);
  });
  
  // Filter out header/footer lines
  const contentLines = keyLines.filter(line => 
    !line.includes('-----BEGIN') && 
    !line.includes('-----END') && 
    line.trim().length > 0
  );
  
  console.log('\n📊 Content Analysis:');
  console.log('====================');
  console.log('Content lines:', contentLines.length);
  
  if (contentLines.length > 0) {
    console.log('First content line:', JSON.stringify(contentLines[0]));
    console.log('Last content line:', JSON.stringify(contentLines[contentLines.length - 1]));
    
    // Check each content line for valid base64
    let validBase64Lines = 0;
    let invalidLines = [];
    
    contentLines.forEach((line, index) => {
      const isValid = /^[A-Za-z0-9+/]*={0,2}$/.test(line.trim());
      if (isValid) {
        validBase64Lines++;
      } else {
        invalidLines.push({ line: index + 1, content: line.substring(0, 30) });
      }
    });
    
    console.log('Valid base64 lines:', validBase64Lines);
    console.log('Invalid lines:', invalidLines.length);
    
    if (invalidLines.length > 0) {
      console.log('\n❌ Invalid Base64 Lines:');
      invalidLines.forEach(invalid => {
        console.log(`  Line ${invalid.line}: ${JSON.stringify(invalid.content)}...`);
      });
    }
  } else {
    console.log('❌ No content lines found! This suggests the key format is completely wrong.');
  }
  
  // Try to reconstruct a properly formatted key
  if (keyLines.length > 0) {
    console.log('\n🔧 Reconstruction Attempt:');
    console.log('===========================');
    
    const hasBeginMarker = keyLines.some(line => line.includes('-----BEGIN'));
    const hasEndMarker = keyLines.some(line => line.includes('-----END'));
    
    console.log('Has BEGIN marker:', hasBeginMarker);
    console.log('Has END marker:', hasEndMarker);
    
    if (hasBeginMarker && hasEndMarker) {
      const reconstructed = keyLines.join('\n');
      console.log('Reconstructed key length:', reconstructed.length);
      console.log('Reconstructed preview:', reconstructed.substring(0, 100) + '...');
    } else {
      console.log('❌ Cannot reconstruct - missing required markers');
    }
  }
  
} catch (error) {
  console.error('❌ Error analyzing private key:', error.message);
  process.exit(1);
} 