/**
 * classifier.controller.ts
 *
 * Sprint 1.3 — POST /api/search/classify
 *
 * Public endpoint (no auth guard). Routes search queries through the
 * ClassifierService to produce a structured intent response.
 *
 * ─── PRD constraints enforced here ──────────────────────────────────────────
 *
 * THROTTLE: 15 requests/min/IP — enforced by ClassifierThrottleGuard.
 *   This is a dedicated bucket, separate from the generic 100/min bucket,
 *   because this endpoint could be used to enumerate private addresses if
 *   unrestricted. The 15/min limit matches the PRD spec exactly.
 *
 * VALIDATION: @Body() is validated via class-validator + ValidationPipe
 *   (configured globally in main.ts). The request DTO is minimal — only
 *   `query` is required. Malformed requests return 400 before hitting the AI.
 *
 * RESPONSE: The full ClassifierResult is returned as-is from ClassifierService.
 *   The controller does not transform or reformat the response.
 *   HTTP status is always 200 — even fallback responses are semantically valid.
 *
 * ─── What this endpoint must NOT do ─────────────────────────────────────────
 * - Must NOT call POST /api/v1/search (proptii-search service) directly
 * - Must NOT require authentication
 * - Must NOT slow down if the AI call breaches 600ms (ClassifierService handles this)
 */

import {
  Controller,
  Post,
  Body,
  HttpCode,
  UseGuards,
  Logger,
  ValidationPipe,
} from '@nestjs/common';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ClassifierService, ClassifierResult } from './classifier.service';
import { ClassifierThrottleGuard } from '../guards/classifier-throttle.guard';

// ─── Request DTO ──────────────────────────────────────────────────────────────

export class ClassifyRequestDto {
  @IsString()
  @IsNotEmpty({ message: 'query must not be empty' })
  @MaxLength(500, { message: 'query must not exceed 500 characters' })
  query!: string;
}

// ─── Controller ───────────────────────────────────────────────────────────────

@Controller('api/search')
export class ClassifierController {
  private readonly logger = new Logger(ClassifierController.name);

  constructor(private readonly classifierService: ClassifierService) {}

  /**
   * POST /api/search/classify
   *
   * Classifies a free-text search query into a structured intent object.
   *
   * Request body: { "query": "2 bed flat in Shoreditch under £1500" }
   *
   * Response:
   * {
   *   "intent":     "property_search",
   *   "audience":   "tenant",
   *   "entities":   { "location": "Shoreditch", "bedrooms": "2", "budget": "£1500" },
   *   "confidence": 0.94,
   *   "fallback":   false,
   *   "cacheHit":   false
   * }
   *
   * Always HTTP 200 — fallback responses are valid (not errors).
   * HTTP 400 if body is missing or query exceeds 500 chars.
   * HTTP 429 if throttle bucket (15/min/IP) is exceeded.
   */
  @Post('classify')
  @HttpCode(200)
  @UseGuards(ClassifierThrottleGuard)
  async classify(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: false }))
    dto: ClassifyRequestDto,
  ): Promise<ClassifierResult> {
    this.logger.debug(`[Classifier] classify request: "${dto.query.slice(0, 80)}"`);
    return this.classifierService.classify(dto.query);
  }
}
