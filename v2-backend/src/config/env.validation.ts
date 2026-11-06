import 'reflect-metadata';
import { plainToInstance, Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  validateSync,
  ValidationError,
} from 'class-validator';

export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  PORT: number = 3002;

  // Firebase
  @IsString()
  @IsOptional()
  FIREBASE_PROJECT_ID: string = 'proptii-16946';

  @IsString()
  @IsOptional()
  FIREBASE_SERVICE_ACCOUNT_JSON?: string;

  @IsString()
  @IsOptional()
  FIREBASE_STORAGE_BUCKET?: string;

  // Redis
  @IsString()
  @IsOptional()
  REDIS_URL?: string;

  // Stripe
  @IsString()
  @IsOptional()
  STRIPE_SECRET_KEY?: string;

  @IsString()
  @IsOptional()
  STRIPE_WEBHOOK_SECRET?: string;

  // Resend / Email
  @IsString()
  @IsOptional()
  RESEND_API_KEY?: string;

  @IsString()
  @IsOptional()
  FRONTEND_URL?: string;
}

export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors: ValidationError[] = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const formattedErrors = errors
      .map((err) => Object.values(err.constraints || {}).join(', '))
      .join('; ');
    throw new Error(`[EnvValidation] Startup configuration error: ${formattedErrors}`);
  }

  // Strict production assertions
  const isProd =
    validatedConfig.NODE_ENV === Environment.Production ||
    !!process.env.RENDER_EXTERNAL_URL;

  const missingKeys: string[] = [];

  if (isProd) {
    if (!validatedConfig.FIREBASE_SERVICE_ACCOUNT_JSON && !process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.FIREBASE_CLIENT_EMAIL) {
      missingKeys.push('FIREBASE_SERVICE_ACCOUNT_JSON (or GOOGLE_APPLICATION_CREDENTIALS)');
    }
    if (!validatedConfig.STRIPE_SECRET_KEY) {
      missingKeys.push('STRIPE_SECRET_KEY');
    }
    if (!validatedConfig.STRIPE_WEBHOOK_SECRET) {
      missingKeys.push('STRIPE_WEBHOOK_SECRET');
    }
  }

  // Redis is required for distributed SSE ticketing and events
  if (!validatedConfig.REDIS_URL && !process.env.REDIS_HOST) {
    if (isProd) {
      missingKeys.push('REDIS_URL');
    } else {
      console.warn('⚠️  [EnvValidation] REDIS_URL not configured. Falling back to local redis://localhost:6379');
    }
  }

  if (missingKeys.length > 0) {
    const errorMsg = `[EnvValidation] FATAL: Missing critical production environment variables:\n  - ${missingKeys.join('\n  - ')}\nBackend cannot safely boot without these secrets.`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  console.log(`✅ [EnvValidation] Environment configuration validated for ${validatedConfig.NODE_ENV} mode.`);
  return validatedConfig;
}
