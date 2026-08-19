import {
  Controller,
  Post,
  Delete,
  UseInterceptors,
  UploadedFile,
  Body,
  Query,
  BadRequestException,
  HttpCode,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from '../services/storage.service';

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('file', {
    limits: {
      fileSize: 25 * 1024 * 1024, // 25MB limit
    },
  }))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folderFromBody?: string,
    @Query('folder') folderFromQuery?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const folder = folderFromBody || folderFromQuery || 'documents';
    return await this.storageService.uploadFile(file, folder);
  }

  @Delete('file')
  @HttpCode(200)
  async deleteFile(@Query('path') filePath: string, @Body('path') bodyPath: string) {
    const pathToDelete = filePath || bodyPath;
    if (!pathToDelete) {
      throw new BadRequestException('Path parameter is required');
    }
    const success = await this.storageService.deleteFile(pathToDelete);
    return { success };
  }
}
