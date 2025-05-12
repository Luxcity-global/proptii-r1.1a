import { z } from 'zod';

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']),
    FUNCTIONS_WORKER_RUNTIME: z.string(),
    AzureWebJobsStorage: z.string(),
    COSMOS_DB_CONNECTION_STRING: z.string(),
    COSMOS_DB_KEY: z.string(),
    COSMOS_DB_DATABASE_NAME: z.string(),
    AZURE_AD_B2C_TENANT_NAME: z.string(),
    AZURE_AD_B2C_CLIENT_ID: z.string(),
    AZURE_AD_B2C_POLICY_NAME: z.string(),
    AZURE_AD_B2C_ISSUER: z.string().url(),
    APPINSIGHTS_INSTRUMENTATIONKEY: z.string(),
    API_PREFIX: z.string(),
    ALLOWED_ORIGINS: z.string(),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(): EnvConfig {
    try {
        return envSchema.parse(process.env);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const missingVars = error.errors.map(err => err.path.join('.')).join(', ');
            throw new Error(`Missing or invalid environment variables: ${missingVars}`);
        }
        throw error;
    }
} 