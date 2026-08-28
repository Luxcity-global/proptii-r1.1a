import './dnsPatch';
import IORedis from 'ioredis';

export interface RedisLike {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode?: string, duration?: number): Promise<'OK' | null>;
  publish(channel: string, message: string): Promise<number>;
  ping(): Promise<string>;
  disconnect(): void;
  status: string;
}

class NoOpRedis implements RedisLike {
  status = 'end';

  async get(): Promise<string | null> {
    return null;
  }

  async set(): Promise<'OK' | null> {
    return null;
  }

  async publish(): Promise<number> {
    return 0;
  }

  async ping(): Promise<string> {
    return 'PONG';
  }

  disconnect(): void {
    /* no-op */
  }
}

const noopRedis = new NoOpRedis();

export function isRedisConfigured(): boolean {
  return process.env.SKIP_REDIS !== 'true' && Boolean(process.env.REDIS_URL?.trim());
}

let client: IORedis | null = null;
let activeClient: RedisLike = noopRedis;
let initAttempted = false;
let unavailableLogged = false;

function logUnavailable(message: string): void {
  if (unavailableLogged) return;
  unavailableLogged = true;
  console.warn(`⚠️ Redis unavailable — continuing without cache (${message})`);
}

function waitForReady(probe: IORedis, timeoutMs: number): Promise<void> {
  if (probe.status === 'ready') return Promise.resolve();

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      probe.off('ready', onReady);
      reject(new Error(`Redis connect timeout after ${timeoutMs}ms`));
    }, timeoutMs);

    const onReady = () => {
      clearTimeout(timer);
      resolve();
    };

    // Do not reject on the first 'error' — ioredis retries with retryStrategy.
    probe.once('ready', onReady);
  });
}

function createRedisClient(url: string): IORedis {
  return new IORedis(url, {
    // BullMQ requires this to be null.
    maxRetriesPerRequest: null,
    connectTimeout: 20000,
    enableReadyCheck: true,
    retryStrategy: (times) => {
      if (times > 8) return null;
      return Math.min(times * 300, 3000);
    },
    reconnectOnError: (err) => {
      const msg = err.message || '';
      return msg.includes('READONLY') || msg.includes('ECONNRESET');
    },
  });
}

/**
 * Connect to Redis at startup. Uses public DNS lookup so Upstash resolves
 * on Windows when the ISP resolver returns EAI_AGAIN / ESERVFAIL.
 */
export async function initRedis(): Promise<boolean> {
  if (initAttempted) return activeClient !== noopRedis;
  initAttempted = true;

  if (!isRedisConfigured()) {
    console.log('ℹ️ Redis disabled (set REDIS_URL and SKIP_REDIS=false to enable)');
    activeClient = noopRedis;
    return false;
  }

  const url = process.env.REDIS_URL!.trim();
  const probe = createRedisClient(url);

  try {
    await waitForReady(probe, 20000);
    await probe.ping();
    client = probe;
    client.on('error', (err) => logUnavailable(err.message));
    client.on('ready', () => {
      unavailableLogged = false;
      console.log('✅ Redis Connected');
    });
    activeClient = client as unknown as RedisLike;
    console.log('✅ Redis Connected');
    return true;
  } catch (error) {
    logUnavailable((error as Error).message);
    probe.disconnect();
    activeClient = noopRedis;
    return false;
  }
}

/** Shared Redis client — no-op when Redis is disabled or unreachable. */
export function getRedis(): RedisLike {
  return activeClient;
}

/** BullMQ requires a real ioredis connection; null when Redis is unavailable. */
export function getBullMqConnection(): IORedis | null {
  return client;
}
