import { generateToken, hashIp, sha256Hex, verifyToken } from './crypto';
import type { CreateLeadInput, LeadRecord } from './validation';

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;

interface LeadRow {
  id: string;
  role: string;
  role_other: string | null;
  property_count: string;
  time_sinks: string;
  time_sinks_other: string | null;
  admin_hours: string;
  biggest_gains: string;
  biggest_gain: string | null;
  biggest_gain_other: string | null;
  frustration: string | null;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  activated: number;
  activated_at: string | null;
  session_token_hash: string;
  token_expires_at: number;
  submitted_at: string;
  ip_hash: string | null;
}

function parseJsonArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function toPublicLead(row: LeadRow): LeadRecord {
  return {
    id: row.id,
    role: row.role,
    roleOther: row.role_other,
    propertyCount: row.property_count,
    timeSinks: parseJsonArray(row.time_sinks),
    timeSinksOther: row.time_sinks_other,
    adminHours: row.admin_hours,
    biggestGains: parseJsonArray(row.biggest_gains),
    biggestGain: row.biggest_gain,
    biggestGainOther: row.biggest_gain_other,
    frustration: row.frustration,
    email: row.email,
    fullName: row.full_name,
    phone: row.phone,
    activated: Boolean(row.activated),
    activatedAt: row.activated_at,
    submittedAt: row.submitted_at,
  };
}

export function hmacSecretFromEnv(env: { LEAD_HMAC_SECRET?: string }): string {
  if (env.LEAD_HMAC_SECRET && env.LEAD_HMAC_SECRET.length >= 16) {
    return env.LEAD_HMAC_SECRET;
  }
  console.warn('LEAD_HMAC_SECRET is not set — using insecure fallback. Set this secret before production use.');
  return 'proptii-campaign-insecure-dev-secret';
}

export async function enforceRateLimit(db: D1Database, ip: string | null): Promise<boolean> {
  if (!ip) return true;
  const ipHash = await hashIp(ip);
  const windowStart = Math.floor(Date.now() / RATE_WINDOW_MS) * RATE_WINDOW_MS;
  await db
    .prepare(
      `INSERT INTO rate_limits (ip_hash, window_start, count)
       VALUES (?, ?, 1)
       ON CONFLICT(ip_hash, window_start) DO UPDATE SET count = count + 1`,
    )
    .bind(ipHash, windowStart)
    .run();
  const row = await db
    .prepare('SELECT count FROM rate_limits WHERE ip_hash = ? AND window_start = ?')
    .bind(ipHash, windowStart)
    .first<{ count: number }>();
  return Boolean(row && row.count <= RATE_LIMIT);
}

