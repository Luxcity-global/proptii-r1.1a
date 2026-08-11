import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from './modules/database.module';
import { ViewingRequestModule } from './modules/viewing-request.module';
import { ReferencingModule } from './modules/referencing.module';
import { SearchModule } from './search/search.module';
import { SheetsModule } from './sheets/sheets.module';
import { ContractModule } from './modules/contract.module';
import { StorageModule } from './storage/storage.module';
import { PropertyDocumentController } from './controllers/property-document.controller';
import { CommunicationController } from './controllers/communication.controller';
import { AnalyticsController } from './controllers/analytics.controller';
import { ClientsController } from './controllers/clients.controller';
import { AzureUsersModule } from './modules/azure-users.module';

import { AuthModule } from './modules/auth.module';
import { HealthModule } from './health/health.module';
import { BillingModule } from './modules/billing/billing.module';
import { RequestIdMiddleware } from './middleware/request-id.middleware';
import { KeepAliveService } from './services/keep-alive.service';
import { AnalyticsService } from './services/analytics.service';
import { ClientsService } from './services/clients.service';
import { GuestEnquiryModule } from './modules/guest-enquiry.module';
import { NativePropertiesModule } from './modules/native-properties.module';

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
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017', {
      dbName: process.env.MONGODB_DB_NAME || 'proptii-communication',
      // Graceful degradation: fail fast instead of hanging the server if Atlas is unreachable.
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      socketTimeoutMS: 10000,
      // Don't queue operations when disconnected — surface errors immediately.
      bufferCommands: false,
    }),
    GuestEnquiryModule,
    NativePropertiesModule,
    BillingModule,
  ],
  controllers: [AppController, PropertyDocumentController, CommunicationController, AnalyticsController, ClientsController],
  providers: [
    AppService,
    AnalyticsService,
    ClientsService,
    // Apply rate limiting globally via the ThrottlerGuard.
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Keep Render free-tier services warm — pings backend + search every 14 min.
    KeepAliveService,
  ],
})
export class AppModule implements NestModule {
  // Sprint 5-T002: Attach request-ID middleware to all routes.
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}