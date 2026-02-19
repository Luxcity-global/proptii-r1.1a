const fs = require('fs');
const path = require('path');

console.log('🔍 DocuSign Configuration Test');
console.log('==============================');
console.log('');

// Check if .env.local exists
const envPath = path.join(__dirname, '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local file not found');
  console.log('Run: node setup-env-local.cjs to create it');
  process.exit(1);
}

// Read and parse .env.local
console.log('📄 Reading .env.local file...');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    const value = valueParts.join('=');
    envVars[key] = value;
  }
});

// Check required DocuSign variables
const requiredVars = [
  'VITE_DOCUSIGN_INTEGRATION_KEY',
  'VITE_DOCUSIGN_USER_ID', 
  'VITE_DOCUSIGN_ACCOUNT_ID',
  'VITE_DOCUSIGN_BASE_URL',
  'VITE_DOCUSIGN_RSA_PRIVATE_KEY'
];

console.log('🔧 Checking DocuSign configuration:');
console.log('');

let allConfigured = true;

requiredVars.forEach(varName => {
  const value = envVars[varName];
  const isConfigured = value && 
    value !== 'your_integration_key_here' && 
    value !== 'your_user_id_here' && 
    value !== 'your_account_id_here' &&
    value !== '-----BEGIN RSA PRIVATE KEY-----\\n...\\n-----END RSA PRIVATE KEY-----';
  
  console.log(`  ${varName}: ${isConfigured ? '✅ Configured' : '❌ Not configured'}`);
  
  if (!isConfigured) {
    allConfigured = false;
  }
});

console.log('');

if (allConfigured) {
  console.log('🎉 DocuSign configuration looks good!');
  console.log('');
  console.log('📋 Next steps:');
  console.log('   1. Start your development server: npm run dev');
  console.log('   2. Go to Contract Management > Upload a document');
  console.log('   3. Click "Customize" and go to the "Edit" tab');
  console.log('   4. You should see the real DocuSign signing interface');
} else {
  console.log('⚠️  DocuSign configuration incomplete');
  console.log('');
  console.log('📋 To fix this:');
  console.log('   1. Get credentials from: https://developers.docusign.com/');
  console.log('   2. Edit .env.local with your real credentials');
  console.log('   3. Run this test again: node test-docusign-config.cjs');
  console.log('');
  console.log('🔧 The app will run in mock mode until configuration is complete.');
}

console.log('');
console.log('💡 For detailed setup instructions, see: DOCUSIGN_SETUP_GUIDE.md'); 