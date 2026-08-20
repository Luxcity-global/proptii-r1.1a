import { Controller, Post, Body, Get, Param, Put, HttpCode, UseGuards, Req, Delete, Query, NotFoundException } from '@nestjs/common';
import { ReferencingService } from '../services/referencing.service';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';

@Controller()
export class ReferencingController {
  constructor(private readonly referencingService: ReferencingService) {}

  // ── Section saves ─────────────────────────────────────────────────────────

  @Post(['referencing/identity', 'applications/:id/identity'])
  @Put(['applications/:id/identity'])
  @HttpCode(200)
  @UseGuards(FirebaseAuthGuard)
  async saveIdentityData(@Req() req: any, @Body() data: any) {
    return await this.referencingService.saveSectionData(req.user.uid, 'identity', data);
  }

  @Post(['referencing/employment', 'applications/:id/employment'])
  @Put(['applications/:id/employment'])
  @HttpCode(200)
  @UseGuards(FirebaseAuthGuard)
  async saveEmploymentData(@Req() req: any, @Body() data: any) {
    return await this.referencingService.saveSectionData(req.user.uid, 'employment', data);
  }

  @Post(['referencing/residential', 'applications/:id/residential'])
  @Put(['applications/:id/residential'])
  @HttpCode(200)
  @UseGuards(FirebaseAuthGuard)
  async saveResidentialData(@Req() req: any, @Body() data: any) {
    return await this.referencingService.saveSectionData(req.user.uid, 'residential', data);
  }

  @Post(['referencing/financial', 'applications/:id/financial'])
  @Put(['applications/:id/financial'])
  @HttpCode(200)
  @UseGuards(FirebaseAuthGuard)
  async saveFinancialData(@Req() req: any, @Body() data: any) {
    return await this.referencingService.saveSectionData(req.user.uid, 'financial', data);
  }

  @Post(['referencing/guarantor', 'applications/:id/guarantor'])
  @Put(['applications/:id/guarantor'])
  @HttpCode(200)
  @UseGuards(FirebaseAuthGuard)
  async saveGuarantorData(@Req() req: any, @Body() data: any) {
    return await this.referencingService.saveSectionData(req.user.uid, 'guarantor', data);
  }

