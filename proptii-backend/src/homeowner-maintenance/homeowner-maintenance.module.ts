import { Module } from '@nestjs/common';
import { HomeownerMaintenanceController } from './homeowner-maintenance.controller';
import { HomeownerMaintenanceService } from './homeowner-maintenance.service';

@Module({
  controllers: [HomeownerMaintenanceController],
  providers: [HomeownerMaintenanceService]
})
export class HomeownerMaintenanceModule {}
