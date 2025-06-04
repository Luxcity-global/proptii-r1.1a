import { Module } from '@nestjs/common';
import { ReferencingService } from '../services/referencing.service';
import { ReferencingController } from '../controllers/referencing.controller';
import { EmailService } from '../services/email.service';

@Module({
  controllers: [ReferencingController],
  providers: [ReferencingService, EmailService],
  exports: [ReferencingService, EmailService],
})
export class ReferencingModule {} 