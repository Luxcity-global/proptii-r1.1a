import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

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
  private endpoint: string;
  private apiKey: string;
  private deploymentName: string;

  constructor(private readonly configService: ConfigService) {
    this.endpoint = this.configService.get<string>('AZURE_OPENAI_ENDPOINT');
    this.apiKey = this.configService.get<string>('AZURE_OPENAI_API_KEY');
    this.deploymentName = this.configService.get<string>('AZURE_OPENAI_DEPLOYMENT_NAME');

    if (!this.endpoint || !this.apiKey || !this.deploymentName) {
      this.logger.error('Missing required Azure OpenAI configuration');
      throw new Error('Azure OpenAI configuration is incomplete');
    }
    this.logger.log('SearchService initialized with Azure OpenAI REST API');
  }

  private getApiUrl() {
    return `${this.endpoint}/openai/deployments/${this.deploymentName}/chat/completions?api-version=2024-02-15-preview`;
  }

  /**
   * Utility to extract and parse JSON from Markdown-wrapped or truncated OpenAI responses.
   * Strips code fences and attempts to parse the first valid JSON array found.
   */
  private extractJsonArray(content: string): any[] {
    if (!content) return [];
    // Remove Markdown code fences (```json ... ``` or ``` ... ```)
    let cleaned = content.trim();
    cleaned = cleaned.replace(/^```(json)?/i, '').replace(/```$/i, '').trim();
    // Try to find the first JSON array in the string
    const arrayMatch = cleaned.match(/\[([\s\S]*)\]/m);
    if (arrayMatch) {
      // Try to parse the matched array
      try {
        return JSON.parse('[' + arrayMatch[1] + ']');
      } catch (e) {
        this.logger.warn('Failed to parse matched JSON array, falling back to full content.');
      }
    }
    // Fallback: try to parse the whole cleaned string
    try {
      return JSON.parse(cleaned);
    } catch (e) {
      this.logger.error('extractJsonArray: Failed to parse JSON', e);
      this.logger.error('Content that failed to parse:', cleaned);
      throw new Error('Invalid response format from AI service');
    }
  }

  async searchProperties(query: string): Promise<any[]> {
    try {
      this.logger.log(`Processing search query: "${query}"`);
      const payload = {
        messages: [
          {
            role: 'system',
            content: `You are a property search assistant. Return only a valid JSON array of property objects, with no extra text, no Markdown, and no explanation.\n\nHere are some example property objects:\n[\n  {\n    "title": "Modern 2 Bedroom Flat in Islington",\n    "price": "£2000/month",\n    "location": "Islington, London",\n    "bedrooms": 2,\n    "propertyType": "Flat",\n    "description": "A bright and spacious flat near the station."\n  },\n  {\n    "title": "Spacious 3 Bedroom House in Walthamstow",\n    "price": "£2500/month",\n    "location": "Walthamstow, London",\n    "bedrooms": 3,\n    "propertyType": "House",\n    "description": "A family home with a large garden and modern kitchen."\n  },\n  {\n    "title": "1 Bedroom Studio in Canary Wharf",\n    "price": "£1500/month",\n    "location": "Canary Wharf, London",\n    "bedrooms": 1,\n    "propertyType": "Studio",\n    "description": "A stylish studio apartment in a prime location."\n  }\n]\n\nAlways return at least 2-3 property objects in a valid JSON array, even if you have to invent them.`
          },
          {
            role: 'user',
            content: query
          }
        ],
        max_tokens: 400
      };
      this.logger.debug('Sending payload to OpenAI:', JSON.stringify(payload));
      const response = await axios.post(
        this.getApiUrl(),
        payload,
        {
          headers: {
            'api-key': this.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );
      this.logger.debug('Raw OpenAI API response:', JSON.stringify(response.data));
      const content = response.data.choices?.[0]?.message?.content;
      this.logger.debug('Raw OpenAI content:', content);
      if (!content) {
        this.logger.warn('No results returned from OpenAI');
        return [];
      }
      try {
        const parsedResult = this.extractJsonArray(content);
        if (!Array.isArray(parsedResult)) {
          throw new Error('Response is not an array');
        }
        return parsedResult;
      } catch (parseError) {
        this.logger.error('Failed to parse OpenAI response', parseError);
        this.logger.error('Content that failed to parse:', content);
        throw new Error('Invalid response format from AI service');
      }
    } catch (error) {
      this.logger.error('Error in searchProperties', {
        error: error.message,
        stack: error.stack,
        query,
        axiosError: {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          headers: error.response?.headers,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            headers: error.config?.headers,
            data: error.config?.data
          }
        }
      });

      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error('Authentication failed. Please check API credentials.');
      }
      // Always return a user-friendly error
      throw new Error('Failed to process search query. Please try again.');
    }
  }

  async getSuggestions(query: string): Promise<string[]> {
    try {
      this.logger.log(`Getting suggestions for query: "${query}"`);
      const payload = {
        messages: [
          {
            role: 'system',
            content: 'You are a property search suggestion assistant. Return a JSON array of up to 10 suggestion strings, and nothing else. The array must be valid JSON, with no explanation, no trailing commas, and no text outside the array.'
          },
          {
            role: 'user',
            content: query
          }
        ],
        max_tokens: 512
      };
      this.logger.debug('Sending payload to OpenAI:', JSON.stringify(payload));
      const response = await axios.post(
        this.getApiUrl(),
        payload,
        {
          headers: {
            'api-key': this.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );
      this.logger.debug('Raw OpenAI API response:', JSON.stringify(response.data));
      const content = response.data.choices?.[0]?.message?.content;
      this.logger.debug('Raw OpenAI content:', content);
      if (!content) {
        this.logger.warn('No suggestions returned from OpenAI');
        return [];
      }
      try {
        const suggestions = JSON.parse(content);
        if (!Array.isArray(suggestions)) {
          throw new Error('Suggestions response is not an array');
        }
        return suggestions;
      } catch (parseError) {
        this.logger.error('Failed to parse suggestions response', parseError);
        this.logger.error('Content that failed to parse:', content);
        // Attempt to repair the JSON string
        let repaired = content.trim();
        // Remove trailing comma before closing bracket
        repaired = repaired.replace(/,\s*([\]\}])/g, '$1');
        // Add closing bracket if missing
        if (!repaired.endsWith(']')) {
          repaired += ']';
        }
        try {
          const suggestions = JSON.parse(repaired);
          if (!Array.isArray(suggestions)) {
            throw new Error('Suggestions response is not an array (after repair)');
          }
          this.logger.warn('Successfully repaired and parsed suggestions JSON.');
          return suggestions;
        } catch (repairError) {
          this.logger.error('Failed to repair and parse suggestions JSON', repairError);
          this.logger.error('Repaired content that failed to parse:', repaired);
          return [];
        }
      }
    } catch (error) {
      this.logger.error('Error in getSuggestions', {
        error: error.message,
        stack: error.stack,
        query
      });
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error('Authentication failed. Please check API credentials.');
      }
      throw new Error('Failed to get suggestions. Please try again.');
    }
  }
} 