import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, HealthCheckResult, HealthIndicatorResult } from '@nestjs/terminus';
import { Logger } from '@nestjs/common';

/**
 * Sprint 5-T003: Health check controller.
 * Replaces the simple AppController health check with a proper Terminus check
 * that verifies live connections to critical dependencies.
 *
 * GET /api/health
 *   - 200 { status: 'ok' }    when all critical deps are reachable
 *   - 503 { status: 'error' } with details if any dep fails
 */
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private readonly health: HealthCheckService) {}

  @Get()
  @HealthCheck()
  async check(): Promise<HealthCheckResult> {
    return this.health.check([
      // ── Cosmos DB ─────────────────────────────────────────────────────────
      async (): Promise<HealthIndicatorResult> => {
        const key = 'cosmos_db';
        const { resolveCosmosConnection, createCosmosClientFromEnv } = await import('../config/cosmos.config');
        const creds = resolveCosmosConnection();

        if (!creds) {
          return { [key]: { status: 'down', message: 'COSMOS_DB_CONNECTION_STRING or COSMOS_DB_KEY not configured' } };
        }

        try {
          const client = createCosmosClientFromEnv();
          if (!client) {
            return { [key]: { status: 'down', message: 'Cosmos DB client could not be created' } };
          }
          // Lightweight check — list databases (low-cost operation)
          await client.databases.readAll().fetchAll();
          return { [key]: { status: 'up' } };
        } catch (err) {
          this.logger.error('Cosmos DB health check failed:', err);
          return { [key]: { status: 'down', message: 'Cannot reach Cosmos DB' } };
        }
      },

      // ── Azure OpenAI (config presence check) ──────────────────────────────
      async (): Promise<HealthIndicatorResult> => {
        const key = 'azure_openai';
        const hasConfig =
          !!process.env.AZURE_OPENAI_ENDPOINT &&
          !!process.env.AZURE_OPENAI_API_KEY &&
          !!process.env.AZURE_OPENAI_DEPLOYMENT_NAME;

        return {
          [key]: hasConfig
            ? { status: 'up' }
            : { status: 'down', message: 'Azure OpenAI environment variables are not configured' },
        };
      },
    ]);
  }
}
