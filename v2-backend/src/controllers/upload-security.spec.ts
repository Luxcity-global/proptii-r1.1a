import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { ReferencingService } from '../services/referencing.service';
import { validateFileContent } from '../utils/file-content-validator';
import { uploadBufferToStorage, uploadBase64ToStorage } from '../utils/firebase-storage';

// Mock firebase-admin and bucket file save
vi.mock('firebase-admin', () => {
  const saveMock = vi.fn().mockResolvedValue(undefined);
  const getSignedUrlMock = vi.fn().mockResolvedValue(['https://signed.storage.url/file']);
  const fileMock = vi.fn().mockReturnValue({
    save: saveMock,
    getSignedUrl: getSignedUrlMock,
  });
  const bucketMock = vi.fn().mockReturnValue({
    name: 'test-bucket',
    file: fileMock,
  });

  return {
    storage: vi.fn().mockReturnValue({
      bucket: bucketMock,
    }),
    firestore: {
      FieldValue: {
        serverTimestamp: vi.fn().mockReturnValue('TIMESTAMP'),
      },
    },
  };
});

describe('File Upload Security & Validation', () => {
  describe('Binary Magic Bytes & Content Inspection (validateFileContent)', () => {
    it('detects and allows legitimate PDF documents', () => {
      const pdfBuffer = Buffer.from('%PDF-1.4\n%âãÏÓ\n1 0 obj\n<<>>\nendobj', 'binary');
      const res = validateFileContent(pdfBuffer, 'bank_statement.pdf', 'application/pdf');
      expect(res.valid).toBe(true);
      expect(res.detectedType).toBe('application/pdf');
    });

    it('detects and allows legitimate PNG images', () => {
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
      const res = validateFileContent(pngBuffer, 'passport_scan.png', 'image/png');
      expect(res.valid).toBe(true);
      expect(res.detectedType).toBe('image/png');
    });

    it('detects and allows legitimate JPEG images', () => {
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
      const res = validateFileContent(jpegBuffer, 'id_photo.jpg', 'image/jpeg');
      expect(res.valid).toBe(true);
      expect(res.detectedType).toBe('image/jpeg');
    });

    it('strictly prohibits Windows DOS/PE executables (.exe, .dll) disguised as PDF', () => {
      const exeBuffer = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]); // MZ header
      const res = validateFileContent(exeBuffer, 'document.pdf', 'application/pdf');
      expect(res.valid).toBe(false);
      expect(res.error).toMatch(/Executable files/i);
    });

    it('strictly prohibits Linux ELF binaries disguised as image', () => {
      const elfBuffer = Buffer.from([0x7f, 0x45, 0x4c, 0x46, 0x02, 0x01, 0x01, 0x00]); // \x7fELF
      const res = validateFileContent(elfBuffer, 'profile.png', 'image/png');
      expect(res.valid).toBe(false);
      expect(res.error).toMatch(/Linux binary/i);
    });

    it('strictly prohibits active HTML or JavaScript files disguised as documents', () => {
      const htmlPayload = Buffer.from('<html><head><script>alert("xss")</script></head><body>hello</body></html>');
      const res = validateFileContent(htmlPayload, 'payslip.pdf', 'application/pdf');
      expect(res.valid).toBe(false);
      expect(res.error).toMatch(/HTML and embedded script/i);
    });

    it('strictly prohibits SVG with inline active scripts', () => {
      const maliciousSvg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
      const res = validateFileContent(maliciousSvg, 'logo.svg', 'image/svg+xml');
      expect(res.valid).toBe(false);
      expect(res.error).toMatch(/prohibited/i);
    });
  });

  describe('Storage Safe Headers (Content-Disposition & nosniff)', () => {
    it('sets attachment Content-Disposition and nosniff metadata in uploadBufferToStorage', async () => {
      const admin = await import('firebase-admin');
      const bucket = admin.storage().bucket();
      const pdfBuffer = Buffer.from('%PDF-1.4 test', 'binary');

      const result = await uploadBufferToStorage(pdfBuffer, 'referencing/u1/doc/uuid.pdf', 'application/pdf', 'my_bank_statement.pdf');
      expect(result.downloadUrl).toBeDefined();

      const fileMockInstance = bucket.file('referencing/u1/doc/uuid.pdf');
      expect(fileMockInstance.save).toHaveBeenCalledWith(
        pdfBuffer,
        expect.objectContaining({
          metadata: expect.objectContaining({
            contentDisposition: expect.stringContaining('attachment; filename="my_bank_statement.pdf"'),
            metadata: expect.objectContaining({
              'x-content-type-options': 'nosniff',
            }),
          }),
        }),
      );
    });

    it('sets attachment Content-Disposition and nosniff metadata in uploadBase64ToStorage', async () => {
      const admin = await import('firebase-admin');
      const bucket = admin.storage().bucket();
      const base64Uri = 'data:application/pdf;base64,' + Buffer.from('%PDF-1.4 test').toString('base64');

      const result = await uploadBase64ToStorage(base64Uri, 'referencing/u1/doc/uuid.pdf', 'payslip.pdf');
      expect(result.downloadUrl).toBeDefined();

      const fileMockInstance = bucket.file('referencing/u1/doc/uuid.pdf');
      expect(fileMockInstance.save).toHaveBeenCalledWith(
        expect.any(Buffer),
        expect.objectContaining({
          metadata: expect.objectContaining({
            contentDisposition: expect.stringContaining('attachment; filename="payslip.pdf"'),
            metadata: expect.objectContaining({
              'x-content-type-options': 'nosniff',
            }),
          }),
        }),
      );
    });
  });

  describe('ReferencingService.saveUserFile security controls', () => {
    let service: ReferencingService;

    beforeEach(() => {
      service = new ReferencingService(null as any);
      const mockCollection = {
        doc: vi.fn().mockReturnValue({
          set: vi.fn().mockResolvedValue(undefined),
        }),
      };
      Object.defineProperty(service, 'filesCollection', {
        get: () => mockCollection,
        configurable: true,
      });
    });

    it('rejects spoofed file with executable contents via saveUserFile', async () => {
      const maliciousFile = {
        buffer: Buffer.from([0x4d, 0x5a, 0x90, 0x00]), // MZ executable header
        originalname: 'evil_invoice.pdf',
        mimetype: 'application/pdf',
        size: 1024,
      } as Express.Multer.File;

      await expect(
        service.saveUserFile('tenant-1', maliciousFile, { section: 'financial' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects file exceeding 25MB via saveUserFile', async () => {
      const hugeFile = {
        buffer: Buffer.from('%PDF-1.4\nlarge payload'),
        originalname: 'giant.pdf',
        mimetype: 'application/pdf',
        size: 30 * 1024 * 1024, // 30MB
      } as Express.Multer.File;

      await expect(
        service.saveUserFile('tenant-1', hugeFile, { section: 'financial' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('sanitizes path traversal attempts in original filename', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4\nvalid pdf content', 'binary');
      const traversalFile = {
        buffer: pdfBuffer,
        originalname: '../../../../etc/passwd.pdf',
        mimetype: 'application/pdf',
        size: pdfBuffer.length,
      } as Express.Multer.File;

      const saved = await service.saveUserFile('tenant-1', traversalFile, { section: 'identity' });
      expect(saved.fileName).not.toContain('..');
      expect(saved.fileName).toBe('passwd.pdf');
    });
  });
});
