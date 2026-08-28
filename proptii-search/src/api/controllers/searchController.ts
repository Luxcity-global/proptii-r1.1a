import { Request, Response, NextFunction, RequestHandler } from 'express';
import { SearchAggregator } from '../../core/services/SearchAggregator';
import { ScraperManager } from '../../integrations/ScraperManager';
import { AgentEnrichmentService } from '../../core/services/AgentEnrichmentService';
import { persistProperty, type PersistableProperty } from '../../utils/persistProperty';
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

    // ── 1. Announce provider names ─────────
    // Announce actual provider names
    write({ type: 'providers', providers: scraperManager.getProviderNames() });

    // ── 2. Cache/DB lookup ──────────────────
    console.log(`[SSE] Checking cache/DB for: "${query}"`);
    const cachedResults = await aggregator.getCachedResults(query);
    if (cachedResults.length > 0) {
      const normalizedCached = cachedResults.map(p => {
        p.agent = p.agent || {};
        p.agent.phone = normalizePhone(p.agent.phone, p.id || p.url);
        return p;
      });
      write({ type: 'initial', data: normalizedCached });
    }

    // ── 3. Live Scraping + Enrichment ────────
    const allScrapedAndEnriched: any[] = [];
    
    await scraperManager.scrapeAll(query, filters, async (provider, providerResults) => {
      
      await enrichmentService.enrichAndStream(providerResults, async (enrichedResult) => {
        if (isClosed) return;

        enrichedResult.agent = enrichedResult.agent || {};
        enrichedResult.agent.phone = normalizePhone(
          enrichedResult.agent.phone,
          enrichedResult.id || enrichedResult.url,
        );

        // Geocode once at ingest, then stream coordinates to the UI.
        const saved = await persistProperty(enrichedResult as unknown as PersistableProperty);
        allScrapedAndEnriched.push(saved);
        write({ type: 'results', provider, data: [saved] });
      });
      
      if (!isClosed) {
        write({ type: 'provider_done', provider });
      }
      
    });


    // ── 4. Persist to cache (coordinates already saved per property above) ──
    if (!isClosed && allScrapedAndEnriched.length > 0) {
      try {
        await aggregator.saveResults(query, allScrapedAndEnriched);
      } catch (e) {
        console.error('[SSE] Failed to cache results:', e);
      }
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
