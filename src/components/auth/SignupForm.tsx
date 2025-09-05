'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'
import Image from 'next/image'
import Link from 'next/link'

export default function SignupForm() {
  const [firstName, setFirstName] = useState('')
  const [middleName, setMiddleName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Create display name from first and last name
      const displayName = `Dr. ${firstName} ${lastName}`
      
      // Sign up the user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          }
        }
      })
      
      if (error) {
        toast.error(error.message)
        return
      }

      if (data.user) {
        // Create doctor record in doctors table
        const { error: doctorError } = await supabase
          .from('doctors')
          .insert({
            id: data.user.id,
            first_name: firstName,
            middle_name: middleName || null,
            last_name: lastName,
            email: email,
          })

        if (doctorError) {
          toast.error('Failed to create doctor profile')
          return
        }

        toast.success('Account created successfully!Signing in.')
      }
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-6 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="max-w-md w-full space-y-6 animate-slide-up">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Image
              src="/logo.png"
              alt="ClinicClerk Logo"
              width={80}
              height={80}
              className="rounded-xl shadow-lg"
              priority
            />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Create your account
          </h2>
          <p className="text-sm text-gray-600">
            Join as a doctor to manage your patients
          </p>
        </div>
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-6 sm:p-8 border border-white/20">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                placeholder="e.g Rahul"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="middleName" className="block text-sm font-medium text-gray-700 mb-1">
                Middle Name (Optional)
              </label>
              <input
                id="middleName"
                name="middleName"
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                placeholder="e.g Manoj"
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                placeholder="e.g Sharma"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                placeholder="e.g doctor123@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating account...
                </div>
              ) : (
                'Create Account'
              )}
            </button>
          </form>
          
          <div className="text-center pt-4 border-t border-gray-200">
            <span className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                Sign in
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
