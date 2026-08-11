import { Body, Controller, Logger, Post, Get, UseInterceptors, UploadedFile, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ContractEmailService } from '../services/contract-email.service';

interface SendSignedContractDto {
  to: string;
  subject: string;
  recipientName: string;
  contractName: string;
  senderName: string;
  senderEmail: string;
  emailType: string;
  htmlContent: string;
}

@Controller('contracts')
export class ContractController {
  constructor(private readonly contractEmailService: ContractEmailService) {}
  private readonly logger = new Logger(ContractController.name);

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getContracts() {
    // Return empty array for now until contract persistence is fully implemented
    return { success: true, data: [] };
  }

  @Post('send-signed-contract')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('attachment'))
  async sendSignedContract(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: SendSignedContractDto
  ) {
    try {
      this.logger.log('📧 Received contract email request:', {
        to: body.to,
        contractName: body.contractName,
        recipientName: body.recipientName,
        fileSize: file?.size || 0
      });

      if (!file) {
        throw new Error('No contract file provided');
      }

      const result = await this.contractEmailService.sendSignedContractEmail({
        to: body.to,
        subject: body.subject,
        recipientName: body.recipientName,
        contractName: body.contractName,
        senderName: body.senderName,
        senderEmail: body.senderEmail,
        htmlContent: body.htmlContent,
        attachment: {
          filename: file.originalname,
          content: file.buffer,
          contentType: file.mimetype
        }
      });

      return result;

    } catch (error) {
      this.logger.error('❌ Error in contract controller:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}
