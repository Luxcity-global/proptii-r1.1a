import * as admin from 'firebase-admin';
import { Logger } from '@nestjs/common';

const logger = new Logger('FirebaseStorage');

// Signed URLs expire after 7 days by default. Adjust per use-case.
const SIGNED_URL_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Returns the Firebase Storage bucket, initialised from the same Admin SDK
 * instance that main.ts already set up. Bucket name is read from env or
 * falls back to the known Proptii bucket.
 */
function getBucket() {
  const bucketName =
    process.env.FIREBASE_STORAGE_BUCKET ||
    `${process.env.FIREBASE_PROJECT_ID || 'proptii-16946'}.firebasestorage.app`;
  return admin.storage().bucket(bucketName);
}

export interface StorageUploadResult {
  storagePath: string;  // gs:// path — stored in Firestore as the canonical ref
  downloadUrl: string;  // signed HTTPS URL (valid for 7 days)
  contentType: string;
  size: number;
}

/**
 * Generate a signed read URL for a file already in Storage.
 * Uses the service account credential — requires client_email + private_key.
 * Returns a URL valid for `expiryMs` milliseconds (default 7 days).
 */
export async function getSignedDownloadUrl(
  storagePath: string,
  expiryMs = SIGNED_URL_EXPIRY_MS,
): Promise<string> {
  const bucket = getBucket();
  const plainPath = storagePath.startsWith('gs://')
    ? storagePath.replace(`gs://${bucket.name}/`, '')
    : storagePath;

  const [url] = await bucket.file(plainPath).getSignedUrl({
    action:  'read',
    expires: Date.now() + expiryMs,
  });
  return url;
}

/**
 * Upload a base64 data-URI to Firebase Storage and return a signed download URL.
 *
 * @param base64DataUri  Full data URI, e.g. "data:application/pdf;base64,JVBERi..."
 * @param storagePath    Destination path inside the bucket, e.g. "referencing/uid/identity/passport.pdf"
 */
export async function uploadBase64ToStorage(
  base64DataUri: string,
  storagePath: string,
): Promise<StorageUploadResult> {
  const bucket = getBucket();

  // Parse the data URI
  const match = base64DataUri.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid base64 data URI — expected "data:<mime>;base64,<data>"');
  }
  const contentType = match[1];
  const buffer = Buffer.from(match[2], 'base64');

  const file = bucket.file(storagePath);
  await file.save(buffer, {
    metadata: { contentType },
    resumable: false,
  });

  // Generate a signed URL so the client can read the file without public bucket access
  const [downloadUrl] = await file.getSignedUrl({
    action:  'read',
    expires: Date.now() + SIGNED_URL_EXPIRY_MS,
  });

  logger.log(`Uploaded ${storagePath} (${buffer.length} bytes, ${contentType})`);

  return {
    storagePath: `gs://${bucket.name}/${storagePath}`,
    downloadUrl,
    contentType,
    size: buffer.length,
  };
}

/**
 * Upload a raw Buffer to Firebase Storage and return a signed download URL.
 */
export async function uploadBufferToStorage(
  buffer: Buffer,
  storagePath: string,
  contentType: string,
): Promise<StorageUploadResult> {
  const bucket = getBucket();
  const file = bucket.file(storagePath);

  await file.save(buffer, {
    metadata: { contentType },
    resumable: false,
  });

  const [downloadUrl] = await file.getSignedUrl({
    action:  'read',
    expires: Date.now() + SIGNED_URL_EXPIRY_MS,
  });

  logger.log(`Uploaded ${storagePath} (${buffer.length} bytes, ${contentType})`);

  return {
    storagePath: `gs://${bucket.name}/${storagePath}`,
    downloadUrl,
    contentType,
    size: buffer.length,
  };
}

/**
 * Delete a file from Firebase Storage by its storage path (gs:// or plain path).
 * Silently succeeds if the file doesn't exist.
 */
export async function deleteFromStorage(storagePath: string): Promise<void> {
  try {
    const bucket = getBucket();
    const plainPath = storagePath.startsWith('gs://')
      ? storagePath.replace(`gs://${bucket.name}/`, '')
      : storagePath;

    await bucket.file(plainPath).delete({ ignoreNotFound: true });
    logger.log(`Deleted ${plainPath} from storage`);
  } catch (err: any) {
    logger.warn(`deleteFromStorage failed for ${storagePath}: ${err?.message || err}`);
  }
}

/**
 * Returns true if a value looks like a base64 data URI that should be
 * uploaded to Storage rather than stored inline in Firestore.
 */
export function isBase64DataUri(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith('data:') && value.includes(';base64,');
}
