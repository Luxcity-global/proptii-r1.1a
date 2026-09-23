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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody, ApiQuery } from '@nestjs/swagger';
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

@ApiTags('Storage')
@ApiBearerAuth('bearer')
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
  @ApiOperation({ summary: 'Upload file to Firebase/Cloud Storage in user-scoped directory' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: 'File to upload' },
        folder: { type: 'string', description: 'Destination folder namespace (e.g. documents, properties)' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Uploaded file public/signed URL and path' })
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
  @ApiOperation({ summary: 'Delete file from cloud storage (ownership verified)' })
  @ApiQuery({ name: 'path', description: 'Storage file path' })
  @ApiResponse({ status: 200, description: 'File deletion result' })
  @ApiResponse({ status: 403, description: 'Forbidden if deleting another user file' })
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
