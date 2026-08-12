import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/** Paths to skip logging (noisy keep-alive pings) */
const SKIP_PATHS = new Set(['/api/health', '/health']);

/** Truncate large bodies so logs stay readable */
function summarise(body: unknown, maxLen = 300): string {
  if (!body || (typeof body === 'object' && Object.keys(body as object).length === 0)) {
    return '(empty)';
  }
  try {
    const raw = JSON.stringify(body);
    return raw.length > maxLen ? raw.slice(0, maxLen) + '…' : raw;
  } catch {
    return String(body).slice(0, maxLen);
  }
}

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    if (SKIP_PATHS.has(req.path)) {
      next();
      return;
    }

    const { method, originalUrl, ip } = req;
    const userAgent = req.headers['user-agent'] ?? '—';
    const start = Date.now();

    // ── REQUEST ──────────────────────────────────────────────────────────────
    this.logger.log(
      `→ ${method} ${originalUrl} | ip=${ip} | ua=${userAgent.slice(0, 60)}` +
      (req.body && Object.keys(req.body).length
        ? ` | body=${summarise(req.body)}`
        : ''),
    );

    // ── RESPONSE ─────────────────────────────────────────────────────────────
    res.on('finish', () => {
      const ms = Date.now() - start;
      const { statusCode } = res;
      const userId = (req as any).user?.uid ?? 'anon';

      const status =
        statusCode >= 500 ? `[ERR ${statusCode}]` :
        statusCode >= 400 ? `[WARN ${statusCode}]` :
        statusCode >= 300 ? `[REDIR ${statusCode}]` :
        `[OK ${statusCode}]`;

      const logFn =
        statusCode >= 500 ? this.logger.error.bind(this.logger) :
        statusCode >= 400 ? this.logger.warn.bind(this.logger) :
        this.logger.log.bind(this.logger);

      logFn(
        `← ${status} ${method} ${originalUrl} | ${ms}ms | uid=${userId}`,
      );
    });

    next();
  }
}
