import { Controller, Post, Body, Get, Param, HttpCode } from '@nestjs/common';
import { ReferencingService } from '../services/referencing.service';

@Controller('referencing')
export class ReferencingController {
  constructor(private readonly referencingService: ReferencingService) { }

  @Post('identity')
  @HttpCode(200)
  async saveIdentityData(@Body() data: any) {
    return await this.referencingService.saveIdentityData(data);
  }

  @Post('employment')
  @HttpCode(200)
  async saveEmploymentData(@Body() data: any) {
    return await this.referencingService.saveEmploymentData(data);
  }

  @Post('residential')
  @HttpCode(200)
  async saveResidentialData(@Body() data: any) {
    return await this.referencingService.saveResidentialData(data);
  }

  @Post('financial')
  @HttpCode(200)
  async saveFinancialData(@Body() data: any) {
    return await this.referencingService.saveFinancialData(data);
  }

  @Post('guarantor')
  @HttpCode(200)
  async saveGuarantorData(@Body() data: any) {
    return await this.referencingService.saveGuarantorData(data);
  }

  @Post('agent')
  @HttpCode(200)
  async saveAgentDetailsData(@Body() data: any) {
    try {
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
} 