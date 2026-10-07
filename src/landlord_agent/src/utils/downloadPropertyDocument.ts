/**
 * Triggers a file download for a property document URL.
 *
 * Firebase Storage URLs (firebasestorage.googleapis.com) and Azure Blob Storage
 * URLs cannot be fetched cross-origin with CORS because the browser sends an
 * Origin header that the storage bucket may not allow. We detect those URLs and
 * open them directly in a new tab instead — the browser will offer a Save dialog
 * for PDFs if the server returns Content-Disposition: attachment, or will render
 * the file inline otherwise. For same-origin or plain blob/data URLs we use the
 * programmatic anchor download path.
 *
 * A second attempt using fetch+blob is made for unknown origins so direct
 * download still works where CORS permits it.
 */
export async function downloadPropertyDocument(url: string, filename: string): Promise<void> {
  const safeName =
    (filename || 'document').replace(/[/\\?%*:|"<>]/g, '_').trim() || 'document';

  if (!url?.trim()) {
    throw new Error('Document URL not available');
  }

  const trimmed = url.trim();

  // data: / blob: — always local, use anchor directly
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    const a = document.createElement('a');
    a.href = trimmed;
    a.download = safeName;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  }

  // Cloud storage URLs — CORS blocks fetch, open in new tab for browser to handle
  const isCloudStorage =
    trimmed.includes('firebasestorage.googleapis.com') ||
    trimmed.includes('storage.googleapis.com') ||
    trimmed.includes('.blob.core.windows.net') ||
    trimmed.includes('storage.cloud.google.com') ||
    trimmed.includes('render.com/storage') ||
    trimmed.includes('amazonaws.com');

  if (isCloudStorage) {
    window.open(trimmed, '_blank', 'noopener,noreferrer');
    return;
  }

  // Same-origin or CORS-enabled URLs — fetch as blob for a real download
  try {
    const res = await fetch(trimmed, { mode: 'cors', credentials: 'omit' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    try {
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = safeName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  } catch {
    // Fallback: open in new tab
    window.open(trimmed, '_blank', 'noopener,noreferrer');
  }
}

/**
 * Opens a document URL in a new browser tab for inline preview.
 */
export function previewPropertyDocument(url: string): void {
  if (!url?.trim()) throw new Error('Document URL not available');
  window.open(url.trim(), '_blank', 'noopener,noreferrer');
}
