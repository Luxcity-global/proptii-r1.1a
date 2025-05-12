/**
 * Static Data Configuration
 * Generated on: 2025-05-07T22:55:12.181Z
 */

export const staticConfig = {
  "mimeTypes": {
    ".json": "text/json",
    ".js": "text/javascript",
    ".css": "text/css",
    ".html": "text/html",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".mp3": "audio/mpeg",
    ".aac": "audio/aac",
    ".ogg": "audio/ogg"
  },
  "securityHeaders": {
    "Content-Security-Policy": "default-src 'self' https: 'unsafe-eval' 'unsafe-inline' blob: data:; object-src 'none'",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains"
  },
  "cacheRules": {
    "static": {
      "maxAge": 31536000,
      "includeSubDomains": true
    },
    "dynamic": {
      "maxAge": 3600,
      "includeSubDomains": false
    }
  }
} as const;

export type StaticConfig = typeof staticConfig;
