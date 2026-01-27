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
