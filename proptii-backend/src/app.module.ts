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
import { AzureUsersModule } from './modules/azure-users.module';

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
    AzureUsersModule,
  ],
  controllers: [AppController, PropertyDocumentController],
  providers: [AppService],
})
export class AppModule { }