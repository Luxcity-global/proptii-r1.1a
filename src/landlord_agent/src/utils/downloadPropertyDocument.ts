/**
 * Triggers a file download for a property document URL.
 * Uses a programmatic blob download when fetch succeeds (works across origins with CORS);
 * falls back to opening the URL in a new tab when fetch is blocked.
 */
export async function downloadPropertyDocument(url: string, filename: string): Promise<void> {
  const safeName =
    (filename || 'document').replace(/[/\\?%*:|"<>]/g, '_').trim() || 'document';

  if (!url?.trim()) {
    throw new Error('Document URL not available');
  }

  const trimmed = url.trim();

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

  try {
    const res = await fetch(trimmed, { mode: 'cors', credentials: 'omit' });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
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
    window.open(trimmed, '_blank', 'noopener,noreferrer');
  }
}
