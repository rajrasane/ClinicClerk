import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Handle storage errors gracefully (e.g., stale tokens on mobile/tunnels)
    storage: {
      getItem: (key: string) => {
        if (typeof window === 'undefined') return null
        try {
          return localStorage.getItem(key)
        } catch {
          return null
        }
      },
      setItem: (key: string, value: string) => {
        if (typeof window === 'undefined') return
        try {
          localStorage.setItem(key, value)
        } catch {
          // Storage full or blocked - ignore
        }
      },
      removeItem: (key: string) => {
        if (typeof window === 'undefined') return
        try {
          localStorage.removeItem(key)
        } catch {
          // Ignore removal errors
        }
      }
    }
  },
  global: {
    // Suppress fetch errors for token refresh failures
    fetch: async (url, options) => {
      try {
        return await fetch(url, options)
      } catch (error) {
        // Network error during refresh - clear stale session
        if (typeof window !== 'undefined' && url.toString().includes('/token')) {
          localStorage.removeItem('sb-' + supabaseUrl.split('//')[1]?.split('.')[0] + '-auth-token')
        }
        throw error
      }
    }
  }
})

// Listen for auth errors globally and clear stale tokens
if (typeof window !== 'undefined') {
  // Pre-emptive check: if token exists but is malformed, clear it before Supabase tries to use it
  try {
    const projectId = supabaseUrl.split('//')[1]?.split('.')[0]
    const tokenKey = `sb-${projectId}-auth-token`
    const storedToken = localStorage.getItem(tokenKey)
    if (storedToken) {
      const parsed = JSON.parse(storedToken)
      // Check if refresh token exists and is a valid string
      if (!parsed?.refresh_token || typeof parsed.refresh_token !== 'string') {
        console.warn('Invalid token structure detected, clearing...')
        localStorage.removeItem(tokenKey)
      }
      // Check if access token has expired (with some buffer)
      if (parsed?.expires_at) {
        const expiresAt = parsed.expires_at * 1000 // Convert to ms
        const now = Date.now()
        // If access token expired more than 7 days ago, refresh token is likely invalid too
        if (now - expiresAt > 7 * 24 * 60 * 60 * 1000) {
          console.warn('Token expired too long ago, clearing...')
          localStorage.removeItem(tokenKey)
        }
      }
    }
  } catch {
    // If parsing fails, the token is corrupted - clear it
    const keys = Object.keys(localStorage).filter(k => k.startsWith('sb-'))
    keys.forEach(k => localStorage.removeItem(k))
  }

  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'TOKEN_REFRESHED' && !session) {
      // Token refresh failed - clear everything
      const keys = Object.keys(localStorage).filter(k => k.startsWith('sb-'))
      keys.forEach(k => localStorage.removeItem(k))
    }
    if (event === 'SIGNED_OUT') {
      // Ensure clean logout
      const keys = Object.keys(localStorage).filter(k => k.startsWith('sb-'))
      keys.forEach(k => localStorage.removeItem(k))
    }
  })
}
