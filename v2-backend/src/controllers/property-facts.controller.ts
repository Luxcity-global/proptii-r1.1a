/**
 * property-facts.controller.ts
 *
 * Sprint 2.2 + 3.1 — Property Facts Endpoints
 *
 * Exposes government data intelligence facts to the Proptii frontend.
 * All responses are read from Firestore — zero live external API calls on
 * any request path.
 *
 * ─── Endpoints ───────────────────────────────────────────────────────────────
 *
 * POST /api/properties/facts          (Sprint 2.2) — batched lookup
 * GET  /api/properties/:id/facts      (Sprint 3.1) — single property
 *
 * ─── PRD constraints (mandatory — do not relax) ──────────────────────────────
 *
 * 1. ABSENCE = UNRESOLVED, NEVER 'clear'.
 *    A missing key in propertyFacts must NOT produce a fabricated 'clear' state.
 *    Missing = absent from the response map (batched) or { flags: [] } (single).
 *
 * 2. NO LIVE EXTERNAL CALLS on any path.
 *    FactsStoreService reads from Firestore only. UprnMatchService reads from
 *    the `uprn_index` Firestore collection. Neither makes HTTP calls at request time.
 *
 * 3. ADDRESS-LOOKUP THROTTLE: 20 req/min/IP (stricter than generic 100/min).
 *    Applied to the single-property endpoint (GET /api/properties/:id/facts)
 *    because it can be used to look up private individuals' addresses via UPRN.
 *    The batched endpoint (POST /api/properties/facts) uses the same bucket.
 *
 * ─── Response shapes (PRD §2.2 / 3.1) ───────────────────────────────────────
 *
 * POST /api/properties/facts:
 *   { [listingId | uprn]: PropertyFactsDoc }
 *   Absent key = unresolved. No null entries inserted.
 *
 * GET /api/properties/:id/facts:
 *   {
 *     listingId:   string,
 *     uprn:        string | null,
 *     titleNumber: string | null,
 *     flags:       Flag[],
 *     match:       'exact' | 'partial' | 'none'
 *   }
 */

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpCode,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import {
  IsArray,
  IsOptional,
  IsString,
  ArrayMaxSize,
  ArrayMinSize,
} from 'class-validator';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiProperty } from '@nestjs/swagger';
import { FactsStoreService }    from '../gov-data/services/facts-store.service';
import { UprnMatchService }     from '../gov-data/services/uprn-match.service';
import { AddressThrottleGuard } from '../guards/address-throttle.guard';
import type { PropertyFactsDoc, Flag } from '../gov-data/schemas/flag.schema';

// ─── Request DTOs ─────────────────────────────────────────────────────────────

export class BatchFactsRequestDto {
  @ApiProperty({ required: false, type: [String], description: 'List of listing IDs (up to 50)' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50, { message: 'listingIds may not exceed 50 items per request' })
  @IsString({ each: true })
  listingIds?: string[];

  @ApiProperty({ required: false, type: [String], description: 'List of UPRNs (up to 50)' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50, { message: 'uprns may not exceed 50 items per request' })
  @IsString({ each: true })
  uprns?: string[];
}

// ─── Response shapes ──────────────────────────────────────────────────────────

export interface SingleFactsResponse {
  listingId:   string;
  uprn:        string | null;
  titleNumber: string | null;
  flags:       Flag[];
  match:       'exact' | 'partial' | 'none';
}

// ─── Controller ───────────────────────────────────────────────────────────────

@ApiTags('Property Facts')
@Controller('properties')
export class PropertyFactsController {

  constructor(
    private readonly factsStore:  FactsStoreService,
    private readonly uprnMatch:   UprnMatchService,
  ) {}

  // ── POST /api/properties/facts ─────────────────────────────────────────────

  @Post('facts')
  @HttpCode(200)
  @UseGuards(AddressThrottleGuard)
  @ApiOperation({ summary: 'Batch lookup property facts for up to 50 listingIds or UPRNs' })
  @ApiResponse({ status: 200, description: 'Map of ID to property facts' })
  async getBatchFacts(
    @Body() dto: BatchFactsRequestDto,
  ): Promise<Record<string, PropertyFactsDoc>> {
    const listingIds = dto.listingIds ?? [];
    const uprns      = dto.uprns      ?? [];

    if (!listingIds.length && !uprns.length) {
      // Return empty map — not an error, but there's nothing to look up
      return {};
    }

    const resultMap = await this.factsStore.getBatch(listingIds, uprns);

    // Convert Map → plain object for JSON serialisation
    // Absent keys are NOT inserted — this is the 'absence = unresolved' rule
    const response: Record<string, PropertyFactsDoc> = {};
    for (const [id, doc] of resultMap.entries()) {
      response[id] = doc;
    }

    return response;
  }

  // ── GET /api/properties/:listingId/facts ───────────────────────────────────

  /**
   * Single-property facts lookup.
   *
   * Looks up by listingId first. If a `uprn` query param is provided, also
   * attempts a direct UPRN lookup and merges the result.
   *
   * The `uprn` param is optional — a listingId alone is sufficient.
   * titleNumber is returned when available (populated by HMLR ingest).
   *
   * Response: { listingId, uprn, titleNumber, flags, match }
   *
   * HTTP 404 if no propertyFacts document exists for this listingId.
   * (Does not 404 when the document exists but has no flags — that is valid.)
   *
   * Address-lookup throttle: 20 req/min/IP (separate bucket from generic API).
   */
  @Get(':listingId/facts')
  @UseGuards(AddressThrottleGuard)
  @ApiOperation({ summary: 'Single property facts lookup by listingId with optional UPRN' })
  @ApiParam({ name: 'listingId', description: 'Listing ID' })
  @ApiQuery({ name: 'uprn', required: false, description: 'Optional UPRN for exact address match' })
  @ApiResponse({ status: 200, description: 'Property facts including flags, UPRN, and title number' })
  @ApiResponse({ status: 404, description: 'Property facts not found' })
  async getSingleFacts(
    @Param('listingId') listingId: string,
    @Query('uprn') uprn?: string,
  ): Promise<SingleFactsResponse> {
    // ── 1. Try UPRN lookup first (preferred — more precise) ───────────────────
    let doc: PropertyFactsDoc | null = null;

    if (uprn) {
      doc = await this.factsStore.getByUprn(uprn);
    }

    // ── 2. Fall back to listingId lookup ──────────────────────────────────────
    if (!doc) {
      doc = await this.factsStore.getByListingId(listingId);
    }

    // ── 3. No facts at all → 404 ─────────────────────────────────────────────
    // Note: a doc with zero flags is still a valid response (not a 404).
    // 404 only when the document doesn't exist at all.
    if (!doc) {
      throw new NotFoundException(
        `No property facts found for listingId="${listingId}"${uprn ? ` uprn="${uprn}"` : ''}. ` +
        `Government data may not yet be available for this property.`,
      );
    }

    return {
      listingId:   listingId,
      uprn:        doc.uprn        ?? uprn ?? null,
      titleNumber: doc.title_number ?? null,
      flags:       doc.flags        ?? [],
      match:       doc.matchStatus  ?? 'none',
    };
  }
}
