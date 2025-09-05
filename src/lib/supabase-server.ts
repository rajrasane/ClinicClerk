import { createServerClient } from '@supabase/ssr'
import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'

export function createSupabaseServerClient(request?: NextRequest) {
  // If request is provided, try to get auth token from Authorization header
  if (request) {
    const authHeader = request.headers.get('Authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '')
      
      return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`
            }
          },
          cookies: {
            get: () => undefined,
            set: () => {},
            remove: () => {}
          }
        }
      )
    }
  }

  // Fallback to cookie-based client
  const cookieStore = cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const store = await cookieStore
          return store.get(name)?.value
        },
        async set(name: string, value: string, options: Record<string, unknown>) {
          try {
            const store = await cookieStore
            store.set({ name, value, ...options })
          } catch {
            // Ignore cookie setting errors in API routes
          }
        },
        async remove(name: string, options: Record<string, unknown>) {
          try {
            const store = await cookieStore
            store.set({ name, value: '', ...options })
          } catch {
            // Ignore cookie removal errors in API routes
          }
        },
      },
    }
  )
}

export async function getAuthenticatedUser(request: NextRequest) {
  try {
    // Get Authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Create Supabase client with the token
    const supabase = createSupabaseServerClient(request)
    
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      console.error('Authentication error:', error)
      return null
    }
    
    return user
  } catch (error) {
    console.error('Authentication setup error:', error)
    return null
  }
}
