import { Controller, Get, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { Response } from 'express';

@ApiTags('GOV.UK')
@SkipThrottle()
@Controller('govuk-rss')
export class GovUkRssController {
  private cacheXml: string | null = null;
  private cacheExpiresAt = 0;
  private readonly CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes cache to prevent rate-limiting

  @Get()
  @ApiOperation({ summary: 'Proxy GOV.UK announcements Atom feed to prevent CORS and browser extension blocks' })
  @ApiResponse({ status: 200, description: 'GOV.UK atom feed XML' })
  async getGovUkFeed(@Res() res: Response) {
    const now = Date.now();
    if (this.cacheXml && now < this.cacheExpiresAt) {
      res.setHeader('Content-Type', 'application/atom+xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=900');
      return res.send(this.cacheXml);
    }

    try {
      const response = await fetch('https://www.gov.uk/search/news-and-communications.atom', {
        headers: {
          'User-Agent': 'Proptii-Backend/2.0 (+https://proptii.co)',
          Accept: 'application/atom+xml, application/xml, text/xml',
        },
      });

      if (response.ok) {
        const text = await response.text();
        if (text && text.length > 50) {
          this.cacheXml = text;
          this.cacheExpiresAt = now + this.CACHE_TTL_MS;

          res.setHeader('Content-Type', 'application/atom+xml; charset=utf-8');
          res.setHeader('Cache-Control', 'public, max-age=900');
          return res.send(this.cacheXml);
        }
      }
    } catch (err: any) {
      if (this.cacheXml) {
        res.setHeader('Content-Type', 'application/atom+xml; charset=utf-8');
        return res.send(this.cacheXml);
      }
    }

    // Graceful fallback XML to ensure clients never break
    const fallbackFeed = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>GOV.UK Announcements</title>
  <updated>${new Date().toISOString()}</updated>
</feed>`;

    res.setHeader('Content-Type', 'application/atom+xml; charset=utf-8');
    return res.status(200).send(fallbackFeed);
  }
}
