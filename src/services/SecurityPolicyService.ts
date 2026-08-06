/**
 * SecurityPolicyService — lightweight password validator.
 *
 * The previous implementation contained ~400 LOC of dead code:
 *   - Mock IP reputation check (always returned { suspicious: false })
 *   - Geolocation prompt on every page load
 *   - In-memory password history that reset on every reload
 *   - MFA policy config with no persistence or enforcement
 *   - console.log as a "notification service"
 *
 * What remains is the one method that production code actually calls:
 * validatePassword(), plus a singleton so existing import paths compile.
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

const POLICY = {
  minLength:          8,
  requireUppercase:   true,
  requireLowercase:   true,
  requireNumbers:     true,
  requireSpecialChars: true,
};

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  if (password.length < POLICY.minLength)
    errors.push(`Password must be at least ${POLICY.minLength} characters long`);
  if (POLICY.requireUppercase && !/[A-Z]/.test(password))
    errors.push('Password must contain at least one uppercase letter');
  if (POLICY.requireLowercase && !/[a-z]/.test(password))
    errors.push('Password must contain at least one lowercase letter');
  if (POLICY.requireNumbers && !/\d/.test(password))
    errors.push('Password must contain at least one number');
  if (POLICY.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password))
    errors.push('Password must contain at least one special character');
  return { isValid: errors.length === 0, errors };
}

// ─── Backward-compatible singleton ──────────────────────────────────────────

export class SecurityPolicyService {
  private static _instance: SecurityPolicyService;

  public static getInstance(): SecurityPolicyService {
    if (!SecurityPolicyService._instance) {
      SecurityPolicyService._instance = new SecurityPolicyService();
    }
    return SecurityPolicyService._instance;
  }

  public validatePassword(password: string): PasswordValidationResult {
    return validatePassword(password);
  }
}

export default SecurityPolicyService;
