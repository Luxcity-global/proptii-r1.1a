import { createHmac, timingSafeEqual } from 'crypto';

function accessSecret(): string {
  return process.env.CONTRACT_FILE_TOKEN_SECRET
    || process.env.FIREBASE_SERVICE_ACCOUNT_JSON
    || process.env.FIREBASE_PRIVATE_KEY
    || '';
}

/** Short-lived token so the existing contract screen can fetch the PDF without embedding it in JSON. */
export function createContractFileAccess(contractId: string, ttlMs = 15 * 60 * 1000): string {
  const secret = accessSecret();
  if (!secret || !contractId) return '';
  const exp = Date.now() + ttlMs;
  const payload = `${contractId}.${exp}`;
  const sig = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${exp}.${sig}`;
}

export function contractFileAccessValid(contractId: string, access?: string): boolean {
  const secret = accessSecret();
  if (!secret || !contractId || !access) return false;
  const splitAt = access.indexOf('.');
  if (splitAt <= 0) return false;
  const exp = Number(access.slice(0, splitAt));
  const sig = access.slice(splitAt + 1);
  if (!sig || !Number.isFinite(exp) || exp < Date.now()) return false;
  const expected = createHmac('sha256', secret).update(`${contractId}.${exp}`).digest('base64url');
  const given = Buffer.from(sig);
  const wanted = Buffer.from(expected);
  if (given.length !== wanted.length) return false;
  return timingSafeEqual(given, wanted);
}
