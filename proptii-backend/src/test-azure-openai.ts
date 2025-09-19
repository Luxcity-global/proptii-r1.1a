import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
const envPath = path.resolve(__dirname, '../.env');
console.log('Loading .env from:', envPath);
dotenv.config({ path: envPath });

async function testAzureOpenAI() {
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;

  console.log('Environment variables loaded:');
  console.log('AZURE_OPENAI_API_KEY:', apiKey ? 'Set' : 'Not set');
  console.log('AZURE_OPENAI_ENDPOINT:', endpoint ? 'Set' : 'Not set');
  console.log('AZURE_OPENAI_DEPLOYMENT_NAME:', deploymentName ? 'Set' : 'Not set');

  if (!apiKey || !endpoint || !deploymentName) {
    console.error('Missing required environment variables');
    process.exit(1);
  }

  const url = `${endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=2024-02-15-preview`;

  try {
    console.log('Testing Azure OpenAI API connection...');
    console.log('URL:', url);
    
    const response = await axios.post(
      url,
      {
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Hello, this is a test message.' }
        ],
        max_tokens: 100
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey
        }
      }
    );

    console.log('Success! Response:', response.data);
  } catch (error) {
    console.error('Error testing Azure OpenAI API:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Response Data:', error.response?.data);
    console.error('Error Message:', error.message);
    if (error.response?.headers) {
      console.error('Response Headers:', error.response.headers);
    }
  }
}

testAzureOpenAI(); 