import { describe, expect, it } from 'vitest';
import { storageObjectFromDownloadUrl } from './firebase-storage';

describe('storageObjectFromDownloadUrl', () => {
  it('reads the object path from a Firebase token link', () => {
    const url = 'https://firebasestorage.googleapis.com/v0/b/proptii-16946.firebasestorage.app/o/contracts%2FSRZv06q1fSgo8VWVX4fZ5i3yDb63%2F1791538080904-49geypng3_Mayama_pdf_signed.pdf?alt=media&token=6b3c79f2-a657-4f73-b72a-af93e054b653';
    expect(storageObjectFromDownloadUrl(url)).toEqual({
      bucket: 'proptii-16946.firebasestorage.app',
      path: 'contracts/SRZv06q1fSgo8VWVX4fZ5i3yDb63/1791538080904-49geypng3_Mayama_pdf_signed.pdf',
    });
  });

  it('reads a Cloud Storage link and ignores other hosts', () => {
    expect(storageObjectFromDownloadUrl(
      'https://storage.googleapis.com/proptii-16946.firebasestorage.app/contracts/landlord/file.pdf?X-Goog-Algorithm=GOOG4-RSA-SHA256',
    )).toEqual({
      bucket: 'proptii-16946.firebasestorage.app',
      path: 'contracts/landlord/file.pdf',
    });
    expect(storageObjectFromDownloadUrl('https://proptii-frontend-vault.onrender.com/contracts/file.pdf')).toBeNull();
    expect(storageObjectFromDownloadUrl('https://firebasestorage.googleapis.com/v0/b/bucket/o/contracts%2F..%2Fsecret.pdf')).toBeNull();
  });
});
