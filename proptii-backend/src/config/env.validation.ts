import { Logger } from '@nestjs/common';
import { z } from 'zod';

/**
 * Zod schema for all required environment variables.
 * Called before NestFactory.create() in main.ts.
 * If validation fails the process exits immediately with a clear error.
 */
const envSchema = z.object({
  // ── Server ─────────────────────────────────────────────────────────────────
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),

  // ── Cosmos DB ───────────────────────────────────────────────────────────────
  COSMOS_DB_CONNECTION_STRING: z.string().min(1, 'COSMOS_DB_CONNECTION_STRING is required'),
  COSMOS_DB_KEY: z.string().min(1, 'COSMOS_DB_KEY is required'),
  COSMOS_DB_DATABASE_NAME: z.string().default('proptii-db'),

  // ── Azure OpenAI ────────────────────────────────────────────────────────────
  AZURE_OPENAI_API_KEY: z.string().min(1, 'AZURE_OPENAI_API_KEY is required'),
  AZURE_OPENAI_ENDPOINT: z.string().url('AZURE_OPENAI_ENDPOINT must be a valid URL'),
  AZURE_OPENAI_DEPLOYMENT_NAME: z.string().min(1, 'AZURE_OPENAI_DEPLOYMENT_NAME is required'),

  // ── Azure Storage ───────────────────────────────────────────────────────────
  AZURE_STORAGE_ACCOUNT_NAME: z.string().optional(),
  AZURE_STORAGE_CONTAINER_NAME: z.string().optional(),
  AZURE_STORAGE_SAS_TOKEN: z.string().optional(),

  // ── Email Service (Azure Communication Services / SMTP) ────────────────────
  EMAIL_SERVICE_ENDPOINT: z.string().optional(),
  EMAIL_SERVICE_KEY: z.string().optional(),
  EMAIL_FROM_ADDRESS: z.string().email().or(z.literal('')).optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM_EMAIL: z.string().email().or(z.literal('')).optional(),
  RESEND_API_KEY: z.string().optional(),

  // ── Firebase (Admin SDK) ────────────────────────────────────────────────────
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().email().or(z.literal('')).optional(),

  // ── Azure AD B2C / MSAL ─────────────────────────────────────────────────────
  MSAL_CLIENT_ID: z.string().min(1, 'MSAL_CLIENT_ID is required for Azure AD B2C authentication'),
  MSAL_AUTHORITY: z.string().url('MSAL_AUTHORITY must be a valid absolute URL (e.g., https://<tenant>.b2clogin.com/...)'),
  MSAL_REDIRECT_URI: z.string().optional(),

  // ── Azure AD B2C (Direct Graph API / Admin) ─────────────────────────────────
  AZURE_AD_B2C_CLIENT_ID: z.string().optional(),
  AZURE_AD_B2C_CLIENT_SECRET: z.string().optional(),
  AZURE_AD_B2C_TENANT_ID: z.string().optional(),

  // ── CORS / Frontend ─────────────────────────────────────────────────────────
  FRONTEND_URL: z.string().optional(),
  APP_URL: z.string().optional(),

  // ── OpenRouter ──────────────────────────────────────────────────────────────
  OPENROUTER_API_KEY: z.string().optional(),

  // ── Google Sheets (legacy route) ────────────────────────────────────────────
  GOOGLE_SHEETS_CREDENTIALS_JSON: z.string().optional(),

  // ── Test email (dev only) ───────────────────────────────────────────────────
  TEST_EMAIL_RECIPIENT: z.string().email().or(z.literal('')).optional(),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validates process.env against the schema.
 * Exits the process with code 1 on failure, listing all missing/invalid vars.
 */
export function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const logger = new Logger('EnvValidation');
    const errors = result.error.issues
      .map((issue) => `  • ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    logger.error(
      '\n[FATAL] Environment variable validation failed. Fix the following before starting:\n' +
        errors +
        '\n',
    );
    process.exit(1);
  }

  return result.data;
}
