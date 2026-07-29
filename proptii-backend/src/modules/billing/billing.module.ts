import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { WebhookController } from './webhook.controller';
import { BillingService } from './billing.service';
import { WebhookService } from './webhook.service';
import { EmailService } from '../../services/email.service';
import { SubscriptionGuard } from '../../guards/subscription.guard';

/**
 * Billing module — Sprint 1.
 * ScheduleModule.forRoot() is registered in AppModule; @Cron decorators in
 * BillingService are discovered automatically from there.
 */
@Module({
  controllers: [BillingController, WebhookController],
  providers: [
    BillingService,
    WebhookService,
    SubscriptionGuard,
    EmailService,
  ],
  exports: [BillingService, SubscriptionGuard],
})
export class BillingModule {}
