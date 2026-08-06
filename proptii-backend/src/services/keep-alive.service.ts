import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';

/**
 * Keep-Alive Service
 *
 * Pings the backend health endpoint and the search service health endpoint
 * every 14 minutes so Render free-tier services never spin down.
 *
 * Render spins down a free service after 15 minutes of inactivity.
 * Pinging at 14-minute intervals keeps all three services warm with
 * a comfortable 1-minute safety margin.
 *
 * The backend pings itself via localhost (zero-cost, no external network hop).
 * The search service is pinged over HTTPS using SEARCH_BACKEND_URL.
 */
@Injectable()
export class KeepAliveService implements OnModuleInit {
  private readonly logger = new Logger(KeepAliveService.name);

  /** Self-ping URL — always localhost so it doesn't leave the container. */
  private readonly selfUrl: string;

  /** External search service URL — set via env var. */
  private readonly searchUrl: string | null;

  constructor() {
    const port = process.env.PORT || '10000';
    this.selfUrl = `http://127.0.0.1:${port}/api/health`;

    const rawSearchUrl = (
      process.env.SEARCH_BACKEND_URL ||
      process.env.VITE_SEARCH_BACKEND_URL ||
      ''
    ).trim();
    this.searchUrl = rawSearchUrl ? `${rawSearchUrl.replace(/\/$/, '')}/health` : null;
  }

  /** Fire once shortly after startup so we know the URLs work. */
  onModuleInit() {
    // Delay 10 s after boot so NestJS is fully listening before we ping ourselves.
    setTimeout(() => void this.ping(), 10_000);
  }

  /**
   * Every 14 minutes — keeps the backend + search service warm on Render free tier.
   * Cron format: "0,14,28,42,56 * * * *" (every 14 min, aligned to clock hour).
   */
  @Cron('0,14,28,42,56 * * * *')
  async ping(): Promise<void> {
    await Promise.allSettled([
      this.pingUrl('backend (self)', this.selfUrl),
      ...(this.searchUrl ? [this.pingUrl('search service', this.searchUrl)] : []),
    ]);
  }

  private async pingUrl(name: string, url: string): Promise<void> {
    try {
      const start = Date.now();
      await axios.get(url, { timeout: 10_000 });
      this.logger.log(`[keep-alive] ${name} OK (${Date.now() - start} ms)`);
    } catch (err: any) {
      // Log but never throw — keep-alive failures must not crash the service.
      this.logger.warn(
        `[keep-alive] ${name} ping failed: ${err?.message ?? err}`,
      );
    }
  }
}
