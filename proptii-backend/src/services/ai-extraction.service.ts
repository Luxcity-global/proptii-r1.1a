import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface ExtractedData {
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
    dateOfBirth?: string;
    nationality?: string;
    employmentStatus?: string;
    jobPosition?: string;
    companyDetails?: string;
    currentAddress?: string;
    monthlyIncome?: string;
}

@Injectable()
export class AIExtractionService {
    private readonly logger = new Logger(AIExtractionService.name);
    private readonly openRouterUrl = 'https://openrouter.ai/api/v1/chat/completions';
    private readonly apiKey: string;

    constructor() {
        this.apiKey = process.env.OPENROUTER_API_KEY || '';
        if (!this.apiKey) {
            this.logger.warn('OPENROUTER_API_KEY is not defined in environment variables');
        }
    }

    async extractDataFromDocument(base64Data: string, mimeType: string): Promise<ExtractedData | null> {
        try {
            if (!this.apiKey) {
                throw new Error('AI extraction configuration missing (API Key)');
            }

            const prompt = `
        Extract the following fields from the provided document (Passport, ID, or CV).
        Return raw JSON data matching the requested schema.
      `;

            this.logger.log('Sending request to OpenRouter with model: google/gemini-2.0-flash-001');

            const response = await axios.post(
                this.openRouterUrl,
                {
                    model: 'google/gemini-2.0-flash-001',
                    messages: [
                        {
                            role: 'user',
                            content: [
                                { type: 'text', text: prompt },
                                {
                                    type: 'image_url',
                                    image_url: {
                                        url: `data:${mimeType};base64,${base64Data}`,
                                    },
                                },
                            ],
                        },
                    ],
                    response_format: {
                        type: 'json_schema',
                        json_schema: {
                            name: 'extracted_data',
                            strict: true,
                            schema: {
                                type: 'object',
                                properties: {
                                    firstName: { type: 'string' },
                                    lastName: { type: 'string' },
                                    email: { type: 'string' },
                                    phoneNumber: { type: 'string' },
                                    dateOfBirth: { type: 'string', description: 'YYYY-MM-DD' },
                                    nationality: { type: 'string' },
                                    employmentStatus: { type: 'string', enum: ['employed', 'self-employed', 'student', 'retired', 'unemployed', ''] },
                                    jobPosition: { type: 'string' },
                                    companyDetails: { type: 'string' },
                                    currentAddress: { type: 'string' },
                                    monthlyIncome: { type: 'string' }
                                },
                                required: ['firstName', 'lastName', 'email', 'phoneNumber', 'dateOfBirth', 'nationality', 'employmentStatus', 'jobPosition', 'companyDetails', 'currentAddress', 'monthlyIncome'],
                                additionalProperties: false
                            }
                        }
                    },
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.apiKey}`,
                        'HTTP-Referer': 'https://proptii.co',
                        'X-Title': 'Proptii Referencing',
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (!response.data || !response.data.choices || response.data.choices.length === 0) {
                this.logger.error('Unexpected OpenRouter response format:', response.data);
                throw new Error('AI returned an empty or invalid response');
            }

            const content = response.data.choices[0].message.content;
            this.logger.debug(`AI Raw Response: ${content}`);

            try {
                const parsed = JSON.parse(content);
                return parsed as ExtractedData;
            } catch (parseError) {
                this.logger.error(`Failed to parse AI content as JSON: ${content}`);
                throw new Error('AI response was not in a valid JSON format');
            }
        } catch (error) {
            this.logger.error('OpenRouter Service Error:', error.message);
            if (axios.isAxiosError(error)) {
                this.logger.error('API Error Data:', error.response?.data);
            }
            throw error;
        }
    }
}
