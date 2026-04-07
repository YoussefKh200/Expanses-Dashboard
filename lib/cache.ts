// lib/cache.ts
// Simple in-memory cache with TTL for production performance

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class Cache {
  private store = new Map<string, CacheEntry<any>>();

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.store.delete(key);
      return null;
    }

    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlMs: number = 60000): void {
    this.store.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }

  invalidatePattern(pattern: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(pattern)) {
        this.store.delete(key);
      }
    }
  }

  clear(): void {
    this.store.clear();
  }

  // Cleanup expired entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.store.delete(key);
      }
    }
  }
}

// Singleton cache instance
export const cache = new Cache();

// Start cleanup interval (every 5 minutes)
if (typeof global !== "undefined") {
  (global as any).__cacheCleanupInterval = setInterval(() => {
    cache.cleanup();
  }, 300000);
}

// Cache keys
export const CACHE_KEYS = {
  STATS: "stats:",
  TRANSACTIONS: "transactions:",
  CATEGORIES: "categories:",
  CATEGORY_BREAKDOWN: "category_breakdown:",
};

// Cache TTLs
export const CACHE_TTL = {
  STATS: 60000, // 1 minute
  TRANSACTIONS: 30000, // 30 seconds
  CATEGORIES: 300000, // 5 minutes
  CATEGORY_BREAKDOWN: 60000, // 1 minute
};
