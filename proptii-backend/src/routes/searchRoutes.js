import express from 'express';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';

dotenv.config();
const router = express.Router();

// Initialize OpenAI client
let openai;
try {
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;

  if (!apiKey || !endpoint || !deployment) {
    throw new Error('Azure OpenAI configuration is missing');
  }

  // Ensure the endpoint doesn't end with a slash
  const baseURL = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint;

  openai = new OpenAI({
    apiKey,
    baseURL: `${baseURL}/openai/deployments/${deployment}`,
    defaultQuery: { 'api-version': '2024-02-15-preview' },
    defaultHeaders: { 'api-key': apiKey }
  });

  console.log('Azure OpenAI client initialized successfully');
} catch (error) {
  console.error('Failed to initialize Azure OpenAI client:', error);
}

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    if (!openai) {
      throw new Error('Azure OpenAI client not initialized');
    }

    // Test connection with a simple completion request
    const completion = await openai.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT,
      messages: [{ role: 'user', content: 'test' }],
      max_tokens: 5
    });

    if (!completion?.choices?.[0]?.message) {
      throw new Error('Invalid response from Azure OpenAI');
    }

    res.json({ status: 'ok', message: 'Search service is healthy' });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Search service is unhealthy',
      details: error.message
    });
  }
});

// Search endpoint
router.post('/', async (req, res) => {
  try {
    if (!openai) {
      throw new Error('Azure OpenAI client not initialized');
    }

    const { query, type } = req.body;
    console.log('Received search request:', { query, type });

    const systemPrompt = type === 'suggestions'
      ? `You are a property search assistant. Your task is to:
1. Analyze the user's property search query
2. Generate 5 relevant property search suggestions
3. Return them as a JSON array of strings
4. Focus on UK property market specifics
5. Include variations in location, price, and property type

Example response format:
[
  "2-bedroom flat in Chelsea under £4,000",
  "Studio apartment in Kensington",
  "1-bed flat near King's Road"
]`
      : `You are a property search assistant. Your task is to:
1. Analyze the user's property search query
2. Provide relevant property suggestions based on the query
3. Format the response as a JSON array of objects with 'title' and 'description' fields
4. Include realistic property details and prices
5. Focus on UK property market specifics

Example response format:
[
  {
    "title": "2-bedroom apartment in Chelsea",
    "description": "Modern flat with high ceilings, £3,500 pcm, near King's Road"
  }
]`;

    const completion = await openai.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query }
      ],
      temperature: 0.7,
      top_p: 0.95,
      frequency_penalty: 0,
      presence_penalty: 0,
      max_tokens: type === 'suggestions' ? 500 : 800
    });

    const response = completion.choices[0].message.content;
    const parsedResponse = JSON.parse(response || '[]');

    console.log('Search response:', parsedResponse);
    res.json(parsedResponse);
  } catch (error) {
    console.error('Search failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Search failed',
      details: error.message
    });
  }
});

export default router; 