import {
  Controller,
  Post,
  Delete,
  UseInterceptors,
  UploadedFile,
  Body,
  Query,
  Req,
  BadRequestException,
  ForbiddenException,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from '../services/storage.service';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';

export interface MulterUploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
  destination?: string;
  filename?: string;
  path?: string;
}

@Controller('storage')
@UseGuards(FirebaseAuthGuard)
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
    @Req() req: any,
    @UploadedFile() file: MulterUploadedFile,
    @Body('folder') folderFromBody?: string,
    @Query('folder') folderFromQuery?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const requestedFolder = folderFromBody || folderFromQuery || 'documents';
    // Sanitize folder against path traversal
    const safeFolder = requestedFolder.replace(/\.\./g, '').replace(/^\/+|\/+$/g, '');
    const userId = req.user?.uid || 'user';
    
    // Automatically scope document uploads to the authenticated user's namespace
    const targetFolder = safeFolder.startsWith('properties') 
      ? safeFolder 
      : `${safeFolder}/${userId}`;

    return await this.storageService.uploadFile(file, targetFolder);
  }

  @Delete('file')
  @HttpCode(200)
  async deleteFile(
    @Req() req: any,
    @Query('path') filePath: string,
    @Body('path') bodyPath: string,
  ) {
    const rawPath = filePath || bodyPath;
    if (!rawPath) {
      throw new BadRequestException('Path parameter is required');
    }

    // Sanitize path against directory traversal
    const safePath = rawPath.replace(/\.\./g, '').replace(/^\/+/, '');
    const userId = req.user?.uid;
    const isAdmin = req.user?.role === 'admin' || req.user?.admin === true;

    // Enforce ownership: standard users may only delete files in their own user directory
    if (!isAdmin && userId && !safePath.includes(userId)) {
      throw new ForbiddenException('You do not have permission to delete this file.');
    }

    const success = await this.storageService.deleteFile(safePath);
    return { success };
  }
}
