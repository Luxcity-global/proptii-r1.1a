import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { LoggingMiddleware } from './middleware/logging.middleware';
import { GovDataModule } from './gov-data/gov-data.module';

// ── Existing controllers ──────────────────────────────────────────────────────
import { AuthController } from './controllers/auth.controller';
import { NativePropertiesController } from './controllers/native-properties.controller';
import { SavedPropertiesController } from './controllers/saved-properties.controller';
import { TenantDashboardController } from './controllers/tenant-dashboard.controller';
import { ViewingRequestController } from './controllers/viewing-request.controller';
import { ReferencingController } from './controllers/referencing.controller';
import { CommunicationController } from './controllers/communication.controller';
import { GuestEnquiryController } from './controllers/guest-enquiry.controller';
import { ContractController } from './controllers/contract.controller';
import { BillingController } from './controllers/billing.controller';
import { UserProfileController } from './controllers/user-profile.controller';
import { HealthController } from './controllers/health.controller';

// ── New controllers (gap-fill) ────────────────────────────────────────────────
import { LandlordsController } from './controllers/landlords.controller';
import { PropertySelectionsController } from './controllers/property-selections.controller';
import { HomeownerController } from './controllers/homeowner.controller';
import { AlertsController } from './controllers/alerts.controller';
import { InsightsController } from './controllers/insights.controller';
import { SheetsController } from './controllers/sheets.controller';
import { RefereeGuarantorController } from './controllers/referee-guarantor.controller';

// ── R1.4 — Search Classifier (Sprint 1.3) ────────────────────────────────────
import { ClassifierController } from './search/classifier.controller';
import { ClassifierService }    from './search/classifier.service';

// ── R1.4 — Runtime Flag (Sprint 2.1) ─────────────────────────────────────
import { FlagsController }        from './controllers/flags.controller';

// ── R1.4 — Property Facts (Sprint 2.2 + 3.1) ─────────────────────────────
import { PropertyFactsController } from './controllers/property-facts.controller';
import { ReportController }        from './controllers/report.controller';

// ── Existing services ─────────────────────────────────────────────────────────
import { NativePropertiesService } from './services/native-properties.service';
import { SavedPropertiesService } from './services/saved-properties.service';
import { ViewingRequestService } from './services/viewing-request.service';
import { ReferencingService } from './services/referencing.service';
import { CommunicationService } from './services/communication.service';
import { GuestEnquiryService } from './services/guest-enquiry.service';
import { ContractService } from './services/contract.service';
import { BillingService } from './services/billing.service';
import { UserProfileService } from './services/user-profile.service';

// ── New services (gap-fill) ───────────────────────────────────────────────────
import { LandlordsService } from './services/landlords.service';
import { PropertySelectionsService } from './services/property-selections.service';
import { HomeownerService } from './services/homeowner.service';
import { AlertsService } from './services/alerts.service';
import { InsightsService } from './services/insights.service';
import { SheetsService } from './services/sheets.service';
import { RefereeGuarantorService } from './services/referee-guarantor.service';
import { EmailService } from './services/email.service';
import { EventsService } from './services/events.service';
import { StorageService } from './services/storage.service';
import { StorageController } from './controllers/storage.controller';

@Module({
  imports: [GovDataModule],
  controllers: [
    HealthController,
    AuthController,
    NativePropertiesController,
    SavedPropertiesController,
    TenantDashboardController,
    ViewingRequestController,
    ReferencingController,
    CommunicationController,
    GuestEnquiryController,
    ContractController,
    BillingController,
    UserProfileController,
    // Gap-fill controllers
    LandlordsController,
    PropertySelectionsController,
    HomeownerController,
    AlertsController,
    InsightsController,
    SheetsController,
    RefereeGuarantorController,
    StorageController,
    // R1.4 Sprint 1.3
    ClassifierController,
    // R1.4 Sprint 2.1
    FlagsController,
    // R1.4 Sprint 2.2 + 3.1
    PropertyFactsController,
    ReportController,
  ],
  providers: [
    EventsService,      // SSE Central Event Broadcaster
    EmailService,       // must be before any service that injects it
    StorageService,     // Firebase Cloud Storage uploader
    NativePropertiesService,
    SavedPropertiesService,
    ViewingRequestService,
    ReferencingService,  // injects EmailService — declared after it above
    CommunicationService,
    GuestEnquiryService,
    ContractService,
    BillingService,
    UserProfileService,
    // Gap-fill services
    LandlordsService,
    PropertySelectionsService,
    HomeownerService,
    AlertsService,
    InsightsService,
    SheetsService,
    RefereeGuarantorService,
    // R1.4 Sprint 1.3
    ClassifierService,
  ],
  exports: [EventsService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply HTTP request/response logging to every route
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}
