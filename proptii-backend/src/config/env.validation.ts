import { Logger } from '@nestjs/common';
import { z } from 'zod';

function applyEnvAliases(): void {
  // Backward-compatible aliases for older environment naming conventions.
  process.env.MSAL_CLIENT_ID ||= process.env.AZURE_AD_B2C_CLIENT_ID;
  process.env.MSAL_AUTHORITY ||= process.env.AZURE_AD_B2C_AUTHORITY;

  process.env.AZURE_OPENAI_DEPLOYMENT_NAME ||= process.env.AZURE_OPENAI_DEPLOYMENT;
  process.env.COSMOS_DB_CONNECTION_STRING ||= process.env.COSMOS_DB_ENDPOINT;
  process.env.COSMOS_DB_DATABASE_NAME ||= process.env.COSMOS_DB_NAME;
}

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
  MONGODB_URI: z.string().optional(),
  MONGODB_DB_NAME: z.string().default('proptii-communication'),

  // ── Azure OpenAI ────────────────────────────────────────────────────────────
  AZURE_OPENAI_API_KEY: z.string().optional(),
  AZURE_OPENAI_ENDPOINT: z.string().url('AZURE_OPENAI_ENDPOINT must be a valid URL').or(z.literal('')).optional(),
  AZURE_OPENAI_DEPLOYMENT_NAME: z.string().optional(),

  // ── Azure Storage ───────────────────────────────────────────────────────────
  AZURE_STORAGE_ACCOUNT_NAME: z.string().optional(),

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
  MSAL_CLIENT_ID: z.string().optional(),
  MSAL_AUTHORITY: z.string().url('MSAL_AUTHORITY must be a valid absolute URL (e.g., https://<tenant>.b2clogin.com/...)').or(z.literal('')).optional(),
  MSAL_ADDITIONAL_AUDIENCES: z.string().optional(),
  MSAL_REDIRECT_URI: z.string().optional(),

  // ── CORS / Frontend ─────────────────────────────────────────────────────────
  FRONTEND_URL: z.string().optional(),
  APP_URL: z.string().optional(),

  // ── OpenRouter ──────────────────────────────────────────────────────────────
  OPENROUTER_API_KEY: z.string().optional(),

  // ── Google Sheets (legacy route) ────────────────────────────────────────────
  GOOGLE_SHEETS_CREDENTIALS_JSON: z.string().optional(),

  // ── Test email (dev only) ───────────────────────────────────────────────────
  TEST_EMAIL_RECIPIENT: z.string().email().or(z.literal('')).optional(),

  // ── Stripe (billing module — Sprint 1) ──────────────────────────────────────
  // All optional at startup — the billing module logs warnings if missing.
  // Use sk_test_* in dev/staging, sk_live_* in production only.
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  PROMO_FREE_MONTH_ACTIVE: z.enum(['true', 'false']).default('true'),

  // Stripe price IDs — one per plan per billing cadence (14 total; no Enterprise)
  STRIPE_PRICE_RENTER_PRO_MONTHLY: z.string().optional(),
  STRIPE_PRICE_RENTER_PRO_ANNUAL: z.string().optional(),
  STRIPE_PRICE_BUYER_PRO_MONTHLY: z.string().optional(),
  STRIPE_PRICE_BUYER_PRO_ANNUAL: z.string().optional(),
  STRIPE_PRICE_STARTER_MONTHLY: z.string().optional(),
  STRIPE_PRICE_STARTER_ANNUAL: z.string().optional(),
  STRIPE_PRICE_LANDLORD_PRO_MONTHLY: z.string().optional(),
  STRIPE_PRICE_LANDLORD_PRO_ANNUAL: z.string().optional(),
  STRIPE_PRICE_ELITE_MONTHLY: z.string().optional(),
  STRIPE_PRICE_ELITE_ANNUAL: z.string().optional(),
  STRIPE_PRICE_INDEPENDENT_MONTHLY: z.string().optional(),
  STRIPE_PRICE_INDEPENDENT_ANNUAL: z.string().optional(),
  STRIPE_PRICE_AGENT_PRO_MONTHLY: z.string().optional(),
  STRIPE_PRICE_AGENT_PRO_ANNUAL: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validates process.env against the schema.
 * Exits the process with code 1 on failure, listing all missing/invalid vars.
 */
export function validateEnv(): Env {
  applyEnvAliases();
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
