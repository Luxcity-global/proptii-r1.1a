import { Controller, Post, Body, Get, Param, HttpCode, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { ReferencingService } from '../services/referencing.service';
import { FileFieldsInterceptor } from '@nestjs/platform-express';

@Controller('referencing')
export class ReferencingController {
  constructor(private readonly referencingService: ReferencingService) { }

  @Post('identity')
  @HttpCode(200)
  async saveIdentityData(@Body() data: any) {
    if (!data.userId) {
      throw new Error('User ID is required');
    }
    return await this.referencingService.saveIdentityData(data);
  }

  @Post('employment')
  @HttpCode(200)
  async saveEmploymentData(@Body() data: any) {
    if (!data.userId) {
      throw new Error('User ID is required');
    }
    return await this.referencingService.saveEmploymentData(data);
  }

  @Post('residential')
  @HttpCode(200)
  async saveResidentialData(@Body() data: any) {
    if (!data.userId) {
      throw new Error('User ID is required');
    }
    return await this.referencingService.saveResidentialData(data);
  }

  @Post('financial')
  @HttpCode(200)
  async saveFinancialData(@Body() data: any) {
    if (!data.userId) {
      throw new Error('User ID is required');
    }
    return await this.referencingService.saveFinancialData(data);
  }

  @Post('guarantor')
  @HttpCode(200)
  async saveGuarantorData(@Body() data: any) {
    if (!data.userId) {
      throw new Error('User ID is required');
    }
    return await this.referencingService.saveGuarantorData(data);
  }

  @Post('agentDetails')
  @HttpCode(200)
  async saveAgentDetailsData(@Body() data: any) {
    try {
      if (!data.userId) {
        throw new Error('User ID is required');
      }
      console.log('Received agent details data:', data);
      const result = await this.referencingService.saveAgentDetailsData(data);
      return result;
    } catch (error) {
      console.error('Error saving agent details:', error);
      throw error;
    }
  }

  @Get(':userId')
  async getFormData(@Param('userId') userId: string) {
    return await this.referencingService.getFormData(userId);
  }

  @Post(':userId/submit')
  @HttpCode(200)
  async submitApplication(
    @Param('userId') userId: string,
    @Body() formData: any
  ) {
    return await this.referencingService.submitApplication(userId, formData);
  }

  @Post('send-email')
  @UseInterceptors(FileFieldsInterceptor([{ name: 'attachments', maxCount: 10 }]))
  async sendEmail(
    @Body() emailData: any,
    @UploadedFiles() files: { attachments?: Express.Multer.File[] }
  ) {
    try {
      const formData = JSON.parse(emailData.formData);
      const attachments = files?.attachments?.map(file => ({
        filename: file.originalname,
        content: file.buffer
      })) || [];

      const result = await this.referencingService.sendEmail({
        to: emailData.to,
        subject: emailData.subject,
        formData,
        attachments,
        submissionId: emailData.submissionId,
        emailType: emailData.emailType || 'agent'
      });

      return result;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  @Post('send-multiple-emails')
  @UseInterceptors(FileFieldsInterceptor([{ name: 'attachments', maxCount: 10 }]))
  async sendMultipleEmails(
    @Body() emailData: any,
    @UploadedFiles() files: { attachments?: Express.Multer.File[] }
  ) {
    try {
      const formData = JSON.parse(emailData.formData);
      const attachments = files?.attachments?.map(file => ({
        filename: file.originalname,
        content: file.buffer
      })) || [];

      const results = await this.referencingService.sendMultipleEmails({
        formData,
        attachments,
        submissionId: emailData.submissionId
      });

      return {
        success: true,
        results
      };
    } catch (error) {
      console.error('Error sending multiple emails:', error);
      throw error;
    }
  }

  @Get('test-email-config')
  async testEmailConfig() {
    return await this.referencingService.testEmailConfig();
  }

  @Post('test-email')
  async testEmail(@Body() data: { email: string }) {
    return await this.referencingService.testEmail(data.email);
  }
} 