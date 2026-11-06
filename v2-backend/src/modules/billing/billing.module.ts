import { Module, forwardRef } from '@nestjs/common';
import { BillingController } from '../../controllers/billing.controller';
import { PaymentsController } from '../../controllers/payments.controller';
import { BillingService } from '../../services/billing.service';
import { SubscriptionGuard } from '../../guards/subscription.guard';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [forwardRef(() => AdminModule)],
  controllers: [
    BillingController,
    PaymentsController,
  ],
  providers: [
    BillingService,
    SubscriptionGuard,
  ],
  exports: [
    BillingService,
    SubscriptionGuard,
  ],
})
export class BillingModule {}
