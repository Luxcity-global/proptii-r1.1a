/**
 * file-content-validator.ts
 *
 * Validates uploaded files by inspecting their magic numbers (byte signatures)
 * and content rather than trusting client-supplied MIME types or filename extensions.
 * Prohibits executables, active scripts, and raw HTML payloads.
 */

export interface ValidationOutcome {
  valid: boolean;
  detectedType: string;
  error?: string;
}

const ALLOWED_MIME_PATTERNS = [
  /^application\/pdf$/,
  /^image\/(jpeg|png|webp|gif|bmp|tiff)$/,
  /^text\/(plain|csv)$/,
  /^application\/(msword|vnd\.openxmlformats-officedocument\..*|json)$/,
];

export function validateFileContent(
  buffer: Buffer | null | undefined,
  originalName?: string,
  declaredMime?: string,
): ValidationOutcome {
  if (!buffer || buffer.length === 0) {
    return { valid: false, detectedType: 'empty', error: 'File is empty' };
  }

  const hexPrefix = buffer.slice(0, 16).toString('hex').toLowerCase();
  const textSample = buffer.slice(0, 1024).toString('utf8').trim().toLowerCase();

  // ── 1. Check for Prohibited Executable / Binary Headers ───────────────────────
  // Windows DOS/PE executable (MZ = 4d5a)
  if (hexPrefix.startsWith('4d5a')) {
    return { valid: false, detectedType: 'application/x-dosexec', error: 'Executable files (.exe, .dll) are prohibited' };
  }

  // Linux ELF binary (\x7fELF = 7f454c46)
  if (hexPrefix.startsWith('7f454c46')) {
    return { valid: false, detectedType: 'application/x-executable', error: 'Linux binary executables are prohibited' };
  }

  // macOS Mach-O binaries (feedface, feedfacf, cafebabe)
  if (
    hexPrefix.startsWith('feedface') ||
    hexPrefix.startsWith('feedfacf') ||
    hexPrefix.startsWith('cefaedfe') ||
    hexPrefix.startsWith('cffaedfe')
  ) {
    return { valid: false, detectedType: 'application/x-mach-binary', error: 'macOS binaries are prohibited' };
  }

  // Shell script shebang (#! = 2321)
  if (hexPrefix.startsWith('2321')) {
    return { valid: false, detectedType: 'application/x-sh', error: 'Shell scripts are prohibited' };
  }

  // ── 2. Check for Prohibited Script / HTML Payloads ───────────────────────────
  if (
    textSample.includes('<html') ||
    textSample.includes('<!doctype html') ||
    textSample.includes('<script') ||
    textSample.includes('javascript:')
  ) {
    return { valid: false, detectedType: 'text/html', error: 'HTML and embedded script files are prohibited' };
  }

  // Prohibit SVG containing script or on* event attributes
  if (textSample.includes('<svg')) {
    if (textSample.includes('<script') || /on[a-z]+=/i.test(textSample)) {
      return { valid: false, detectedType: 'image/svg+xml', error: 'SVG files with active scripts are prohibited' };
    }
  }

  // ── 3. Validate Legitimate Document / Image Signatures ────────────────────────
  // PDF (%PDF = 25504446)
  if (hexPrefix.startsWith('25504446')) {
    return { valid: true, detectedType: 'application/pdf' };
  }

  // PNG (\x89PNG\r\n\x1a\n = 89504e470d0a1a0a)
  if (hexPrefix.startsWith('89504e470d0a1a0a')) {
    return { valid: true, detectedType: 'image/png' };
  }

  // JPEG (ffd8ff)
  if (hexPrefix.startsWith('ffd8ff')) {
    return { valid: true, detectedType: 'image/jpeg' };
  }

  // WEBP (RIFF....WEBP: 52494646....57454250)
  if (hexPrefix.startsWith('52494646') && buffer.length >= 12) {
    const webpHeader = buffer.slice(8, 12).toString('ascii');
    if (webpHeader === 'WEBP') {
      return { valid: true, detectedType: 'image/webp' };
    }
  }

  // GIF (GIF87a / GIF89a = 47494638)
  if (hexPrefix.startsWith('47494638')) {
    return { valid: true, detectedType: 'image/gif' };
  }

  // Zip-based documents (.docx, .xlsx, .zip = PK\x03\x04 = 504b0304)
  if (hexPrefix.startsWith('504b0304')) {
    return { valid: true, detectedType: declaredMime || 'application/vnd.openxmlformats-officedocument' };
  }

  // Plain text / CSV files: ensure all bytes in initial chunk are printable ASCII or UTF-8
  const isPrintableText = buffer.slice(0, Math.min(buffer.length, 512)).every(
    (b) => (b >= 32 && b <= 126) || b === 9 || b === 10 || b === 13 || b > 127
  );

  if (isPrintableText) {
    return { valid: true, detectedType: declaredMime || 'text/plain' };
  }

  // If declared MIME type is explicitly in the allowed list and not an executable
  if (declaredMime && ALLOWED_MIME_PATTERNS.some((p) => p.test(declaredMime))) {
    return { valid: true, detectedType: declaredMime };
  }

  return {
    valid: false,
    detectedType: 'application/octet-stream',
    error: 'Unrecognized or unsupported file format',
  };
}
