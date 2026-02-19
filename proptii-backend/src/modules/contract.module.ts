import { Module } from '@nestjs/common';
import { ContractController } from '../controllers/contract.controller';
import { ContractEmailService } from '../services/contract-email.service';

@Module({
  controllers: [ContractController],
  providers: [ContractEmailService],
  exports: [ContractEmailService],
})
export class ContractModule {}
