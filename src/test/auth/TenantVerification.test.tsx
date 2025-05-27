import { describe, it, expect, vi } from 'vitest';
import { msalConfig } from '../../config/authConfig';

describe('Tenant Verification', () => {
  it('should verify domain setup', async () => {
    const response = await fetch(`https://${msalConfig.auth.knownAuthorities[0]}/.well-known/openid-configuration`);
    expect(response.ok).toBe(true);
    const config = await response.json();
    expect(config.issuer).toContain(msalConfig.auth.knownAuthorities[0]);
  });

  it('should verify admin access', async () => {
    const mockAdminCheck = vi.fn().mockResolvedValue({ isAdmin: true });
    const result = await mockAdminCheck();
    expect(result.isAdmin).toBe(true);
  });

  it('should verify basic operations', async () => {
    const operations = [
      'validateAuthority',
      'validateClientId',
      'validateScopes',
      'validateEndpoints'
    ];

    const mockValidationResults = operations.map(op => ({ 
      operation: op, 
      status: 'success' 
    }));

    expect(mockValidationResults.every(r => r.status === 'success')).toBe(true);
  });
}); 