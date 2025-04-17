import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

/**
 * Service for handling property search functionality using Azure OpenAI.
 * 
 * Configuration Requirements:
 * - AZURE_OPENAI_API_KEY: Your Azure OpenAI API key
 * - AZURE_OPENAI_ENDPOINT: Your Azure OpenAI endpoint (without trailing slash)
 * - AZURE_OPENAI_DEPLOYMENT: The deployment name (e.g., 'gpt-4o')
 * 
 * The service constructs the Azure OpenAI URL as:
 * ${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT}
 * 
 * @see README.md for more configuration details
 */
@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('AZURE_OPENAI_API_KEY');
    const endpoint = this.configService.get<string>('AZURE_OPENAI_ENDPOINT');
    const deployment = this.configService.get<string>('AZURE_OPENAI_DEPLOYMENT');
    
    this.logger.log('Initializing Azure OpenAI client with:');
    this.logger.log(`Endpoint: ${endpoint}`);
    this.logger.log(`Deployment: ${deployment}`);
    
    if (!apiKey || !endpoint || !deployment) {
      this.logger.error('Missing Azure OpenAI configuration:', { 
        apiKey: !!apiKey, 
        endpoint: !!endpoint,
        deployment: !!deployment 
      });
      throw new Error('Azure OpenAI configuration is missing');
    }

    try {
      // Ensure the endpoint doesn't end with a slash
      const baseURL = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint;
      
      this.openai = new OpenAI({
        apiKey,
        baseURL: `${baseURL}/openai/deployments/${deployment}`,
        defaultQuery: { 'api-version': '2024-02-15-preview' },
        defaultHeaders: { 'api-key': apiKey }
      });
      
      this.logger.log(`Azure OpenAI client initialized with base URL: ${baseURL}/openai/deployments/${deployment}`);
    } catch (error) {
      this.logger.error('Failed to initialize Azure OpenAI client:', error);
      throw error;
    }
  }

  async searchProperties(query: string): Promise<any> {
    try {
      this.logger.log(`Searching properties with query: ${query}`);
      
      const messages: ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: `You are a property search assistant. Your task is to:
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
]`
        },
        {
          role: 'user',
          content: query,
        },
      ];

      this.logger.log('Sending request to Azure OpenAI:', {
        messages,
        temperature: 0.7,
        top_p: 0.95,
        frequency_penalty: 0,
        presence_penalty: 0,
        max_tokens: 800,
      });

      const completion = await this.openai.chat.completions.create({
        model: this.configService.get<string>('AZURE_OPENAI_DEPLOYMENT'),
        messages,
        temperature: 0.7,
        top_p: 0.95,
        frequency_penalty: 0,
        presence_penalty: 0,
        max_tokens: 800,
      });

      const response = completion.choices[0].message.content;
      this.logger.log(`Received response: ${response}`);
      
      const parsedResponse = JSON.parse(response || '[]');
      this.logger.log(`Parsed response: ${JSON.stringify(parsedResponse, null, 2)}`);
      
      return parsedResponse;
    } catch (error) {
      this.logger.error('Error during property search:', {
        message: error.message,
        status: error.status,
        code: error.code,
        type: error.type,
        stack: error.stack,
        response: error.response?.data,
        request: error.request,
        config: {
          endpoint: this.configService.get<string>('AZURE_OPENAI_ENDPOINT'),
          deployment: this.configService.get<string>('AZURE_OPENAI_DEPLOYMENT'),
          hasApiKey: !!this.configService.get<string>('AZURE_OPENAI_API_KEY')
        }
      });
      throw new Error(`Property search failed: ${error.message}`);
    }
  }

  async getSuggestions(query: string): Promise<string[]> {
    try {
      this.logger.log(`Getting suggestions for query: ${query}`);
      
      const messages: ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: `You are a property search assistant. Your task is to:
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
        },
        {
          role: 'user',
          content: query,
        },
      ];

      this.logger.log('Sending request to Azure OpenAI:', {
        messages,
        temperature: 0.7,
        top_p: 0.95,
        frequency_penalty: 0,
        presence_penalty: 0,
        max_tokens: 500,
      });

      const completion = await this.openai.chat.completions.create({
        model: this.configService.get<string>('AZURE_OPENAI_DEPLOYMENT'),
        messages,
        temperature: 0.7,
        top_p: 0.95,
        frequency_penalty: 0,
        presence_penalty: 0,
        max_tokens: 500,
      });

      const response = completion.choices[0].message.content;
      this.logger.log(`Received suggestions: ${response}`);
      
      return JSON.parse(response || '[]');
    } catch (error) {
      this.logger.error('Error during suggestions fetch:', {
        message: error.message,
        status: error.status,
        code: error.code,
        type: error.type,
        stack: error.stack,
        response: error.response?.data,
        request: error.request
      });
      throw new Error(`Failed to get suggestions: ${error.message}`);
    }
  }
} 