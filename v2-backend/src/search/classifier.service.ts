/**
 * classifier.service.ts
 *
 * Sprint 1.3 — Search Intent Classifier.
 *
 * The only live AI call permitted in R1.4. Classifies a free-text search query
 * into a structured intent object used by the frontend to route the search
 * experience and apply the correct audience lens.
 *
 * ─── PRD constraints (mandatory — do not relax) ──────────────────────────────
 *
 * 1. HARD TIMEOUT 600ms — on breach, return fallback immediately.
 *    Fallback: { intent: 'property_search', fallback: true, cacheHit: false }
 *    The classifier must NEVER slow down a search result.
 *
 * 2. REDIS CACHE 24h TTL — normalised query → cached ClassifierResult.
 *    Cache key: 'classify:' + normalise(query)
 *    Cache-hit responses set cacheHit: true and skip the AI call entirely.
 *    Cost tracking must use cache-miss volume, NOT total request volume.
 *
 * 3. NO PROPTII-SEARCH CALL — this service must never trigger a property
 *    search. It is a routing/intent layer only.
 *
 * ─── AI providers ────────────────────────────────────────────────────────────
 * Attempts Gemini first (GEMINI_API_KEY), falls back to OpenRouter
 * (OPENROUTER_API_KEY). Both keys are optional — if neither is set, returns
 * the safe fallback (property_search intent) every time.
 *
 * ─── Intent taxonomy (PRD §1.3) ─────────────────────────────────────────────
 * property_search      — query is looking for properties to buy/rent
 * specific_address     — query names a specific address or postcode
 * general_answerable   — property question answerable without a search
 * general_too_broad    — too vague to route meaningfully
 * off_topic            — nothing to do with property
 */

import { Injectable, Logger } from '@nestjs/common';
import { getRedisClient } from '../utils/redis-client';
import type { Audience } from '../gov-data/schemas/flag.schema';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ClassifierIntent =
  | 'property_search'
  | 'specific_address'
  | 'general_answerable'
  | 'general_too_broad'
  | 'off_topic';

export interface ClassifierResult {
  /** Classified intent — determines how the frontend routes the query. */
  intent: ClassifierIntent;

  /**
   * Inferred audience from the query context.
   * Defaults to 'buyer' when the audience cannot be determined.
   */
  audience: Audience;

  /**
   * Extracted named entities from the query.
   * e.g. { location: 'Shoreditch', bedrooms: '2', budget: '£800pcm' }
   */
  entities: Record<string, string>;

  /** AI confidence score 0–1. Set to 0 for fallback/cache responses. */
  confidence: number;

  /** True when the 600ms timeout fired and a safe default was returned. */
  fallback: boolean;

