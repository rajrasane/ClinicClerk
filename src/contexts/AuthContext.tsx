'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User, Session, SupabaseClient } from '@supabase/supabase-js'
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
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)

  // Initialize Supabase client only on the client side
  useEffect(() => {
    const initSupabase = async () => {
      if (typeof window !== 'undefined') {
        const { supabase: supabaseClient } = await import('@/lib/supabase')
        setSupabase(supabaseClient)
      }
    }
    initSupabase()
  }, [])

  // Fetch doctor data when user is available
  const fetchDoctorData = useCallback(async (userId: string) => {
    if (!supabase) return
    
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
    }
  }, [supabase])

  useEffect(() => {
    if (!supabase) return

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }: { data: { session: Session | null } }) => {
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
    } = supabase.auth.onAuthStateChange(async (_event: string, session: Session | null) => {
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
  }, [supabase, fetchDoctorData])

  const signIn = async (email: string, password: string) => {
    if (!supabase) return { error: new Error('Supabase not initialized') }
    
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
    if (!supabase) return { error: new Error('Supabase not initialized') }
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { error }
  }

  const signOut = async () => {
    if (!supabase) return
    
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
