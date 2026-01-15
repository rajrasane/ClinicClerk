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
  const lastFetchTimeRef = useRef<number>(0)

  // Fetch doctor data when user is available
  const fetchDoctorData = async (userId: string, force = false) => {
    // Prevent duplicate calls for the same user
    if (!force && fetchingRef.current && currentUserIdRef.current === userId) {
      console.log('[AuthContext] Skipping duplicate fetch - already fetching for user:', userId);
      return
    }

    // Cache for 10 minutes - don't refetch if we fetched recently
    const now = Date.now()
    const tenMinutes = 10 * 60 * 1000
    if (!force && currentUserIdRef.current === userId && (now - lastFetchTimeRef.current) < tenMinutes) {
      console.log('[AuthContext] Skipping fetch - using cached data (age:', Math.round((now - lastFetchTimeRef.current) / 1000), 'seconds)');
      return // Use cached data
    }

    console.log('[AuthContext] Fetching doctor data for user:', userId, 'force:', force);
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
        lastFetchTimeRef.current = Date.now() // Update cache timestamp
        console.log('[AuthContext] Doctor data fetched successfully');
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
        console.error('[AuthContext] Error fetching doctor data:', error);
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
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
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

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
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
    
    // Reset cache timestamp
    lastFetchTimeRef.current = 0
    currentUserIdRef.current = null
    
    // Clear any stored tokens
    if (typeof window !== 'undefined') {
      localStorage.removeItem('supabase.auth.token')
      sessionStorage.removeItem('supabase.auth.token')
    }
    
    await supabase.auth.signOut()
  }

  const refreshDoctorData = async () => {
    if (user?.id) {
      // Force refresh by clearing cache timestamp and forcing fetch
      console.log('[AuthContext] Forcing doctor data refresh');
      lastFetchTimeRef.current = 0
      await fetchDoctorData(user.id, true)
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
