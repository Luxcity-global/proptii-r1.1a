import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Property } from './entities/property.entity';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @InjectRepository(Property)
    private propertyRepository: Repository<Property>,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'proptii-backend',
      version: '1.0.0'
    };
  }

  @Get('test-db')
  async testDatabase() {
    try {
      // Attempt to create a test property
      const testProperty = this.propertyRepository.create({
        title: 'Test Property',
        address: '123 Test Street',
        price: 250000,
        bedrooms: 3,
        bathrooms: 2,
        description: 'Test property for database connection verification'
      });

      await this.propertyRepository.save(testProperty);

      return {
        status: 'success',
        message: 'Database connection successful',
        testProperty
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Database connection failed',
        error: error.message
      };
    }
  }
}