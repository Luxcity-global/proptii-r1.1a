import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ThrottlerModule.forRoot([{
      ttl: 10,   // time to live in seconds
      limit: 60, // max requests per ttl per IP
    }]),
  ],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {} 