import { Controller, Post, Body, Get, Param, Put, HttpCode, UseGuards, Req, Delete, Query, NotFoundException, ForbiddenException, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ReferencingService } from '../services/referencing.service';
import { RefereeGuarantorService } from '../services/referee-guarantor.service';
import { FirebaseAuthGuard, OptionalFirebaseAuthGuard } from '../guards/firebase-auth.guard';

@ApiTags('Referencing')
@Controller()
export class ReferencingController {
  constructor(
    private readonly referencingService: ReferencingService,
    private readonly refereeGuarantorService: RefereeGuarantorService,
  ) {}

  // ── Section saves ─────────────────────────────────────────────────────────

  @Post(['referencing/identity', 'applications/:id/identity'])
  @Put(['applications/:id/identity'])
  @HttpCode(200)
  @UseGuards(OptionalFirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Save identity section data for referencing application' })
  @ApiResponse({ status: 200, description: 'Section saved successfully' })
  async saveIdentityData(@Req() req: any, @Body() data: any) {
    const uid = req.user?.uid && req.user.uid !== 'guest' ? req.user.uid : (data?.userId || 'guest');
    return await this.referencingService.saveSectionData(uid, 'identity', data);
  }

  @Post(['referencing/employment', 'applications/:id/employment'])
  @Put(['applications/:id/employment'])
  @HttpCode(200)
  @UseGuards(OptionalFirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Save employment section data' })
  @ApiResponse({ status: 200, description: 'Section saved successfully' })
  async saveEmploymentData(@Req() req: any, @Body() data: any) {
    const uid = req.user?.uid && req.user.uid !== 'guest' ? req.user.uid : (data?.userId || 'guest');
    return await this.referencingService.saveSectionData(uid, 'employment', data);
  }

  @Post(['referencing/residential', 'applications/:id/residential'])
  @Put(['applications/:id/residential'])
  @HttpCode(200)
  @UseGuards(OptionalFirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Save residential history section data' })
  @ApiResponse({ status: 200, description: 'Section saved successfully' })
  async saveResidentialData(@Req() req: any, @Body() data: any) {
    const uid = req.user?.uid && req.user.uid !== 'guest' ? req.user.uid : (data?.userId || 'guest');
    return await this.referencingService.saveSectionData(uid, 'residential', data);
  }

  @Post(['referencing/financial', 'applications/:id/financial'])
  @Put(['applications/:id/financial'])
  @HttpCode(200)
  @UseGuards(OptionalFirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Save financial & banking section data' })
  @ApiResponse({ status: 200, description: 'Section saved successfully' })
  async saveFinancialData(@Req() req: any, @Body() data: any) {
    const uid = req.user?.uid && req.user.uid !== 'guest' ? req.user.uid : (data?.userId || 'guest');
    return await this.referencingService.saveSectionData(uid, 'financial', data);
  }

  @Post(['referencing/guarantor', 'applications/:id/guarantor'])
  @Put(['applications/:id/guarantor'])
  @HttpCode(200)
  @UseGuards(OptionalFirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Save guarantor details section data' })
  @ApiResponse({ status: 200, description: 'Section saved successfully' })
  async saveGuarantorData(@Req() req: any, @Body() data: any) {
    const uid = req.user?.uid && req.user.uid !== 'guest' ? req.user.uid : (data?.userId || 'guest');
    return await this.referencingService.saveSectionData(uid, 'guarantor', data);
  }

  @Post(['referencing/agentDetails', 'applications/:id/agentDetails'])
  @Put(['applications/:id/agentDetails'])
  @HttpCode(200)
  @UseGuards(OptionalFirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Save agent details section data' })
  @ApiResponse({ status: 200, description: 'Section saved successfully' })
  async saveAgentDetailsData(@Req() req: any, @Body() data: any) {
    const uid = req.user?.uid && req.user.uid !== 'guest' ? req.user.uid : (data?.userId || 'guest');
    return await this.referencingService.saveSectionData(uid, 'agentDetails', data);
  }

  // ── Forms ─────────────────────────────────────────────────────────────────

  /**
   * IMPORTANT: specific routes like forms/all, forms/:formId, files/all,
   * status/:email, public/:viewToken, shares/validate-claim, shares/claim
   * must ALL be declared BEFORE the wildcard GET referencing/:userId to
   * prevent route shadowing.
   */

  @Get('referencing/forms/all')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Get all referencing form drafts for authenticated user' })
  @ApiResponse({ status: 200, description: 'List of referencing forms' })
  async getAllForms(@Req() req: any) {
    const data = await this.referencingService.getFormData(req.user.uid);
    return { success: true, data: data && Object.keys(data).length ? [data] : [] };
  }

  @Get('referencing/forms/:formId')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Get specific referencing form by ID' })
  @ApiParam({ name: 'formId', description: 'Referencing Form ID / User ID' })
  @ApiResponse({ status: 200, description: 'Referencing form document' })
  @ApiResponse({ status: 403, description: 'Forbidden if not owner or staff' })
  async getReferencingForm(@Req() req: any, @Param('formId') formId: string) {
    const userId = req.user?.uid;
    const isOwner = userId === formId || formId === `general_${userId}` || formId.includes(userId);
    const isOwnerOrStaff = isOwner || req.user?.role === 'landlord' || req.user?.role === 'agent' || req.user?.role === 'admin' || req.user?.admin === true;
    if (!isOwnerOrStaff) {
      throw new ForbiddenException('You do not have permission to view this referencing form.');
    }
    const data = await this.referencingService.getFormData(formId).catch(() => null);
    const hasContent = data && typeof data === 'object' && Object.keys(data).length > 0;
    if (!hasContent) {
      return { success: true, data: { id: formId, formData: {}, currentStep: 1, stepStatus: {}, isSubmitted: false } };
    }
    return { success: true, data: { id: formId, ...(data as any) } };
  }

  @Post('referencing/forms/:formId')
  @HttpCode(200)
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Save referencing form draft' })
  @ApiParam({ name: 'formId', description: 'Referencing Form ID' })
  @ApiResponse({ status: 200, description: 'Form saved' })
  async saveReferencingForm(@Req() req: any, @Param('formId') formId: string, @Body() body: any) {
    const userId = req.user?.uid;
    const isOwner = userId === formId || formId === `general_${userId}` || formId.includes(userId);
    const isOwnerOrAdmin = isOwner || req.user?.role === 'admin' || req.user?.admin === true || req.user?.role === 'landlord' || req.user?.role === 'agent';
    if (!isOwnerOrAdmin) {
      throw new ForbiddenException('You do not have permission to modify this referencing form.');
    }
    return await this.referencingService.saveFormData(formId, body);
  }

  // ── Status ────────────────────────────────────────────────────────────────

  @Get('referencing/status/:tenantEmail')
  @HttpCode(200)
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Check referencing status by tenant email' })
  @ApiParam({ name: 'tenantEmail', description: 'Tenant email address' })
  @ApiResponse({ status: 200, description: 'Status details' })
  async getReferencingStatus(@Param('tenantEmail') tenantEmail: string) {
    return await this.referencingService.getReferencingStatusByEmail(tenantEmail);
  }

  // ── AI Document Extraction ────────────────────────────────────────────────

  @Post('referencing/ai-extract')
  @HttpCode(200)
  @UseGuards(OptionalFirebaseAuthGuard)
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 15 * 1024 * 1024 },
  }))
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'AI document data extraction from uploaded payslip or ID' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: 'Document file (PDF/Image)' },
        base64Data: { type: 'string', description: 'Base64 encoded document' },
        mimeType: { type: 'string', description: 'MIME type of document' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Extracted fields' })
  async extractDocumentData(
    @UploadedFile() file?: Express.Multer.File,
    @Body() body?: any,
  ) {
    return await this.referencingService.extractDocumentData(file, body);
  }

  // ── Files ─────────────────────────────────────────────────────────────────

  @Get(['referencing/files/all', 'applications/:id/documents'])
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Get all uploaded supporting documents for user' })
  @ApiResponse({ status: 200, description: 'Array of user files' })
  async getUserFiles(@Req() req: any) {
    return await this.referencingService.getUserFiles(req.user.uid);
  }

  @Post(['referencing/files/save', 'applications/:id/upload', 'property/upload-photo', 'property/upload-document'])
  @HttpCode(200)
  @UseGuards(OptionalFirebaseAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Upload and save referencing supporting document or photo' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiResponse({ status: 200, description: 'Saved file metadata and storage URL' })
  async saveUserFile(
    @Req() req: any,
    @UploadedFile() file?: Express.Multer.File,
    @Body() body?: any,
  ) {
    const uid = req.user?.uid && req.user.uid !== 'guest' ? req.user.uid : (body?.userId || 'guest');
    return await this.referencingService.saveUserFile(uid, file, body);
  }

  @Delete(['referencing/files/:fileId', 'documents/:fileId'])
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Delete user uploaded file' })
  @ApiParam({ name: 'fileId', description: 'File ID' })
  @ApiResponse({ status: 200, description: 'File deleted' })
  async deleteUserFile(@Req() req: any, @Param('fileId') fileId: string) {
    return await this.referencingService.deleteUserFile(req.user.uid, fileId);
  }

  @Get('referencing/files/:fileId/url')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Refresh file signed download URL' })
  @ApiParam({ name: 'fileId', description: 'File ID' })
  @ApiResponse({ status: 200, description: 'Signed download URL' })
  async getFileDownloadUrl(@Req() req: any, @Param('fileId') fileId: string) {
    return await this.referencingService.refreshFileDownloadUrl(req.user.uid, fileId);
  }

  // ── Public passport view (no auth) ───────────────────────────────────────

  @Get('referencing/public/:viewToken')
  @ApiOperation({ summary: 'View public referencing passport by share token (no auth required)' })
  @ApiParam({ name: 'viewToken', description: 'Passport view token' })
  @ApiResponse({ status: 200, description: 'Passport view data' })
  @ApiResponse({ status: 404, description: 'Invalid or expired token' })
  async getPublicPassport(@Param('viewToken') viewToken: string) {
    const result = await this.referencingService.getPublicPassportByToken(viewToken);
    if (!result) throw new NotFoundException('Referencing passport not found or link is invalid.');
    if ((result as any).expired) return { success: false, expired: true, message: 'This referencing link has expired.' };
    return { success: true, ...(result as any) };
  }

  // ── Invites — public validate (no auth) ───────────────────────────────────

  @Get('referencing/invite/validate')
  @ApiOperation({ summary: 'Validate referencing invite token (no auth required)' })
  @ApiQuery({ name: 'token', description: 'Invite token' })
  @ApiResponse({ status: 200, description: 'Validation result' })
  async validateInviteToken(@Query('token') token: string) {
    if (!token) return { valid: false, error: 'No token provided' };
    return await this.referencingService.validateInviteToken(token);
  }

  @Get('referencing/guarantor-invite')
  @ApiOperation({ summary: 'Fetch guarantor invite details by token' })
  @ApiQuery({ name: 'token', description: 'Guarantor token' })
  @ApiResponse({ status: 200, description: 'Guarantor invite data' })
  async getGuarantorInvite(@Query('token') token: string) {
    return await this.refereeGuarantorService.getGuarantorInvite(token);
  }

  // ── Shares — public validate (no auth) ───────────────────────────────────

  @Get('referencing/shares/validate-claim')
  @ApiOperation({ summary: 'Validate claim token for passport share' })
  @ApiQuery({ name: 'token', description: 'Claim token' })
  @ApiResponse({ status: 200, description: 'Validation result' })
  async validateClaimToken(@Query('token') claimToken: string) {
    if (!claimToken) return { valid: false, error: 'No token provided' };
    return await this.referencingService.validateClaimToken(claimToken);
  }

  // ── Shares — authenticated ────────────────────────────────────────────────

  @Post('referencing/shares/claim')
  @HttpCode(200)
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Claim shared referencing passport with claim token' })
  @ApiResponse({ status: 200, description: 'Passport share claimed' })
  async claimShare(@Req() req: any, @Body() body: { claimToken: string }) {
    return await this.referencingService.claimShare(body.claimToken, req.user.uid, req.user.email || '');
  }

  @Post('referencing/shares')
  @HttpCode(200)
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Create a new share link or grant access to referencing passport' })
  @ApiResponse({ status: 200, description: 'Share record and share link' })
  async sharePassport(@Req() req: any, @Body() shareData: any) {
    return await this.referencingService.shareReferencingPassport(req.user.uid, shareData);
  }

  @Get('referencing/shares')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'List active referencing passport shares created by user' })
  @ApiResponse({ status: 200, description: 'Array of active shares' })
  async getShares(@Req() req: any) {
    return await this.referencingService.getReferencingShares(req.user.uid);
  }

  @Delete('referencing/shares/:shareId')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Revoke/delete referencing passport share' })
  @ApiParam({ name: 'shareId', description: 'Share ID' })
  @ApiResponse({ status: 200, description: 'Share revoked' })
  async deleteShare(@Req() req: any, @Param('shareId') shareId: string) {
    return await this.referencingService.deleteReferencingShare(req.user.uid, shareId);
  }

  @Get('referencing/received')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'List referencing passports received/claimed by landlord' })
  @ApiResponse({ status: 200, description: 'Array of received passports' })
  async getReceivedReferencings(@Req() req: any) {
    const email = (req.user.email || '').toLowerCase().trim();
    return await this.referencingService.getReceivedReferencings(email);
  }

  // ── Request referencing from a tenant ────────────────────────────────────

  @Post('referencing/request')
  @HttpCode(200)
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Landlord/agent sends referencing invite request email to tenant' })
  @ApiResponse({ status: 200, description: 'Request email sent' })
  async requestReferencing(@Req() req: any, @Body() body: {
    tenantEmail: string;
    tenantName?: string;
    propertyAddress?: string;
    landlordName?: string;
  }) {
    const landlordName = body.landlordName
      || req.user.name
      || req.user.email
      || 'Your landlord/agent';
    return await this.referencingService.sendReferencingRequest({
      tenantEmail:     body.tenantEmail,
      tenantName:      body.tenantName      || body.tenantEmail,
      propertyAddress: body.propertyAddress || '',
      landlordName,
      landlordId:      req.user.uid,
    });
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  @Post('referencing/invite/submit')
  @HttpCode(200)
  @ApiOperation({ summary: 'Submit invite-based referencing application without prior account' })
  @ApiResponse({ status: 200, description: 'Application submitted' })
  async submitInviteApplication(@Body() body: { token?: string; formData: any }) {
    const userId = body.token || `tenant_${Date.now()}`;
    return await this.referencingService.submitApplication(userId, body.formData);
  }

  @Post(['referencing/:userId/submit', 'applications/:userId/submit'])
  @HttpCode(200)
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Submit final completed referencing application' })
  @ApiParam({ name: 'userId', description: 'Tenant user ID' })
  @ApiResponse({ status: 200, description: 'Application submission confirmed' })
  async submitApplication(@Req() req: any, @Param('userId') userId: string, @Body() formData: any) {
    return await this.referencingService.submitApplication(userId, formData);
  }

  // ── Referee & Guarantor responses by tenant email (landlord/agent view) ──────

  @Get('referencing/responses/:tenantEmail')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Get referee and guarantor responses for a tenant by email (landlord/agent view)' })
  @ApiParam({ name: 'tenantEmail', description: 'Tenant email address' })
  @ApiResponse({ status: 200, description: 'Referee and guarantor responses' })
  async getResponsesByEmail(@Param('tenantEmail') tenantEmail: string) {
    return await this.refereeGuarantorService.getResponsesByEmail(tenantEmail);
  }

  // ── Wildcard — must be LAST to avoid shadowing specific routes ────────────

  @Get(['referencing/:userId', 'applications/:userId'])
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Get referencing form draft / document by user ID' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Referencing form document' })
  async getFormData(@Req() req: any, @Param('userId') userId: string) {
    return await this.referencingService.getFormData(userId);
  }
}
