import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from './modules/database.module';
import { ViewingRequestModule } from './modules/viewing-request.module';
import { ReferencingModule } from './modules/referencing.module';
import { SearchModule } from './search/search.module';
import { SheetsModule } from './sheets/sheets.module';
import { ContractModule } from './modules/contract.module';
import { StorageModule } from './storage/storage.module';
import { PropertyDocumentController } from './controllers/property-document.controller';
import { AzureUsersModule } from './modules/azure-users.module';
import { AuthModule } from './modules/auth.module';
import { HealthModule } from './health/health.module';
import { BillingModule } from './modules/billing/billing.module';
import { RequestIdMiddleware } from './middleware/request-id.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    // Sprint 5-T001: Global rate limiting — 100 req/min per IP for general routes.
    // Tighter limits can be applied per-route with @Throttle({ default: { limit: 10, ttl: 60000 } })
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000, // 1 minute in ms
        limit: 100,
      },
      {
        name: 'ai_search',
        ttl: 60_000,
        limit: 10,
      },
    ]),
    AuthModule,
    DatabaseModule,
    ViewingRequestModule,
    ReferencingModule,
    SearchModule,
    SheetsModule,
    ContractModule,
    StorageModule,
    AzureUsersModule,
    HealthModule,
    BillingModule,
  ],
  controllers: [AppController, PropertyDocumentController],
  providers: [
    AppService,
    // Apply rate limiting globally via the ThrottlerGuard.
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  // Sprint 5-T002: Attach request-ID middleware to all routes.
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}