/** Convert Firestore / JSON date values to an ISO string. */
export function toIso(value: unknown): string | null {
  if (value == null || value === '') return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const ms = value < 1e12 ? value * 1000 : value;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const d = new Date(trimmed);
    return Number.isNaN(d.getTime()) ? trimmed : d.toISOString();
  }

  if (typeof value === 'object') {
    const v = value as {
      toDate?: () => Date;
      seconds?: number;
      nanoseconds?: number;
      _seconds?: number;
      _nanoseconds?: number;
    };
    if (typeof v.toDate === 'function') {
      try {
        return toIso(v.toDate());
      } catch {
        return null;
      }
    }
    const seconds = v.seconds ?? v._seconds;
    const nanos = v.nanoseconds ?? v._nanoseconds;
    if (typeof seconds === 'number') {
      return new Date(seconds * 1000 + (typeof nanos === 'number' ? nanos / 1e6 : 0)).toISOString();
    }
  }

  return null;
}

export function firstIso(...values: unknown[]): string | null {
  for (const value of values) {
    const iso = toIso(value);
    if (iso) return iso;
  }
  return null;
}

const DATE_KEYS = new Set([
  'createdAt',
  'updatedAt',
  'roleAssignedAt',
  'lastActiveAt',
  'lastLoginAt',
  'trialEndsAt',
  'currentPeriodEnd',
]);

export function serializeUserDates<T extends Record<string, unknown>>(data: T): T {
  const out: Record<string, unknown> = { ...data };
  for (const key of DATE_KEYS) {
    if (key in out) {
      const iso = toIso(out[key]);
      if (iso) out[key] = iso;
    }
  }
  return out as T;
}
