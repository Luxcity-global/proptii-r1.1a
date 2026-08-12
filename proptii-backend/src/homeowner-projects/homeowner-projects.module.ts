import { Module } from '@nestjs/common';
import { HomeownerProjectsController } from './homeowner-projects.controller';
import { HomeownerProjectsService } from './homeowner-projects.service';

@Module({
  controllers: [HomeownerProjectsController],
  providers: [HomeownerProjectsService]
})
export class HomeownerProjectsModule {}
