'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'
import Image from 'next/image'
import Link from 'next/link'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

export default function SignupForm() {
  const [firstName, setFirstName] = useState('')
  const [middleName, setMiddleName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate password strength
      if (password.length < 8) {
        toast.error('Password must be at least 8 characters long')
        setLoading(false)
        return
      }
      if (!/[A-Z]/.test(password)) {
        toast.error('Password must contain at least one uppercase letter')
        setLoading(false)
        return
      }
      if (!/[0-9]/.test(password)) {
        toast.error('Password must contain at least one number')
        setLoading(false)
        return
      }

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

        toast.success('Account created successfully! Signing in.')
      }
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-start justify-center bg-gradient-to-br from-teal-50 to-cyan-100 py-8 px-4 sm:py-12 sm:px-6 lg:px-8 animate-fade-in">
      <div className="max-w-md w-full space-y-5 sm:space-y-6 animate-slide-up">
        <div className="text-center">
          <Link
            href="/"
            className="group inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4 text-sm font-medium"
          >
            <svg
              className="w-4 h-4 mr-1.5 transition-transform group-hover:-translate-x-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
          <div className="flex justify-center mb-5 sm:mb-6">
            <Image
              src="/logo.png"
              alt="ClinicClerk Logo"
              width={70}
              height={70}
              className="rounded-xl shadow-lg"
              priority
            />
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
            Create your account
          </h2>
          <p className="text-sm text-gray-600">
            Join as a doctor to manage your patients
          </p>
        </div>
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-4 sm:p-5 lg:p-6 border border-white/20">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                autoComplete="given-name"
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors duration-200 text-sm"
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
                autoComplete="additional-name"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors duration-200 text-sm"
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
                autoComplete="family-name"
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors duration-200 text-sm"
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
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors duration-200 text-sm"
                placeholder="e.g doctor123@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  className={`w-full px-4 py-2.5 ${password ? 'pr-12' : 'pr-4'} border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors duration-200 text-sm`}
                  placeholder="Min 8 chars, 1 uppercase, 1 number"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                />
                {password && (
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-600 to-teal-700 text-white py-2.5 px-4 rounded-lg font-medium hover:from-teal-700 hover:to-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-sm"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating account…
                </div>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="text-center pt-4 border-t border-gray-200">
            <span className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-teal-600 hover:text-teal-500 transition-colors">
                Sign in
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
