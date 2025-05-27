import { Module } from '@nestjs/common';
import { ReferencingService } from '../services/referencing.service';
import { ReferencingController } from '../controllers/referencing.controller';

@Module({
  controllers: [ReferencingController],
  providers: [ReferencingService],
  exports: [ReferencingService],
})
export class ReferencingModule {} 