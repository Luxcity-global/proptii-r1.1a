import { Resolver } from 'node:dns/promises';

const publicResolver = new Resolver();
publicResolver.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4', '9.9.9.9']);

/**
 * Convert mongodb+srv:// to mongodb:// using public DNS, so Atlas still
 * connects when Windows SRV lookups return ESERVFAIL / ETIMEOUT.
 */
export async function mongodbSrvToStandardUri(mongoUri: string): Promise<string> {
  if (!/^mongodb\+srv:\/\//i.test(mongoUri)) return mongoUri;

  const parsed = new URL(mongoUri.replace(/^mongodb\+srv:\/\//i, 'https://'));
  const srv = await publicResolver.resolveSrv(`_mongodb._tcp.${parsed.hostname}`);
  if (!srv.length) {
    throw new Error(`No MongoDB SRV records for ${parsed.hostname}`);
  }

  const txt = await publicResolver.resolveTxt(parsed.hostname).catch(() => [] as string[][]);
  const params = new URLSearchParams(parsed.search);
  for (const row of txt) {
    for (const part of row.join('').split('&')) {
      const eq = part.indexOf('=');
      if (eq > 0) {
        const key = part.slice(0, eq);
        const value = part.slice(eq + 1);
        if (key && value && !params.has(key)) params.set(key, value);
      }
    }
  }
  params.set('tls', 'true');
  if (!params.has('retryWrites')) params.set('retryWrites', 'true');
  if (!params.has('w')) params.set('w', 'majority');

  const auth = parsed.username
    ? `${encodeURIComponent(parsed.username)}:${encodeURIComponent(parsed.password)}@`
    : '';
  const hosts = srv.map((record) => `${record.name}:${record.port || 27017}`).join(',');
  const db = parsed.pathname && parsed.pathname !== '/' ? parsed.pathname : '/';
  return `mongodb://${auth}${hosts}${db}?${params.toString()}`;
}

export function isSrvLookupError(error: unknown): boolean {
  const err = error as NodeJS.ErrnoException;
  const message = err?.message || String(error);
  return (
    err?.code === 'ESERVFAIL' ||
    err?.code === 'ETIMEOUT' ||
    err?.code === 'ENOTFOUND' ||
    err?.syscall === 'querySrv' ||
    message.includes('querySrv')
  );
}
