import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { EmailService } from '../services/email.service';

interface SendEmailPayload {
  to?: string;
  subject?: string;
  html?: string;
  emailType?:
    | 'agent'
    | 'referee'
    | 'guarantor'
    | 'user'
    | 'viewing-agent'
    | 'viewing-user'
    | 'viewing-confirmed'
    | 'viewing-reschedule'
    | 'viewing-cancel'
    | 'viewing-cancellation';
}

interface SendEmailWithAttachmentPayload extends SendEmailPayload {
  attachmentBase64?: string;
  attachmentFilename?: string;
  attachmentMimeType?: string;
}

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('send')
  @UseInterceptors(AnyFilesInterceptor())
  async sendEmail(@Body() body: SendEmailPayload) {
    const { to, subject, html, emailType } = body;

    if (!to || !subject || !html) {
      throw new BadRequestException(
        'Missing required fields: to, subject, html',
      );
    }

    try {
      const result = await this.emailService.sendEmail({
        to,
        subject,
        html,
        emailType: emailType as 'agent' | 'referee' | 'guarantor' | 'user' | 'viewing-agent' | 'viewing-user' | 'viewing-reschedule' | 'viewing-cancel' | undefined,
      });

      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to send email',
      );
    }
  }

  @Post('send-base64')
  @UseInterceptors(
    AnyFilesInterceptor({
      storage: memoryStorage(),
      limits: {
        fieldSize: 100 * 1024 * 1024, // 100MB limit for form fields (base64 strings)
        fields: 10, // Maximum number of non-file fields
        fileSize: 0, // No file uploads expected
      },
    }),
  )
  async sendEmailWithBase64(@Body() body: SendEmailWithAttachmentPayload) {
    const {
      to,
      subject,
      html,
      emailType,
      attachmentBase64,
      attachmentFilename,
      attachmentMimeType,
    } = body;

    if (!to || !subject || !html) {
      throw new BadRequestException(
        'Missing required fields: to, subject, html',
      );
    }

    if (attachmentBase64 && !attachmentFilename) {
      throw new BadRequestException(
        'Attachment filename is required when attachment data is provided',
      );
    }

    const attachments = [];

    if (attachmentBase64) {
      try {
        const buffer = Buffer.from(attachmentBase64, 'base64');

        attachments.push({
          filename: attachmentFilename ?? 'attachment',
          content: buffer,
          contentType: attachmentMimeType ?? 'application/octet-stream',
        });
      } catch (error) {
        throw new BadRequestException(
          `Failed to decode attachment: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        );
      }
    }

    try {
      const result = await this.emailService.sendEmail({
        to,
        subject,
        html,
        emailType: emailType as 'agent' | 'referee' | 'guarantor' | 'user' | 'viewing-agent' | 'viewing-user' | 'viewing-reschedule' | 'viewing-cancel' | undefined,
        attachments,
      });

      return {
        success: true,
        messageId: result.messageId,
        attachmentsSent: attachments.length > 0,
      };
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to send email',
      );
    }
  }
}


