'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  CheckCircleIcon, 
  CheckIcon,
  ShieldCheckIcon, 
  ClockIcon, 
  DevicePhoneMobileIcon,
  ChartBarIcon,
  UserGroupIcon,
  ArrowRightIcon,
  StarIcon
} from '@heroicons/react/24/outline';

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showAllFAQs, setShowAllFAQs] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect to dashboard
  }

  const features = [
    {
      icon: UserGroupIcon,
      title: "Patient Management",
      description: "Complete patient profiles with medical history, contact details, and visit tracking."
    },
    {
      icon: ClockIcon,
      title: "Visit Records",
      description: "Detailed visit logs with diagnoses, prescriptions, and medical notes for every consultation."
    },
    {
      icon: ShieldCheckIcon,
      title: "Data Security",
      description: "High-level encryption with multi-tenant architecture. Your data stays completely private."
    },
    {
      icon: CheckCircleIcon,
      title: "Excel/PDF Export",
      description: "Export patient data and visit records in Excel or PDF format for reports and referrals."
    },
    {
      icon: DevicePhoneMobileIcon,
      title: "Image Uploads",
      description: "Attach medical images, prescriptions, and documents directly to patient visit records."
    },
    {
      icon: ChartBarIcon,
      title: "Smart Search",
      description: "Quickly find patients by name, phone number, or filter visits by date ranges."
    }
  ];

  const plans = [
    {
      name: "Basic",
      price: "Free",
      period: "forever",
      description: "Perfect for getting started",
      features: [
        "Up to 50 patients",
        "Unlimited visits",
        "Basic search & filters",
        "Excel Export (3 per month)",
      ],
      cta: "Get Started Free",
      popular: false
    },
    {
      name: "Professional",
      price: "₹1,999",
      period: "per month",
      description: "Most popular for growing practices",
      features: [
        "Up to 2,000 patients",
        "Unlimited visits",
        "Basic search & filters",
        "Unlimited Excel/PDF export",
        "Image uploads for visits",
        "Prescription printing"
      ],
      cta: "Get Started",
      popular: true
    },
    {
      name: "Enterprise",
      price: "₹3,999",
      period: "per month",
      description: "For large practices & clinics",
      features: [
        "All features of Professional plan",
        "Unlimited patients",
        "Custom integrations",
        "24/7 phone support",
        "Dedicated account manager",
        "Access to our AI agents"
      ],
      cta: "Get Started",
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 overflow-x-hidden">
      {/* Navigation */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-white/20 fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4 relative">
            {/* Logo - Left */}
            <Link href="/" className="flex items-center gap-2 sm:gap-3">
              <Image 
                src="/logo.png" 
                alt="ClinicClerk Logo" 
                width={32}
                height={32}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg"
                priority
              />
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold">
                <span className="text-gray-900">Clinic</span>
                <span className="text-blue-800">Clerk</span>
              </h1>
            </Link>
            
            {/* Pricing - Center on sm/md/lg */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <Link 
                href="#pricing"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('pricing')?.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                  });
                }}
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors text-sm sm:text-base"
              >
                Pricing
              </Link>
            </div>
            
            {/* Navigation - Right */}
            <div className="flex items-center gap-2 sm:gap-4">
              <Link 
                href="/login"
                className="text-gray-700 hover:text-gray-900 font-medium transition-colors text-sm sm:text-base px-2 sm:px-0 border border-gray-300 sm:border-0 rounded-lg sm:rounded-none py-1.5 sm:py-0"
              >
                Sign In
              </Link>
              <Link 
                href="/signup"
                className="hidden sm:inline-flex bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 text-sm sm:text-base whitespace-nowrap"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-12 sm:py-16 lg:py-24 pt-20 sm:pt-24 lg:pt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 lg:gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center md:text-left"
            >
              <h1 className="text-3xl sm:text-4xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
                Smart Patient Management for{' '}
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent block sm:inline">
                  Indian Doctors
                </span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8 max-w-2xl md:max-w-none mx-auto md:mx-0">
                <span className="sm:hidden">Digital patient records made easy. Store patient details, track visits, and manage your clinic efficiently.</span>
                <span className="hidden sm:block">Digital patient records made easy. Store patient details, track visits, and manage your clinic efficiently - all in one secure platform designed for Indian medical practices.</span>
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center md:justify-start items-center">
              <Link 
                href="/signup"
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                Start For Free
                <ArrowRightIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
              <Link 
                href="/login"
                className="w-full sm:w-auto bg-white/90 backdrop-blur-md text-gray-700 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold hover:bg-white transition-all duration-200 border border-white/20 text-sm sm:text-base"
              >
                Sign In
              </Link>
            </div>
            
            {/* Doctor Image for SM screens - below description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="hidden sm:flex md:hidden justify-center items-center mt-6"
            >
              <div className="relative">
                <div className="w-48 h-48 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center">
                  <div className="w-40 h-40 rounded-full overflow-hidden shadow-lg">
                    <Image
                      src="/smiling-doctor.jpg"
                      alt="Smiling Indian Doctor using ClinicClerk"
                      width={160}
                      height={160}
                      className="w-full h-full object-cover"
                      priority
                    />
                  </div>
                </div>
                {/* Floating elements - smaller for sm */}
                <div className="absolute -top-1 -right-1 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="absolute -bottom-1 -left-1 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
              </div>
            </motion.div>
            </motion.div>
            
            {/* Doctor Image for MD+ screens - side by side */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="hidden md:flex justify-center items-center"
            >
              <div className="relative">
                <div className="w-72 h-72 md:w-80 md:h-80 lg:w-96 lg:h-96 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center">
                  {/* Doctor Image */}
                  <div className="w-60 h-60 md:w-64 md:h-64 lg:w-80 lg:h-80 rounded-full overflow-hidden shadow-lg">
                    <Image
                      src="/smiling-doctor.jpg"
                      alt="Smiling Indian Doctor using ClinicClerk"
                      width={320}
                      height={320}
                      className="w-full h-full object-cover"
                      priority
                    />
                  </div>
                </div>
                {/* Floating elements */}
                <div className="absolute -top-2 -right-2 md:-top-4 md:-right-4 w-12 h-12 md:w-16 md:h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 md:w-8 md:h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="absolute -bottom-2 -left-2 md:-bottom-4 md:-left-4 w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 md:w-6 md:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-12 sm:py-16 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-8 sm:mb-12"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
              Why Choose ClinicClerk?
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-center p-6 bg-white/80 rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Lightning Fast</h3>
              <p className="text-sm text-gray-600">Access patient records instantly</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-center p-6 bg-white/80 rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">100% Secure</h3>
              <p className="text-sm text-gray-600">Your data is encrypted & private</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="text-center p-6 bg-white/80 rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">No Setup Required</h3>
              <p className="text-sm text-gray-600">Start using immediately - no installation or training needed</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="text-center p-6 bg-white/80 rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Cost Effective</h3>
              <p className="text-sm text-gray-600">Affordable for solo practitioners</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-8 sm:mb-12 lg:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
              Everything You Need for Modern Practice
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto px-4">
              Comprehensive features designed to streamline your medical practice and improve patient care.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white/90 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/20 hover:shadow-xl transition-all duration-300"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
                  <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base text-gray-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-12 sm:py-16 lg:py-20 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-8 sm:mb-12"
          >
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto px-4">
              Choose the plan that fits your practice size and needs.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 lg:p-8 border transition-all duration-300 hover:shadow-xl relative ${
                  plan.popular 
                    ? 'bg-white/95 backdrop-blur-md border-blue-300 ring-2 ring-blue-500 md:transform md:scale-105' 
                    : 'bg-white/90 backdrop-blur-md border-white/20'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-1.5 rounded-full text-xs font-semibold shadow-lg">Most Valuable</span>
                  </div>
                )}
                
                <div className="text-center p-3 sm:p-4 md:p-6 lg:p-8">
                  <h3 className={`text-lg sm:text-xl md:text-xl lg:text-2xl font-bold mb-2 ${
                    plan.popular ? 'text-blue-900' : 'text-gray-900'
                  }`}>{plan.name}</h3>
                  <div className="mb-4">
                    <span className={`text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-bold ${
                      plan.popular ? 'text-blue-900' : 'text-gray-900'
                    }`}>{plan.price}</span>
                    {plan.price !== "Free" && <span className="text-gray-600 ml-1 text-sm sm:text-base">/{plan.period}</span>}
                  </div>
                  <p className="text-gray-600 mb-4 sm:mb-5 md:mb-6 lg:mb-8 text-sm sm:text-base">{plan.description}</p>
                  
                  <ul className="space-y-2 sm:space-y-2.5 md:space-y-3 lg:space-y-4 mb-4 sm:mb-5 md:mb-6 lg:mb-8 text-left">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <CheckIcon className={`h-4 w-4 sm:h-5 sm:w-5 mt-1 sm:mt-0.5 flex-shrink-0 ${
                          plan.popular ? 'text-blue-600' : 'text-green-500'
                        }`} />
                        <span className="text-gray-700 text-xs sm:text-sm md:text-sm lg:text-base">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <button className={`w-full py-2.5 sm:py-3 md:py-3 lg:py-4 px-4 sm:px-5 md:px-6 rounded-lg sm:rounded-xl font-semibold transition-all duration-200 text-sm sm:text-base md:text-base lg:text-lg ${
                    plan.popular 
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl' 
                      : plan.name === 'Basic'
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}>
                    {plan.cta}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="text-center mt-6 sm:mt-8"
          >
            <p className="text-sm sm:text-base text-gray-600 ">🚀 Currently in Beta</p>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-8 sm:mb-12"
          >
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Trusted by Doctors Across India
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              See what medical professionals are saying about ClinicClerk
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                name: "Dr. Priya Sharma",
                title: "General Physician, Mumbai",
                image: "/testimonial-1.jpg",
                rating: 5,
                quote: "ClinicClerk has transformed my practice! I can now access any patient's history instantly. The interface is so intuitive that I started using it from day one without any training."
              },
              {
                name: "Dr. Rajesh Kumar",
                title: "Pediatrician, Delhi",
                image: "/testimonial-2.jpg", 
                rating: 5,
                quote: "The image upload feature is fantastic for tracking children's growth charts and vaccination records. My patients' parents love how organized everything is now."
              },
              {
                name: "Dr. Meera Patel",
                title: "Dermatologist, Bangalore",
                image: "/testimonial-3.jpg",
                rating: 5,
                quote: "Being able to export patient data for referrals has saved me hours every week. The security features give me complete peace of mind about patient privacy."
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white/90 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarIcon key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <blockquote className="text-gray-700 mb-6 text-sm sm:text-base leading-relaxed">
                  &quot;{testimonial.quote}&quot;
                </blockquote>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm sm:text-base">{testimonial.name}</div>
                    <div className="text-gray-600 text-xs sm:text-sm">{testimonial.title}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-8 sm:mb-12"
          >
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg sm:text-xl text-gray-600">
              Everything you need to know about ClinicClerk
            </p>
          </motion.div>

          <div className="space-y-4 sm:space-y-6">
            {[
              {
                question: "Is my patient data secure and private?",
                answer: "Absolutely. We use high-level encryption and multi-tenant architecture to ensure your data is completely isolated and secure. Your patient information is never shared with anyone and remains 100% private to your practice."
              },
              {
                question: "Do I need any technical knowledge to use ClinicClerk?",
                answer: "Not at all! ClinicClerk is designed to be intuitive and user-friendly. You can start using it immediately without any training or technical setup. If you can use WhatsApp, you can use ClinicClerk."
              },
              {
                question: "Can I export my patient data if needed?",
                answer: "Yes, you have complete control over your data. You can export patient records and visit details in Excel or PDF format anytime. This is useful for referrals, reports, or if you ever want to switch systems."
              },
              {
                question: "How does the free Basic plan work?",
                answer: "The Basic plan is completely free forever for up to 50 patients. It includes unlimited visits, basic search, and 3 Excel exports per month. Perfect for new practices or doctors wanting to try the system."
              },
              {
                question: "What happens if I exceed my plan limits?",
                answer: "We'll notify you before you reach your limits. You can easily upgrade your plan anytime. For the Basic plan, you can upgrade to Professional to add more patients and unlock additional features."
              },
              {
                question: "Is there a mobile app available?",
                answer: "ClinicClerk works perfectly on mobile browsers with a responsive design optimized for phones and tablets. You can access all features from any device with an internet connection."
              },
              {
                question: "Can I cancel my subscription anytime?",
                answer: "Yes, you can cancel anytime with no questions asked. We also offer a 30-day money-back guarantee on all paid plans. Your data remains accessible even after cancellation."
              },
              {
                question: "Do you provide customer support?",
                answer: "Yes! We provide email support for all users and phone support for Professional and Enterprise plans. Our team is here to help you get the most out of ClinicClerk."
              }
            ].slice(0, showAllFAQs ? 8 : 4).map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white/90 backdrop-blur-md rounded-xl p-4 sm:p-6 border border-white/20 hover:shadow-lg transition-all duration-300"
              >
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                  {faq.question}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  {faq.answer}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Load More Button */}
          {!showAllFAQs && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              viewport={{ once: true }}
              className="text-center mt-8"
            >
              <button
                onClick={() => setShowAllFAQs(true)}
                className="bg-white border-2 border-blue-600 text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-200"
              >
                Load More FAQs
              </button>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            viewport={{ once: true }}
            className="text-center mt-8 sm:mt-12"
          >
            <p className="text-base sm:text-lg text-gray-600 mb-4">
              Still have questions?
            </p>
            <Link 
              href="mailto:support@clinicclerk.com"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
            >
              Contact Support
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Demo/Trial Section */}
      <section className="py-12 sm:py-16 bg-white/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left side - Demo info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
                Try ClinicClerk Risk-Free
              </h2>
              <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8">
                Experience the power of digital patient management with our interactive demo or start your free trial today.
              </p>
              
              <div className="space-y-4 mb-6 sm:mb-8">
                <div className="flex items-start gap-3">
                  <CheckCircleIcon className="w-6 h-6 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Interactive Demo</h3>
                    <p className="text-gray-600 text-sm">Explore all features with sample data - no signup required</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircleIcon className="w-6 h-6 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Free Basic Plan</h3>
                    <p className="text-gray-600 text-sm">Start with up to 50 patients completely free - no time limits</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircleIcon className="w-6 h-6 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">No Credit Card Required</h3>
                    <p className="text-gray-600 text-sm">Start immediately - upgrade only when you&rsquo;re ready</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Link 
                  href="/demo"
                  className="flex-1 sm:flex-none bg-white border-2 border-blue-600 text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-200 text-center"
                >
                  View Live Demo
                </Link>
                <Link 
                  href="/signup"
                  className="flex-1 sm:flex-none bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 text-center"
                >
                  Start For Free
                </Link>
              </div>
            </motion.div>

            {/* Right side - Actual Screenshot */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="bg-white/90 backdrop-blur-md rounded-2xl p-3 border border-white/20 shadow-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <div className="flex-1 bg-gray-100 rounded px-3 py-1 text-xs text-gray-600">
                    clinicclerk.com
                  </div>
                </div>
                
                {/* Actual ClinicClerk Screenshot */}
                <div className="rounded-lg overflow-hidden">
                  <Image
                    src="/site_screenshot.png"
                    alt="ClinicClerk Dashboard Screenshot"
                    width={600}
                    height={400}
                    className="w-full h-auto object-cover"
                    priority
                  />
                </div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute -top-2 -right-2 sm:-top-4 sm:-right-4 w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center shadow-lg">
                <CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12 text-white"
          >
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
              Ready to Modernize Your Practice?
            </h2>
            <p className="text-lg sm:text-xl mb-6 sm:mb-8 opacity-90">
              Join the beta and help shape the future of digital medical records.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Link 
                href="/signup"
                className="w-full sm:w-auto bg-white text-blue-600 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200 flex items-center justify-center gap-2 text-base sm:text-lg"
              >
                Start For Free
                <ArrowRightIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
              <Link 
                href="/login"
                className="w-full sm:w-auto border-2 border-white text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold hover:bg-white/10 transition-all duration-200 text-base sm:text-lg"
              >
                Sign In
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            {/* Company Info */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <Image 
                  src="/logo.png" 
                  alt="ClinicClerk Logo" 
                  width={32}
                  height={32}
                  className="rounded-lg"
                />
                <h3 className="text-xl font-bold">
                  <span className="text-white">Clinic</span>
                  <span className="text-blue-400">Clerk</span>
                </h3>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                Digital patient management made simple for Indian doctors. Secure, intuitive, and designed specifically for solo medical practices.
              </p>
              <div className="flex gap-4">
                <Link href="mailto:support@clinicclerk.com" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </Link>
                <Link href="tel:+91-9876543210" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Product Links */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><Link href="/features" className="text-gray-400 hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/security" className="text-gray-400 hover:text-white transition-colors">Security</Link></li>
                <li><Link href="/integrations" className="text-gray-400 hover:text-white transition-colors">Integrations</Link></li>
              </ul>
            </div>

            {/* Support Links */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                <li><Link href="/help" className="text-gray-400 hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="/contact" className="text-gray-400 hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-gray-400 hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-gray-400 text-sm mb-4 md:mb-0">
                <p>&copy; 2025 ClinicClerk. Built with ❤️ for modern medical practices in India.</p>
              </div>
              {/* <div className="flex items-center gap-6 text-sm">
                <p className="text-gray-400">🇮🇳 Made in India</p>
              </div> */}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
