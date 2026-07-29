import { Controller, Post, Body, Get, Param, HttpCode, UseInterceptors, UploadedFiles, UseGuards, Logger, Req, ForbiddenException, Delete } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ReferencingService } from '../services/referencing.service';
import { AIExtractionService } from '../services/ai-extraction.service';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { SubscriptionGuard } from '../guards/subscription.guard';
import { RequiresActiveSubscription } from '../decorators/requires-active-subscription.decorator';
import {
  AiExtractDto,
  SaveIdentityDto,
  SaveEmploymentDto,
  SaveResidentialDto,
  SaveFinancialDto,
  SaveGuarantorDto,
  SaveAgentDetailsDto,
  SubmitApplicationDto,
  RefereeResponseDto,
} from '../dtos/referencing.dto';

@Controller('referencing')
@RequiresActiveSubscription()
export class ReferencingController {
  private readonly logger = new Logger(ReferencingController.name);

  constructor(
    private readonly referencingService: ReferencingService,
    private readonly aiExtractionService: AIExtractionService
  ) { }

  /** AI document extraction — write operation, requires auth */
  @Post('ai-extract')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @ApiBearerAuth()
  async extractDataFromAI(@Body() data: AiExtractDto) {
    this.logger.log(`AI extraction request — mimeType: ${data.mimeType}`);
    const result = await this.aiExtractionService.extractDataFromDocument(data.base64Data, data.mimeType);
    return { success: true, data: result };
  }

  @Post('identity')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @ApiBearerAuth()
  async saveIdentityData(@Req() req: any, @Body() data: SaveIdentityDto) {
    if (data.userId !== req.user?.sub) {
      throw new ForbiddenException('You can only modify your own referencing data');
    }
    return await this.referencingService.saveIdentityData(data);
  }

  @Post('employment')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @ApiBearerAuth()
  async saveEmploymentData(@Req() req: any, @Body() data: SaveEmploymentDto) {
    if (data.userId !== req.user?.sub) {
      throw new ForbiddenException('You can only modify your own referencing data');
    }
    return await this.referencingService.saveEmploymentData(data);
  }

  @Post('residential')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @ApiBearerAuth()
  async saveResidentialData(@Req() req: any, @Body() data: SaveResidentialDto) {
    if (data.userId !== req.user?.sub) {
      throw new ForbiddenException('You can only modify your own referencing data');
    }
    return await this.referencingService.saveResidentialData(data);
  }

  @Post('financial')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @ApiBearerAuth()
  async saveFinancialData(@Req() req: any, @Body() data: SaveFinancialDto) {
    if (data.userId !== req.user?.sub) {
      throw new ForbiddenException('You can only modify your own referencing data');
    }
    return await this.referencingService.saveFinancialData(data);
  }

  @Post('guarantor')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @ApiBearerAuth()
  async saveGuarantorData(@Req() req: any, @Body() data: SaveGuarantorDto) {
    if (data.userId !== req.user?.sub) {
      throw new ForbiddenException('You can only modify your own referencing data');
    }
    return await this.referencingService.saveGuarantorData(data);
  }

  @Post('agentDetails')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @ApiBearerAuth()
  async saveAgentDetailsData(@Req() req: any, @Body() data: SaveAgentDetailsDto) {
    if (data.userId !== req.user?.sub) {
      throw new ForbiddenException('You can only modify your own referencing data');
    }
    this.logger.log('Saving agent details data');
    return await this.referencingService.saveAgentDetailsData(data);
  }

  @Get(':userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getFormData(@Req() req: any, @Param('userId') userId: string) {
    if (userId !== req.user?.sub) {
      throw new ForbiddenException('You can only view your own referencing data');
    }
    return await this.referencingService.getFormData(userId);
  }

  @Post(':userId/submit')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @ApiBearerAuth()
  async submitApplication(
    @Req() req: any,
    @Param('userId') userId: string,
    @Body() formData: SubmitApplicationDto
  ) {
    if (userId !== req.user?.sub) {
      throw new ForbiddenException('You can only submit your own referencing data');
    }
    return await this.referencingService.submitApplication(userId, formData);
  }

