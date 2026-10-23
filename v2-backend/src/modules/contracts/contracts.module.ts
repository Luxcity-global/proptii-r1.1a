import { Module } from '@nestjs/common';
import { ContractController } from '../../controllers/contract.controller';
import { DocumentsController } from '../../controllers/documents.controller';
import { StorageController } from '../../controllers/storage.controller';
import { ContractService } from '../../services/contract.service';
import { DocumentsService } from '../../services/documents.service';

@Module({
  controllers: [
    ContractController,
    DocumentsController,
    StorageController,
  ],
  providers: [
    ContractService,
    DocumentsService,
  ],
  exports: [
    ContractService,
    DocumentsService,
  ],
})
export class ContractsModule {}
