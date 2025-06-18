import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { initializeCosmosDB } from './config/cosmos.config';
import * as express from 'express';

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

  // Configure body parser to handle larger payloads for file uploads
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Set global prefix for all routes except root
  app.setGlobalPrefix('api', {
    exclude: ['/'],
  });

  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    credentials: true,
    maxAge: 600,
  });

  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }));

  app.useGlobalFilters(new HttpExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('Proptii API')
    .setDescription('The Proptii API description')
    .setVersion('1.0')
    .addTag('search')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = process.env.PORT || 3000;

  try {
    await app.listen(port, '0.0.0.0');
    logger.log(`Application is running on: http://localhost:${port}`);
    logger.log(`API documentation available at: http://localhost:${port}/api-docs`);
  } catch (error) {
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
}

bootstrap().catch(err => {
  console.error('Bootstrap failed:', err);
  process.exit(1);
});