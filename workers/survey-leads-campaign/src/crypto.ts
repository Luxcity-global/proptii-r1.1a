const encoder = new TextEncoder();

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function fromBase64Url(value: string): string {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  return atob(padded + pad);
}

export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const left = encoder.encode(a);
  const right = encoder.encode(b);
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) {
    diff |= left[i] ^ right[i];
  }
  return diff === 0;
}

async function hmacSha256Hex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return toHex(signature);
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return toHex(digest);
}

export async function hashIp(ip: string): Promise<string> {
  const digest = await sha256Hex(`${ip}proptii-salt`);
  return digest.slice(0, 16);
}

export async function generateToken(leadId: string, expiresAt: number, secret: string): Promise<string> {
  const payload = `${leadId}:${expiresAt}`;
  const sig = await hmacSha256Hex(secret, payload);
  return btoa(`${payload}:${sig}`).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export async function verifyToken(
  token: string,
  secret: string,
): Promise<{ leadId: string; expiresAt: number }> {
  try {
    const decoded = fromBase64Url(token);
    const parts = decoded.split(':');
    if (parts.length !== 3) throw new Error('malformed');
    const [leadId, expiresAtStr, sig] = parts;
    const expiresAt = Number.parseInt(expiresAtStr, 10);
    if (!leadId || Number.isNaN(expiresAt)) throw new Error('bad expiry');
    const expected = await hmacSha256Hex(secret, `${leadId}:${expiresAt}`);
    if (!timingSafeEqual(sig, expected)) throw new Error('sig mismatch');
    if (Date.now() > expiresAt) throw new Error('expired');
    return { leadId, expiresAt };
  } catch {
    throw new Error('Invalid or expired session token');
  }
}
