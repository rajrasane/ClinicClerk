import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
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
      // Only log non-user_not_found errors to reduce noise
      if (error?.code !== 'user_not_found') {
        console.error('Authentication error:', error)
      }
      
      // If user doesn't exist, clear the session by setting expired cookies
      if (error?.code === 'user_not_found') {
        const response = NextResponse.json(
          { success: false, error: 'User not found - session cleared' },
          { status: 401 }
        )
        
        // Clear all possible Supabase auth cookies with correct names
        const cookieOptions = { 
          expires: new Date(0),
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax' as const
        }
        
        // Clear all possible Supabase cookie variations
        const supabaseProject = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)/)?.[1] || 'localhost'
        
        // Clear project-specific cookies
        response.cookies.set(`sb-${supabaseProject}-auth-token`, '', cookieOptions)
        response.cookies.set(`sb-${supabaseProject}-auth-token.0`, '', cookieOptions)
        response.cookies.set(`sb-${supabaseProject}-auth-token.1`, '', cookieOptions)
        
        // Clear generic auth cookies
        response.cookies.set('sb-access-token', '', cookieOptions)
        response.cookies.set('sb-refresh-token', '', cookieOptions)
        response.cookies.set('supabase-auth-token', '', cookieOptions)
        response.cookies.set('supabase.auth.token', '', cookieOptions)
        
        throw response
      }
      
      return null
    }
    
    return user
  } catch (error) {
    // If it's our custom response, re-throw it
    if (error instanceof NextResponse) {
      throw error
    }
    console.error('Authentication setup error:', error)
    return null
  }
}