export async function submitLead(
  db: D1Database,
  dto: CreateLeadInput,
  secret: string,
  ip?: string,
): Promise<{ token: string; leadId: string }> {
  const leadId = crypto.randomUUID();
  const expiresAt = Date.now() + TOKEN_TTL_MS;
  const token = await generateToken(leadId, expiresAt, secret);
  const tokenHash = await sha256Hex(token);
  const email = dto.email ? dto.email.toLowerCase() : null;
  const submittedAt = new Date().toISOString();
  const ipHash = ip ? await hashIp(ip) : null;

  await db
    .prepare(
      `INSERT INTO leads (
        id, role, role_other, property_count, time_sinks, time_sinks_other,
        admin_hours, biggest_gains, biggest_gain, biggest_gain_other, frustration,
        email, full_name, phone, activated, activated_at, session_token_hash,
        token_expires_at, submitted_at, ip_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      leadId,
      dto.role,
      dto.roleOther ?? null,
      dto.propertyCount,
      JSON.stringify(dto.timeSinks),
      dto.timeSinksOther ?? null,
      dto.adminHours,
      JSON.stringify(dto.biggestGains),
      dto.biggestGain || dto.biggestGains[0] || null,
      dto.biggestGainOther ?? null,
      dto.frustration ?? null,
      email,
      dto.fullName ?? null,
      dto.phone ?? null,
      email ? 1 : 0,
      email ? submittedAt : null,
      tokenHash,
      expiresAt,
      submittedAt,
      ipHash,
    )
    .run();

  return { token, leadId };
}

export async function getLeadBySession(db: D1Database, token: string, secret: string) {
  const { leadId } = await verifyToken(token, secret);
  const row = await db.prepare('SELECT * FROM leads WHERE id = ?').bind(leadId).first<LeadRow>();
  if (!row) throw new Error('Lead not found');
  const tokenHash = await sha256Hex(token);
  if (row.session_token_hash !== tokenHash) throw new Error('Token mismatch');
  const publicLead = toPublicLead(row);
  return {
    leadId,
    email: publicLead.email ?? undefined,
    fullName: publicLead.fullName ?? undefined,
    phone: publicLead.phone ?? undefined,
    role: publicLead.role,
    roleOther: publicLead.roleOther ?? undefined,
    propertyCount: publicLead.propertyCount,
    timeSinks: publicLead.timeSinks,
    timeSinksOther: publicLead.timeSinksOther ?? undefined,
    adminHours: publicLead.adminHours,
    biggestGain: publicLead.biggestGain ?? undefined,
    biggestGains: publicLead.biggestGains,
    biggestGainOther: publicLead.biggestGainOther ?? undefined,
    frustration: publicLead.frustration ?? undefined,
  };
}

export async function activateLead(db: D1Database, leadId: string, email: string): Promise<void> {
  const existing = await db.prepare('SELECT id FROM leads WHERE id = ?').bind(leadId).first();
  if (!existing) throw new Error('Lead not found');
  await db
    .prepare(
      `UPDATE leads
       SET email = ?, activated = 1, activated_at = ?
       WHERE id = ?`,
    )
    .bind(email.toLowerCase().trim(), new Date().toISOString(), leadId)
    .run();
}

export async function listLeads(db: D1Database, limit = 50, startAfter?: string): Promise<LeadRecord[]> {
  const safeLimit = Math.min(Math.max(limit, 1), 500);
  let rows: LeadRow[] = [];
  if (startAfter) {
    const cursor = await db.prepare('SELECT submitted_at, id FROM leads WHERE id = ?').bind(startAfter).first<{ submitted_at: string; id: string }>();
    if (cursor) {
      const result = await db
        .prepare(
          `SELECT * FROM leads
           WHERE submitted_at < ? OR (submitted_at = ? AND id < ?)
           ORDER BY submitted_at DESC, id DESC
           LIMIT ?`,
        )
        .bind(cursor.submitted_at, cursor.submitted_at, cursor.id, safeLimit)
        .all<LeadRow>();
      rows = result.results ?? [];
    }
  } else {
    const result = await db
      .prepare('SELECT * FROM leads ORDER BY submitted_at DESC, id DESC LIMIT ?')
      .bind(safeLimit)
      .all<LeadRow>();
    rows = result.results ?? [];
  }
  return rows.map(toPublicLead);
}

function csvEscape(value: unknown): string {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

export async function exportLeadsCsv(db: D1Database): Promise<string> {
  const result = await db.prepare('SELECT * FROM leads ORDER BY submitted_at DESC, id DESC').all<LeadRow>();
  const headers = [
    'id',
    'submittedAt',
    'fullName',
    'email',
    'phone',
    'role',
    'roleOther',
    'propertyCount',
    'timeSinks',
    'timeSinksOther',
    'adminHours',
    'biggestGains',
    'biggestGainOther',
    'frustration',
    'activated',
    'activatedAt',
  ];
  const rows = (result.results ?? []).map((row) => {
    const lead = toPublicLead(row);
    return [
      lead.id,
      lead.submittedAt,
      lead.fullName ?? '',
      lead.email ?? '',
      lead.phone ?? '',
      lead.role,
      lead.roleOther ?? '',
      lead.propertyCount,
      lead.timeSinks.join(' | '),
      lead.timeSinksOther ?? '',
      lead.adminHours,
      lead.biggestGains.join(' | '),
      lead.biggestGainOther ?? '',
      (lead.frustration ?? '').replace(/[\r\n,]/g, ' '),
      lead.activated ? 'yes' : 'no',
      lead.activatedAt ?? '',
    ].map(csvEscape).join(',');
  });
  return [headers.join(','), ...rows].join('\n');
}
