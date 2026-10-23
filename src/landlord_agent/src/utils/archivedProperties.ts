const ARCHIVED_PROPERTIES_STORAGE_KEY = 'proptii_archived_property_records';

export interface ArchivedPropertyRecord {
  id: string;
  address?: string;
  archivedAt: number;
}

export function getArchivedPropertyRecords(): ArchivedPropertyRecord[] {
  try {
    const raw = localStorage.getItem(ARCHIVED_PROPERTIES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function recordArchivedProperty(id: string, address?: string): void {
  try {
    const existing = getArchivedPropertyRecords();
    const normalizedAddress = address ? address.toLowerCase().trim() : undefined;
    const filtered = existing.filter(
      (r) => r.id !== id && (!normalizedAddress || r.address !== normalizedAddress)
    );
    filtered.push({
      id,
      address: normalizedAddress,
      archivedAt: Date.now(),
    });
    localStorage.setItem(ARCHIVED_PROPERTIES_STORAGE_KEY, JSON.stringify(filtered));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('proptii_archived_property_updated', {
        detail: { id, address: normalizedAddress, archived: true },
      }));
    }
  } catch (err) {
    console.warn('Failed to record archived property in localStorage:', err);
  }
}

export function recordUnarchivedProperty(id: string, address?: string): void {
  try {
    const existing = getArchivedPropertyRecords();
    const normalizedAddress = address ? address.toLowerCase().trim() : undefined;
    const filtered = existing.filter(
      (r) => r.id !== id && (!normalizedAddress || r.address !== normalizedAddress)
    );
    localStorage.setItem(ARCHIVED_PROPERTIES_STORAGE_KEY, JSON.stringify(filtered));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('proptii_archived_property_updated', {
        detail: { id, address: normalizedAddress, archived: false },
      }));
    }
  } catch (err) {
    console.warn('Failed to clear archived property from localStorage:', err);
  }
}

export function isPropertyArchivedLocal(id?: string | null, address?: string | null): boolean {
  if (!id && !address) return false;
  const records = getArchivedPropertyRecords();
  const normalizedAddress = address ? address.toLowerCase().trim() : undefined;
  return records.some((r) => {
    if (id && r.id === id) return true;
    if (normalizedAddress && r.address && r.address === normalizedAddress) return true;
    return false;
  });
}
