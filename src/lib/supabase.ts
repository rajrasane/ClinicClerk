import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const storageKey = `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`

// Scope cleanup to this application's auth state. Other applications may share
// this origin, and a temporary network failure must not erase a valid session.
export function clearAuthStorage() {
  if (typeof window === 'undefined') return
  for (const storageName of ['localStorage', 'sessionStorage'] as const) {
    try {
      const storage = window[storageName]
      for (const key of [storageKey, `${storageKey}-code-verifier`, `${storageKey}-user`]) {
        storage.removeItem(key)
      }
    } catch {
      // Storage can be unavailable in private or embedded browsing contexts.
    }
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: typeof window !== 'undefined',
    persistSession: typeof window !== 'undefined',
    detectSessionInUrl: typeof window !== 'undefined',
    storageKey,
    storage: {
      getItem: (key: string) => {
        if (typeof window === 'undefined') return null
        try { return window.localStorage.getItem(key) } catch { return null }
      },
      setItem: (key: string, value: string) => {
        if (typeof window === 'undefined') return
        try { window.localStorage.setItem(key, value) } catch { /* Storage unavailable. */ }
      },
      removeItem: (key: string) => {
        if (typeof window === 'undefined') return
        try { window.localStorage.removeItem(key) } catch { /* Storage unavailable. */ }
      }
    }
  }
})
