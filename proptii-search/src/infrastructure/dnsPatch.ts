import dns from 'node:dns';
import net from 'node:net';
import { promisify } from 'node:util';

/**
 * Windows DNS often fails getaddrinfo (EAI_AGAIN / ESERVFAIL) for Upstash
 * and MongoDB Atlas hosts. Node's dns.lookup uses the OS resolver;
 * dns.resolve* uses c-ares and can target public DNS.
 *
 * Patch lookup so mongoose, ioredis, and fetch-related sockets resolve
 * via Google/Cloudflare, then fall back to the system resolver.
 */
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4', '9.9.9.9']);

const resolver = new dns.Resolver();
resolver.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4', '9.9.9.9']);

const originalLookup = dns.lookup.bind(dns);

function bypassCustomDns(hostname: string): boolean {
  const host = hostname.replace(/^\[|\]$/g, '');
  return host === 'localhost' || host.endsWith('.local') || net.isIP(host) !== 0;
}

type LookupCallback = (err: NodeJS.ErrnoException | null, address?: unknown, family?: number) => void;

export function publicDnsLookup(hostname: string, options: unknown, callback?: LookupCallback): void {
  if (typeof options === 'function') {
    callback = options as LookupCallback;
    options = {};
  } else if (typeof options === 'number') {
    options = { family: options };
  }

  const cb = callback!;
  const opts = (options || {}) as dns.LookupOptions & { family?: number; all?: boolean };

  if (bypassCustomDns(hostname)) {
    originalLookup(hostname, opts, cb as Parameters<typeof dns.lookup>[2]);
    return;
  }

  const family = opts.family;
  const all = Boolean(opts.all);

  const succeed = (addresses: string[], fam: 4 | 6) => {
    if (all) {
      cb(null, addresses.map((address) => ({ address, family: fam })));
    } else {
      cb(null, addresses[0], fam);
    }
  };

  const resolveFamily = (fam: 4 | 6): Promise<string[]> =>
    new Promise((resolve, reject) => {
      const fn = fam === 4 ? resolver.resolve4.bind(resolver) : resolver.resolve6.bind(resolver);
      fn(hostname, (err, records) => {
        if (err || !records?.length) {
          reject(err || Object.assign(new Error(`ENODATA ${hostname}`), { code: 'ENODATA' }));
          return;
        }
        resolve(records as string[]);
      });
    });

  const run = async () => {
    if (family === 6) {
      succeed(await resolveFamily(6), 6);
      return;
    }
    try {
      succeed(await resolveFamily(4), 4);
    } catch (err4) {
      if (family === 4) throw err4;
      succeed(await resolveFamily(6), 6);
    }
  };

  run().catch(() => originalLookup(hostname, opts, cb as Parameters<typeof dns.lookup>[2]));
}

export function installPublicDnsLookup(): void {
  (dns as typeof dns & { lookup: typeof publicDnsLookup }).lookup = publicDnsLookup as typeof dns.lookup;
  (dns.promises as { lookup: typeof dns.promises.lookup }).lookup = promisify(publicDnsLookup) as typeof dns.promises.lookup;
}

installPublicDnsLookup();
