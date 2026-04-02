import { Controller, Get, Logger } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {
    const logger = new Logger(AppController.name);
    logger.log('AppController initialized');
  }

  @Get()
  getRoot() {
    return {
      name: 'Proptii Backend API',
      version: '1.0.0',
      status: 'running',
      timestamp: new Date().toISOString(),
      docs: '/api-docs',
      healthCheck: '/api/health'
    };
  }

  @Get('health')
  healthCheck() {
    const logger = new Logger(AppController.name);
    logger.log('Health check endpoint called');
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'proptii-backend',
      version: '1.0.0',
      uptime: process.uptime()
    };
  }
}