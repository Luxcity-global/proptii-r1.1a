import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';

/**
 * Sprint 5-T003: Real dependency health checks using @nestjs/terminus.
 * GET /api/health returns { status: 'ok' } when all dependencies are reachable,
 * 503 with details if any critical dependency is down.
 */
@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
})
export class HealthModule {}
