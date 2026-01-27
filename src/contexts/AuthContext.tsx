'use client'

import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { apiCache } from '@/lib/cache'

interface Doctor {
  id: string
  first_name: string
  middle_name?: string
  last_name: string
  email: string
  phone?: string
  clinic_name?: string
  clinic_address?: string
}

interface AuthContextType {
  user: User | null
  session: Session | null
  doctor: Doctor | null
  loading: boolean
  doctorLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  refreshDoctorData: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [loading, setLoading] = useState(true)
  const [doctorLoading, setDoctorLoading] = useState(false)
  const fetchingRef = useRef(false)
  const currentUserIdRef = useRef<string | null>(null)

  // Fetch doctor data when user is available
  const fetchDoctorData = async (userId: string) => {
    // Prevent duplicate calls for the same user
    if (fetchingRef.current && currentUserIdRef.current === userId) {
      return
    }

    fetchingRef.current = true
    currentUserIdRef.current = userId
    setDoctorLoading(true)
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('id, first_name, middle_name, last_name, email, phone, clinic_name, clinic_address')
        .eq('id', userId)
        .single()
      
      if (data && !error) {
        setDoctor(data)
      } else {
        // If doctor record doesn't exist (account deleted), sign out the user
        if (error?.code === 'PGRST116') {
          console.log('Doctor record not found, signing out user')
          // Clear tokens before signing out
          if (typeof window !== 'undefined') {
            localStorage.clear()
            sessionStorage.clear()
          }
          await supabase.auth.signOut()
          return
        }
        setDoctor(null)
      }
    } catch (error) {
      console.error('Error fetching doctor data:', error)
      setDoctor(null)
    } finally {
      setDoctorLoading(false)
      fetchingRef.current = false
    }
  }

  useEffect(() => {
    // Get initial session with error handling for stale tokens
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      // Handle invalid refresh token error - clear stale tokens and reset
      if (error?.message?.includes('Refresh Token') || error?.code === 'bad_jwt') {
        console.warn('Stale auth tokens detected, clearing...')
        if (typeof window !== 'undefined') {
          localStorage.clear()
          sessionStorage.clear()
        }
        setSession(null)
        setUser(null)
        setDoctor(null)
        setLoading(false)
        setDoctorLoading(false)
        return
      }
      
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false) // Auth loading complete
      
      if (session?.user?.id) {
        fetchDoctorData(session.user.id) // Fetch doctor data separately
      } else {
        setDoctor(null)
        setDoctorLoading(false)
      }
    }).catch((err) => {
      // Catch any unhandled auth errors (e.g., network issues, invalid tokens)
      console.error('Auth session error:', err)
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
      }
      setSession(null)
      setUser(null)
      setDoctor(null)
      setLoading(false)
      setDoctorLoading(false)
    })

    // Listen for auth changes (including token refresh errors)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Handle token refresh failure
      if (event === 'TOKEN_REFRESHED' && !session) {
        console.warn('Token refresh failed, clearing session...')
        if (typeof window !== 'undefined') {
          localStorage.clear()
          sessionStorage.clear()
        }
        setSession(null)
        setUser(null)
        setDoctor(null)
        setLoading(false)
        setDoctorLoading(false)
        return
      }
      
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false) // Auth loading complete
      
      if (session?.user?.id) {
        fetchDoctorData(session.user.id) // Fetch doctor data separately
      } else {
        setDoctor(null)
        setDoctorLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    // Clear cache on successful sign in to ensure fresh data for new user
    if (!error) {
      apiCache.clear()
    }
    
    return { error }
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { error }
  }

  const signOut = async () => {
    // Clear all cached data before signing out
    apiCache.clear()
    
    // Clear any stored tokens
    if (typeof window !== 'undefined') {
      localStorage.removeItem('supabase.auth.token')
      sessionStorage.removeItem('supabase.auth.token')
    }
    
    await supabase.auth.signOut()
  }

  const refreshDoctorData = async () => {
    if (user?.id) {
      await fetchDoctorData(user.id)
    }
  }

  const value = {
    user,
    session,
    doctor,
    loading,
    doctorLoading,
    signIn,
    signUp,
    signOut,
    refreshDoctorData,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
