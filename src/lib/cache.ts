// Patient data lives only in memory and belongs to one authenticated account.
class ApiCache {
  private cache = new Map<string, { data: unknown; expiresAt: number }>();
  private userId: string | null = null;
  private generation = 0;

  setUser(userId: string | null) {
    if (this.userId !== userId) {
      this.clear();
      this.userId = userId;
    }
  }

  snapshot() {
    return { userId: this.userId, generation: this.generation };
  }

  isCurrent(snapshot: ReturnType<ApiCache['snapshot']>) {
    return snapshot.userId === this.userId && snapshot.generation === this.generation;
  }

  set(key: string, data: unknown, ttlMinutes = 5) {
    if (!this.userId) return;
    this.cache.set(`${this.userId}:${key}`, { data, expiresAt: Date.now() + ttlMinutes * 60 * 1000 });
  }

  get(key: string) {
    if (!this.userId) return null;
    const scopedKey = `${this.userId}:${key}`;
    const cached = this.cache.get(scopedKey);
    if (!cached) return null;
    if (Date.now() >= cached.expiresAt) {
      this.cache.delete(scopedKey);
      return null;
    }
    return cached.data;
  }

  invalidate(pattern: string) {
    // Requests started before a mutation must not restore stale records.
    this.generation++;
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) this.cache.delete(key);
    }
  }

  clear() {
    this.generation++;
    this.cache.clear();
  }
}

export const apiCache = new ApiCache();

export async function cachedFetch(url: string, options?: RequestInit, ttlMinutes = 5, forceRefresh = false) {
  const owner = apiCache.snapshot();
  const assertCurrent = () => {
    if (options?.signal?.aborted || !apiCache.isCurrent(owner)) {
      throw new DOMException('Request is no longer current', 'AbortError');
    }
  };
  assertCurrent();
  const { supabase } = await import('@/lib/supabase');
  const { data: { session }, error } = await supabase.auth.getSession();
  assertCurrent();
  if (error || !session?.access_token || !owner.userId || session.user.id !== owner.userId) {
    throw new Error('Authentication required');
  }

  const headers = new Headers(options?.headers);
  headers.set('Authorization', `Bearer ${session.access_token}`);
  const isGet = (options?.method ?? 'GET').toUpperCase() === 'GET';
  // Only the application's standard GET representation is cached. Custom
  // request headers may select a different representation and bypass caching.
  const canCache = isGet && !options?.headers;
  if (canCache && !forceRefresh) {
    const cached = apiCache.get(url);
    if (cached) return { ...cached, fromCache: true };
  }

  const response = await fetch(url, { ...options, headers, credentials: 'same-origin', cache: 'no-store' });
  const data = await response.json();
  assertCurrent();
  if (response.ok && data.success && canCache) apiCache.set(url, data, ttlMinutes);
  return data;
}

export function isAbortedRequest(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError';
}

// Capture once before an operation's first await. Multi-step operations must
// reuse this owner for every request, even when the auth SDK refreshes tokens.
export async function authenticatedJsonFetch(
  url: string,
  options?: RequestInit,
  owner = apiCache.snapshot()
) {
  const assertCurrent = () => {
    if (options?.signal?.aborted || !apiCache.isCurrent(owner)) {
      throw new DOMException('Request is no longer current', 'AbortError');
    }
  };
  assertCurrent();
  const { supabase } = await import('@/lib/supabase');
  const { data: { session }, error } = await supabase.auth.getSession();
  assertCurrent();
  if (error || !owner.userId || !session?.access_token) throw new Error('Authentication required');
  if (session.user.id !== owner.userId) {
    throw new DOMException('Account changed during request', 'AbortError');
  }
  const headers = new Headers(options?.headers);
  headers.set('Authorization', `Bearer ${session.access_token}`);
  assertCurrent();
  const response = await fetch(url, { ...options, headers, credentials: 'same-origin', cache: 'no-store' });
  assertCurrent();
  const data = await response.json();
  assertCurrent();
  return { response, data };
}
