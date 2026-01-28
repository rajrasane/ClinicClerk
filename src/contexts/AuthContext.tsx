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
  const doctorDataRef = useRef<Doctor | null>(null) // Track doctor data for closure access

  // Fetch doctor data when user is available
  const fetchDoctorData = async (userId: string) => {
    // Prevent duplicate concurrent calls
    if (fetchingRef.current) {
      return
    }

    fetchingRef.current = true
    setDoctorLoading(true)
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('id, first_name, middle_name, last_name, email, phone, clinic_name, clinic_address')
        .eq('id', userId)
        .single()

      if (data && !error) {
        doctorDataRef.current = data
        setDoctor(data)
      } else {
        // If doctor record doesn't exist (account deleted), sign out the user
        if (error?.code === 'PGRST116') {
          console.log('Doctor record not found, signing out user')
          if (typeof window !== 'undefined') {
            localStorage.clear()
            sessionStorage.clear()
          }
          await supabase.auth.signOut()
          return
        }
        doctorDataRef.current = null
        setDoctor(null)
      }
    } catch (error) {
      console.error('Error fetching doctor data:', error)
      doctorDataRef.current = null
      setDoctor(null)
    } finally {
      setDoctorLoading(false)
      fetchingRef.current = false
    }
  }

  useEffect(() => {
    let hasFetchedDoctor = false // Track if we already fetched on this mount

    // Helper to clear all Supabase tokens
    const clearAuthTokens = () => {
      if (typeof window !== 'undefined') {
        // Clear all Supabase auth keys
        const keys = Object.keys(localStorage).filter(k => k.startsWith('sb-'))
        keys.forEach(k => localStorage.removeItem(k))
        sessionStorage.clear()
      }
    }

    // Helper to reset auth state
    const resetAuthState = () => {
      setSession(null)
      setUser(null)
      setDoctor(null)
      setLoading(false)
      setDoctorLoading(false)
    }

    // Get initial session with error handling for stale tokens
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        // Handle invalid refresh token error
        if (error?.message?.includes('Refresh Token') || error?.code === 'bad_jwt') {
          console.warn('Stale auth tokens detected, clearing...')
          clearAuthTokens()
          resetAuthState()
          return
        }

        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)

        if (session?.user?.id && !hasFetchedDoctor) {
          hasFetchedDoctor = true
          fetchDoctorData(session.user.id)
        } else if (!session?.user) {
          setDoctor(null)
          setDoctorLoading(false)
        }
      } catch (err: unknown) {
        // Catch AuthApiError thrown during refresh attempt
        const errorMessage = err instanceof Error ? err.message : String(err)
        if (errorMessage.includes('Refresh Token') || errorMessage.includes('Invalid') || errorMessage.includes('Not Found')) {
          console.warn('Auth error during session init, clearing tokens:', errorMessage)
          clearAuthTokens()
        } else {
          console.error('Auth session error:', err)
          clearAuthTokens()
        }
        resetAuthState()
      }
    }

    initializeAuth()

    // Listen for auth changes (including token refresh errors)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Handle token refresh failure or signout
      if ((event === 'TOKEN_REFRESHED' && !session) || event === 'SIGNED_OUT') {
        if (event === 'TOKEN_REFRESHED') {
          console.warn('Token refresh failed, clearing session...')
        }
        clearAuthTokens()
        resetAuthState()
        doctorDataRef.current = null
        hasFetchedDoctor = false
        return
      }

      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)

      // Only fetch doctor data on actual sign in (not initial load or token refresh)
      if (event === 'SIGNED_IN' && session?.user?.id && !hasFetchedDoctor) {
        hasFetchedDoctor = true
        fetchDoctorData(session.user.id)
      } else if (!session?.user) {
        doctorDataRef.current = null
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
