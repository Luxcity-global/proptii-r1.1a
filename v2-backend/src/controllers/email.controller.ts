import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Logger,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { sendEmail } from '../utils/resend';

export interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@ApiTags('Email')
@Controller('email')
export class EmailController {
  private readonly logger = new Logger(EmailController.name);

  @Post('send')
  @UseInterceptors(FileInterceptor('attachments', {
    limits: { fileSize: 25 * 1024 * 1024 }, // 25MB attachment limit
  }))
  @HttpCode(200)
  @ApiOperation({ summary: 'Send an email with optional multipart attachment via Resend' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiResponse({ status: 200, description: 'Email sent successfully' })
  async sendEmail(
    @Body() body: any,
    @UploadedFile() file?: MulterFile,
  ) {
    const to = body.to;
    const subject = body.subject || 'Notification from Proptii';
    const html = body.html || '<p>You have received a new message from Proptii.</p>';

    if (!to || typeof to !== 'string' || !to.includes('@')) {
      throw new BadRequestException('Recipient email (to) is required and must be valid');
    }

    let attachments: any[] | undefined;
    if (file && file.buffer) {
      attachments = [{
        filename: file.originalname || 'attachment.pdf',
        content: file.buffer.toString('base64'),
        content_type: file.mimetype || 'application/pdf',
      }];
    }

    try {
      const id = await sendEmail({
        to: to.toLowerCase().trim(),
        subject,
        html,
        attachments,
      });

      this.logger.log(`Email sent successfully to ${to} [${id}]`);
      return { success: true, messageId: id };
    } catch (err: any) {
      this.logger.error(`Failed to send email to ${to}: ${err?.message || err}`);
      return { success: false, error: err?.message || 'Failed to send email' };
    }
  }

  @Post('send-base64')
  @UseInterceptors(FileInterceptor('file')) // in case sent as multipart
  @HttpCode(200)
  @ApiOperation({ summary: 'Send an email with base64 attachment via Resend' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiResponse({ status: 200, description: 'Email sent successfully' })
  async sendEmailBase64(
    @Body() body: any,
    @UploadedFile() file?: MulterFile,
  ) {
    const to = body.to;
    const subject = body.subject || 'Contract for Review';
    const html = body.html || '<p>Please find attached your contract for review.</p>';

    if (!to || typeof to !== 'string' || !to.includes('@')) {
      throw new BadRequestException('Recipient email (to) is required and must be valid');
    }

    let attachments: any[] | undefined;

    if (file && file.buffer) {
      attachments = [{
        filename: file.originalname || body.attachmentFilename || 'contract.pdf',
        content: file.buffer.toString('base64'),
        content_type: file.mimetype || body.attachmentMimeType || 'application/pdf',
      }];
    } else if (body.attachmentBase64) {
      attachments = [{
        filename: body.attachmentFilename || 'contract.pdf',
        content: body.attachmentBase64,
        content_type: body.attachmentMimeType || 'application/pdf',
      }];
    }

    try {
      const id = await sendEmail({
        to: to.toLowerCase().trim(),
        subject,
        html,
        attachments,
      });

      this.logger.log(`Base64 email sent successfully to ${to} [${id}]`);
      return { success: true, messageId: id };
    } catch (err: any) {
      this.logger.error(`Failed to send base64 email to ${to}: ${err?.message || err}`);
      return { success: false, error: err?.message || 'Failed to send email' };
    }
  }
}
