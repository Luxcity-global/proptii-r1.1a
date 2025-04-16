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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(databaseConfig),
    TypeOrmModule.forFeature([Property]),
    ThrottlerModule.forRoot([{
      ttl: 60,
      limit: 10,
    }]),
    SearchModule,
    StorageModule,
  ],
  controllers: [AppController, TestController],
  providers: [AppService],
})
export class AppModule {}