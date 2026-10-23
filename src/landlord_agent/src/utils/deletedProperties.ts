const DELETED_PROPERTIES_STORAGE_KEY = 'proptii_deleted_property_records';

export interface DeletedPropertyRecord {
  id: string;
  address?: string;
  deletedAt: number;
}

export function getDeletedPropertyRecords(): DeletedPropertyRecord[] {
  try {
    const raw = localStorage.getItem(DELETED_PROPERTIES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function recordDeletedProperty(id: string, address?: string): void {
  try {
    const existing = getDeletedPropertyRecords();
    const normalizedAddress = address ? address.toLowerCase().trim() : undefined;
    const filtered = existing.filter(
      (r) => r.id !== id && (!normalizedAddress || r.address !== normalizedAddress)
    );
    filtered.push({
      id,
      address: normalizedAddress,
      deletedAt: Date.now(),
    });
    localStorage.setItem(DELETED_PROPERTIES_STORAGE_KEY, JSON.stringify(filtered));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('proptii_deleted_property_updated', {
        detail: { id, address: normalizedAddress },
      }));
    }
  } catch (err) {
    console.warn('Failed to record deleted property in localStorage:', err);
  }
}

export function isPropertyDeleted(id?: string | null, address?: string | null): boolean {
  if (!id && !address) return false;
  const records = getDeletedPropertyRecords();
  const normalizedAddress = address ? address.toLowerCase().trim() : undefined;
  return records.some((r) => {
    if (id && r.id === id) return true;
    if (normalizedAddress && r.address && r.address === normalizedAddress) return true;
    return false;
  });
}

export function clearDeletedPropertyRecord(id: string): void {
  try {
    const existing = getDeletedPropertyRecords();
    const filtered = existing.filter((r) => r.id !== id);
    localStorage.setItem(DELETED_PROPERTIES_STORAGE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.warn('Failed to clear deleted property record from localStorage:', err);
  }
}
