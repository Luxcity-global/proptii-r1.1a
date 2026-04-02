import { Controller, Post, Body, Get, Param, HttpCode, UseInterceptors, UploadedFiles, UseGuards, Logger } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ReferencingService } from '../services/referencing.service';
import { AIExtractionService } from '../services/ai-extraction.service';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
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
export class ReferencingController {
  private readonly logger = new Logger(ReferencingController.name);

  constructor(
    private readonly referencingService: ReferencingService,
    private readonly aiExtractionService: AIExtractionService
  ) { }

  /** AI document extraction — write operation, requires auth */
  @Post('ai-extract')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async extractDataFromAI(@Body() data: AiExtractDto) {
    this.logger.log(`AI extraction request — mimeType: ${data.mimeType}`);
    const result = await this.aiExtractionService.extractDataFromDocument(data.base64Data, data.mimeType);
    return { success: true, data: result };
  }

  @Post('identity')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async saveIdentityData(@Body() data: SaveIdentityDto) {
    return await this.referencingService.saveIdentityData(data);
  }

  @Post('employment')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async saveEmploymentData(@Body() data: SaveEmploymentDto) {
    return await this.referencingService.saveEmploymentData(data);
  }

  @Post('residential')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async saveResidentialData(@Body() data: SaveResidentialDto) {
    return await this.referencingService.saveResidentialData(data);
  }

  @Post('financial')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async saveFinancialData(@Body() data: SaveFinancialDto) {
    return await this.referencingService.saveFinancialData(data);
  }

  @Post('guarantor')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async saveGuarantorData(@Body() data: SaveGuarantorDto) {
    return await this.referencingService.saveGuarantorData(data);
  }

  @Post('agentDetails')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async saveAgentDetailsData(@Body() data: SaveAgentDetailsDto) {
    this.logger.log('Saving agent details data');
    return await this.referencingService.saveAgentDetailsData(data);
  }

  @Get(':userId')
  async getFormData(@Param('userId') userId: string) {
    return await this.referencingService.getFormData(userId);
  }

  @Post(':userId/submit')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async submitApplication(
    @Param('userId') userId: string,
    @Body() formData: SubmitApplicationDto
  ) {
    return await this.referencingService.submitApplication(userId, formData);
  }

  /** Send referencing email with attachments (multipart form) */
  @Post('send-email')
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async testEmail(@Body() data: { email: string }) {
    return await this.referencingService.testEmail(data.email);
  }

  @Post('response')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async saveRefereeGuarantorResponse(@Body() data: RefereeResponseDto) {
    return await this.referencingService.saveRefereeGuarantorResponse(data);
  }

  @Get('responses/:tenantEmail')
  @HttpCode(200)
  async getRefereeGuarantorResponses(@Param('tenantEmail') tenantEmail: string) {
    return await this.referencingService.getRefereeGuarantorResponses(tenantEmail);
  }
}