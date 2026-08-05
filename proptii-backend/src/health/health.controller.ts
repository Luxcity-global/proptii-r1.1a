import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, HealthCheckResult, HealthIndicatorResult } from '@nestjs/terminus';
import { Logger } from '@nestjs/common';

/**
 * GET /api/health        — lightweight ping (used by Render.com uptime checks)
 * GET /api/health/detail — full dependency health check across all services
 */
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private readonly health: HealthCheckService) {}

  /** Lightweight ping — always returns 200 if the server is up. */
  @Get()
  ping() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  /** Full dependency health check — checks all critical services. */
  @Get('detail')
  @HealthCheck()
  async check(): Promise<HealthCheckResult> {
    return this.health.check([
      // ── Cosmos DB ─────────────────────────────────────────────────────────
      async (): Promise<HealthIndicatorResult> => {
        const key = 'cosmos_db';
        const endpoint = process.env.COSMOS_DB_CONNECTION_STRING;
        const dbKey = process.env.COSMOS_DB_KEY;
        if (!endpoint || !dbKey) {
          return { [key]: { status: 'down', message: 'COSMOS_DB_CONNECTION_STRING or COSMOS_DB_KEY not configured' } };
        }
        try {
          const { CosmosClient } = await import('@azure/cosmos');
          const client = new CosmosClient({ endpoint, key: dbKey });
          await client.databases.readAll().fetchAll();
          return { [key]: { status: 'up' } };
        } catch (err) {
          this.logger.error('Cosmos DB health check failed:', err);
          return { [key]: { status: 'down', message: 'Cannot reach Cosmos DB' } };
        }
      },

      // ── Firestore ─────────────────────────────────────────────────────────
      async (): Promise<HealthIndicatorResult> => {
        const key = 'firestore';
        try {
          const { getFirestore } = await import('../config/firestore.config');
          const db = getFirestore();
          if (!db) return { [key]: { status: 'down', message: 'Firestore not initialized' } };
          await db.listCollections();
          return { [key]: { status: 'up' } };
        } catch (err) {
          this.logger.error('Firestore health check failed:', err);
          return { [key]: { status: 'down', message: 'Cannot reach Firestore' } };
        }
      },

      // ── MongoDB (Communications) ───────────────────────────────────────────
      async (): Promise<HealthIndicatorResult> => {
        const key = 'mongodb';
        const uri = process.env.MONGODB_URI;
        if (!uri) return { [key]: { status: 'down', message: 'MONGODB_URI not configured' } };
        try {
          const mongoose = await import('mongoose');
          const state = mongoose.default.connection.readyState;
          // 1 = connected, 2 = connecting
          return state === 1 || state === 2
            ? { [key]: { status: 'up', state } }
            : { [key]: { status: 'down', message: `Mongoose state: ${state}` } };
        } catch (err) {
          this.logger.error('MongoDB health check failed:', err);
          return { [key]: { status: 'down', message: 'Cannot reach MongoDB' } };
        }
      },

      // ── Azure Blob Storage ─────────────────────────────────────────────────
      async (): Promise<HealthIndicatorResult> => {
        const key = 'azure_blob';
        const connStr = process.env.BLOB_STORAGE_CONNECTION_STRING
          || process.env.AzureWebJobsStorage
          || process.env.AZURE_STORAGE_CONNECTION_STRING;
        if (!connStr) return { [key]: { status: 'down', message: 'Azure Blob connection string not configured' } };
        try {
          const { BlobServiceClient } = await import('@azure/storage-blob');
          const client = BlobServiceClient.fromConnectionString(connStr);
          await client.getProperties();
          return { [key]: { status: 'up' } };
        } catch (err) {
          this.logger.error('Azure Blob health check failed:', err);
          return { [key]: { status: 'down', message: 'Cannot reach Azure Blob Storage' } };
        }
      },

      // ── SMTP (Email) ────────────────────────────────────────────────────────
      async (): Promise<HealthIndicatorResult> => {
        const key = 'smtp';
        // Support both naming conventions: EMAIL_* (production) and SMTP_* (local/legacy)
        const hasConfig =
          !!(process.env.EMAIL_HOST || process.env.SMTP_HOST) &&
          !!(process.env.EMAIL_USER || process.env.SMTP_USER) &&
          !!(process.env.EMAIL_PASSWORD || process.env.SMTP_PASS);
        return {
          [key]: hasConfig
            ? { status: 'up' }
            : { status: 'down', message: 'SMTP environment variables not configured' },
        };
      },

      // ── Azure OpenAI (config presence check) ──────────────────────────────
      async (): Promise<HealthIndicatorResult> => {
        const key = 'azure_openai';
        const hasConfig =
          !!process.env.AZURE_OPENAI_ENDPOINT &&
          !!process.env.AZURE_OPENAI_API_KEY &&
          !!(process.env.AZURE_OPENAI_DEPLOYMENT_NAME || process.env.AZURE_OPENAI_DEPLOYMENT);
        return {
          [key]: hasConfig
            ? { status: 'up' }
            : { status: 'down', message: 'Azure OpenAI environment variables are not configured' },
        };
      },
    ]);
  }
}
