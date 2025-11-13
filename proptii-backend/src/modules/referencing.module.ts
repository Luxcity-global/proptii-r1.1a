import { Module } from '@nestjs/common';
import { ReferencingService } from '../services/referencing.service';
import { ReferencingController } from '../controllers/referencing.controller';
import { EmailService } from '../services/email.service';
import { EmailController } from '../controllers/email.controller';

@Module({
  controllers: [ReferencingController, EmailController],
  providers: [ReferencingService, EmailService],
  exports: [ReferencingService, EmailService],
})
export class ReferencingModule {} 