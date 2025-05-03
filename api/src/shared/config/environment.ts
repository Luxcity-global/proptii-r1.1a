import { z } from 'zod';

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']),
    FUNCTIONS_WORKER_RUNTIME: z.literal('node'),
    COSMOS_DB_CONNECTION_STRING: z.string(),
    COSMOS_DB_DATABASE_NAME: z.string(),
    AZURE_AD_B2C_CLIENT_ID: z.string(),
    AZURE_AD_B2C_TENANT_NAME: z.string(),
    AZURE_AD_B2C_POLICY_NAME: z.string(),
    APPINSIGHTS_INSTRUMENTATIONKEY: z.string(),
    API_PREFIX: z.string(),
    ALLOWED_ORIGINS: z.string(),
});

export type EnvConfig = z.infer<typeof envSchema>;

export const validateEnv = (): EnvConfig => {
    const config = {
        NODE_ENV: process.env.NODE_ENV,
        FUNCTIONS_WORKER_RUNTIME: process.env.FUNCTIONS_WORKER_RUNTIME,
        COSMOS_DB_CONNECTION_STRING: process.env.COSMOS_DB_CONNECTION_STRING,
        COSMOS_DB_DATABASE_NAME: process.env.COSMOS_DB_DATABASE_NAME,
        AZURE_AD_B2C_CLIENT_ID: process.env.AZURE_AD_B2C_CLIENT_ID,
        AZURE_AD_B2C_TENANT_NAME: process.env.AZURE_AD_B2C_TENANT_NAME,
        AZURE_AD_B2C_POLICY_NAME: process.env.AZURE_AD_B2C_POLICY_NAME,
        APPINSIGHTS_INSTRUMENTATIONKEY: process.env.APPINSIGHTS_INSTRUMENTATIONKEY,
        API_PREFIX: process.env.API_PREFIX,
        ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
    };

    const result = envSchema.safeParse(config);

    if (!result.success) {
        throw new Error(`Environment validation failed: ${JSON.stringify(result.error.format(), null, 2)}`);
    }

    return result.data;
}; 