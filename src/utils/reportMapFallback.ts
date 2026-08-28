/** Branded centroid map — always available when postcodes.io returns coordinates. */
export function centroidMapSvgDataUrl(latitude: number, longitude: number): string {
  const lat = latitude.toFixed(4);
  const lng = longitude.toFixed(4);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 320" role="img" aria-label="Approximate postcode centroid map">
  <defs>
    <pattern id="g" width="28" height="28" patternUnits="userSpaceOnUse">
      <path d="M 28 0 L 0 0 0 28" fill="none" stroke="#d2dade" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="640" height="320" fill="#eef1f3"/>
  <rect width="640" height="320" fill="url(#g)" opacity="0.55"/>
  <rect x="0" y="138" width="640" height="10" fill="#c5cdd2" opacity="0.85"/>
  <rect x="308" y="0" width="10" height="320" fill="#c5cdd2" opacity="0.85"/>
  <rect x="80" y="52" width="200" height="6" rx="2" fill="#d2dade"/>
  <rect x="360" y="210" width="180" height="6" rx="2" fill="#d2dade"/>
  <circle cx="320" cy="132" r="22" fill="#ea4335" opacity="0.18"/>
  <circle cx="320" cy="132" r="8" fill="#ea4335"/>
  <circle cx="320" cy="132" r="3" fill="#ffffff"/>
  <text x="320" y="178" text-anchor="middle" font-family="system-ui,sans-serif" font-size="12" fill="#3a4a57">Postcode centroid (approximate)</text>
  <text x="320" y="198" text-anchor="middle" font-family="ui-monospace,monospace" font-size="11" fill="#136c9e">${lat}, ${lng}</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function isLocalMapFallback(url: string): boolean {
  return url.startsWith('data:image/svg+xml');
}
