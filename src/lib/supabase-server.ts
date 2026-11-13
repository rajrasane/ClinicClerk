import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'

function bearerToken(request: NextRequest) {
  const match = request.headers.get('Authorization')?.match(/^Bearer\s+(\S+)$/i)
  return match?.[1] ?? null
}

// API routes use explicit bearer authentication. Never share browser session
// state, refresh tokens, or a cookie fallback between server requests.
export function createSupabaseServerClient(request: NextRequest) {
  const token = bearerToken(request)
  if (!token) throw new Error('Bearer authentication required')
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { headers: { Authorization: `Bearer ${token}` } }
    }
  )
}

export async function getAuthenticatedUser(request: NextRequest) {
  const token = bearerToken(request)
  if (!token) return null
  try {
    const supabase = createSupabaseServerClient(request)
    const { data: { user }, error } = await supabase.auth.getUser(token)
    return error ? null : user
  } catch {
    return null
  }
}
