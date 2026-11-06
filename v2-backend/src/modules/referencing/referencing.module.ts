import { Module } from '@nestjs/common';
import { ReferencingController } from '../../controllers/referencing.controller';
import { RefereeGuarantorController } from '../../controllers/referee-guarantor.controller';
import { TenantInvitationsController } from '../../controllers/tenant-invitations.controller';
import { ReferencingService } from '../../services/referencing.service';
import { RefereeGuarantorService } from '../../services/referee-guarantor.service';

@Module({
  controllers: [
    ReferencingController,
    RefereeGuarantorController,
    TenantInvitationsController,
  ],
  providers: [
    ReferencingService,
    RefereeGuarantorService,
  ],
  exports: [
    ReferencingService,
    RefereeGuarantorService,
  ],
})
export class ReferencingModule {}
