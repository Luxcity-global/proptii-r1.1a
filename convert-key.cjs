const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');
const forge = require('node-forge');

// Read the PKCS#1 key
const pkcs1Pem = fs.readFileSync('privatekey.pem', 'utf8');
const privateKey = forge.pki.privateKeyFromPem(pkcs1Pem);

// Convert to PKCS#8
const pkcs8Pem = forge.pki.privateKeyToPem(privateKey);

// Save as PKCS#8
fs.writeFileSync('privatekey-pk8.pem', pkcs8Pem);

console.log('✅ Converted to PKCS#8 and saved as privatekey-pk8.pem');