import {
  BadRequestException,
  Controller,
  InternalServerErrorException,
  Logger,
  Post,
  ServiceUnavailableException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { StorageService } from '../services/storage.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth } from '@nestjs/swagger';
import { getFirestore } from '../config/firestore.config';

@Controller('property')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PropertyDocumentController {
  private readonly logger = new Logger(PropertyDocumentController.name);

  constructor(private readonly storageService: StorageService) {}

  @Post('upload-document')
  @Roles('landlord', 'agent')
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // Max 20 uploads per minute per IP
  @UseInterceptors(
    FileInterceptor('document', {
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  async uploadDocument(@Req() req: any, @UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No document file provided');
    }

    const allowedMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Allowed types are: PDF, JPEG, PNG, DOC, DOCX, CSV, XLS, XLSX');
    }

    try {
      const uploaded = await this.storageService.uploadFile(file, 'property-documents');

      this.logger.log(
        `Uploaded document ${file.originalname} (${uploaded.size} bytes) to ${uploaded.path}`,
      );

      return {
        success: true,
        document: {
          url: uploaded.url,
          path: uploaded.path,
          name: file.originalname,
          type: uploaded.contentType,
          size: uploaded.size,
        },
      };
    } catch (error) {
      this.logger.error('Error uploading document:', error);
      throw new InternalServerErrorException('Failed to upload document');
    }
  }

  @Post('upload-photo')
  @Roles('landlord', 'agent')
  @Throttle({ default: { limit: 40, ttl: 60000 } }) // Max 40 photos per minute per IP
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit for photos
      },
    }),
  )
  async uploadPhoto(@Req() req: any, @UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No photo provided');
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Allowed types are: JPEG, PNG, WEBP');
    }

    try {
      const uploaded = await this.storageService.uploadFile(file, 'property-photos');

      return {
        success: true,
        message: 'Photo uploaded successfully',
        data: {
          url: uploaded.url,
          filename: uploaded.path.split('/').pop(),
          originalName: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
        }
      };
    } catch (error) {
      this.logger.error('Error uploading photo:', error);
      throw new InternalServerErrorException('Failed to upload photo');
    }
  }
}
