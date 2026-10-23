import { Module } from '@nestjs/common';
import { HealthController } from '../../controllers/health.controller';
import { AdminDashboardController } from '../../controllers/admin-dashboard.controller';
import { LandlordsController } from '../../controllers/landlords.controller';
import { TenantsController } from '../../controllers/tenants.controller';
import { TenantDashboardController } from '../../controllers/tenant-dashboard.controller';
import { InsightsController } from '../../controllers/insights.controller';
import { SheetsController } from '../../controllers/sheets.controller';

import { AdminDashboardService } from '../../services/admin-dashboard.service';
import { LandlordsService } from '../../services/landlords.service';
import { TenantsService } from '../../services/tenants.service';
import { InsightsService } from '../../services/insights.service';
import { SheetsService } from '../../services/sheets.service';
import { BackupService } from '../../services/backup.service';
import { GdprPurgeService } from '../../services/gdpr-purge.service';
import { LeadsModule } from '../../leads/leads.module';

@Module({
  imports: [LeadsModule],
  controllers: [
    HealthController,
    AdminDashboardController,
    LandlordsController,
    TenantsController,
    TenantDashboardController,
    InsightsController,
    SheetsController,
  ],
  providers: [
    AdminDashboardService,
    LandlordsService,
    TenantsService,
    InsightsService,
    SheetsService,
    BackupService,
    GdprPurgeService,
  ],
  exports: [
    AdminDashboardService,
    LandlordsService,
    TenantsService,
    InsightsService,
    BackupService,
    GdprPurgeService,
  ],
})
export class AdminModule {}
