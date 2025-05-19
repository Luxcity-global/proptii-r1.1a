import { Module } from '@nestjs/common';
import { ViewingRequestController } from '../controllers/viewing-request.controller';
import { ViewingRequestService } from '../services/viewing-request.service';

@Module({
  controllers: [ViewingRequestController],
  providers: [ViewingRequestService],
  exports: [ViewingRequestService],
})
export class ViewingRequestModule {} 