import { Injectable, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';
import { CreateLeadDto } from './dto/create-lead.dto';

export interface LeadSessionPayload {
  leadId: string;
  email?: string;
  role: string;
  propertyCount: string;
  timeSinks: string[];
  adminHours: string;
  biggestGain: string;
  frustration?: string;
}

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);
  private readonly COLLECTION = 'campaign_leads';
  private readonly TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

  private get db() {
    return admin.firestore();
  }

  private get hmacSecret(): string {
    const secret = process.env.LEAD_HMAC_SECRET;
    if (!secret) {
      this.logger.warn('LEAD_HMAC_SECRET is not set — using insecure fallback. Set this env var in production!');
      return 'proptii-campaign-insecure-dev-secret';
    }
    return secret;
  }

  /** Hash an IP address for GDPR-compliant storage */
  private hashIp(ip: string): string {
    return crypto.createHash('sha256').update(ip + 'proptii-salt').digest('hex').slice(0, 16);
  }

  /** Generate a signed HMAC session token for a lead */
  private generateToken(leadId: string, expiresAt: number): string {
    const payload = `${leadId}:${expiresAt}`;
    const sig = crypto.createHmac('sha256', this.hmacSecret).update(payload).digest('hex');
    const raw = Buffer.from(`${payload}:${sig}`).toString('base64url');
    return raw;
  }

  /** Verify a token and return the leadId if valid */
  private verifyToken(token: string): { leadId: string; expiresAt: number } {
    try {
      const decoded = Buffer.from(token, 'base64url').toString('utf8');
      const parts = decoded.split(':');
      if (parts.length !== 3) throw new Error('malformed');
      const [leadId, expiresAtStr, sig] = parts;
      const expiresAt = parseInt(expiresAtStr, 10);
      if (isNaN(expiresAt)) throw new Error('bad expiry');

      const payload = `${leadId}:${expiresAt}`;
      const expected = crypto.createHmac('sha256', this.hmacSecret).update(payload).digest('hex');
      if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
        throw new Error('sig mismatch');
      }
      if (Date.now() > expiresAt) throw new Error('expired');
      return { leadId, expiresAt };
    } catch {
      throw new UnauthorizedException('Invalid or expired session token');
    }
  }

  /** Submit a new campaign questionnaire response and issue a session token */
  async submitLead(dto: CreateLeadDto, ip?: string): Promise<{ token: string; leadId: string }> {
    const docRef = this.db.collection(this.COLLECTION).doc();
    const leadId = docRef.id;
    const expiresAt = Date.now() + this.TOKEN_TTL_MS;
    const token = this.generateToken(leadId, expiresAt);
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const leadEmail = dto.email ? dto.email.toLowerCase().trim() : null;
    const lead = {
      role: dto.role,
      propertyCount: dto.propertyCount,
      timeSinks: dto.timeSinks,
      adminHours: dto.adminHours,
      biggestGain: dto.biggestGain,
      frustration: dto.frustration ?? null,
      email: leadEmail,
      activated: leadEmail ? true : false,
      activatedAt: leadEmail ? admin.firestore.FieldValue.serverTimestamp() : null,
      sessionTokenHash: tokenHash,
      tokenExpiresAt: admin.firestore.Timestamp.fromMillis(expiresAt),
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
      ipHash: ip ? this.hashIp(ip) : null,
    };

    await docRef.set(lead);
    this.logger.log(`Lead created: ${leadId} | role=${dto.role} | email=${leadEmail || 'none'}`);
    return { token, leadId };
  }

  /** Verify session token and return personalised payload for the welcome page */
  async getLeadBySession(token: string): Promise<LeadSessionPayload> {
    const { leadId } = this.verifyToken(token);
    const snap = await this.db.collection(this.COLLECTION).doc(leadId).get();
    if (!snap.exists) throw new UnauthorizedException('Lead not found');

    const data = snap.data()!;
    // Verify token hash matches stored hash
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    if (data.sessionTokenHash !== tokenHash) {
      throw new UnauthorizedException('Token mismatch');
    }

    return {
      leadId,
      email: data.email ?? undefined,
      role: data.role,
      propertyCount: data.propertyCount,
      timeSinks: data.timeSinks,
      adminHours: data.adminHours,
      biggestGain: data.biggestGain,
      frustration: data.frustration ?? undefined,
    };
  }

  /** Attach email to a lead after the "Activate" CTA */
  async activateLead(leadId: string, email: string): Promise<void> {
    const docRef = this.db.collection(this.COLLECTION).doc(leadId);
    const snap = await docRef.get();
    if (!snap.exists) throw new BadRequestException('Lead not found');

    await docRef.update({
      email: email.toLowerCase().trim(),
      activated: true,
      activatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    this.logger.log(`Lead activated: ${leadId} | email=${email}`);
  }

  /** Admin: list all leads (paginated) */
  async listLeads(limit = 50, startAfter?: string): Promise<any[]> {
    let query = this.db
      .collection(this.COLLECTION)
      .orderBy('submittedAt', 'desc')
      .limit(limit);

    if (startAfter) {
      const cursor = await this.db.collection(this.COLLECTION).doc(startAfter).get();
      if (cursor.exists) query = query.startAfter(cursor);
    }

    const snaps = await query.get();
    return snaps.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      submittedAt: doc.data().submittedAt?.toDate?.()?.toISOString() ?? null,
      activatedAt: doc.data().activatedAt?.toDate?.()?.toISOString() ?? null,
      tokenExpiresAt: undefined, // don't expose
      sessionTokenHash: undefined, // don't expose
      ipHash: undefined, // don't expose
    }));
  }

  /** Admin: export all leads as CSV string */
  async exportLeadsCsv(): Promise<string> {
    const snaps = await this.db
      .collection(this.COLLECTION)
      .orderBy('submittedAt', 'desc')
      .get();

    const headers = [
      'id',
      'submittedAt',
      'email',
      'role',
      'propertyCount',
      'timeSinks',
      'adminHours',
      'biggestGain',
      'frustration',
      'activated',
    ];
    const rows = snaps.docs.map(doc => {
      const d = doc.data();
      return [
        doc.id,
        d.submittedAt?.toDate?.()?.toISOString() ?? '',
        d.email ?? '',
        d.role ?? '',
        d.propertyCount ?? '',
        (d.timeSinks ?? []).join(' | '),
        d.adminHours ?? '',
        d.biggestGain ?? '',
        (d.frustration ?? '').replace(/[\r\n,]/g, ' '),
        d.activated ? 'yes' : 'no',
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  /** Admin: delete a specific lead by ID */
  async deleteLead(leadId: string): Promise<void> {
    const docRef = this.db.collection(this.COLLECTION).doc(leadId);
    const snap = await docRef.get();
    if (!snap.exists) throw new BadRequestException('Lead not found');
    await docRef.delete();
    this.logger.log(`Lead deleted: ${leadId}`);
  }

  /** Admin: clear all campaign leads */
  async clearAllLeads(): Promise<{ deletedCount: number }> {
    const snaps = await this.db.collection(this.COLLECTION).get();
    const batch = this.db.batch();
    snaps.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    this.logger.log(`Cleared all campaign leads (${snaps.size} deleted)`);
    return { deletedCount: snaps.size };
  }
}
