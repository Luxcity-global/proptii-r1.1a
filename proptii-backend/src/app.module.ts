import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SearchModule } from './search/search.module';
import { StorageModule } from './storage/storage.module';
import { TestController } from './controllers/test.controller';
import { databaseConfig } from './config/database.config';
import { Property } from './entities/property.entity';
import { Agent } from './entities/agent.entity';
import { ViewingRequest } from './entities/viewing-request.entity';
import { PropertyController } from './controllers/property.controller';
import { AgentController } from './controllers/agent.controller';
import { ViewingRequestController } from './controllers/viewing-request.controller';
import { PropertyService } from './services/property.service';
import { AgentService } from './services/agent.service';
import { ViewingRequestService } from './services/viewing-request.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(databaseConfig),
    TypeOrmModule.forFeature([Property, Agent, ViewingRequest]),
    ThrottlerModule.forRoot([{
      ttl: 60,
      limit: 10,
    }]),
    SearchModule,
    StorageModule,
  ],
  controllers: [
    AppController,
    TestController,
    PropertyController,
    AgentController,
    ViewingRequestController,
  ],
  providers: [
    AppService,
    PropertyService,
    AgentService,
    ViewingRequestService,
  ],
})
export class AppModule {}