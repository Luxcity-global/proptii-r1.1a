/** Paths and staff-email checks for the isolated ProptiiAdmin dashboard. */

export const ADMIN_PATH = '/ProptiiAdmin';

export function isAdminDashboardPath(pathname: string): boolean {
  const p = (pathname || '').toLowerCase();
  return p === '/proptiiadmin' || p.startsWith('/proptiiadmin/');
}

export function isStaffEmail(email?: string | null): boolean {
  if (!email) return false;
  const lower = email.toLowerCase().trim();
  const extra = String(import.meta.env.VITE_ADMIN_EMAILS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (extra.includes(lower)) return true;

  const domain = lower.split('@')[1];
  const domains = String(import.meta.env.VITE_ADMIN_EMAIL_DOMAINS || 'proptii.com,proptii.co')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (domain && domains.includes(domain)) return true;

  // Local/dev: any signed-in account can open the dashboard (no @proptii.co required).
  if (import.meta.env.DEV && import.meta.env.VITE_ADMIN_ALLOW_DEV !== 'false') return true;
  return false;
}
