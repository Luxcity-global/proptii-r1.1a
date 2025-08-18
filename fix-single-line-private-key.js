#!/usr/bin/env node

import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔧 Single-Line Private Key Fixer');
console.log('=================================\n');

// Check if .env.local exists
const envLocalPath = join(__dirname, '.env.local');

if (!fs.existsSync(envLocalPath)) {
  console.log('❌ .env.local file not found');
  process.exit(1);
}

function formatPrivateKey(singleLineKey) {
  // Remove quotes if present
  let key = singleLineKey.replace(/^["']|["']$/g, '');
  
  // Check if it has the markers we expect
  const beginMarker = '-----BEGIN PRIVATE KEY-----';
  const endMarker = '-----END PRIVATE KEY-----';
  
  if (!key.includes(beginMarker) || !key.includes(endMarker)) {
    throw new Error('Private key is missing required BEGIN or END markers');
  }
  
  // Find the positions of the markers
  const beginPos = key.indexOf(beginMarker);
  const endPos = key.indexOf(endMarker);
  
  if (beginPos === -1 || endPos === -1 || endPos <= beginPos) {
    throw new Error('Private key markers are in wrong positions');
  }
  
  // Extract the key content between the markers
  const keyContent = key.substring(beginPos + beginMarker.length, endPos);
  
  // Remove any existing whitespace or special characters from the content
  const cleanContent = keyContent.replace(/[\s\r\n]/g, '');
  
  // Split the content into 64-character lines (standard PEM format)
  const lines = [beginMarker];
  for (let i = 0; i < cleanContent.length; i += 64) {
    lines.push(cleanContent.substring(i, i + 64));
  }
  lines.push(endMarker);
  
  // Join with newlines and then escape for .env format
  const formattedKey = lines.join('\\n');
  
  return formattedKey;
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
  
  console.log('🔍 Current key analysis:');
  console.log('  Length:', keyValue.length, 'characters');
  console.log('  Format: Single line (no newlines)');
  console.log('  Has BEGIN marker:', keyValue.includes('-----BEGIN PRIVATE KEY-----'));
  console.log('  Has END marker:', keyValue.includes('-----END PRIVATE KEY-----'));
  
  // Create backup
  const backupPath = join(__dirname, '.env.local.backup-' + Date.now());
  fs.writeFileSync(backupPath, envContent);
  console.log('✅ Created backup at', backupPath.split('\\').pop());
  
  // Format the key
  console.log('\n🔧 Formatting private key...');
  const formattedKey = formatPrivateKey(keyValue);
  
  console.log('✅ Key formatted successfully!');
  console.log('  New format: Multi-line with \\n separators');
  console.log('  New length:', formattedKey.length, 'characters');
  
  // Update the env file
  lines[privateKeyIndex] = `VITE_DOCUSIGN_RSA_PRIVATE_KEY="${formattedKey}"`;
  const updatedContent = lines.join('\n');
  
  fs.writeFileSync(envLocalPath, updatedContent);
  console.log('✅ Updated .env.local file');
  
  // Verify the fix
  console.log('\n✅ Private key has been fixed!');
  console.log('🔄 Next steps:');
  console.log('1. Restart your development server (npm run dev)');
  console.log('2. Test the DocuSign integration');
  console.log('3. The private key should now be properly formatted');
  
  // Show a preview of the formatted key
  const previewKey = formattedKey.replace(/\\n/g, '\n');
  const previewLines = previewKey.split('\n');
  console.log('\n📝 Formatted key preview:');
  console.log(previewLines[0]); // BEGIN marker
  console.log(previewLines[1] + '...'); // First content line
  console.log('... (' + (previewLines.length - 3) + ' more content lines) ...');
  console.log(previewLines[previewLines.length - 1]); // END marker
  
} catch (error) {
  console.error('❌ Error fixing private key:', error.message);
  process.exit(1);
} 