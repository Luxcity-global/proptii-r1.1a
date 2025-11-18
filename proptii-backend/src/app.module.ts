import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './modules/database.module';
import { ViewingRequestModule } from './modules/viewing-request.module';
import { ReferencingModule } from './modules/referencing.module';
import { SearchModule } from './search/search.module';
import { SheetsModule } from './sheets/sheets.module';
import { ContractModule } from './modules/contract.module';
import { StorageModule } from './storage/storage.module';
import { PropertyDocumentController } from './controllers/property-document.controller';
import { AzureUsersController } from './controllers/azure-users.controller';
import { AzureUsersService } from './services/azure-users.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    ViewingRequestModule,
    ReferencingModule,
    SearchModule,
    SheetsModule,
    ContractModule,
    StorageModule,
  ],
  controllers: [AppController, PropertyDocumentController, AzureUsersController],
  providers: [AppService, AzureUsersService],
})
export class AppModule { }