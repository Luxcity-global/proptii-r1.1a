import { Module } from '@nestjs/common';
import { CommunicationController } from '../../controllers/communication.controller';
import { GuestEnquiryController } from '../../controllers/guest-enquiry.controller';
import { ViewingRequestController } from '../../controllers/viewing-request.controller';
import { EmailController } from '../../controllers/email.controller';
import { AlertsController } from '../../controllers/alerts.controller';

import { CommunicationService } from '../../services/communication.service';
import { GuestEnquiryService } from '../../services/guest-enquiry.service';
import { ViewingRequestService } from '../../services/viewing-request.service';
import { AlertsService } from '../../services/alerts.service';
import { NotificationSchedulerService } from '../../services/notification-scheduler.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [
    CommunicationController,
    GuestEnquiryController,
    ViewingRequestController,
    EmailController,
    AlertsController,
  ],
  providers: [
    CommunicationService,
    GuestEnquiryService,
    ViewingRequestService,
    AlertsService,
    NotificationSchedulerService,
  ],
  exports: [
    CommunicationService,
    GuestEnquiryService,
    ViewingRequestService,
    AlertsService,
  ],
})
export class CommunicationModule {}
