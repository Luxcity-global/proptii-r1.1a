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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }