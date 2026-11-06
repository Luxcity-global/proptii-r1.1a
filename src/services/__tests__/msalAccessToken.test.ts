import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isJwtExpired, clearStoredAuthToken, getAccessTokenForApiRequest } from '../msalAccessToken';

vi.mock('../authReady', () => ({
  waitForAuthReady: vi.fn().mockResolvedValue(true),
}));

function createMockJwt(expTimestampSeconds: number): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ uid: 'user-1', exp: expTimestampSeconds }));
  const signature = 'test-sig';
  return `${header}.${payload}.${signature}`;
}

describe('msalAccessToken JWT validation and expiration safeguards', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    clearStoredAuthToken();
    vi.clearAllMocks();
  });

  describe('isJwtExpired', () => {
    it('returns true for null, undefined, empty, or malformed strings', () => {
      expect(isJwtExpired(null)).toBe(true);
      expect(isJwtExpired(undefined)).toBe(true);
      expect(isJwtExpired('')).toBe(true);
      expect(isJwtExpired('not-a-jwt')).toBe(true);
      expect(isJwtExpired('a.b')).toBe(true);
    });

    it('returns true for expired JWT tokens', () => {
      const pastExp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const token = createMockJwt(pastExp);
      expect(isJwtExpired(token)).toBe(true);
    });

    it('returns true for tokens expiring within bufferSeconds (default 60s)', () => {
      const imminentExp = Math.floor(Date.now() / 1000) + 30; // 30s from now (within 60s buffer)
      const token = createMockJwt(imminentExp);
      expect(isJwtExpired(token)).toBe(true);
    });

    it('returns false for fresh tokens with future expiration', () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour in future
      const token = createMockJwt(futureExp);
      expect(isJwtExpired(token)).toBe(false);
    });
  });

  describe('getAccessTokenForApiRequest storage fallback', () => {
    it('purges expired token from localStorage and returns null', async () => {
      const expiredToken = createMockJwt(Math.floor(Date.now() / 1000) - 1000);
      localStorage.setItem('auth_token', expiredToken);

      const token = await getAccessTokenForApiRequest();
      expect(token).toBeNull();
      expect(localStorage.getItem('auth_token')).toBeNull();
    });

    it('returns valid token from localStorage when not expired', async () => {
      const validToken = createMockJwt(Math.floor(Date.now() / 1000) + 3600);
      localStorage.setItem('auth_token', validToken);

      const token = await getAccessTokenForApiRequest();
      expect(token).toBe(validToken);
    });
  });
});
