import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/rate-limit';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Skip non-API routes
  if (!path.startsWith('/api/')) {
    return NextResponse.next();
  }

  const clientId = getClientIdentifier(request);

  // Determine rate limit config based on path
  let config = RATE_LIMITS.api;
  let limitKey = `api:${clientId}`;

  if (path.includes('/auth') || path.includes('/login') || path.includes('/signup')) {
    config = RATE_LIMITS.auth;
    limitKey = `auth:${clientId}`;
  } else if (path.includes('/export')) {
    config = RATE_LIMITS.export;
    limitKey = `export:${clientId}`;
  } else if (request.method === 'GET') {
    config = RATE_LIMITS.read;
    limitKey = `read:${clientId}`;
  }

  const result = checkRateLimit(limitKey, config);

  if (!result.success) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil(result.resetIn / 1000)
      },
      { 
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil(result.resetIn / 1000)),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(result.resetIn / 1000)),
        }
      }
    );
  }

  // Add rate limit headers to successful responses
  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Remaining', String(result.remaining));
  response.headers.set('X-RateLimit-Reset', String(Math.ceil(result.resetIn / 1000)));
  
  return response;
}

export const config = {
  matcher: '/api/:path*',
};
