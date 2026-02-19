import { Controller, Post, UseInterceptors, UploadedFile, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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

  @Post('send-signed-contract')
  @UseInterceptors(FileInterceptor('attachment'))
  async sendSignedContract(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: SendSignedContractDto
  ) {
    try {
      console.log('📧 Received contract email request:', {
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
      console.error('❌ Error in contract controller:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}
