import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { initializeCosmosDB } from './config/cosmos.config';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Log environment variables (excluding sensitive data)
  logger.log(`COSMOS_DB_DATABASE_NAME: ${process.env.COSMOS_DB_DATABASE_NAME}`);
  logger.log(`STORAGE_ACCOUNT: ${process.env.AZURE_STORAGE_ACCOUNT_NAME}`);
  logger.log(`NODE_ENV: ${process.env.NODE_ENV}`);
  logger.log(`PORT: ${process.env.PORT || 3000}`);

  // Initialize Cosmos DB
  try {
    logger.log('Initializing Cosmos DB...');
    await initializeCosmosDB();
    logger.log('Cosmos DB initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize Cosmos DB:', error);
    logger.error('Please check your Cosmos DB configuration in .env file');
    process.exit(1);
  }

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'debug', 'log', 'verbose'],
  });
  
  // Configure body parser for larger file uploads
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

  // Set global prefix for all routes except root
  app.setGlobalPrefix('api', {
    exclude: ['/'],
  });
  
  // ... rest of the code ...
}

bootstrap(); 