import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

const DEFAULT_STAFF_DOMAINS = ['proptii.com', 'proptii.co'];

/**
 * Staff-only gate for the internal admin dashboard.
 * Additive — not used by any existing product routes.
 *
 * Allow:
 *  - emails listed in ADMIN_EMAILS (comma-separated)
 *  - emails on ADMIN_EMAIL_DOMAINS (default: proptii.com, proptii.co)
 *  - local mock tokens when NODE_ENV !== production AND ADMIN_ALLOW_DEV !== 'false'
 */
export function isStaffEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  const lower = email.toLowerCase().trim();
  if (!lower.includes('@')) return false;

  const extra = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (extra.includes(lower)) return true;

  const domain = lower.split('@')[1];
  const domains = (process.env.ADMIN_EMAIL_DOMAINS || DEFAULT_STAFF_DOMAINS.join(','))
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (domain && domains.includes(domain)) return true;

  const isProd = process.env.NODE_ENV === 'production' || !!process.env.RENDER_EXTERNAL_URL;
  if (!isProd && process.env.ADMIN_ALLOW_DEV !== 'false') {
    if (lower.endsWith('@test.proptii.co')) return true;
  }

  return false;
}

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const email = request.user?.email as string | undefined;
    const isProd = process.env.NODE_ENV === 'production' || !!process.env.RENDER_EXTERNAL_URL;

    // In production, require email verification to prevent unverified staff account takeover
    if (isProd && request.user?.email_verified !== true) {
      throw new ForbiddenException('Staff email address must be verified');
    }

    if (!isStaffEmail(email)) {
      throw new ForbiddenException('Staff access only');
    }
    return true;
  }
}