  /** True when this result was served from the Redis cache. */
  cacheHit: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CLASSIFIER_TIMEOUT_MS = 600;
const CACHE_TTL_SECONDS     = 86_400; // 24 hours
const CACHE_KEY_PREFIX      = 'classify:';

const FALLBACK_RESULT: Omit<ClassifierResult, 'cacheHit'> = {
  intent:     'property_search',
  audience:   'buyer',
  entities:   {},
  confidence: 0,
  fallback:   true,
};

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a search intent classifier for a UK property platform (Proptii).
Classify the user's search query and respond with ONLY a valid JSON object — no markdown, no explanation.

Intent values:
- "property_search"    — looking for properties to buy or rent
- "specific_address"   — asking about a specific address, street, or postcode
- "general_answerable" — a property-related question answerable without a live search
- "general_too_broad"  — too vague to route meaningfully (e.g. "help", "what is property")
- "off_topic"          — nothing to do with property

Audience values: "buyer" | "tenant" | "landlord" | "agent" | "homeowner"
Use "tenant" (not "renter"). Default to "buyer" if unclear.

Response schema (strict):
{
  "intent":     "property_search",
  "audience":   "buyer",
  "entities":   { "location": "", "bedrooms": "", "budget": "", "propertyType": "" },
  "confidence": 0.95
}
Only populate entity fields that are clearly present in the query. Use empty string for absent fields.`;

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class ClassifierService {
  private readonly logger = new Logger(ClassifierService.name);

  /** Timeout for the AI call in ms. Overridable in tests. */
  protected timeoutMs = CLASSIFIER_TIMEOUT_MS;

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Classifies a free-text search query.
   *
   * Pipeline:
   *   1. Normalise query (lowercase, trim, collapse whitespace)
   *   2. Check Redis cache → return immediately if hit
   *   3. Race AI call against 600ms timeout
   *   4. On timeout or error → return FALLBACK_RESULT
   *   5. On success → write to Redis cache + return result
   */
  async classify(rawQuery: string): Promise<ClassifierResult> {
    const query = normaliseQuery(rawQuery);

    if (!query) {
      return { ...FALLBACK_RESULT, cacheHit: false };
    }

    // ── 1. Cache lookup ──────────────────────────────────────────────────────
    const cached = await this.getCached(query);
    if (cached) {
      this.logger.debug(`[Classifier] Cache hit for "${query}"`);
      return { ...cached, cacheHit: true };
    }

    // ── 2. Race AI call against timeout ─────────────────────────────────────
    const aiResult = await this.classifyWithTimeout(query);

    if (!aiResult) {
      // Timeout or error — return safe fallback, do NOT cache it
      this.logger.warn(`[Classifier] Timeout/error for "${query}" — returning fallback`);
      return { ...FALLBACK_RESULT, cacheHit: false };
    }

    // ── 3. Cache successful result ───────────────────────────────────────────
    await this.setCached(query, aiResult);
    this.logger.debug(`[Classifier] Classified "${query}" → ${aiResult.intent} (${aiResult.confidence})`);

    return { ...aiResult, cacheHit: false };
  }

  // ── AI call with timeout ───────────────────────────────────────────────────

  /**
   * Races the AI classification against a 600ms timer.
   * Returns null on timeout or any error.
   */
  private async classifyWithTimeout(
    query: string,
  ): Promise<Omit<ClassifierResult, 'cacheHit'> | null> {
    const timeout = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), this.timeoutMs),
    );

    const aiCall = this.callAI(query).catch((err: any) => {
      this.logger.warn(`[Classifier] AI call failed: ${err?.message}`);
      return null;
    });

    return Promise.race([aiCall, timeout]);
  }

  /**
   * Calls the AI provider (Gemini first, OpenRouter fallback).
   * Returns a parsed ClassifierResult or null on failure.
   */
  private async callAI(
    query: string,
  ): Promise<Omit<ClassifierResult, 'cacheHit'> | null> {
    const geminiKey    = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const openrouterKey = process.env.OPENROUTER_API_KEY;

    // ── Gemini ───────────────────────────────────────────────────────────────
    if (geminiKey) {
      const result = await this.callGemini(query, geminiKey);
      if (result) return result;
    }

    // ── OpenRouter fallback ──────────────────────────────────────────────────
    if (openrouterKey) {
      const result = await this.callOpenRouter(query, openrouterKey);
      if (result) return result;
    }

    if (!geminiKey && !openrouterKey) {
      this.logger.warn(
        '[Classifier] No AI API key configured (GEMINI_API_KEY or OPENROUTER_API_KEY). ' +
        'Set one in .env to enable intent classification.',
      );
    }

    return null;
  }

  // ── Gemini ─────────────────────────────────────────────────────────────────

  private async callGemini(
    query: string,
    apiKey: string,
  ): Promise<Omit<ClassifierResult, 'cacheHit'> | null> {
    const models = ['gemini-2.5-flash', 'gemini-1.5-flash'];

    for (const model of models) {
      try {
        const resp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                { parts: [{ text: `${SYSTEM_PROMPT}\n\nQuery: "${query}"` }] },
              ],
              generationConfig: { responseMimeType: 'application/json' },
            }),
          },
        );

        if (!resp.ok) continue;

        const json = await resp.json() as any;
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) continue;

        return this.parseAIResponse(text);
      } catch {
        continue;
      }
    }

    return null;
  }

  // ── OpenRouter ─────────────────────────────────────────────────────────────

  private async callOpenRouter(
    query: string,
    apiKey: string,
  ): Promise<Omit<ClassifierResult, 'cacheHit'> | null> {
    try {
      const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'google/gemini-2.0-flash-001',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user',   content: `Query: "${query}"` },
          ],
          response_format: { type: 'json_object' },
        }),
      });

      if (!resp.ok) return null;

      const json = await resp.json() as any;
      const text = json.choices?.[0]?.message?.content;
      if (!text) return null;

      return this.parseAIResponse(text);
    } catch {
      return null;
    }
  }

  // ── Response parsing ───────────────────────────────────────────────────────

  /**
   * Parses and validates the AI JSON response.
   * Returns null if parsing fails or required fields are missing/invalid.
   */
  private parseAIResponse(text: string): Omit<ClassifierResult, 'cacheHit'> | null {
    try {
      // Strip markdown code fences if the model added them despite instructions
      const cleaned = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
      const parsed = JSON.parse(cleaned);

      const intent = parsed.intent;
      const validIntents: ClassifierIntent[] = [
        'property_search', 'specific_address', 'general_answerable',
        'general_too_broad', 'off_topic',
      ];
      if (!validIntents.includes(intent)) {
        this.logger.warn(`[Classifier] Invalid intent in AI response: "${intent}"`);
        return null;
      }

      const validAudiences: Audience[] = ['buyer', 'tenant', 'landlord', 'agent', 'homeowner'];
      const audience: Audience = validAudiences.includes(parsed.audience)
        ? parsed.audience
        : 'buyer'; // safe default

      const entities: Record<string, string> = {};
      if (parsed.entities && typeof parsed.entities === 'object') {
        for (const [k, v] of Object.entries(parsed.entities)) {
          if (typeof v === 'string' && v.trim()) entities[k] = v.trim();
        }
      }

      const confidence = typeof parsed.confidence === 'number'
        ? Math.max(0, Math.min(1, parsed.confidence))
        : 0.5;

      return { intent, audience, entities, confidence, fallback: false };
    } catch (err: any) {
      this.logger.warn(`[Classifier] Failed to parse AI response: ${err?.message}`);
      return null;
    }
  }

  // ── Redis cache helpers ────────────────────────────────────────────────────

  private async getCached(
    normalisedQuery: string,
  ): Promise<Omit<ClassifierResult, 'cacheHit'> | null> {
    try {
      const redis = getRedisClient();
      const raw   = await redis.get(`${CACHE_KEY_PREFIX}${normalisedQuery}`);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null; // cache failure is non-fatal
    }
  }

  private async setCached(
    normalisedQuery: string,
    result: Omit<ClassifierResult, 'cacheHit'>,
  ): Promise<void> {
    try {
      const redis = getRedisClient();
      await redis.set(
        `${CACHE_KEY_PREFIX}${normalisedQuery}`,
        JSON.stringify(result),
        'EX',
        CACHE_TTL_SECONDS,
      );
    } catch {
      // non-fatal — request already succeeded
    }
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Normalises a query for use as a Redis cache key.
 * Lowercase, trimmed, whitespace collapsed.
 * e.g. "  2 Bed Flat  London  " → "2 bed flat london"
 */
export function normaliseQuery(query: string): string {
  return (query ?? '').toLowerCase().trim().replace(/\s+/g, ' ');
}
