'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { apiCache } from '@/lib/cache'

interface Doctor {
  id: string
  first_name: string
  last_name: string
  email: string
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [loading, setLoading] = useState(true)
  const [doctorLoading, setDoctorLoading] = useState(false)

  // Fetch doctor data when user is available
  const fetchDoctorData = async (userId: string) => {
    setDoctorLoading(true)
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('id, first_name, last_name, email')
        .eq('id', userId)
        .single()
      
      if (data && !error) {
        setDoctor(data)
      } else {
        setDoctor(null)
      }
    } catch (error) {
      console.error('Error fetching doctor data:', error)
      setDoctor(null)
    } finally {
      setDoctorLoading(false)
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
    await supabase.auth.signOut()
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
