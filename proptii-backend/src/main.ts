// Compatibility shim for older Node.js versions lacking process.getBuiltinModule (required by recent bson/mongodb versions)
if (typeof globalThis.process !== 'undefined' && !globalThis.process.getBuiltinModule) {
  (globalThis.process as any).getBuiltinModule = (name: string) => {
    try {
      return require(name);
    } catch {
      return {};
    }
  };
}

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { initializeCosmosDB } from './config/cosmos.config';
import { validateEnv } from './config/env.validation';
import * as express from 'express';
import * as dotenv from 'dotenv';

// Load environment variables from .env file first, then validate.
dotenv.config();
validateEnv(); // exits process with clear error if required vars are missing

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
    logger.log('Cosmos DB initialization completed');
  } catch (error) {
    logger.error('Failed to initialize Cosmos DB:', error);
    logger.warn('Continuing without Cosmos DB - some features may not work');
  }

  const isProd = process.env.NODE_ENV === 'production';
  const app = await NestFactory.create(AppModule, {
    // Structured log levels: quiet in production, verbose in development.
    logger: isProd ? ['warn', 'error'] : ['log', 'debug', 'verbose', 'warn', 'error'],
  });

  // Apply logger level via app.useLogger as well for runtime control.
  app.useLogger(isProd ? ['warn', 'error'] : ['log', 'debug', 'verbose', 'warn', 'error']);

  // Body limit: 10 MB covers base64-encoded referencing documents up to ~7.5 MB raw.
  // For larger file uploads, use multipart/form-data with FileInterceptor instead.
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Set global prefix for all routes except root
  app.setGlobalPrefix('api', {
    exclude: ['/'],
  });

  // Explicit CORS allowlist — origin:true (reflect-any) is a security risk.
  const allowedOrigins = [
    'https://proptii.co',
    'https://www.proptii.co',
    'https://proptii-r1-1a-new.onrender.com',
    'https://proptii-frontend.onrender.com',
    'https://proptii-r1-1a-5347.onrender.com',
    ...(process.env.NODE_ENV !== 'production'
      ? [
          'http://localhost:5173',
          'http://localhost:4173',
          'http://localhost:3000',
          'http://127.0.0.1:5173',
          'http://127.0.0.1:4173',
        ]
      : []),
  ];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow server-to-server / mobile requests that send no Origin header.
      if (!origin) return callback(null, true);
      const isAllowed =
        allowedOrigins.includes(origin) ||
        /\.onrender\.com$/.test(origin) ||
        /\.proptii\.co$/.test(origin);
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin '${origin}' is not allowed`));
      }
    },
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
  const logger = new Logger('Bootstrap');
  logger.error('Bootstrap failed:', err);
  process.exit(1);
});