import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fileService } from '../fileService';
import { firestoreService } from '../firestoreService';
import { uploadToFirebaseStorage } from '../storageService';

vi.mock('../firestoreService', () => ({
  firestoreService: {
    getUserFiles: vi.fn(),
    saveUserFile: vi.fn(),
    deleteUserFile: vi.fn(),
  },
}));

vi.mock('../storageService', () => ({
  uploadToFirebaseStorage: vi.fn(),
  deleteFromFirebaseStorage: vi.fn(),
}));

describe('Tenant fileService ("Your Files" Dashboard)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fileService.setCurrentUser(null);
  });

  it('getFiles returns empty files list when no user is logged in and no files exist', async () => {
    const files = await fileService.getFiles();
    expect(files).toEqual([]);
  });

  it('getFiles returns user-specific uploaded files from Firestore', async () => {
    fileService.setCurrentUser('tenant_user_456');

    const mockUserFiles = [
      {
        id: 'user_file_101_identity',
        name: 'Passport_Copy.pdf',
        category: 'Identity',
        type: 'application/pdf',
        size: 1048576,
        uploadDate: new Date('2026-03-01T10:00:00.000Z'),
        url: 'https://storage/passport.pdf',
      },
      {
        id: 'user_file_102_employment',
        name: 'Employment_Letter.pdf',
        category: 'Employment',
        type: 'application/pdf',
        size: 524288,
        uploadDate: new Date('2026-03-02T10:00:00.000Z'),
        url: 'https://storage/employment.pdf',
      },
    ];

    vi.mocked(firestoreService.getUserFiles).mockResolvedValue({
      success: true,
      files: mockUserFiles as any,
    });

    const allFiles = await fileService.getFiles();

    expect(firestoreService.getUserFiles).toHaveBeenCalledWith('tenant_user_456');
    expect(allFiles.some(f => f.name === 'Passport_Copy.pdf' && f.category === 'Identity')).toBe(true);
    expect(allFiles.some(f => f.name === 'Employment_Letter.pdf' && f.category === 'Employment')).toBe(true);
  });

  it('uploadFiles reads file and persists to Firestore under current user', async () => {
    fileService.setCurrentUser('tenant_user_456');

    vi.mocked(uploadToFirebaseStorage).mockResolvedValue({
      success: true,
      url: 'https://storage.googleapis.com/documents/Bank_Statement_Jan2026.pdf',
      fileName: 'Bank_Statement_Jan2026.pdf',
    });

    vi.mocked(firestoreService.saveUserFile).mockResolvedValue({
      success: true,
      fileId: 'user_file_999',
    });

    const mockFile = new File(['dummy bank statement content'], 'Bank_Statement_Jan2026.pdf', {
      type: 'application/pdf',
    });

    const results = await fileService.uploadFiles([mockFile], 'Financial');

    expect(results).toHaveLength(1);
    expect(results[0].success).toBe(true);
    expect(results[0].file?.name).toBe('Bank_Statement_Jan2026.pdf');
    expect(results[0].file?.category).toBe('Financial');
    expect(results[0].file?.url).toBe('https://storage.googleapis.com/documents/Bank_Statement_Jan2026.pdf');

    expect(firestoreService.saveUserFile).toHaveBeenCalledWith(
      'tenant_user_456',
      expect.objectContaining({
        name: 'Bank_Statement_Jan2026.pdf',
        category: 'Financial',
        type: 'application/pdf',
      })
    );
  });

  it('deleteFile removes document from Firestore when firestoreId exists', async () => {
    fileService.setCurrentUser('tenant_user_456');

    vi.mocked(firestoreService.deleteUserFile).mockResolvedValue({
      success: true,
    });

    const res = await fileService.deleteFile(999, 'user_file_999');

    expect(res.success).toBe(true);
    expect(firestoreService.deleteUserFile).toHaveBeenCalledWith('tenant_user_456', 'user_file_999');
  });
});
