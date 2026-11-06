import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    // ── Content Security Policy (CSP) ─────────────────────────────────────────
    // Allows self, trusted CDNs for Swagger / Leaflet maps / Firebase / Stripe
    const isDocRoute = req.path.startsWith('/api/docs') || req.path.startsWith('/docs');
    
    if (isDocRoute) {
      res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' https://unpkg.com https://cdn.jsdelivr.net; " +
        "style-src 'self' 'unsafe-inline' https://unpkg.com https://fonts.googleapis.com; " +
        "img-src 'self' data: https:; " +
        "font-src 'self' https://fonts.gstatic.com data:; " +
        "connect-src 'self' https:; " +
        "frame-ancestors 'none';",
      );
    } else {
      res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' https://apis.google.com https://*.firebaseapp.com https://js.stripe.com; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "img-src 'self' data: blob: https:; " +
        "font-src 'self' https://fonts.gstatic.com data:; " +
        "connect-src 'self' https: wss:; " +
        "frame-ancestors 'none'; " +
        "form-action 'self';",
      );
    }

    // ── OWASP Recommended Security Headers ───────────────────────────────────
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '0');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-DNS-Prefetch-Control', 'off');
    res.setHeader('X-Download-Options', 'noopen');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');

    // HSTS (HTTP Strict Transport Security) in production
    const isProd = process.env.NODE_ENV === 'production' || !!process.env.RENDER_EXTERNAL_URL;
    if (isProd || req.secure) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }

    next();
  }
}
