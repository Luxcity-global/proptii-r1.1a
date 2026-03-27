const fs = require('fs');
const forge = require('node-forge');

console.log('🔧 DocuSign Key Format Fixer');
console.log('=============================\n');

// Check if privatekey.pem exists
if (!fs.existsSync('privatekey.pem')) {
  console.log('❌ privatekey.pem file not found');
  process.exit(1);
}

// Read the real private key from privatekey.pem
const realPrivateKey = fs.readFileSync('privatekey.pem', 'utf8');
console.log('✅ Found privatekey.pem');
console.log('🔍 Real key length:', realPrivateKey.length);
console.log('🔍 Real key starts with:', realPrivateKey.substring(0, 50));

// Check format and convert if needed
let pkcs8Key;

if (realPrivateKey.includes('-----BEGIN RSA PRIVATE KEY-----')) {
  console.log('📋 Detected PKCS#1 format (RSA PRIVATE KEY)');
  console.log('🔄 Converting to PKCS#8 format...');
  
  try {
    // Parse the PKCS#1 key
    const rsaPrivateKey = forge.pki.privateKeyFromPem(realPrivateKey);
    
    // Convert to PKCS#8 format
    pkcs8Key = forge.pki.privateKeyToPem(rsaPrivateKey);
    
    console.log('✅ Successfully converted to PKCS#8');
    console.log('🔍 PKCS#8 key starts with:', pkcs8Key.substring(0, 50));
    
  } catch (error) {
    console.error('❌ Error converting private key:', error.message);
    process.exit(1);
  }
  
} else if (realPrivateKey.includes('-----BEGIN PRIVATE KEY-----')) {
  console.log('✅ Already in PKCS#8 format (PRIVATE KEY)');
  pkcs8Key = realPrivateKey;
  
} else {
  console.log('❌ Unrecognized private key format');
  console.log('Expected: -----BEGIN RSA PRIVATE KEY----- or -----BEGIN PRIVATE KEY-----');
  process.exit(1);
}

// Read .env.local
if (!fs.existsSync('.env.local')) {
  console.log('❌ .env.local file not found');
  process.exit(1);
}

const envContent = fs.readFileSync('.env.local', 'utf8');
console.log('✅ Found .env.local');

// Format for .env.local (single line with \n)
const formattedKey = pkcs8Key.replace(/\n/g, '\\n');

// Update .env.local
const newEnvContent = envContent.replace(
  /VITE_DOCUSIGN_RSA_PRIVATE_KEY=.+/,
  `VITE_DOCUSIGN_RSA_PRIVATE_KEY=${formattedKey}`
);

// Backup original
fs.writeFileSync('.env.local.backup', envContent);
console.log('💾 Created backup: .env.local.backup');

// Write updated file
fs.writeFileSync('.env.local', newEnvContent);
console.log('✅ Updated .env.local with real PKCS#8 key');

console.log('\n🎉 Private key update complete!');
console.log('✨ Your DocuSign integration should now work properly');
console.log('📊 Key stats:');
console.log('   - Original format: PKCS#1 (RSA PRIVATE KEY)');
console.log('   - Converted to: PKCS#8 (PRIVATE KEY)');
console.log('   - Key length:', pkcs8Key.length, 'characters'); 