import { Module, Global } from '@nestjs/common';
import { EventsService } from '../../services/events.service';
import { StorageService } from '../../services/storage.service';
import { EmailService } from '../../services/email.service';
import { MalwareScanService } from '../../services/malware-scan.service';
import { ImageOptimiserService } from '../../services/image-optimiser.service';

@Global()
@Module({
  providers: [
    EventsService,
    StorageService,
    EmailService,
    MalwareScanService,
    ImageOptimiserService,
  ],
  exports: [
    EventsService,
    StorageService,
    EmailService,
    MalwareScanService,
    ImageOptimiserService,
  ],
})
export class SharedModule {}
