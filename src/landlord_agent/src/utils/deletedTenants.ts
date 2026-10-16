const DELETED_TENANTS_STORAGE_KEY = 'proptii_deleted_tenant_records';

export interface DeletedTenantRecord {
  id: string;
  email?: string;
  deletedAt: number;
}

export function getDeletedTenantRecords(): DeletedTenantRecord[] {
  try {
    const raw = localStorage.getItem(DELETED_TENANTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function recordDeletedTenant(id: string, email?: string): void {
  try {
    const existing = getDeletedTenantRecords();
    const normalizedEmail = email ? email.toLowerCase().trim() : undefined;
    const filtered = existing.filter(
      (r) => r.id !== id && (!normalizedEmail || r.email !== normalizedEmail)
    );
    filtered.push({
      id,
      email: normalizedEmail,
      deletedAt: Date.now(),
    });
    localStorage.setItem(DELETED_TENANTS_STORAGE_KEY, JSON.stringify(filtered));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('proptii_deleted_tenant_updated', {
        detail: { id, email: normalizedEmail },
      }));
    }
  } catch (err) {
    console.warn('Failed to record deleted tenant in localStorage:', err);
  }
}

export function isTenantDeleted(id?: string | null, email?: string | null): boolean {
  if (!id && !email) return false;
  const records = getDeletedTenantRecords();
  const normalizedEmail = email ? email.toLowerCase().trim() : undefined;
  return records.some((r) => {
    if (id && r.id === id) return true;
    if (normalizedEmail && r.email && r.email === normalizedEmail) return true;
    return false;
  });
}

export function clearDeletedTenantRecord(id: string): void {
  try {
    const existing = getDeletedTenantRecords();
    const filtered = existing.filter((r) => r.id !== id);
    localStorage.setItem(DELETED_TENANTS_STORAGE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.warn('Failed to clear deleted tenant record from localStorage:', err);
  }
}
