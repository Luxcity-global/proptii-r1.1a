import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ServeStaticModule } from '@nestjs/serve-static';
import * as path from 'path';
import * as fs from 'fs';

import { LoggingMiddleware } from './middleware/logging.middleware';
import { CorrelationIdMiddleware } from './middleware/correlation-id.middleware';
import { SecurityHeadersMiddleware } from './middleware/security-headers.middleware';
import { validateEnv } from './config/env.validation';

// ── 7 Domain Modules + Shared Module ──────────────────────────────────────────
import { SharedModule } from './modules/shared/shared.module';
import { AuthModule } from './modules/auth/auth.module';
import { PropertiesModule } from './modules/properties/properties.module';
import { ReferencingModule } from './modules/referencing/referencing.module';
import { ContractsModule } from './modules/contracts/contracts.module';
import { CommunicationModule } from './modules/communication/communication.module';
import { BillingModule } from './modules/billing/billing.module';
import { AdminModule } from './modules/admin/admin.module';

function resolvePublicFolder(folder: string): string {
  const inDist = path.join(__dirname, 'public', folder);
  if (fs.existsSync(inDist)) {
    return inDist;
  }
  return path.join(__dirname, '..', 'public', folder);
}

// Validate environment secrets at module definition time
validateEnv(process.env);

@Module({
  imports: [
    // Cross-cutting core
    SharedModule,
    ScheduleModule.forRoot(),
    // Tiered rate limiter: burst protection (15/s), medium flow (60/10s), baseline (120/min)
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 15,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 60,
      },
      {
        name: 'default',
        ttl: 60000,
        limit: 120,
      },
    ]),
    // Serve static campaign pages at /campaign/* and /welcome/*
    ServeStaticModule.forRoot(
      {
        rootPath: resolvePublicFolder('campaign'),
        serveRoot: '/campaign',
        serveStaticOptions: { index: 'index.html', fallthrough: false },
      },
      {
        rootPath: resolvePublicFolder('welcome'),
        serveRoot: '/welcome',
        serveStaticOptions: { index: 'index.html', fallthrough: false },
      },
    ),
    // 7 Domain Modules
    AuthModule,
    PropertiesModule,
    ReferencingModule,
    ContractsModule,
    CommunicationModule,
    BillingModule,
    AdminModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    Reflector,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply Correlation ID, Security Headers, and HTTP logging to every route
    consumer
      .apply(CorrelationIdMiddleware, SecurityHeadersMiddleware, LoggingMiddleware)
      .forRoutes('*');
  }
}
