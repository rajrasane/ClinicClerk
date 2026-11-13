'use client'

import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase, clearAuthStorage } from '@/lib/supabase'
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
  const [session, setSession] = useState<Session | null>(null)
  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [loading, setLoading] = useState(true)
  const [doctorLoading, setDoctorLoading] = useState(false)
  const ownerRef = useRef<string | null>(null)
  const doctorRequestRef = useRef(0)
  const mountedRef = useRef(false)
  const sessionRevisionRef = useRef(0)

  const applySession = useCallback((next: Session | null) => {
    sessionRevisionRef.current++
    const nextOwner = next?.user.id ?? null
    if (ownerRef.current !== nextOwner || nextOwner === null) {
      doctorRequestRef.current++
      ownerRef.current = nextOwner
      apiCache.clear()
      apiCache.setUser(nextOwner)
      setDoctor(null)
      setDoctorLoading(false)
    }
    setSession(next)
    setLoading(false)
  }, [])

  const fetchDoctorData = useCallback(async (userId: string) => {
    if (!mountedRef.current || ownerRef.current !== userId) return
    const request = ++doctorRequestRef.current
    const isCurrent = () => mountedRef.current && ownerRef.current === userId && doctorRequestRef.current === request
    setDoctorLoading(true)
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('id, first_name, middle_name, last_name, email, phone, clinic_name, clinic_address')
        .eq('id', userId)
        .single()
      if (!isCurrent()) return
      if (error?.code === 'PGRST116') {
        applySession(null)
        await supabase.auth.signOut({ scope: 'local' })
        clearAuthStorage()
        return
      }
      setDoctor(error ? null : data)
    } catch {
      if (isCurrent()) setDoctor(null)
    } finally {
      if (isCurrent()) setDoctorLoading(false)
    }
  }, [applySession])

  useEffect(() => {
    mountedRef.current = true
    let active = true
    const doctorRequests = doctorRequestRef
    let doctorTimer: ReturnType<typeof setTimeout> | undefined
    const acceptSession = (next: Session | null) => {
      if (!active) return
      const changed = ownerRef.current !== (next?.user.id ?? null)
      applySession(next)
      if (changed && next?.user.id) {
        clearTimeout(doctorTimer)
        // Supabase auth callbacks run under its auth lock. Defer database work
        // until the callback returns to avoid waiting on that same lock.
        doctorTimer = setTimeout(() => { void fetchDoctorData(next.user.id) }, 0)
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => {
      acceptSession(next)
    })
    const initialRevision = sessionRevisionRef.current
    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active || sessionRevisionRef.current !== initialRevision) return
      acceptSession(error ? null : data.session)
    }).catch(() => {
      if (active && sessionRevisionRef.current === initialRevision) acceptSession(null)
    })

    return () => {
      active = false
      mountedRef.current = false
      ownerRef.current = null
      doctorRequests.current++
      clearTimeout(doctorTimer)
      subscription.unsubscribe()
      apiCache.setUser(null)
      apiCache.clear()
    }
  }, [applySession, fetchDoctorData])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password })
    return { error }
  }

  const signOut = async () => {
    applySession(null)
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    clearAuthStorage()
  }

  const refreshDoctorData = async () => {
    if (session?.user.id) await fetchDoctorData(session.user.id)
  }

  return <AuthContext.Provider value={{
    user: session?.user ?? null,
    session,
    doctor: doctor?.id === session?.user.id ? doctor : null,
    loading, doctorLoading, signIn, signUp, signOut, refreshDoctorData
  }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
