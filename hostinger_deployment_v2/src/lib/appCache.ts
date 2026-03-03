// In-memory cache backed by sessionStorage for whitelisted keys.
// Survives page refreshes (sessionStorage) and in-session navigations (Map).
// Falls back to memory-only if sessionStorage is unavailable (private browsing).

interface Entry<T> {
  data: T;
  cachedAt: number;
}

const PERSIST_PREFIXES = ['sidebar_projects_', 'user_profile_', 'project_'];
const STORAGE_PREFIX = 'appCache:';

function shouldPersist(key: string): boolean {
  return PERSIST_PREFIXES.some(p => key.startsWith(p));
}

function hasSessionStorage(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const testKey = '__appCache_test__';
    sessionStorage.setItem(testKey, '1');
    sessionStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

class MemoryCache {
  private store = new Map<string, Entry<unknown>>();
  private canPersist: boolean;

  constructor() {
    this.canPersist = hasSessionStorage();
    this.hydrate();
  }

  /** Restore whitelisted keys from sessionStorage into the in-memory Map */
  private hydrate(): void {
    if (!this.canPersist) return;
    try {
      for (let i = 0; i < sessionStorage.length; i++) {
        const storageKey = sessionStorage.key(i);
        if (!storageKey || !storageKey.startsWith(STORAGE_PREFIX)) continue;
        const cacheKey = storageKey.slice(STORAGE_PREFIX.length);
        const raw = sessionStorage.getItem(storageKey);
        if (raw) {
          const entry: Entry<unknown> = JSON.parse(raw);
          this.store.set(cacheKey, entry);
        }
      }
    } catch {
      // Corrupted storage — start fresh
    }
  }

  get<T>(key: string, ttlMs = 5 * 60 * 1000): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() - entry.cachedAt > ttlMs) {
      this.delete(key);
      return null;
    }
    return entry.data as T;
  }

  set<T>(key: string, data: T): void {
    const entry: Entry<T> = { data, cachedAt: Date.now() };
    this.store.set(key, entry);
    if (this.canPersist && shouldPersist(key)) {
      try {
        sessionStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(entry));
      } catch {
        // Quota exceeded — memory-only for this key
      }
    }
  }

  delete(key: string): void {
    this.store.delete(key);
    if (this.canPersist && shouldPersist(key)) {
      try {
        sessionStorage.removeItem(STORAGE_PREFIX + key);
      } catch { /* ignore */ }
    }
  }

  clear(): void {
    this.store.clear();
    if (this.canPersist) {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const k = sessionStorage.key(i);
          if (k && k.startsWith(STORAGE_PREFIX)) keysToRemove.push(k);
        }
        keysToRemove.forEach(k => sessionStorage.removeItem(k));
      } catch { /* ignore */ }
    }
  }
}

export const appCache = new MemoryCache();
