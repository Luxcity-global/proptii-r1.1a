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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { StorageService } from '../services/storage.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { SubscriptionGuard } from '../guards/subscription.guard';
import { RequiresActiveSubscription } from '../decorators/requires-active-subscription.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('property')
@UseGuards(JwtAuthGuard, SubscriptionGuard)
@RequiresActiveSubscription()
@ApiBearerAuth()
export class PropertyDocumentController {
  private readonly logger = new Logger(PropertyDocumentController.name);

  constructor(private readonly storageService: StorageService) {}

  @Post('upload-document')
  @UseInterceptors(
    FileInterceptor('document', {
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  async uploadDocument(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No document file provided');
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
      if (error instanceof Error && error.message === 'STORAGE_NOT_CONFIGURED') {
        this.logger.error('Failed to upload property document: storage not configured');
        throw new ServiceUnavailableException('Document storage service is not configured');
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to upload property document: ${message}`, error as any);
      throw new InternalServerErrorException('Failed to upload document');
    }
  }
}

