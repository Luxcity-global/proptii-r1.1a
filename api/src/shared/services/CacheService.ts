import { AppError } from '../middleware/error-handling';

interface CacheConfig {
    ttl: number; // Time to live in seconds
    maxSize: number; // Maximum number of items in cache
    cleanupInterval: number; // Cleanup interval in seconds
}

interface CacheItem<T> {
    key: string;
    value: T;
    timestamp: number;
    expiresAt: number;
}

export class CacheService {
    private cache: Map<string, CacheItem<any>>;
    private config: CacheConfig;
    private cleanupInterval: NodeJS.Timeout;

    constructor(config: CacheConfig) {
        this.cache = new Map();
        this.config = config;
        this.cleanupInterval = setInterval(() => this.cleanup(), config.cleanupInterval * 1000);
    }

    async get<T>(key: string): Promise<T | null> {
        const item = this.cache.get(key);
        if (!item) return null;

        if (Date.now() > item.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        return item.value as T;
    }

    async set<T>(key: string, value: T): Promise<void> {
        if (this.cache.size >= this.config.maxSize) {
            this.evictOldest();
        }

        const now = Date.now();
        const item: CacheItem<T> = {
            key,
            value,
            timestamp: now,
            expiresAt: now + (this.config.ttl * 1000)
        };

        this.cache.set(key, item);
    }

    async delete(key: string): Promise<void> {
        this.cache.delete(key);
    }

    async clear(): Promise<void> {
        this.cache.clear();
    }

    private cleanup(): void {
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            if (now > item.expiresAt) {
                this.cache.delete(key);
            }
        }
    }

    private evictOldest(): void {
        let oldestKey: string | null = null;
        let oldestTimestamp = Infinity;

        for (const [key, item] of this.cache.entries()) {
            if (item.timestamp < oldestTimestamp) {
                oldestTimestamp = item.timestamp;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.cache.delete(oldestKey);
        }
    }

    async getStats(): Promise<{
        size: number;
        hitCount: number;
        missCount: number;
        evictionCount: number;
    }> {
        return {
            size: this.cache.size,
            hitCount: 0, // Implement hit/miss tracking if needed
            missCount: 0,
            evictionCount: 0
        };
    }

    destroy(): void {
        clearInterval(this.cleanupInterval);
        this.cache.clear();
    }
}

// Cache decorator for methods
export function cached(ttl: number = 300) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        const cache = new CacheService({
            ttl,
            maxSize: 1000,
            cleanupInterval: 60
        });

        descriptor.value = async function (...args: any[]) {
            const cacheKey = `${propertyKey}_${JSON.stringify(args)}`;
            const cachedValue = await cache.get(cacheKey);

            if (cachedValue !== null) {
                return cachedValue;
            }

            const result = await originalMethod.apply(this, args);
            await cache.set(cacheKey, result);
            return result;
        };

        return descriptor;
    };
} 