  /** Send referencing email with attachments (multipart form) */
  @Post('send-email')
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileFieldsInterceptor([{ name: 'attachments', maxCount: 10 }]))
  async sendEmail(
    @Body() emailData: Record<string, string>,
    @UploadedFiles() files: { attachments?: Express.Multer.File[] }
  ) {
    const formData = JSON.parse(emailData.formData ?? '{}');
    const attachments = files?.attachments?.map(file => ({
      filename: file.originalname,
      content: file.buffer
    })) ?? [];

    return await this.referencingService.sendEmail({
      to: emailData.to,
      subject: emailData.subject,
      formData,
      html: emailData.html,
      attachments,
      submissionId: emailData.submissionId,
      emailType: emailData.emailType ?? 'agent'
    });
  }

  @Post('send-multiple-emails')
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileFieldsInterceptor([{ name: 'attachments', maxCount: 10 }]))
  async sendMultipleEmails(
    @Body() emailData: Record<string, string>,
    @UploadedFiles() files: { attachments?: Express.Multer.File[] }
  ) {
    const formData = JSON.parse(emailData.formData ?? '{}');
    const attachments = files?.attachments?.map(file => ({
      filename: file.originalname,
      content: file.buffer
    })) ?? [];

    const results = await this.referencingService.sendMultipleEmails({
      formData,
      html: emailData.html,
      attachments,
      submissionId: emailData.submissionId
    });

    return { success: true, results };
  }

  @Get('test-email-config')
  async testEmailConfig() {
    return await this.referencingService.testEmailConfig();
  }

  @Post('test-email')
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @ApiBearerAuth()
  async testEmail(@Body() data: { email: string }) {
    return await this.referencingService.testEmail(data.email);
  }

  @Post('response')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @ApiBearerAuth()
  async saveRefereeGuarantorResponse(@Body() data: RefereeResponseDto) {
    return await this.referencingService.saveRefereeGuarantorResponse(data);
  }

  @Get('responses/:tenantEmail')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getRefereeGuarantorResponses(@Req() req: any, @Param('tenantEmail') tenantEmail: string) {
    const userEmail = req.user?.emails?.[0] || req.user?.email || req.user?.preferred_username;
    if (tenantEmail.toLowerCase() !== userEmail?.toLowerCase() && req.user?.role !== 'landlord' && req.user?.role !== 'agent') {
      throw new ForbiddenException('You do not have permission to view these responses');
    }
    return await this.referencingService.getRefereeGuarantorResponses(tenantEmail);
  }

  @Get('status/:tenantEmail')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getReferencingStatus(@Req() req: any, @Param('tenantEmail') tenantEmail: string) {
    const userEmail = req.user?.emails?.[0] || req.user?.email || req.user?.preferred_username;
    if (tenantEmail.toLowerCase() !== userEmail?.toLowerCase() && req.user?.role !== 'landlord' && req.user?.role !== 'agent') {
      throw new ForbiddenException('You do not have permission to view this referencing status');
    }
    return await this.referencingService.getReferencingStatusByEmail(tenantEmail);
  }

  @Delete('responses/:responseId')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async deleteResponse(@Req() req: any, @Param('responseId') responseId: string) {
    if (req.user?.role !== 'landlord' && req.user?.role !== 'agent') {
      throw new ForbiddenException('Only landlords or agents can delete responses');
    }
    return await this.referencingService.deleteResponse(responseId);
  }

  // ==========================================
  // Proxy Endpoints for Tenant Referencing Flow
  // ==========================================

  @Get('forms/all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getUserReferencingForms(@Req() req: any) {
    const userId = req.user?.sub;
    return await this.referencingService.getUserReferencingForms(userId);
  }

  @Get('forms/:propertyId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getReferencingForm(@Req() req: any, @Param('propertyId') propertyId: string) {
    const userId = req.user?.sub;
    return await this.referencingService.getReferencingForm(userId, propertyId);
  }

  @Post('forms/:propertyId')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async saveReferencingForm(@Req() req: any, @Param('propertyId') propertyId: string, @Body() formPayload: any) {
    const userId = req.user?.sub;
    return await this.referencingService.saveReferencingForm(userId, propertyId, formPayload);
  }

  @Delete('forms/:propertyId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async deleteReferencingForm(@Req() req: any, @Param('propertyId') propertyId: string) {
    const userId = req.user?.sub;
    return await this.referencingService.deleteReferencingForm(userId, propertyId);
  }

  @Get('files/all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getUserFiles(@Req() req: any) {
    const userId = req.user?.sub;
    return await this.referencingService.getUserFiles(userId);
  }

  @Post('files/save')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async saveUserFile(@Req() req: any, @Body() fileData: any) {
    const userId = req.user?.sub;
    return await this.referencingService.saveUserFile(userId, fileData);
  }

  @Delete('files/:fileId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async deleteUserFile(@Req() req: any, @Param('fileId') fileId: string) {
    const userId = req.user?.sub;
    return await this.referencingService.deleteUserFile(userId, fileId);
  }
}