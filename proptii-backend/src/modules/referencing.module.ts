import { Module } from '@nestjs/common';
import { ReferencingService } from '../services/referencing.service';
import { ReferencingController } from '../controllers/referencing.controller';
import { EmailService } from '../services/email.service';
import { EmailController } from '../controllers/email.controller';
import { AIExtractionService } from '../services/ai-extraction.service';
import { BillingModule } from './billing/billing.module';
import { NativePropertiesModule } from './native-properties.module';

@Module({
  imports: [BillingModule, NativePropertiesModule],
  controllers: [ReferencingController, EmailController],
  providers: [ReferencingService, EmailService, AIExtractionService],
  exports: [ReferencingService, EmailService, AIExtractionService],
})
export class ReferencingModule { } 