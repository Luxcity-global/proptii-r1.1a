import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmailController } from './email.controller';
import * as resendUtil from '../utils/resend';

describe('EmailController', () => {
  let controller: EmailController;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(resendUtil, 'sendEmail').mockResolvedValue('test-resend-id-123');
    controller = new EmailController();
  });

  it('rejects email requests with missing or invalid to email', async () => {
    await expect(controller.sendEmail({ to: '', subject: 'Test' })).rejects.toThrow();
    await expect(controller.sendEmail({ to: 'invalid-address' })).rejects.toThrow();
  });

  it('sends email successfully with attachment', async () => {
    const file = {
      fieldname: 'attachments',
      originalname: 'agreement.pdf',
      encoding: '7bit',
      mimetype: 'application/pdf',
      size: 1024,
      buffer: Buffer.from('PDF content'),
    };

    const result = await controller.sendEmail(
      { to: 'client@example.com', subject: 'Your Tenancy Agreement' },
      file,
    );

    expect(result.success).toBe(true);
    expect(result.messageId).toBe('test-resend-id-123');
  });

  it('sends base64 email successfully', async () => {
    const body = {
      to: 'tenant@example.com',
      subject: 'Contract for Review',
      attachmentBase64: Buffer.from('sample pdf').toString('base64'),
      attachmentFilename: 'contract.pdf',
      attachmentMimeType: 'application/pdf',
    };

    const result = await controller.sendEmailBase64(body);
    expect(result.success).toBe(true);
    expect(result.messageId).toBe('test-resend-id-123');
  });
});
