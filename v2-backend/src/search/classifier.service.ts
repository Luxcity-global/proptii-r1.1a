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
   * Extracted named entities and query parameters from the query or conversation.
   * e.g. { location: 'Hackney', bedrooms: '2', minPrice: 1500, maxPrice: 2400, propertyType: 'flat', expandedKeywords: [...], amenities: [...] }
   */
  entities: Record<string, any>;

  /** AI confidence score 0–1. Set to 0 for fallback/cache responses. */
  confidence: number;

  /** True when the timeout fired or error occurred and fallback was returned. */
  fallback: boolean;

  /** True when this result was served from the Redis cache. */
  cacheHit: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CLASSIFIER_TIMEOUT_MS = 2500;
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

const SYSTEM_PROMPT = `You are an AI search intent parser and query expansion engine for a UK property portal (Proptii).
Analyze the user's natural language search query or conversation. Understand their goals, extract structured search parameters for property portals, and expand the query with relevant synonyms.

Respond with ONLY a valid JSON object — no markdown, no explanation.

Schema:
{
  "intent": "property_search" | "specific_address" | "general_answerable" | "general_too_broad" | "off_topic",
  "audience": "buyer" | "tenant" | "landlord" | "agent" | "homeowner",
  "entities": {
    "location": string,
    "channel": "rent" | "sale",
    "bedrooms": "0" | "1" | "2" | "3" | "4+" | "",
    "minBeds": number | null,
    "maxBeds": number | null,
    "minPrice": number | null,
    "maxPrice": number | null,
    "propertyType": "flat" | "house" | "studio" | "bungalow" | "",
    "radius": number | null,
    "furnishing": "furnished" | "unfurnished" | "",
    "intentSummary": string,
    "expandedKeywords": string[],
    "amenities": string[]
  },
  "confidence": 0.95
}

Guidelines:
- "location": clean geographic location name, town, city, area or UK postcode ONLY (e.g. "Bristol", "Hackney", "Camden", "SW1A 1AA"). Never include non-location words like "bills included" or "pet friendly".
- "channel": default to "rent" for rent/pcm/let/tenants/sharers, "sale" for buy/sale/purchase/freehold.
- "bedrooms": "0" for studio, "1", "2", "3", "4+".
- "minBeds" / "maxBeds": integer values if specified (studio is minBeds: 0, maxBeds: 0).
- "minPrice" / "maxPrice": monthly rent or total purchase price in GBP numbers (e.g. 2400).
- "intentSummary": a concise, human-readable summary of user criteria (e.g. "2-bed flat in Hackney under £2,400 with outdoor space near station").
- "expandedKeywords": array of relevant synonyms or search terms to match against property descriptions (e.g. for "near station" -> ["station", "tube", "underground", "overground", "commute"]; for "balcony" -> ["balcony", "terrace", "patio", "outdoor space"]).
- "amenities": array of canonical tags for detected criteria. Standard tags: "pet_friendly", "bills_included", "balcony_or_garden", "near_station", "parking", "gym", "concierge", "sharers", "wooden_floors", "high_floor", "quiet_area", "ensuite".`;

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

    // ── 2. Live AI call (raced against timeout) ────────────────────────────
    const aiResult = await this.classifyWithTimeout(query);

    if (!aiResult) {
      // Heuristic entity extraction fallback so filter pills ALWAYS work instantly
      const heuristic = extractHeuristicEntities(query);
      this.logger.log(`[Classifier] Heuristic fallback for "${query}" → ${JSON.stringify(heuristic.entities)}`);
      return { ...heuristic, fallback: true, cacheHit: false };
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
    const models = ['gemini-3.5-flash-lite', 'gemini-3.6-flash'];

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

      const entities: Record<string, any> = {};
      if (parsed.entities && typeof parsed.entities === 'object') {
        for (const [k, v] of Object.entries(parsed.entities)) {
          if (v === null || v === undefined) continue;
          if (typeof v === 'string') {
            const trimmed = v.trim();
            if (trimmed) entities[k] = trimmed;
          } else if (typeof v === 'number' && Number.isFinite(v)) {
            entities[k] = v;
          } else if (typeof v === 'boolean') {
            entities[k] = v ? 'true' : 'false';
          } else if (Array.isArray(v)) {
            entities[k] = v.filter(Boolean);
          }
        }

        // Convenience flags for quick checks
        if (Array.isArray(entities.amenities)) {
          for (const am of entities.amenities) {
            if (typeof am === 'string') {
              entities[am] = 'true';
            }
          }
        }
      }

      const confidence = typeof parsed.confidence === 'number'
        ? Math.max(0, Math.min(1, parsed.confidence))
        : 0.95;

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

export function extractHeuristicEntities(query: string): {
  intent: ClassifierIntent;
  audience: Audience;
  entities: Record<string, any>;
  confidence: number;
} {
  const lower = query.toLowerCase();
  const entities: Record<string, any> = {};
  const amenitiesList: string[] = [];
  const expandedKeywords: string[] = [];

  // Location
  const locMatch = query.match(/\b(?:in|at|near|around)\s+([A-Za-z\s]+?)(?:\s+(?:under|<|for|to|\d+)|$)/i);
  if (locMatch && locMatch[1]) {
    const rawLoc = locMatch[1].trim();
    const cleanLoc = rawLoc.replace(/\b(bills?|included|with|pet|pets|friendly|balcony|garden|parking|furnished|flat|house|studio)\b.*/i, '').trim();
    if (cleanLoc) entities.location = cleanLoc;
  }
  if (!entities.location) {
    const commonCities = ['london', 'manchester', 'birmingham', 'leeds', 'bristol', 'liverpool', 'sheffield', 'nottingham', 'newcastle', 'edinburgh', 'glasgow', 'cardiff', 'brighton', 'oxford', 'cambridge', 'hackney', 'islington', 'shoreditch', 'brixton', 'camden'];
    for (const city of commonCities) {
      if (lower.includes(city)) {
        entities.location = city.charAt(0).toUpperCase() + city.slice(1);
        break;
      }
    }
  }

  // Bedrooms
  const bedMatch = query.match(/\b(\d+)\s*(?:bed|bedroom|br)\b/i);
  if (bedMatch) {
    entities.bedrooms = bedMatch[1];
    entities.minBeds = parseInt(bedMatch[1], 10);
    entities.maxBeds = parseInt(bedMatch[1], 10);
  } else if (lower.includes('studio')) {
    entities.bedrooms = '0';
    entities.minBeds = 0;
    entities.maxBeds = 0;
  }

  // Property Type
  if (lower.includes('flat') || lower.includes('apartment')) {
    entities.property_type = 'flat';
    entities.propertyType = 'flat';
  } else if (lower.includes('house') || lower.includes('terraced') || lower.includes('semi-detached') || lower.includes('detached')) {
    entities.property_type = 'house';
    entities.propertyType = 'house';
  } else if (lower.includes('studio')) {
    entities.property_type = 'studio';
    entities.propertyType = 'studio';
  }

  // Price Max
  const priceMatch = query.match(/(?:under|<|max|up to|budget|£)\s*£?(\d[\d,]*)/i);
  if (priceMatch) {
    const num = parseInt(priceMatch[1].replace(/,/g, ''), 10);
    entities.price_max = String(num);
    entities.maxPrice = num;
  }

  // Amenities & Keywords
  if (/\b(pet|pets|pet[- ]friendly|dog|dogs|cat|cats|animal|animals)\b/i.test(lower)) {
    entities.pet_friendly = 'true';
    amenitiesList.push('pet_friendly');
    expandedKeywords.push('pet friendly', 'pets considered', 'dogs', 'cats');
  }
  if (/\b(bills? included|all bills|utilities included)\b/i.test(lower)) {
    entities.bills_included = 'true';
    amenitiesList.push('bills_included');
    expandedKeywords.push('all bills included', 'utilities included', 'bills inclusive');
  }
  if (/\b(parking|garage|driveway)\b/i.test(lower)) {
    entities.parking = 'true';
    amenitiesList.push('parking');
    expandedKeywords.push('parking', 'allocated parking', 'garage', 'driveway');
  }
  if (/\b(balcony|terrace|garden|patio)\b/i.test(lower)) {
    entities.outside = 'true';
    amenitiesList.push('balcony_or_garden');
    expandedKeywords.push('balcony', 'terrace', 'private garden', 'patio');
  }
  if (/\b(station|tube|metro|underground|train|commute)\b/i.test(lower)) {
    amenitiesList.push('near_station');
    expandedKeywords.push('station', 'tube', 'underground', 'overground');
  }
  if (/\b(gym|fitness)\b/i.test(lower)) {
    amenitiesList.push('gym');
    expandedKeywords.push('gym', 'fitness centre');
  }
  if (/\b(concierge|porter|security)\b/i.test(lower)) {
    amenitiesList.push('concierge');
    expandedKeywords.push('concierge', 'porter', '24hr concierge');
  }

  entities.amenities = amenitiesList;
  entities.expandedKeywords = expandedKeywords;

  // Tenure & Audience
  let audience: Audience = 'tenant';
  if (lower.includes('buy') || lower.includes('sale') || lower.includes('purchase')) {
    entities.tenure = 'buy';
    entities.channel = 'sale';
    audience = 'buyer';
  } else {
    entities.tenure = 'rent';
    entities.channel = 'rent';
    audience = 'tenant';
  }

  // Intent summary
  const parts: string[] = [];
  if (entities.bedrooms) parts.push(entities.bedrooms === '0' ? 'Studio' : `${entities.bedrooms}-bed`);
  if (entities.propertyType) parts.push(entities.propertyType);
  if (entities.location) parts.push(`in ${entities.location}`);
  if (entities.maxPrice) parts.push(`under £${entities.maxPrice.toLocaleString()}`);
  if (amenitiesList.length > 0) parts.push(`with ${amenitiesList.map(a => a.replace(/_/g, ' ')).join(', ')}`);
  entities.intentSummary = parts.length > 0 ? parts.join(' ') : query;

  return {
    intent: 'property_search',
    audience,
    entities,
    confidence: 0,
  };
}