  @Post(['referencing/agentDetails', 'applications/:id/agentDetails'])
  @Put(['applications/:id/agentDetails'])
  @HttpCode(200)
  @UseGuards(FirebaseAuthGuard)
  async saveAgentDetailsData(@Req() req: any, @Body() data: any) {
    return await this.referencingService.saveSectionData(req.user.uid, 'agentDetails', data);
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
  async getAllForms(@Req() req: any) {
    const data = await this.referencingService.getFormData(req.user.uid);
    return { success: true, data: data && Object.keys(data).length ? [data] : [] };
  }

  @Get('referencing/forms/:formId')
  async getReferencingForm(@Param('formId') formId: string) {
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
  async saveReferencingForm(@Param('formId') formId: string, @Body() body: any) {
    return await this.referencingService.saveFormData(formId, body);
  }

  // ── Status ────────────────────────────────────────────────────────────────

  @Get('referencing/status/:tenantEmail')
  @HttpCode(200)
  @UseGuards(FirebaseAuthGuard)
  async getReferencingStatus(@Param('tenantEmail') tenantEmail: string) {
    return await this.referencingService.getReferencingStatusByEmail(tenantEmail);
  }

  // ── AI Document Extraction ────────────────────────────────────────────────

  @Post('referencing/ai-extract')
  @HttpCode(200)
  async extractDocumentData(@Body() body: { base64Data: string; mimeType?: string }) {
    return await this.referencingService.extractDocumentData(body.base64Data, body.mimeType);
  }

  // ── Files ─────────────────────────────────────────────────────────────────

  @Get(['referencing/files/all', 'applications/:id/documents'])
  @UseGuards(FirebaseAuthGuard)
  async getUserFiles(@Req() req: any) {
    return await this.referencingService.getUserFiles(req.user.uid);
  }

  @Post(['referencing/files/save', 'applications/:id/upload', 'property/upload-photo', 'property/upload-document'])
  @HttpCode(200)
  @UseGuards(FirebaseAuthGuard)
  async saveUserFile(@Req() req: any, @Body() fileData: any) {
    return await this.referencingService.saveUserFile(req.user?.uid || 'dev-user', fileData);
  }

  @Delete(['referencing/files/:fileId', 'documents/:fileId'])
  @UseGuards(FirebaseAuthGuard)
  async deleteUserFile(@Req() req: any, @Param('fileId') fileId: string) {
    return await this.referencingService.deleteUserFile(req.user.uid, fileId);
  }

  @Get('referencing/files/:fileId/url')
  @UseGuards(FirebaseAuthGuard)
  async getFileDownloadUrl(@Req() req: any, @Param('fileId') fileId: string) {
    return await this.referencingService.refreshFileDownloadUrl(req.user.uid, fileId);
  }

  // ── Public passport view (no auth) ───────────────────────────────────────

  @Get('referencing/public/:viewToken')
  async getPublicPassport(@Param('viewToken') viewToken: string) {
    const result = await this.referencingService.getPublicPassportByToken(viewToken);
    if (!result) throw new NotFoundException('Referencing passport not found or link is invalid.');
    if ((result as any).expired) return { success: false, expired: true, message: 'This referencing link has expired.' };
    return { success: true, ...(result as any) };
  }

  // ── Shares — public validate (no auth) ───────────────────────────────────

  @Get('referencing/shares/validate-claim')
  async validateClaimToken(@Query('token') claimToken: string) {
    if (!claimToken) return { valid: false, error: 'No token provided' };
    return await this.referencingService.validateClaimToken(claimToken);
  }

  // ── Shares — authenticated ────────────────────────────────────────────────

  @Post('referencing/shares/claim')
  @HttpCode(200)
  @UseGuards(FirebaseAuthGuard)
  async claimShare(@Req() req: any, @Body() body: { claimToken: string }) {
    return await this.referencingService.claimShare(body.claimToken, req.user.uid, req.user.email || '');
  }

  @Post('referencing/shares')
  @HttpCode(200)
  @UseGuards(FirebaseAuthGuard)
  async sharePassport(@Req() req: any, @Body() shareData: any) {
    return await this.referencingService.shareReferencingPassport(req.user.uid, shareData);
  }

  @Get('referencing/shares')
  @UseGuards(FirebaseAuthGuard)
  async getShares(@Req() req: any) {
    return await this.referencingService.getReferencingShares(req.user.uid);
  }

  @Delete('referencing/shares/:shareId')
  @UseGuards(FirebaseAuthGuard)
  async deleteShare(@Req() req: any, @Param('shareId') shareId: string) {
    return await this.referencingService.deleteReferencingShare(req.user.uid, shareId);
  }

  @Get('referencing/received')
  @UseGuards(FirebaseAuthGuard)
  async getReceivedReferencings(@Req() req: any) {
    const email = (req.user.email || '').toLowerCase().trim();
    return await this.referencingService.getReceivedReferencings(email);
  }

  // ── Request referencing from a tenant ────────────────────────────────────
  // Landlord/agent sends a referencing invite email to any tenant email address.

  @Post('referencing/request')
  @HttpCode(200)
  @UseGuards(FirebaseAuthGuard)
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

  @Post(['referencing/:userId/submit', 'applications/:userId/submit'])
  @HttpCode(200)
  @UseGuards(FirebaseAuthGuard)
  async submitApplication(@Req() req: any, @Param('userId') userId: string, @Body() formData: any) {
    return await this.referencingService.submitApplication(userId, formData);
  }

  // ── Wildcard — must be LAST to avoid shadowing specific routes ────────────

  @Get(['referencing/:userId', 'applications/:userId'])
  @UseGuards(FirebaseAuthGuard)
  async getFormData(@Req() req: any, @Param('userId') userId: string) {
    return await this.referencingService.getFormData(userId);
  }
}
