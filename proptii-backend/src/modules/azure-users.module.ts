import { Module } from '@nestjs/common';
import { AzureUsersService } from '../services/azure-users.service';
import { AzureUsersController } from '../controllers/azure-users.controller';

@Module({
  controllers: [AzureUsersController],
  providers: [AzureUsersService],
  exports: [AzureUsersService],
})
export class AzureUsersModule {}
