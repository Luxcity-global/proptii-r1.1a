import { Controller, Post, Body, Get, Param, UseInterceptors, UploadedFile, MaxFileSizeValidator, ParseFilePipe } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ReferencingService } from '../services/referencing.service';

@Controller('referencing')
export class ReferencingController {
  constructor(private readonly referencingService: ReferencingService) {}

  @Post('identity')
  @UseInterceptors(FileInterceptor('identityProof'))
  async saveIdentityData(
    @Body() data: any,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
        ],
      }),
    )
    file?: Express.Multer.File,
  ) {
    try {
      if (file) {
        data.identityProof = {
          filename: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          buffer: file.buffer
        };
      }
      return await this.referencingService.saveIdentityData(data);
    } catch (error) {
      throw new Error(`Failed to save identity data: ${error.message}`);
    }
  }

  @Post('employment')
  @UseInterceptors(FileInterceptor('proofDocument'))
  async saveEmploymentData(
    @Body() data: any,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
        ],
      }),
    )
    file?: Express.Multer.File,
  ) {
    try {
      if (file) {
        data.proofDocument = {
          filename: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          buffer: file.buffer
        };
      }
      return await this.referencingService.saveEmploymentData(data);
    } catch (error) {
      throw new Error(`Failed to save employment data: ${error.message}`);
    }
  }

  @Post('residential')
  @UseInterceptors(FileInterceptor('proofDocument'))
  async saveResidentialData(
    @Body() data: any,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
        ],
      }),
    )
    file?: Express.Multer.File,
  ) {
    try {
      if (file) {
        data.proofDocument = {
          filename: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          buffer: file.buffer
        };
      }
      return await this.referencingService.saveResidentialData(data);
    } catch (error) {
      throw new Error(`Failed to save residential data: ${error.message}`);
    }
  }

  @Post('financial')
  @UseInterceptors(FileInterceptor('proofOfIncomeDocument'))
  async saveFinancialData(
    @Body() data: any,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
        ],
      }),
    )
    file?: Express.Multer.File,
  ) {
    try {
      if (file) {
        data.proofOfIncomeDocument = {
          filename: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          buffer: file.buffer
        };
      }
      return await this.referencingService.saveFinancialData(data);
    } catch (error) {
      throw new Error(`Failed to save financial data: ${error.message}`);
    }
  }

  @Post('guarantor')
  @UseInterceptors(FileInterceptor('identityDocument'))
  async saveGuarantorData(
    @Body() data: any,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
        ],
      }),
    )
    file?: Express.Multer.File,
  ) {
    try {
      if (file) {
        data.identityDocument = {
          filename: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          buffer: file.buffer
        };
      }
      return await this.referencingService.saveGuarantorData(data);
    } catch (error) {
      throw new Error(`Failed to save guarantor data: ${error.message}`);
    }
  }

  @Post('agent')
  async saveAgentDetailsData(@Body() data: any) {
    try {
      return await this.referencingService.saveAgentDetailsData(data);
    } catch (error) {
      throw new Error(`Failed to save agent details: ${error.message}`);
    }
  }

  @Get(':userId')
  async getFormData(@Param('userId') userId: string) {
    try {
      return await this.referencingService.getFormData(userId);
    } catch (error) {
      throw new Error(`Failed to get form data: ${error.message}`);
    }
  }

  @Post(':userId/submit')
  async submitApplication(
    @Param('userId') userId: string,
    @Body() data: any
  ) {
    try {
      return await this.referencingService.submitApplication(userId, data);
    } catch (error) {
      throw new Error(`Failed to submit application: ${error.message}`);
    }
  }
} 