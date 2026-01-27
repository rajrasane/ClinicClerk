/**
 * Simple in-memory rate limiter for API routes
 * For production with multiple instances, use Redis-based solution (e.g., @upstash/ratelimit)
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

interface RateLimitConfig {
  maxRequests: number;  // Max requests allowed
  windowMs: number;     // Time window in milliseconds
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetIn: number;
}

/**
 * Check rate limit for a given identifier
 * @param identifier - Unique identifier (IP, user ID, etc.)
 * @param config - Rate limit configuration
 * @returns Result with success status and remaining requests
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const key = identifier;
  const entry = rateLimitStore.get(key);

  // If no entry or window expired, create new entry
  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetIn: config.windowMs,
    };
  }

  // Check if limit exceeded
  if (entry.count >= config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetIn: entry.resetTime - now,
    };
  }

  // Increment count
  entry.count++;
  return {
    success: true,
    remaining: config.maxRequests - entry.count,
    resetIn: entry.resetTime - now,
  };
}

/**
 * Get client identifier from request (IP address)
 */
export function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || 
             request.headers.get('x-real-ip') || 
             'unknown';
  return ip;
}

// Pre-configured rate limits for different endpoints
export const RATE_LIMITS = {
  // Strict: Auth endpoints (login, signup)
  auth: { maxRequests: 5, windowMs: 60 * 1000 },         // 5 requests per minute
  // Standard: Regular API endpoints
  api: { maxRequests: 60, windowMs: 60 * 1000 },         // 60 requests per minute
  // Relaxed: Read-heavy endpoints
  read: { maxRequests: 120, windowMs: 60 * 1000 },       // 120 requests per minute
  // Export: Bulk data exports
  export: { maxRequests: 10, windowMs: 60 * 1000 },      // 10 requests per minute
};
