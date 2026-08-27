/**
 * compliance-transform.service.ts
 *
 * Derives compliance flags from uploaded documents and upserts them into
 * the `propertyFacts` Firestore collection.
 *
 * This service is called inline from ReferencingService.saveUserFile()
 * immediately after a document is saved. No Cloud Functions billing required.
 *
 * Flow:
 *   User uploads gas cert
 *     ↓
 *   POST /api/property/upload-document (existing endpoint — interface unchanged)
 *     ↓
 *   referencingService.saveUserFile() — saves to Firestore + Storage (existing)
 *     ↓
 *   complianceTransformService.deriveAndUpsert(doc) ← THIS SERVICE
 *     ↓
 *   Writes Flag into propertyFacts/{listing_id} (new Firestore collection)
 *
 * Supported document types and their derived flags:
 *   gas_safety_certificate  → gas_cert_valid
 *   epc_certificate         → epc_rating (from compliance upload, not EPC register)
 *   electrical_certificate  → electrical_cert_valid
 *   pat_test                → pat_cert_valid
 *   insurance               → insurance_valid
 *   (all others)            → compliance_document_received (generic info flag)
 *
 * IMPORTANT: This service never reads external APIs — only the uploaded file
 * metadata already saved by saveUserFile().
 */

import { Injectable, Logger } from '@nestjs/common';
import { FactsStoreService } from './facts-store.service';
import type { Flag, FlagState, FlagSeverity } from '../schemas/flag.schema';

// ─── Document type → flag mapping ────────────────────────────────────────────

interface FlagSpec {
  flagId:       string;
  baseSeverity: FlagSeverity;
  detail:       string;
}

const DOCUMENT_FLAG_MAP: Record<string, FlagSpec> = {
  gas_safety_certificate:  { flagId: 'gas_cert_valid',          baseSeverity: 'high',   detail: 'Gas safety certificate uploaded by landlord.' },
  epc_certificate:         { flagId: 'epc_rating',              baseSeverity: 'medium', detail: 'EPC certificate uploaded by landlord. Verify rating letter is visible.' },
  electrical_certificate:  { flagId: 'electrical_cert_valid',   baseSeverity: 'high',   detail: 'Electrical installation condition report uploaded.' },
  pat_test:                { flagId: 'pat_cert_valid',           baseSeverity: 'low',    detail: 'PAT test certificate uploaded.' },
  insurance:               { flagId: 'insurance_valid',          baseSeverity: 'medium', detail: 'Buildings or contents insurance document uploaded.' },
};

const GENERIC_FLAG_SPEC: FlagSpec = {
  flagId:       'compliance_document_received',
  baseSeverity: 'info',
  detail:       'Compliance document uploaded.',
};

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class ComplianceTransformService {
  private readonly logger = new Logger(ComplianceTransformService.name);

  constructor(private readonly factsStore: FactsStoreService) {}

  /**
   * Called after every successful saveUserFile() invocation.
   * Derives the appropriate Flag and upserts it into propertyFacts.
   *
   * @param doc  The saved file metadata as returned by saveUserFile()
   *             Must contain at minimum: { userId, section, field, fileName }
   *             Optionally: { listingId, propertyId }
   */
  async deriveAndUpsert(doc: {
    userId:      string;
    section?:    string;
    field?:      string;
    fileName?:   string;
    listingId?:  string;
    propertyId?: string;
    [key: string]: any;
  }): Promise<void> {
    // Resolve the key to write facts against.
    // Prefer listingId/propertyId over userId to ensure correct doc targeting.
    const factKey = doc.listingId ?? doc.propertyId ?? doc.userId;
    if (!factKey) {
      this.logger.warn('[ComplianceTransform] No factKey resolvable — skipping upsert.');
      return;
    }

    const docType = this.resolveDocumentType(doc);
    const spec = DOCUMENT_FLAG_MAP[docType] ?? GENERIC_FLAG_SPEC;

    const flag: Flag = {
      flagId:       spec.flagId,
      source:       'compliance_upload',
      cadence:      'live',
      state:        'clear' as FlagState, // upload itself is the evidence of compliance
      baseSeverity: spec.baseSeverity,
      detail:       `${spec.detail} File: ${doc.fileName ?? 'unknown'}.`,
      ingestedAt:   new Date().toISOString(),
      sourceRef:    doc.id ?? null, // Firestore document ID of the source file record
    };

    try {
      await this.factsStore.upsertFlag(factKey, flag);
      this.logger.log(
        `[ComplianceTransform] Upserted flag "${flag.flagId}" for key=${factKey} (docType=${docType})`
      );
    } catch (err: any) {
      // Non-fatal — the file was already saved successfully. Log but don't rethrow.
      this.logger.warn(
        `[ComplianceTransform] upsertFlag failed for key=${factKey}: ${err?.message}`
      );
    }
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  /**
   * Resolves a document type string from the file metadata.
   * Checks (in order): explicit `documentType` field, `section` field,
   * then falls back to filename-based heuristics.
   */
  private resolveDocumentType(doc: Record<string, any>): string {
    if (doc.documentType && DOCUMENT_FLAG_MAP[doc.documentType]) {
      return doc.documentType;
    }

    const section = (doc.section ?? '').toLowerCase().replace(/[^a-z_]/g, '_');
    if (DOCUMENT_FLAG_MAP[section]) return section;

    // Filename heuristics
    const fileName = (doc.fileName ?? doc.name ?? '').toLowerCase();
    if (fileName.includes('gas'))         return 'gas_safety_certificate';
    if (fileName.includes('epc'))         return 'epc_certificate';
    if (fileName.includes('electrical') || fileName.includes('eicr')) return 'electrical_certificate';
    if (fileName.includes('pat'))         return 'pat_test';
    if (fileName.includes('insurance'))   return 'insurance';

    return '__generic__';
  }
}
