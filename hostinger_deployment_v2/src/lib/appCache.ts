// Module-level in-memory cache — persists across route navigations, no quota issues
// Data is keyed by string, expires after TTL (default 5 min)

interface Entry<T> {
  data: T;
  cachedAt: number;
}

class MemoryCache {
  private store = new Map<string, Entry<unknown>>();

  get<T>(key: string, ttlMs = 5 * 60 * 1000): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() - entry.cachedAt > ttlMs) {
      this.store.delete(key);
      return null;
    }
    return entry.data as T;
  }

  set<T>(key: string, data: T): void {
    this.store.set(key, { data, cachedAt: Date.now() });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

export const appCache = new MemoryCache();
