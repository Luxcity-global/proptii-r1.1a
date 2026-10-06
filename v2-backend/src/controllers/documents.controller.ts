/**
 * DocumentsController — /api/documents
 *
 * Standalone document vault endpoints. Documents belong to a landlord and
 * optionally to a property. propertyId=null means "unassigned".
 *
 * POST   /api/documents              — create / upload metadata
 * GET    /api/documents              — list all for this landlord
 * GET    /api/documents?propertyId=X — list for specific property
 * GET    /api/documents?propertyId=unassigned — list unassigned
 * PATCH  /api/documents/:id/assign   — assign or unassign to a property
 * DELETE /api/documents/:id          — delete
 */
import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, Req, UseGuards, HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';
import { DocumentsService } from '../services/documents.service';

@ApiTags('Documents')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @HttpCode(201)
  @ApiOperation({ summary: 'Save document metadata after file is uploaded to storage' })
  @ApiResponse({ status: 201, description: 'Document record created' })
  async create(@Req() req: any, @Body() body: any) {
    const landlordId = req.user?.uid || req.user?.id || req.user?.email;
    return this.documentsService.createDocument(landlordId, {
      propertyId:  body.propertyId ?? null,
      name:        body.name,
      type:        body.type,
      url:         body.url,
      issueDate:   body.issueDate,
      expiryDate:  body.expiryDate ?? null,
      status:      body.status ?? 'valid',
    });
  }

  @Get()
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'List documents for authenticated landlord' })
  @ApiQuery({ name: 'propertyId', required: false, description: 'Filter by property ID or pass "unassigned" for documents with no property' })
  @ApiResponse({ status: 200, description: 'Array of document records' })
  async list(
    @Req() req: any,
    @Query('propertyId') propertyId?: string,
  ) {
    const landlordId = req.user?.uid || req.user?.id || req.user?.email;
    const userEmail = req.user?.email;
    const docs = await this.documentsService.getDocuments(landlordId, propertyId, userEmail);
    return { success: true, documents: docs };
  }

  @Patch(':id/assign')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Assign or unassign a document to a property' })
  @ApiResponse({ status: 200, description: 'Document updated' })
  async assign(@Req() req: any, @Param('id') id: string, @Body() body: { propertyId: string | null }) {
    const landlordId = req.user?.uid || req.user?.id || req.user?.email;
    const userEmail = req.user?.email;
    const doc = await this.documentsService.assignToProperty(id, landlordId, body.propertyId ?? null, userEmail);
    return { success: true, document: doc };
  }

  @Delete(':id')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @HttpCode(200)
  @ApiOperation({ summary: 'Delete a document record (does not delete the file from Storage)' })
  @ApiResponse({ status: 200, description: 'Deleted' })
  async remove(@Req() req: any, @Param('id') id: string) {
    const landlordId = req.user?.uid || req.user?.id || req.user?.email;
    const userEmail = req.user?.email;
    await this.documentsService.deleteDocument(id, landlordId, userEmail);
    return { success: true };
  }
}
