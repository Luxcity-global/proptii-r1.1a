import { Module } from '@nestjs/common';
import { NativePropertiesController } from '../../controllers/native-properties.controller';
import { PropertyCatalogueController } from '../../controllers/property-catalogue.controller';
import { SavedPropertiesController } from '../../controllers/saved-properties.controller';
import { PropertySelectionsController } from '../../controllers/property-selections.controller';
import { HomeownerController } from '../../controllers/homeowner.controller';
import { PropertyFactsController } from '../../controllers/property-facts.controller';
import { ReportController } from '../../controllers/report.controller';
import { ClassifierController } from '../../search/classifier.controller';
import { FlagsController } from '../../controllers/flags.controller';

import { NativePropertiesService } from '../../services/native-properties.service';
import { SavedPropertiesService } from '../../services/saved-properties.service';
import { PropertySelectionsService } from '../../services/property-selections.service';
import { HomeownerService } from '../../services/homeowner.service';
import { ClassifierService } from '../../search/classifier.service';
import { ReadyToPublishService } from '../../services/ready-to-publish.service';
import { OwnershipClaimsService } from '../../services/ownership-claims.service';
import { OwnershipClaimsController } from '../../controllers/ownership-claims.controller';
import { GovDataModule } from '../../gov-data/gov-data.module';

@Module({
  imports: [GovDataModule],
  controllers: [
    NativePropertiesController,
    PropertyCatalogueController,
    SavedPropertiesController,
    PropertySelectionsController,
    HomeownerController,
    PropertyFactsController,
    ReportController,
    ClassifierController,
    FlagsController,
    OwnershipClaimsController,
  ],
  providers: [
    NativePropertiesService,
    SavedPropertiesService,
    PropertySelectionsService,
    HomeownerService,
    ClassifierService,
    ReadyToPublishService,
    OwnershipClaimsService,
  ],
  exports: [
    NativePropertiesService,
    SavedPropertiesService,
    PropertySelectionsService,
    HomeownerService,
    ReadyToPublishService,
    OwnershipClaimsService,
  ],
})
export class PropertiesModule {}
