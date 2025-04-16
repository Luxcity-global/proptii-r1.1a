import { Controller, Get, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from '../services/storage.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Property } from '../entities/property.entity';

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
        address: '123 Test Street',
        price: 250000,
        bedrooms: 3,
        bathrooms: 2,
        description: 'Test property for database connection verification',
        images: []
      });

      await this.propertyRepository.save(testProperty);

      return {
        status: 'success',
        message: 'Database connection successful',
        data: testProperty
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Database connection failed',
        error: error.message
      };
    }
  }

  @Post('storage')
  @UseInterceptors(FileInterceptor('file'))
  async testStorage(@UploadedFile() file: Express.Multer.File) {
    try {
      const url = await this.storageService.uploadFile(file, 'test');
      return {
        status: 'success',
        message: 'File uploaded successfully',
        url
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Storage test failed',
        error: error.message
      };
    }
  }
}