import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { validateEnv, Environment } from './env.validation';

describe('validateEnv', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('validates a correct development configuration', () => {
    const config = {
      NODE_ENV: 'development',
      PORT: '3002',
      REDIS_URL: 'redis://localhost:6379',
      FIREBASE_PROJECT_ID: 'proptii-16946',
    };

    const validated = validateEnv(config);
    expect(validated.NODE_ENV).toBe(Environment.Development);
    expect(validated.PORT).toBe(3002);
  });

  it('fails fast on invalid enum values', () => {
    const config = {
      NODE_ENV: 'not-a-valid-env',
    };

    expect(() => validateEnv(config)).toThrow('[EnvValidation] Startup configuration error');
  });

  it('throws fatal error in production when critical secrets are missing', () => {
    const config = {
      NODE_ENV: 'production',
      PORT: '3002',
    };
    delete process.env.RENDER_EXTERNAL_URL;
    delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
    delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    expect(() => validateEnv(config)).toThrow('[EnvValidation] FATAL: Missing critical production environment variables');
  });
});
