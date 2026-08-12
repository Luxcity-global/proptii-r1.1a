import { Controller, Post, Body, Get, Param, Put, HttpCode, UseGuards, Req, ForbiddenException, Delete } from '@nestjs/common';
import { ReferencingService } from '../services/referencing.service';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';

@Controller()
export class ReferencingController {
  constructor(private readonly referencingService: ReferencingService) {}

  @Post(['referencing/identity', 'applications/:id/identity'])
  @Put(['applications/:id/identity'])
  @HttpCode(200)
  @UseGuards(FirebaseAuthGuard)
  async saveIdentityData(@Req() req: any, @Body() data: any) {
    const userId = req.user.uid;
    return await this.referencingService.saveSectionData(userId, 'identity', data);
  }

  @Post(['referencing/employment', 'applications/:id/employment'])
  @Put(['applications/:id/employment'])
  @HttpCode(200)
  @UseGuards(FirebaseAuthGuard)
  async saveEmploymentData(@Req() req: any, @Body() data: any) {
    const userId = req.user.uid;
    return await this.referencingService.saveSectionData(userId, 'employment', data);
  }

  @Post(['referencing/residential', 'applications/:id/residential'])
  @Put(['applications/:id/residential'])
  @HttpCode(200)
  @UseGuards(FirebaseAuthGuard)
  async saveResidentialData(@Req() req: any, @Body() data: any) {
    const userId = req.user.uid;
    return await this.referencingService.saveSectionData(userId, 'residential', data);
  }

  @Post(['referencing/financial', 'applications/:id/financial'])
  @Put(['applications/:id/financial'])
  @HttpCode(200)
  @UseGuards(FirebaseAuthGuard)
  async saveFinancialData(@Req() req: any, @Body() data: any) {
    const userId = req.user.uid;
    return await this.referencingService.saveSectionData(userId, 'financial', data);
  }

  @Post(['referencing/guarantor', 'applications/:id/guarantor'])
  @Put(['applications/:id/guarantor'])
  @HttpCode(200)
  @UseGuards(FirebaseAuthGuard)
  async saveGuarantorData(@Req() req: any, @Body() data: any) {
    const userId = req.user.uid;
    return await this.referencingService.saveSectionData(userId, 'guarantor', data);
  }

  @Post(['referencing/agentDetails', 'applications/:id/agentDetails'])
  @Put(['applications/:id/agentDetails'])
  @HttpCode(200)
  @UseGuards(FirebaseAuthGuard)
  async saveAgentDetailsData(@Req() req: any, @Body() data: any) {
    const userId = req.user.uid;
    return await this.referencingService.saveSectionData(userId, 'agentDetails', data);
  }

  @Get(['referencing/:userId', 'applications/:userId'])
  @UseGuards(FirebaseAuthGuard)
  async getFormData(@Req() req: any, @Param('userId') userId: string) {
    return await this.referencingService.getFormData(userId);
  }

  @Post(['referencing/:userId/submit', 'applications/:userId/submit'])
  @HttpCode(200)
  @UseGuards(FirebaseAuthGuard)
  async submitApplication(@Req() req: any, @Param('userId') userId: string, @Body() formData: any) {
    return await this.referencingService.submitApplication(userId, formData);
  }

  @Get('referencing/status/:tenantEmail')
  @HttpCode(200)
  @UseGuards(FirebaseAuthGuard)
  async getReferencingStatus(@Req() req: any, @Param('tenantEmail') tenantEmail: string) {
    return await this.referencingService.getReferencingStatusByEmail(tenantEmail);
  }

  @Get(['referencing/files/all', 'applications/:id/documents'])
  @UseGuards(FirebaseAuthGuard)
  async getUserFiles(@Req() req: any) {
    const userId = req.user.uid;
    return await this.referencingService.getUserFiles(userId);
  }

  @Post(['referencing/files/save', 'applications/:id/upload', 'property/upload-photo', 'property/upload-document'])
  @HttpCode(200)
  @UseGuards(FirebaseAuthGuard)
  async saveUserFile(@Req() req: any, @Body() fileData: any) {
    const userId = req.user?.uid || 'dev-user';
    return await this.referencingService.saveUserFile(userId, fileData);
  }

  @Delete(['referencing/files/:fileId', 'documents/:fileId'])
  @UseGuards(FirebaseAuthGuard)
  async deleteUserFile(@Req() req: any, @Param('fileId') fileId: string) {
    const userId = req.user.uid;
    return await this.referencingService.deleteUserFile(userId, fileId);
  }
}
