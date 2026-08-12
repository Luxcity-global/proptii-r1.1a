import { Module } from '@nestjs/common';
import { AuthController } from './controllers/auth.controller';
import { NativePropertiesController } from './controllers/native-properties.controller';
import { NativePropertiesService } from './services/native-properties.service';
import { SavedPropertiesController } from './controllers/saved-properties.controller';
import { SavedPropertiesService } from './services/saved-properties.service';
import { TenantDashboardController } from './controllers/tenant-dashboard.controller';
import { ViewingRequestController } from './controllers/viewing-request.controller';
import { ViewingRequestService } from './services/viewing-request.service';
import { ReferencingController } from './controllers/referencing.controller';
import { ReferencingService } from './services/referencing.service';
import { CommunicationController } from './controllers/communication.controller';
import { CommunicationService } from './services/communication.service';
import { GuestEnquiryController } from './controllers/guest-enquiry.controller';
import { GuestEnquiryService } from './services/guest-enquiry.service';
import { ContractController } from './controllers/contract.controller';
import { ContractService } from './services/contract.service';
import { BillingController } from './controllers/billing.controller';
import { BillingService } from './services/billing.service';
import { UserProfileController } from './controllers/user-profile.controller';
import { UserProfileService } from './services/user-profile.service';

import { HealthController } from './controllers/health.controller';

@Module({
  imports: [],
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
  ],
  providers: [
    NativePropertiesService,
    SavedPropertiesService,
    ViewingRequestService,
    ReferencingService,
    CommunicationService,
    GuestEnquiryService,
    ContractService,
    BillingService,
    UserProfileService,
  ],
})
export class AppModule {}
