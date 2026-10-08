import apiService from './api';

function bytesArePdf(bytes: Uint8Array): boolean {
  return bytes.length >= 4 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
}

/** Download the stored contract PDF. The API returns the file itself, not a base64 copy. */
export async function fetchContractPdfFile(contractId: string, fileName: string): Promise<File | null> {
  const id = String(contractId || '').trim();
  if (!id || id.startsWith('agent-ct-') || id.startsWith('demo-')) return null;
  const name = (fileName || 'contract').toLowerCase().endsWith('.pdf') ? fileName : `${fileName || 'contract'}.pdf`;
  const paths = [`/contracts/${encodeURIComponent(id)}/file`, `/contracts/landlord/${encodeURIComponent(id)}/file`];

  for (const url of paths) {
    try {
      const response = await apiService.request<Blob>({
        method: 'GET',
        url,
        responseType: 'blob',
        timeout: 60000,
        headers: { Accept: 'application/pdf' },
      });
      const blob = response.data;
      if (!(blob instanceof Blob) || blob.size < 5) continue;
      const type = blob.type || '';
      if (type.includes('json') || type.includes('html')) continue;
      const file = new File([blob], name, { type: 'application/pdf' });
      const head = new Uint8Array(await file.slice(0, 5).arrayBuffer());
      if (bytesArePdf(head)) return file;
    } catch {
      continue;
    }
  }
  return null;
}
