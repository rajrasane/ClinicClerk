// Simple in-memory cache for API responses
class ApiCache {
  private cache = new Map<string, { data: unknown; timestamp: number; ttl: number }>();

  set(key: string, data: unknown, ttlMinutes: number = 5) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000
    });
  }

  get(key: string) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > cached.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  invalidate(pattern: string) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  clear() {
    this.cache.clear();
  }
}

export const apiCache = new ApiCache();

// Cached fetch wrapper
export async function cachedFetch(url: string, options?: RequestInit, ttlMinutes: number = 5) {
  const cacheKey = `${url}${JSON.stringify(options || {})}`;
  
  // Return cached data if available
  const cached = apiCache.get(cacheKey);
  if (cached && !options?.method) { // Only cache GET requests
    return { ...cached, fromCache: true };
  }

  // Get auth token if available
  let authHeaders = {};
  if (typeof window !== 'undefined') {
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        authHeaders = { 'Authorization': `Bearer ${session.access_token}` };
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
  }

  // Fetch fresh data
  const response = await fetch(url, {
    credentials: 'include',
    ...options,
    headers: {
      ...authHeaders,
      ...options?.headers
    }
  });
  const data = await response.json();

  // Cache successful GET requests
  if (response.ok && !options?.method) {
    apiCache.set(cacheKey, data, ttlMinutes);
  }

  return data;
}
