import { Controller, Get, Post, UploadedFile, UseInterceptors, Body, ValidationPipe, HttpException, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from '../services/storage.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Property } from '../entities/property.entity';
import { TestPropertyDto } from '../dto/test-property.dto';

@Controller('test')
export class TestController {
  constructor(
    private readonly storageService: StorageService,
    @InjectRepository(Property)
    private propertyRepository: Repository<Property>,
  ) {}

  @Get('db')
  async testDatabase() {
    try {
      const testProperty = this.propertyRepository.create({
        title: 'Test Property',
        description: 'Test property for database connection verification',
        price: 250000,
        bedrooms: 3,
        bathrooms: 2,
        street: '123 Test Street',
        city: 'Test City',
        town: 'Test Town',
        postcode: 'TE1 1ST',
        status: 'available',
        agentId: 'test-agent-id'
      });

      await this.propertyRepository.save(testProperty);

      return {
        status: 'success',
        message: 'Database connection successful',
        data: testProperty
      };
    } catch (error) {
      throw new HttpException({
        status: 'error',
        message: 'Database connection failed',
        error: error.message
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('property')
  async createTestProperty(@Body(ValidationPipe) propertyData: TestPropertyDto) {
    try {
      const testProperty = this.propertyRepository.create(propertyData);
      const savedProperty = await this.propertyRepository.save(testProperty);

      return {
        status: 'success',
        message: 'Test property created successfully',
        data: savedProperty
      };
    } catch (error) {
      throw new HttpException({
        status: 'error',
        message: 'Failed to create test property',
        error: error.message
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('storage')
  @UseInterceptors(FileInterceptor('file'))
  async testStorage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new HttpException({
        status: 'error',
        message: 'No file uploaded'
      }, HttpStatus.BAD_REQUEST);
    }

    try {
      const url = await this.storageService.uploadFile(file, 'test');
      return {
        status: 'success',
        message: 'File uploaded successfully',
        url
      };
    } catch (error) {
      throw new HttpException({
        status: 'error',
        message: 'Storage test failed',
        error: error.message
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}