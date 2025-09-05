'use client'

import { useAuth } from '@/contexts/AuthContext'
import SignupForm from '@/components/auth/SignupForm'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function SignupPage() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      router.push('/')
    }
  }, [user, router])

  if (user) {
    return null // Will redirect
  }

  return <SignupForm />
}
