#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Create a readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 DocuSign Environment Setup');
console.log('===============================');
console.log('');
console.log('This script will help you create a .env.local file with your DocuSign credentials.');
console.log('');
console.log('📋 You\'ll need the following from your DocuSign Developer Account:');
console.log('   1. Integration Key (Client ID)');
console.log('   2. User ID (your email address)');
console.log('   3. Account ID');
console.log('   4. RSA Private Key');
console.log('');
console.log('🌐 Get these from: https://developers.docusign.com/');
console.log('');

// Function to prompt for user input
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

// Function to create .env.local file
async function createEnvFile() {
  try {
    console.log('Creating .env.local file...');
    
    // Check if .env.local already exists
    const envLocalPath = path.join(__dirname, '.env.local');
    if (fs.existsSync(envLocalPath)) {
      const overwrite = await prompt('⚠️  .env.local already exists. Overwrite? (y/N): ');
      if (overwrite.toLowerCase() !== 'y' && overwrite.toLowerCase() !== 'yes') {
        console.log('✅ Keeping existing .env.local file.');
        rl.close();
        return;
      }
    }
    
    // Get user input for credentials
    console.log('');
    console.log('📝 Enter your DocuSign credentials (press Enter to use placeholders):');
    console.log('');
    
    const integrationKey = await prompt('Integration Key: ') || 'your_integration_key_here';
    const userId = await prompt('User ID (email): ') || 'your_user_id_here';
    const accountId = await prompt('Account ID: ') || 'your_account_id_here';
    const baseUrl = await prompt('Base URL (demo.docusign.net or www.docusign.net): ') || 'https://demo.docusign.net';
    
    console.log('');
    console.log('🔑 For the RSA Private Key:');
    console.log('   - Copy the entire key including BEGIN and END lines');
    console.log('   - Replace all newlines with \\n');
    console.log('   - Or press Enter to use placeholder');
    console.log('');
    
    const privateKey = await prompt('RSA Private Key (formatted): ') || '-----BEGIN RSA PRIVATE KEY-----\\n...\\n-----END RSA PRIVATE KEY-----';
    
    // Create the .env.local content
    const envContent = `# DocuSign Configuration
# Get your credentials from: https://developers.docusign.com/

VITE_DOCUSIGN_INTEGRATION_KEY=${integrationKey}
VITE_DOCUSIGN_USER_ID=${userId}
VITE_DOCUSIGN_ACCOUNT_ID=${accountId}
VITE_DOCUSIGN_BASE_URL=${baseUrl.startsWith('http') ? baseUrl : 'https://' + baseUrl}
VITE_DOCUSIGN_RSA_PRIVATE_KEY=${privateKey}
VITE_DOCUSIGN_REDIRECT_URI=http://localhost:5173/docusign/callback

# Backend API URL
VITE_API_URL=http://localhost:7071/api

# Set to true for testing without real credentials
VITE_DOCUSIGN_MOCK_MODE=false
`;
    
    // Write the file
    fs.writeFileSync(envLocalPath, envContent);
    
    console.log('');
    console.log('✅ .env.local file created successfully!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('   1. If you used placeholders, edit .env.local with your real credentials');
    console.log('   2. Restart your development server: npm run dev');
    console.log('   3. Test the DocuSign integration in the Contract Management section');
    console.log('');
    console.log('🔒 Security note: .env.local is already in .gitignore - never commit it!');
    
  } catch (error) {
    console.error('❌ Error creating .env.local file:', error.message);
  } finally {
    rl.close();
  }
}

// Start the setup process
createEnvFile(); 