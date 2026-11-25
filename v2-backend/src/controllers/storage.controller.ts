import {
  Controller,
  Post,
  Get,
  Delete,
  UseInterceptors,
  UploadedFile,
  Body,
  Query,
  Req,
  Res,
  BadRequestException,
  ForbiddenException,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody, ApiQuery } from '@nestjs/swagger';
import { StorageService } from '../services/storage.service';
import { FirebaseAuthGuard, OptionalFirebaseAuthGuard } from '../guards/firebase-auth.guard';

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

function isStaffUser(req: any): boolean {
  if (req.user?.role === 'admin' || req.user?.admin === true) return true;
  const email = String(req.user?.email || '').toLowerCase().trim();
  if (!email) return false;
  const raw = `${process.env.ADMIN_EMAILS || ''},${process.env.ADMIN_EMAIL || ''}`;
  const adminEmails = raw
    .split(/[,;\s]+/)
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.includes('@'));
  return adminEmails.includes(email);
}

@ApiTags('Storage')
@ApiBearerAuth('bearer')
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @HttpCode(200)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @UseGuards(OptionalFirebaseAuthGuard)
  @UseInterceptors(FileInterceptor('file', {
    limits: {
      fileSize: 25 * 1024 * 1024, // 25MB limit
      files: 1,
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

    const isVerificationFolder =
      safeFolder.includes('verification') ||
      /\/(photo_id|proof_of_address|eicr|deposit-protection)(\/|$)/i.test(safeFolder);

    // C1: verification docs must never land under publicly readable properties/
    if (isVerificationFolder && safeFolder.startsWith('properties')) {
      throw new BadRequestException(
        'Verification documents must be uploaded under documents/{uid}/…, not properties/',
      );
    }

    let targetFolder: string;
    if (isVerificationFolder) {
      // Force private documents/{uid}/… path (reuse existing storage.rules)
      const rest = safeFolder.replace(/^documents\/?/, '').replace(new RegExp(`^${userId}/?`), '');
      targetFolder = `documents/${userId}/${rest || 'verification'}`.replace(/\/+/g, '/');
    } else if (safeFolder.startsWith('properties')) {
      targetFolder = safeFolder;
    } else if (safeFolder.startsWith(`documents/${userId}`)) {
      targetFolder = safeFolder;
    } else {
      targetFolder = `${safeFolder}/${userId}`;
    }

    const result = await this.storageService.uploadFile(file, targetFolder);

    // For verification uploads, prefer storagePath for authenticated download (C1)
    if (isVerificationFolder) {
      return {
        ...result,
        storagePath: result.fullPath,
        // Keep url for backwards compatibility but clients should use /storage/download
      };
    }

    return result;
  }

  /**
   * GET /api/storage/download?path=documents/{uid}/…
   * Owner or staff only. Used for C1 verification files (no public token reliance).
   */
  @Get('download')
  @UseGuards(FirebaseAuthGuard)
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({ summary: 'Authenticated download for private documents/{uid}/ files' })
  @ApiQuery({ name: 'path', description: 'Storage object path' })
  @ApiResponse({ status: 200, description: 'File bytes' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async downloadFile(
    @Req() req: any,
    @Res() res: any,
    @Query('path') filePath: string,
  ) {
    if (!filePath) {
      throw new BadRequestException('Path parameter is required');
    }

    const safePath = decodeURIComponent(filePath).replace(/\.\./g, '').replace(/^\/+/, '');
    const userId = req.user?.uid;
    const staff = isStaffUser(req);

    if (!safePath.startsWith('documents/')) {
      throw new ForbiddenException('Only documents/ paths can be downloaded via this endpoint');
    }

    const ownerMatch = safePath.match(/^documents\/([^/]+)\//);
    const ownerId = ownerMatch?.[1];
    if (!staff && (!userId || ownerId !== userId)) {
      throw new ForbiddenException('You do not have permission to download this file.');
    }

    const { buffer, contentType, fileName } = await this.storageService.downloadFile(safePath);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.setHeader('Cache-Control', 'private, no-store');
    res.send(buffer);
  }

  @Delete('file')
  @HttpCode(200)
  @UseGuards(FirebaseAuthGuard)
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
    const isAdmin = isStaffUser(req);

    // Enforce ownership: standard users may only delete files in their own user directory.
    // Exception: files under 'properties/documents/' are portfolio documents — any authenticated
    // user may delete them (the property ownership is enforced at the property level elsewhere).
    const isPropertyDoc = safePath.startsWith('properties/') || safePath.startsWith('properties%2F');
    if (!isAdmin && userId && !isPropertyDoc && !safePath.includes(userId)) {
      throw new ForbiddenException('You do not have permission to delete this file.');
    }

    const success = await this.storageService.deleteFile(safePath);
    return { success };
  }
}
