#!/usr/bin/env node

import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 DocuSign Private Key Test');
console.log('============================\n');

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
  
  // Find the private key line
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('VITE_DOCUSIGN_RSA_PRIVATE_KEY=')) {
      privateKeyLine = lines[i];
      break;
    }
  }
  
  if (!privateKeyLine) {
    console.log('❌ VITE_DOCUSIGN_RSA_PRIVATE_KEY not found in .env.local');
    process.exit(1);
  }
  
  // Extract the private key value
  const keyValue = privateKeyLine.split('=')[1];
  
  console.log('🔍 Private Key Analysis:');
  console.log('========================');
  console.log('Raw length:', keyValue.length);
  console.log('Has quotes:', keyValue.startsWith('"') && keyValue.endsWith('"'));
  console.log('Contains \\n:', keyValue.includes('\\n'));
  
  // Clean the key
  let cleanKey = keyValue.replace(/^["']|["']$/g, '');
  cleanKey = cleanKey.replace(/\\n/g, '\n');
  
  const lines_key = cleanKey.split('\n');
  console.log('Number of lines:', lines_key.length);
  
  // Check markers
  const hasBegin = cleanKey.includes('-----BEGIN PRIVATE KEY-----');
  const hasEnd = cleanKey.includes('-----END PRIVATE KEY-----');
  console.log('Has BEGIN marker:', hasBegin);
  console.log('Has END marker:', hasEnd);
  
  // Count content lines
  const contentLines = lines_key.filter(line => 
    !line.includes('-----BEGIN') && 
    !line.includes('-----END') && 
    line.trim().length > 0
  );
  console.log('Content lines:', contentLines.length);
  
  // Validate content lines
  let validLines = 0;
  let invalidLines = 0;
  
  contentLines.forEach(line => {
    if (/^[A-Za-z0-9+/]*={0,2}$/.test(line.trim())) {
      validLines++;
    } else {
      invalidLines++;
    }
  });
  
  console.log('Valid base64 lines:', validLines);
  console.log('Invalid base64 lines:', invalidLines);
  
  // Overall assessment
  console.log('\n📊 Assessment:');
  console.log('==============');
  
  if (hasBegin && hasEnd && contentLines.length > 10 && invalidLines === 0) {
    console.log('✅ Private key format looks CORRECT!');
    console.log('✅ Should work with DocuSign API');
    
    console.log('\n📝 Key structure:');
    console.log(lines_key[0]); // BEGIN marker
    console.log(lines_key[1].substring(0, 20) + '... (' + lines_key[1].length + ' chars)');
    console.log('... (' + (contentLines.length - 2) + ' more content lines) ...');
    console.log(lines_key[lines_key.length - 2].substring(0, 20) + '... (' + lines_key[lines_key.length - 2].length + ' chars)');
    console.log(lines_key[lines_key.length - 1]); // END marker
    
    console.log('\n🎉 The private key fix was successful!');
    console.log('🚀 Your DocuSign integration should now work properly.');
    console.log('🔄 If you restarted the dev server, test the DocuSign features in your app.');
    
  } else {
    console.log('❌ Private key still has issues:');
    if (!hasBegin) console.log('  - Missing BEGIN marker');
    if (!hasEnd) console.log('  - Missing END marker'); 
    if (contentLines.length <= 10) console.log('  - Too few content lines');
    if (invalidLines > 0) console.log('  - Invalid base64 content');
    
    console.log('\n🔧 Try running fix-single-line-private-key.js again');
  }
  
} catch (error) {
  console.error('❌ Error testing private key:', error.message);
  process.exit(1);
} 