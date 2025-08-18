#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 DocuSign Private Key Debugger');
console.log('================================\n');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
    console.log('❌ .env.local file not found!');
    process.exit(1);
}

// Read current .env.local
const envContent = fs.readFileSync(envPath, 'utf8');
console.log('✅ Found .env.local file');

// Check for private key
const privateKeyMatch = envContent.match(/VITE_DOCUSIGN_RSA_PRIVATE_KEY=(.+)/);
if (!privateKeyMatch) {
    console.log('❌ VITE_DOCUSIGN_RSA_PRIVATE_KEY not found in .env.local');
    process.exit(1);
}

const currentKey = privateKeyMatch[1];
console.log('\n🔍 Private Key Analysis:');
console.log('=====================================');

// Remove quotes if present
const cleanKey = currentKey.replace(/^["']|["']$/g, '');
console.log('Key length:', cleanKey.length, 'characters');
console.log('Has quotes:', currentKey !== cleanKey);

// Check format
const hasBegin = cleanKey.includes('-----BEGIN RSA PRIVATE KEY-----');
const hasEnd = cleanKey.includes('-----END RSA PRIVATE KEY-----');
const hasNewlines = cleanKey.includes('\\n');

console.log('Has BEGIN marker:', hasBegin);
console.log('Has END marker:', hasEnd);
console.log('Has \\n escapes:', hasNewlines);

// Try to parse the key
try {
    const parsedKey = cleanKey.replace(/\\n/g, '\n');
    console.log('\n📝 Parsed Key Preview:');
    console.log('=====================================');
    console.log(parsedKey.substring(0, 200) + '...');
    console.log('=====================================');
    
    // Check if it looks like a valid RSA key
    const lines = parsedKey.split('\n');
    const keyLines = lines.filter(line => 
        !line.includes('-----BEGIN') && 
        !line.includes('-----END') && 
        line.trim().length > 0
    );
    
    console.log('\n🔍 Key Content Analysis:');
    console.log('Number of key lines:', keyLines.length);
    console.log('Average line length:', Math.round(keyLines.reduce((sum, line) => sum + line.length, 0) / keyLines.length));
    
    if (keyLines.length < 10) {
        console.log('❌ WARNING: Too few key lines - RSA keys typically have 20+ lines');
    }
    
    // Check for common RSA key patterns
    const firstKeyLine = keyLines[0] || '';
    const lastKeyLine = keyLines[keyLines.length - 1] || '';
    
    console.log('First key line starts with:', firstKeyLine.substring(0, 10));
    console.log('Last key line ends with:', lastKeyLine.substring(lastKeyLine.length - 10));
    
    // Check if it looks like base64
    const isValidBase64 = /^[A-Za-z0-9+/]*={0,2}$/.test(firstKeyLine);
    console.log('First line looks like base64:', isValidBase64);
    
    if (!isValidBase64) {
        console.log('❌ ERROR: Key content is not valid base64 - this is likely corrupted');
    }
    
} catch (error) {
    console.log('❌ Error parsing key:', error.message);
}

console.log('\n🔧 Recommendations:');
console.log('1. Get a fresh RSA private key from DocuSign developer portal');
console.log('2. Make sure it\'s an RSA key, not EC or other type');
console.log('3. Copy the entire key including BEGIN and END markers');
console.log('4. Ensure no extra characters or spaces are included');
console.log('5. The key should be about 1700+ characters long'); 