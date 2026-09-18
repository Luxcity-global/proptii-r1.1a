import { Request, Response, NextFunction, RequestHandler } from 'express';
import { SearchAggregator } from '../../core/services/SearchAggregator';
import { ScraperManager } from '../../integrations/ScraperManager';
import { AgentEnrichmentService } from '../../core/services/AgentEnrichmentService';
import { postcodeLocationService, ResolvedLocation } from '../../core/services/PostcodeLocationService';
import Property from '../../models/Property';
import { normalizePhone } from '../../utils/phone';


const aggregator    = new SearchAggregator();
const scraperManager = new ScraperManager();
const enrichmentService = new AgentEnrichmentService();

export const searchProperties: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  const { query, filters } = req.body;
  let isClosed = false;

  const write = (payload: object) => {
    try {
      if (!res.writableEnded && !isClosed) {
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
      }
    } catch (e) {
      console.error(`[SSE] Write failed for: "${query}"`, e);
    }
  };

  try {
    if (!query) {
      return res.status(400).json({ status: 'fail', message: 'Query is required' });
    }

    // ── SSE headers ─────────────────────────────────────────────────────────
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    console.log(`[SSE] Search started for: "${query}"`);

    // ── Heartbeat and Initial Ping ──────────────────────────────────────────
    res.write(': keep-alive\n\n');

    const heartbeat = setInterval(() => {
      try {
        if (!res.writableEnded && !isClosed) {
          res.write(': keep-alive\n\n');
        } else {
          clearInterval(heartbeat);
        }
      } catch (e) {
        clearInterval(heartbeat);
      }
    }, 8000);

    res.on('close', () => { 
      isClosed = true; 
      clearInterval(heartbeat);
    });

    // ── 1. Resolve Location & Check Cache Concurrently ──────────────────────
    const [locSettled, cacheSettled] = await Promise.allSettled([
      postcodeLocationService.resolve(query, filters),
      aggregator.getCachedResults(query, filters),
    ]);

    let resolvedLocation: ResolvedLocation | undefined;
    if (locSettled.status === 'fulfilled') {
      resolvedLocation = locSettled.value;
      console.log(`[SSE] Location resolved: "${resolvedLocation.displayName}" (RM: ${resolvedLocation.rightmoveLocationId}, OTM: ${resolvedLocation.otmLocationSlug})`);
      write({
        type: 'location_resolved',
        data: {
          displayName: resolvedLocation.displayName,
          outcode: resolvedLocation.outcode,
          adminDistrict: resolvedLocation.adminDistrict,
          coordinates: resolvedLocation.coordinates,
        }
      });
    } else {
      console.warn(`[SSE] Location resolution warning for "${query}":`, locSettled.reason);
    }

    // ── 2. Announce provider names ─────────
    write({ type: 'providers', providers: scraperManager.getProviderNames() });

    // ── 3. Emit Cache/DB lookup (Strict: only properties with verified email) ──
    if (cacheSettled.status === 'fulfilled' && cacheSettled.value.length > 0) {
      const validCached = cacheSettled.value.filter(
        p => p.agent?.email && typeof p.agent.email === 'string' && p.agent.email.includes('@')
      );
      if (validCached.length > 0) {
        console.log(`[SSE] Found ${validCached.length}/${cacheSettled.value.length} strict cached results for: "${query}"`);
        const normalizedCached = validCached.map(p => {
          p.agent = p.agent || {};
          p.agent.phone = normalizePhone(p.agent.phone, p.id || p.url);
          return p;
        });
        write({ type: 'initial', data: normalizedCached });
      }
    }

    // ── 4. Live Scraping + Strict Email Enrichment + Stream Verified Only ────
    const allScrapedAndEnriched: any[] = [];
    const searchFilters = {
      ...(filters || {}),
      resolvedLocation,
    };
    
    await scraperManager.scrapeAll(query, searchFilters, async (provider, providerResults) => {
      if (providerResults && providerResults.length > 0) {
        const normalizedBatch = providerResults.map(p => {
          p.agent = p.agent || {};
          p.agent.phone = normalizePhone(p.agent.phone, (p as any).id || p.url) || undefined;
          return p;
        });

        // Strict Email Enrichment: Only keep properties where a valid email was found
        const strictBatch = await enrichmentService.enrichStrict(normalizedBatch);

        if (strictBatch.length > 0) {
          allScrapedAndEnriched.push(...strictBatch);

          // Stream verified properties with emails to user
          if (!isClosed) {
            write({ type: 'results', provider, data: strictBatch });
          }
        }
      }
      
      if (!isClosed) {
        write({ type: 'provider_done', provider });
      }
    });


    // ── 5. Persist (fire-and-forget) ──────────
    if (!isClosed && allScrapedAndEnriched.length > 0) {
      setImmediate(async () => {
        try {
          await aggregator.saveResults(query, allScrapedAndEnriched, filters);
          await Promise.all(allScrapedAndEnriched.map(p => {
            // Sanitize numeric fields to avoid CastErrors
            const sanitized = {
              ...p,
              bedrooms: (typeof p.bedrooms === 'number') ? p.bedrooms : (p.bedrooms ? parseInt(p.bedrooms as any) : null),
              bathrooms: (typeof p.bathrooms === 'number') ? p.bathrooms : (p.bathrooms ? parseInt(p.bathrooms as any) : null),
              scrapedAt: new Date()
            };

            return Property.findOneAndUpdate(
              { url: p.url },
              sanitized,
              { upsert: true, returnDocument: 'after' }
            );
          }));
        } catch (e) {
          console.error('[SSE] Failed to persist results:', e);
        }
      });
    }

    // ── 5. Done ──────────────────────────────────────────────────────────────
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();


  } catch (err: any) {
    console.error(`[SSE] Fatal Error in search controller for "${query}":`, err.stack || err);
    if (!res.writableEnded) {
      write({ type: 'error', message: err.message || 'Search failed' });
      res.end();
    }
    next(err);
  }
};
