import { z } from 'zod';

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']),
    FUNCTIONS_WORKER_RUNTIME: z.string(),
    AzureWebJobsStorage: z.string(),
    // MongoDB — used by the communication feature
    MONGODB_URI: z.string(),
    MONGODB_DB_NAME: z.string().default('proptii-communication'),
    // Cosmos DB — still used by PropertyService, UserService, ViewingService, MonitoringService
    COSMOS_DB_CONNECTION_STRING: z.string().optional(),
    COSMOS_DB_KEY: z.string().optional(),
    COSMOS_DB_DATABASE_NAME: z.string().optional(),
    AZURE_AD_B2C_TENANT_NAME: z.string(),
    AZURE_AD_B2C_CLIENT_ID: z.string(),
    AZURE_AD_B2C_POLICY_NAME: z.string(),
    AZURE_AD_B2C_ISSUER: z.string().url(),
    APPINSIGHTS_INSTRUMENTATIONKEY: z.string().optional(),
    API_PREFIX: z.string(),
    ALLOWED_ORIGINS: z.string(),
    // Messaging — optional to avoid breaking existing deployments
    BLOB_STORAGE_CONNECTION_STRING: z.string().optional(),
    BLOB_STORAGE_CONTAINER_NAME: z.string().optional(),
    ATTACHMENT_SAS_EXPIRY_SECONDS: z.coerce.number().default(3600),
    EMAIL_FROM_ADDRESS: z.string().email().optional(),
    ACTIVE_USER_THRESHOLD_SECONDS: z.coerce.number().default(300),
    EMAIL_DEDUP_WINDOW_SECONDS: z.coerce.number().default(900),
    // Email transport — Resend API (primary)
    RESEND_API_KEY: z.string().optional(),
    // Email transport — SMTP fallback
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
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
