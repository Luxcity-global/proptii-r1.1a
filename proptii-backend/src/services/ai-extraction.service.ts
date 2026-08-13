import { BadGatewayException, BadRequestException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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

const EXTRACTION_PROMPT = `Extract the following fields from the provided document (Passport, ID, CV, or similar).
Return JSON only, matching this schema. Use empty strings for unknown values:
{
  "firstName": string,
  "lastName": string,
  "email": string,
  "phoneNumber": string,
  "dateOfBirth": string (YYYY-MM-DD),
  "nationality": string,
  "employmentStatus": "employed" | "self-employed" | "student" | "retired" | "unemployed" | "",
  "jobPosition": string,
  "companyDetails": string,
  "currentAddress": string,
  "monthlyIncome": string
}`;

const OPENROUTER_MODELS = [
    'google/gemini-2.5-flash',
    'google/gemini-3.5-flash',
    'google/gemini-3.6-flash',
] as const;

@Injectable()
export class AIExtractionService {
    private readonly logger = new Logger(AIExtractionService.name);
    private readonly openRouterUrl = 'https://openrouter.ai/api/v1/chat/completions';

    constructor(private readonly configService: ConfigService) {
        if (this.getOpenRouterKey()) {
            this.logger.log('AI extraction: OpenRouter configured');
        } else if (this.getAzureConfig()) {
            this.logger.log('AI extraction: Azure OpenAI configured (OpenRouter key missing)');
        } else {
            this.logger.warn(
                'AI extraction is not configured. Set OPENROUTER_API_KEY or AZURE_OPENAI_API_KEY + AZURE_OPENAI_ENDPOINT + AZURE_OPENAI_DEPLOYMENT_NAME.',
            );
        }
    }

    async extractDataFromDocument(base64Data: string, mimeType: string): Promise<ExtractedData | null> {
        const openRouterKey = this.getOpenRouterKey();
        if (openRouterKey) {
            return this.extractWithOpenRouter(base64Data, mimeType, openRouterKey);
        }

        const azure = this.getAzureConfig();
        if (azure) {
            return this.extractWithAzure(base64Data, mimeType, azure);
        }

        throw new ServiceUnavailableException(
            'Auto-fill is not configured. Add OPENROUTER_API_KEY (PDFs and images) or AZURE_OPENAI_API_KEY (images) to proptii-backend/.env and restart the server.',
        );
    }

    private readEnv(name: string): string {
        return (this.configService.get<string>(name) || process.env[name] || '').trim();
    }

    private getOpenRouterKey(): string {
        const dedicated = this.readEnv('OPENROUTER_API_KEY');
        if (dedicated) {
            return dedicated;
        }

        // Common misconfig: OpenRouter key pasted into AZURE_OPENAI_API_KEY
        const azureNamed = this.readEnv('AZURE_OPENAI_API_KEY') || this.readEnv('AZURE_OPENAI_KEY');
        if (azureNamed.startsWith('sk-or-')) {
            this.logger.warn(
                'AZURE_OPENAI_API_KEY looks like an OpenRouter key. Using it for OpenRouter. Rename the variable to OPENROUTER_API_KEY.',
            );
            return azureNamed;
        }
        return '';
    }

    private getAzureConfig(): { endpoint: string; apiKey: string; deployment: string } | null {
        const endpoint = this.readEnv('AZURE_OPENAI_ENDPOINT').replace(/\/$/, '');
        const apiKey = this.readEnv('AZURE_OPENAI_API_KEY') || this.readEnv('AZURE_OPENAI_KEY');
        const deployment = this.readEnv('AZURE_OPENAI_DEPLOYMENT_NAME') || this.readEnv('AZURE_OPENAI_DEPLOYMENT');

        if (!endpoint || !apiKey || !deployment || apiKey.startsWith('sk-or-')) {
            return null;
        }
        return { endpoint, apiKey, deployment };
    }

    private getOpenRouterModels(): string[] {
        const configured = this.readEnv('OPENROUTER_MODEL');
        const models = configured ? [configured, ...OPENROUTER_MODELS] : [...OPENROUTER_MODELS];
        return [...new Set(models)];
    }

    private isUnavailableModelError(error: unknown): boolean {
        if (!axios.isAxiosError(error)) {
            return false;
        }
        const message = String(error.response?.data?.error?.message || error.response?.data?.message || '');
        const status = error.response?.status;
        return status === 404 || /no endpoints found/i.test(message);
    }

    private async extractWithOpenRouter(
        base64Data: string,
        mimeType: string,
        apiKey: string,
    ): Promise<ExtractedData> {
        const models = this.getOpenRouterModels();
        let lastError: unknown;

        for (const model of models) {
            this.logger.log(`Sending request to OpenRouter with model: ${model}`);
            try {
                const response = await axios.post(
                    this.openRouterUrl,
                    {
                        model,
                        max_tokens: 2048,
                        messages: [
                            {
                                role: 'user',
                                content: [
                                    { type: 'text', text: EXTRACTION_PROMPT },
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
                                        employmentStatus: {
                                            type: 'string',
                                            enum: ['employed', 'self-employed', 'student', 'retired', 'unemployed', ''],
                                        },
                                        jobPosition: { type: 'string' },
                                        companyDetails: { type: 'string' },
                                        currentAddress: { type: 'string' },
                                        monthlyIncome: { type: 'string' },
                                    },
                                    required: [
                                        'firstName',
                                        'lastName',
                                        'email',
                                        'phoneNumber',
                                        'dateOfBirth',
                                        'nationality',
                                        'employmentStatus',
                                        'jobPosition',
                                        'companyDetails',
                                        'currentAddress',
                                        'monthlyIncome',
                                    ],
                                    additionalProperties: false,
                                },
                            },
                        },
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${apiKey}`,
                            'HTTP-Referer': 'https://proptii.co',
                            'X-Title': 'Proptii Referencing',
                            'Content-Type': 'application/json',
                        },
                        timeout: 60_000,
                    },
                );

                return this.parseModelContent(response.data?.choices?.[0]?.message?.content);
            } catch (error) {
                lastError = error;
                if (this.isUnavailableModelError(error)) {
                    this.logger.warn(`OpenRouter model unavailable: ${model}. Trying next model.`);
                    continue;
                }
                this.rethrowProviderError('OpenRouter', error);
            }
        }

        this.rethrowProviderError('OpenRouter', lastError);
    }

    private async extractWithAzure(
        base64Data: string,
        mimeType: string,
        azure: { endpoint: string; apiKey: string; deployment: string },
    ): Promise<ExtractedData> {
        if (mimeType === 'application/pdf') {
            throw new BadRequestException(
                'PDF auto-fill requires OPENROUTER_API_KEY. Upload a JPG or PNG of the document, or add an OpenRouter key to proptii-backend/.env.',
            );
        }

        this.logger.log(`Sending extraction request to Azure OpenAI deployment: ${azure.deployment}`);

        const url = `${azure.endpoint}/openai/deployments/${azure.deployment}/chat/completions?api-version=2024-02-15-preview`;

        try {
            const response = await axios.post(
                url,
                {
                    messages: [
                        {
                            role: 'system',
                            content: 'You extract structured tenant referencing fields from identity and employment documents. Return JSON only.',
                        },
                        {
                            role: 'user',
                            content: [
                                { type: 'text', text: EXTRACTION_PROMPT },
                                {
                                    type: 'image_url',
                                    image_url: {
                                        url: `data:${mimeType};base64,${base64Data}`,
                                    },
                                },
                            ],
                        },
                    ],
                    max_tokens: 800,
                    response_format: { type: 'json_object' },
                },
                {
                    headers: {
                        'api-key': azure.apiKey,
                        'Content-Type': 'application/json',
                    },
                    timeout: 60_000,
                },
            );

            return this.parseModelContent(response.data?.choices?.[0]?.message?.content);
        } catch (error) {
            this.rethrowProviderError('Azure OpenAI', error);
        }
    }

    private parseModelContent(content: unknown): ExtractedData {
        if (typeof content !== 'string' || !content.trim()) {
            throw new BadGatewayException('AI returned an empty or invalid response');
        }

        let raw = content.trim();
        raw = raw.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();

        try {
            return JSON.parse(raw) as ExtractedData;
        } catch {
            this.logger.error(`Failed to parse AI content as JSON: ${raw}`);
            throw new BadGatewayException('AI response was not in a valid JSON format');
        }
    }

    private rethrowProviderError(provider: string, error: unknown): never {
        if (error instanceof BadRequestException || error instanceof BadGatewayException || error instanceof ServiceUnavailableException) {
            throw error;
        }

        const axiosError = axios.isAxiosError(error) ? error : null;
        const providerMessage =
            axiosError?.response?.data?.error?.message ||
            axiosError?.response?.data?.message ||
            (error instanceof Error ? error.message : String(error));

        this.logger.error(`${provider} extraction failed: ${providerMessage}`);
        if (axiosError?.response?.data) {
            this.logger.error(`${provider} error payload: ${JSON.stringify(axiosError.response.data)}`);
        }

        throw new BadGatewayException(`${provider} auto-fill failed. Please try again or enter details manually.`);
    }
}
