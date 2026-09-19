export const LEAD_ROLES = [
  'Estate agent / letting agent',
  'Independent landlord',
  'Property manager',
  'Property investor',
  'Other',
] as const;

export const PROPERTY_COUNTS = ['1–5', '6–20', '21–50', '51–100', '100+'] as const;

export const ADMIN_HOURS = [
  'Less than 2 hours',
  '2–5 hours',
  '5–10 hours',
  '10–20 hours',
  '20+ hours',
] as const;

export const BIGGEST_GAINS = [
  'Qualify applicants automatically',
  'Handle enquiries / viewings',
  'Referencing and documents',
  'Contracts in one place',
  'Routine communication',
  'Maintenance tracking',
  'Compliance',
  'Something else',
] as const;

export const TIME_SINKS = [
  'Chasing people (applicants, tenants, owners)',
  'Viewings and enquiries',
  'Referencing and documents',
  'Contracts and paperwork',
  'Compliance',
  'Maintenance and repairs',
  'Keeping systems and chats updated',
  'Other',
] as const;

export type LeadRole = (typeof LEAD_ROLES)[number];
export type PropertyCount = (typeof PROPERTY_COUNTS)[number];
export type AdminHours = (typeof ADMIN_HOURS)[number];
export type BiggestGain = (typeof BIGGEST_GAINS)[number];
export type TimeSink = (typeof TIME_SINKS)[number];

export interface CreateLeadInput {
  role: LeadRole;
  roleOther?: string;
  propertyCount: PropertyCount;
  timeSinks: TimeSink[];
  timeSinksOther?: string;
  adminHours: AdminHours;
  biggestGains: BiggestGain[];
  biggestGain?: string;
  biggestGainOther?: string;
  frustration?: string;
  email?: string;
  fullName?: string;
  phone?: string;
  website?: string;
}

export interface LeadRecord {
  id: string;
  role: string;
  roleOther: string | null;
  propertyCount: string;
  timeSinks: string[];
  timeSinksOther: string | null;
  adminHours: string;
  biggestGains: string[];
  biggestGain: string | null;
  biggestGainOther: string | null;
  frustration: string | null;
  email: string | null;
  fullName: string | null;
  phone: string | null;
  activated: boolean;
  activatedAt: string | null;
  submittedAt: string;
}

export class LeadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LeadValidationError';
  }
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function optionalTrimmed(value: unknown, max: number, field: string): string | undefined {
  if (value == null || value === '') return undefined;
  if (!isString(value)) throw new LeadValidationError(`${field} must be a string`);
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed.length > max) throw new LeadValidationError(`${field} is too long`);
  return trimmed;
}

function assertIn<T extends string>(value: unknown, allowed: readonly T[], field: string): T {
  if (!isString(value) || !(allowed as readonly string[]).includes(value)) {
    throw new LeadValidationError(`Invalid ${field}`);
  }
  return value as T;
}

export function parseCreateLead(body: unknown): CreateLeadInput {
  if (!body || typeof body !== 'object') {
    throw new LeadValidationError('Request body must be a JSON object');
  }
  const dto = body as Record<string, unknown>;

  if (dto.website != null && dto.website !== '') {
    throw new LeadValidationError('Rejected');
  }

  const role = assertIn(dto.role, LEAD_ROLES, 'role');
  const propertyCount = assertIn(dto.propertyCount, PROPERTY_COUNTS, 'propertyCount');
  const adminHours = assertIn(dto.adminHours, ADMIN_HOURS, 'adminHours');

  if (!Array.isArray(dto.timeSinks) || dto.timeSinks.length < 1 || dto.timeSinks.length > 3) {
    throw new LeadValidationError('timeSinks must contain 1–3 items');
  }
  const timeSinks = dto.timeSinks.map((item) => assertIn(item, TIME_SINKS, 'timeSinks'));

  let biggestGains: BiggestGain[] = [];
  if (Array.isArray(dto.biggestGains) && dto.biggestGains.length > 0) {
    if (dto.biggestGains.length > 3) throw new LeadValidationError('biggestGains must contain 1–3 items');
    biggestGains = dto.biggestGains.map((item) => assertIn(item, BIGGEST_GAINS, 'biggestGains'));
  } else if (dto.biggestGain) {
    biggestGains = [assertIn(dto.biggestGain, BIGGEST_GAINS, 'biggestGain')];
  } else {
    throw new LeadValidationError('biggestGains must contain 1–3 items');
  }

  const email = optionalTrimmed(dto.email, 320, 'email');
  if (email && !email.includes('@')) throw new LeadValidationError('Invalid email');

  return {
    role,
    propertyCount,
    adminHours,
    timeSinks,
    biggestGains,
    biggestGain: optionalTrimmed(dto.biggestGain, 400, 'biggestGain') ?? biggestGains[0],
    email,
    fullName: optionalTrimmed(dto.fullName, 120, 'fullName'),
    phone: optionalTrimmed(dto.phone, 40, 'phone'),
    roleOther: optionalTrimmed(dto.roleOther, 400, 'roleOther'),
    timeSinksOther: optionalTrimmed(dto.timeSinksOther, 400, 'timeSinksOther'),
    biggestGainOther: optionalTrimmed(dto.biggestGainOther, 400, 'biggestGainOther'),
    frustration: optionalTrimmed(dto.frustration, 300, 'frustration'),
    website: '',
  };
}

export function parseEmail(value: unknown): string {
  const email = optionalTrimmed(value, 320, 'email');
  if (!email || !email.includes('@')) throw new LeadValidationError('Valid email is required');
  return email.toLowerCase();
}
