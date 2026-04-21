import { Request, Response, NextFunction, RequestHandler } from 'express';
import { SearchAggregator } from '../../core/services/SearchAggregator';
import { ScraperManager } from '../../integrations/ScraperManager';
import { AgentEnrichmentService } from '../../core/services/AgentEnrichmentService';
import Property from '../../models/Property';
import fs from 'fs';

const TRACE = (msg: string) => {
  fs.appendFileSync('scratch/backend_live.log', `[${new Date().toISOString()}] ${msg}\n`);
};

const aggregator    = new SearchAggregator();
const scraperManager = new ScraperManager();
const enrichmentService = new AgentEnrichmentService();

export const searchProperties: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query, filters } = req.body;

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
      TRACE(`[SSE] Response closed connection. WritableEnded? ${res.writableEnded}`);
    });

    // ── 1. Announce provider names ─────────
    // White Label: Always announce 'Proptii'
    write({ type: 'providers', providers: ['Proptii'] });

    // ── 2. Cache/DB lookup ──────────────────
    console.log(`[SSE] Checking cache/DB for: "${query}"`);
    const cachedResults = await aggregator.getCachedResults(query);
    if (cachedResults.length > 0) {
      // Apply strict email filter to cached results too, just in case
      const validCached = cachedResults.filter(p => p.agent?.email);
      if (validCached.length > 0) {
        TRACE(`[SSE] Sending ${validCached.length} valid cached results for: "${query}"`);
        // White Label: Mask provider
        write({ type: 'initial', data: validCached.map(p => ({ ...p, source: 'Proptii' })) });
      } else {
        TRACE(`[SSE] Found ${cachedResults.length} cached results but none had valid emails for: "${query}"`);
      }
    } else {
      TRACE(`[SSE] Cache miss (no initial pulse) for: "${query}"`);
    }

    // ── 3. Live Scraping + Enrichment ────────
    TRACE(`[SSE] Starting scrapeAll for: "${query}"`);
    const allScrapedAndEnriched: any[] = [];
    
    await scraperManager.scrapeAll(query, filters, async (provider, providerResults) => {
      TRACE(`[SSE] Scraper ${provider} found ${providerResults.length} items. Starting streaming enrichment...`);
      
      await enrichmentService.enrichAndStream(providerResults, (enrichedResult) => {
        TRACE(`[SSE] Callback for ${provider}. isClosed=${isClosed}. Property: ${enrichedResult.title}`);
        if (!isClosed) {
          const whiteLabeledResult = { ...enrichedResult, source: 'Proptii' };
          allScrapedAndEnriched.push(whiteLabeledResult);
          // White Label: Mask provider
          write({ type: 'results', provider: 'Proptii', data: [whiteLabeledResult] });
          TRACE(`[SSE] Wrote result!`);
        }
      });
      
      if (!isClosed) {
        TRACE(`[SSE] Writing provider_done for ${provider}`);
        write({ type: 'provider_done', provider: 'Proptii' });
      }
      
      TRACE(`[SSE] Finished streaming enrichment for ${provider}. Cached/Streamed: ${providerResults.length}`);
    });

    TRACE(`[SSE] scrapeAll completely resolved for: "${query}"`);

    // ── 4. Persist (fire-and-forget) ──────────
    if (!isClosed && allScrapedAndEnriched.length > 0) {
      setImmediate(async () => {
        try {
          await aggregator.saveResults(query, allScrapedAndEnriched);
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
    TRACE(`[SSE] Sending done and ending response for: "${query}"`);
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();

    TRACE(`[SSE] res.end() called successfully!`);

  } catch (err: any) {
    TRACE(`[SSE] Fatal Error in search controller for "${query}": ${err.stack || err}`);
    console.error(`[SSE] Fatal Error in search controller for "${query}":`, err.stack || err);
    if (!res.writableEnded) {
      write({ type: 'error', message: err.message || 'Search failed' });
      res.end();
    }
    next(err);
  }
};
