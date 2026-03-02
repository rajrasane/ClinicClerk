'use client';

import React, { useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  ArrowDownTrayIcon,
  CheckIcon,
  ShieldCheckIcon,
  ClockIcon,
  PhotoIcon,
  ChartBarIcon,
  UserGroupIcon,
  ArrowRightIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useRef } from 'react';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

// Animated section wrapper
function AnimatedSection({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={staggerContainer}
      className={className}
    >
      {children}
    </motion.div>
  );
}

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-100">
        <div className="text-lg">Loading…</div>
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
      icon: ArrowDownTrayIcon,
      title: "Excel/PDF Export",
      description: "Export patient data and visit records in Excel or PDF format for reports and referrals."
    },
    {
      icon: PhotoIcon,
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
        "Up to 3 visits per patient",
        "Basic search & filters",
        "Excel Export (3 per month)",
      ],
      cta: "Try for Free",
      popular: false
    },
    {
      name: "Professional",
      price: "₹399",
      period: "per month",
      description: "Most popular for growing practices",
      features: [
        "Up to 250 patients",
        "Unlimited visits",
        "Advance search & filters",
        "Unlimited Excel/PDF export",
        "Image uploads for visits",
        "Prescription printing"
      ],
      cta: "Get Started",
      popular: true
    },
    {
      name: "Enterprise",
      price: "₹899",
      period: "per month",
      description: "For large practices & clinics",
      features: [
        "All features of Professional plan",
        "Unlimited patients",
        "Custom integrations",
        "24/7 support",
        "Dedicated account management",
        "Early Access to our upcoming AI agents"
      ],
      cta: "Get Started",
      popular: false,
      premium: true
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100 overflow-x-hidden">
      {/* Navigation */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-white/20 fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4 relative">
            {/* Logo - Left */}
            <Link href="/" className="flex items-center gap-2 sm:gap-3">
              <Image
                src="/logo.png"
                alt="ClinicClerk Logo"
                width={80}
                height={80}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg"
                priority
                quality={100}
              />
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold">
                <span className="text-gray-900">Clinic</span>
                <span className="text-teal-700">Clerk</span>
              </h1>
            </Link>

            {/* Pricing - Center on md/lg only */}
            <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2">
              <Link
                href="#pricing"
                onClick={(e) => {
                  e.preventDefault();
                  const element = document.getElementById('pricing');
                  if (element) {
                    const yOffset = -24; // Adjust this value as needed
                    const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
                    window.scrollTo({ top: y, behavior: 'smooth' });
                  }
                }}
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors text-base"
              >
                Pricing
              </Link>
            </div>

            {/* Navigation - Right */}
            <div className="flex items-center gap-4 sm:gap-4">
              {/* Pricing for small screens - next to Sign In */}
              <Link
                href="#pricing"
                onClick={(e) => {
                  e.preventDefault();
                  const element = document.getElementById('pricing');
                  if (element) {
                    const yOffset = -24; // Adjust this value as needed
                    const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
                    window.scrollTo({ top: y, behavior: 'smooth' });
                  }
                }}
                className="md:hidden text-green-600 hover:text-green-700 font-medium transition-colors text-sm"
              >
                Pricing
              </Link>
              <Link
                href="/login"
                className="text-gray-700 hover:text-gray-900 font-medium transition-colors text-sm sm:text-base px-2 sm:px-0 border border-gray-300 sm:border-0 rounded-lg sm:rounded-none py-1.5 sm:py-0"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="hidden sm:inline-flex bg-gradient-to-r from-teal-600 to-teal-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium hover:from-teal-700 hover:to-teal-800 transition-colors duration-200 text-sm sm:text-base whitespace-nowrap"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Extended to fill viewport */}
      <section className="relative min-h-[calc(100vh-80px)] py-16 sm:py-20 lg:py-34 pt-24 sm:pt-28 lg:pt-45 flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 lg:gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center md:text-left"
            >
              <h1 className="font-display text-3xl sm:text-4xl md:text-4xl lg:text-5xl xl:text-6xl text-gray-900 mb-4 sm:mb-6 leading-tight">
                Smart Patient Management for{' '}
                <span className="bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent block sm:inline">
                  Indian Doctors
                </span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8 max-w-2xl md:max-w-none mx-6 md:mx-0 text-balanced">
                <span className="sm:hidden">Digital patient records made easy. Store patient details, track visits, and manage your clinic efficiently.</span>
                <span className="hidden sm:block">Digital patient records made easy. Store patient details, track visits, and manage your clinic efficiently - all in one secure platform designed for Indian medical practices.</span>
              </p>

              {/* Doctor Image for mobile screens - above buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex md:hidden justify-center items-center mb-6"
              >
                <div className="relative">
                  <div className="w-56 h-56 bg-gradient-to-br from-teal-100 to-indigo-200 rounded-full flex items-center justify-center">
                    <div className="w-48 h-48 rounded-full overflow-hidden shadow-lg">
                      <Image
                        src="/smiling-doctor.webp"
                        alt="Smiling Indian Doctor using ClinicClerk"
                        width={160}
                        height={160}
                        className="w-full h-full object-cover"
                        priority
                      />
                    </div>
                  </div>
                  {/* Floating elements - smaller for sm */}
                  <div className="absolute -top-1 -right-1 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

              {/* Buttons section - below doctor image on mobile */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center md:justify-start items-center">
                <Link
                  href="/signup"
                  className="w-full sm:w-auto bg-gradient-to-r from-teal-600 to-teal-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold hover:from-teal-700 hover:to-teal-800 transition-colors duration-200 flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  Start For Free
                  <ArrowRightIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
                <Link
                  href="/login"
                  className="w-full sm:w-auto bg-white/90 backdrop-blur-md text-gray-700 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold hover:bg-white transition-colors duration-200 border border-white/20 text-sm sm:text-base"
                >
                  Sign In
                </Link>
              </div>
            </motion.div>

            {/* Doctor Image for MD+ screens - side by side */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="hidden md:flex justify-center items-center"
            >
              <div className="relative">
                <div className="w-72 h-72 md:w-80 md:h-80 lg:w-96 lg:h-96 bg-gradient-to-br from-teal-100 to-blue-200 rounded-full flex items-center justify-center">
                  {/* Doctor Image */}
                  <div className="w-60 h-60 md:w-64 md:h-64 lg:w-80 lg:h-80 rounded-full overflow-hidden shadow-lg">
                    <Image
                      src="/smiling-doctor.webp"
                      alt="Smiling Indian Doctor using ClinicClerk"
                      width={320}
                      height={320}
                      className="w-full h-full object-cover object-top"
                      priority
                    />
                  </div>
                </div>
                {/* Floating elements */}
                <div className="absolute -top-2 -right-2 md:-top-4 md:-right-4 w-12 h-12 md:w-16 md:h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 md:w-8 md:h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      <section className="py-12 sm:py-16 bg-white/50" style={{ willChange: 'transform' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
              Why Choose ClinicClerk?
            </h2>
          </div>
          <AnimatedSection className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6 sm:gap-8 sm:[&>*:nth-child(3)]:col-start-1 sm:[&>*:nth-child(3)]:col-end-3 sm:[&>*:nth-child(3)]:justify-self-center sm:[&>*:nth-child(3)]:w-full sm:[&>*:nth-child(3)]:max-w-sm md:[&>*:nth-child(3)]:col-start-auto md:[&>*:nth-child(3)]:col-end-auto md:[&>*:nth-child(3)]:justify-self-auto md:[&>*:nth-child(3)]:max-w-none lg:[&>*:nth-child(3)]:col-start-auto lg:[&>*:nth-child(3)]:col-end-auto lg:[&>*:nth-child(3)]:justify-self-auto lg:[&>*:nth-child(3)]:max-w-none">
            <motion.div variants={fadeInUp} className="text-center p-6 bg-white/80 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Lightning Fast</h3>
              <p className="text-sm text-gray-600">Access patient records instantly</p>
            </motion.div>
            <motion.div variants={fadeInUp} className="text-center p-6 bg-white/80 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">No Setup Required</h3>
              <p className="text-sm text-gray-600">Start using immediately - no installation or training needed</p>
            </motion.div>
            <motion.div variants={fadeInUp} className="text-center p-6 bg-white/80 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-purple-600">₹</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Cost Effective</h3>
              <p className="text-sm text-gray-600">Affordable for solo practitioners</p>
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 lg:py-20" style={{ willChange: 'transform' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
              Everything You Need for Modern Practice
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto px-4">
              Comprehensive features designed to streamline your medical practice and improve patient care.
            </p>
          </div>

          <AnimatedSection className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="bg-white/90 rounded-2xl p-4 sm:p-6 border border-white/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-teal-600 to-teal-700 rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h3 className="text-sm sm:text-lg lg:text-xl font-semibold text-gray-900 mb-1 sm:mb-2 lg:mb-3">
                  {feature.title}
                </h3>
                <p className="text-xs sm:text-sm lg:text-base text-gray-600 leading-tight sm:leading-normal">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </AnimatedSection>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-12 sm:py-16 lg:py-20 bg-white/50" style={{ willChange: 'transform' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto px-4">
              Choose the plan that fits your practice size and needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <React.Fragment key={plan.name}>
                {/* Mobile divider - only show between cards on small screens */}
                {index > 0 && (
                  <div className="md:hidden flex justify-center -mb-2">
                    <div className="w-36 h-px bg-gray-300"></div>
                  </div>
                )}

                <div className="relative">
                  <div
                    className={`mt-2 md:mt-0 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 lg:p-8 border transition-colors duration-300 hover:shadow-xl relative ${plan.popular
                      ? 'bg-white/95 border-teal-300 ring-2 ring-teal-500 md:transform md:scale-105'
                      : plan.premium
                        ? 'bg-white/95 border-gray-800 ring-2 ring-gray-800 md:transform md:scale-105'
                        : 'bg-white/90 border-white/20'
                      }`}
                    style={{ willChange: 'transform' }}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-gradient-to-r from-teal-600 to-teal-700 text-white px-4 py-1.5 rounded-full text-xs font-semibold shadow-lg">Most Popular</span>
                      </div>
                    )}
                    {plan.premium && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-gradient-to-r from-gray-900 to-black text-white px-4 py-1.5 rounded-full text-xs font-semibold shadow-lg">Most Valued</span>
                      </div>
                    )}

                    <div className="text-center p-3 sm:p-4 md:p-6 lg:p-8">
                      <h3 className={`text-lg sm:text-xl md:text-xl lg:text-2xl font-bold mb-2 ${plan.popular ? 'text-teal-800' : plan.premium ? 'text-gray-900' : 'text-gray-900'
                        }`}>{plan.name}</h3>
                      <div className="mb-4">
                        <span className={`text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-bold ${plan.popular ? 'text-teal-800' : plan.premium ? 'text-gray-900' : 'text-gray-900'
                          }`}>{plan.price}</span>
                        {plan.price !== "Free" && <span className="text-gray-600 ml-1 text-sm sm:text-base">/{plan.period}</span>}
                      </div>
                      <p className="text-gray-600 mb-4 sm:mb-5 md:mb-6 lg:mb-8 text-sm sm:text-base">{plan.description}</p>

                      <ul className="space-y-2 sm:space-y-2.5 md:space-y-3 lg:space-y-4 mb-4 sm:mb-5 md:mb-6 lg:mb-8 text-left">
                        {plan.features.map((feature, featureIndex) => {
                          if (plan.name === 'Enterprise' && featureIndex === 0) {
                            return (
                              <div key={featureIndex} className="mb-2">
                                <li className="flex items-start gap-2 sm:gap-3">
                                  <div className={`h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-5 lg:w-5 mt-0 sm:mt-0.5 lg:mt-1 flex-shrink-0 rounded-full flex items-center justify-center ${plan.premium && featureIndex === 0 ? 'bg-teal-100' : ''
                                    }`}>
                                    <CheckIcon className={`h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 lg:h-4 lg:w-4 ${plan.popular ? 'text-teal-600' : plan.premium && featureIndex === 0 ? 'text-teal-600' : plan.premium ? 'text-gray-700' : 'text-green-500'
                                      }`} />
                                  </div>
                                  <span className="text-gray-700 text-xs sm:text-sm md:text-sm lg:text-base leading-tight sm:leading-normal">{feature}</span>
                                </li>
                                <div className="flex justify-center my-1">
                                  <div className="h-5 w-5 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
                                    <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return (
                            <li key={featureIndex} className="flex items-start gap-2 sm:gap-3">
                              <CheckIcon className={`h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 mt-0 sm:mt-0.5 flex-shrink-0 ${plan.popular ? 'text-teal-600' : plan.premium ? 'text-gray-700' : 'text-green-500'
                                }`} />
                              <span className="text-gray-700 text-xs sm:text-sm md:text-sm lg:text-base leading-tight sm:leading-normal">{feature}</span>
                            </li>
                          );
                        })}
                      </ul>

                      <button className={`w-full py-2.5 sm:py-3 md:py-3 lg:py-4 px-4 sm:px-5 md:px-6 rounded-lg sm:rounded-xl font-semibold transition-colors duration-200 text-sm sm:text-base md:text-base lg:text-lg ${plan.popular
                        ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white hover:from-teal-700 hover:to-teal-800 shadow-lg hover:shadow-xl'
                        : plan.premium
                          ? 'bg-gradient-to-r from-gray-900 to-black text-white hover:from-gray-800 hover:to-gray-900 shadow-lg hover:shadow-xl'
                          : plan.name === 'Basic'
                            ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl'
                            : plan.name === 'Enterprise'
                              ? 'border-2 bg-gray-800 text-white hover:shadow-lg'
                              : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                        }`}>
                        {plan.cta}
                      </button>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>

        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-12 sm:py-16 lg:py-20" style={{ willChange: 'transform' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Trusted by Doctors Across India
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              See what medical professionals are saying about ClinicClerk
            </p>
          </div>

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
              <div
                key={index}
                className="bg-white/90 rounded-2xl p-6 border border-white/20 hover:shadow-xl transition-colors duration-300"
                style={{ willChange: 'transform' }}
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
                  <div className="w-12 h-12 bg-gradient-to-br from-teal-100 to-cyan-200 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm sm:text-base">{testimonial.name}</div>
                    <div className="text-gray-600 text-xs sm:text-sm">{testimonial.title}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-4xl mx-auto px-10 sm:px-10 lg:px-8">
        <div className="h-px bg-gray-300"></div>
      </div>

      {/* FAQ Section */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg sm:text-xl text-gray-600">
              Everything you need to know about ClinicClerk
            </p>
          </div>

          <div className="bg-white/90 rounded-2xl border border-white/20 shadow-lg">
            <Accordion type="single" collapsible className="w-full">
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
                <AccordionItem key={`faq-${index}`} value={`faq-${index}`} className="border-b border-gray-200 last:border-b-0">
                  <AccordionTrigger className="text-left px-6 py-4 hover:no-underline hover:bg-gray-50/50 transition-colors">
                    <span className="text-base sm:text-lg font-semibold text-gray-900 pr-4">
                      {faq.question}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 pt-0">
                    <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                      {faq.answer}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Load More Button */}
          {!showAllFAQs && (
            <div className="text-center mt-8">
              <button
                onClick={() => setShowAllFAQs(true)}
                className="bg-white border-2 border-teal-600 text-teal-600 px-6 py-3 rounded-xl font-semibold hover:bg-teal-50 transition-colors duration-200"
              >
                Load More FAQs
              </button>
            </div>
          )}

          <div className="text-center mt-8 sm:mt-12">
            <p className="text-base sm:text-lg text-gray-600 mb-4">
              Still have questions?
            </p>
            <Link
              href="mailto:support@clinicclerk.com"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-600 to-teal-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-teal-700 hover:to-teal-800 transition-colors duration-200"
            >
              Contact Support
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-4xl mx-auto px-10 sm:px-10 lg:px-8">
        <div className="h-px bg-gray-300"></div>
      </div>

      {/* Demo/Trial Section */}
      {/* <section className="py-12 sm:py-16 bg-white/50" style={{ willChange: 'transform' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div>
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
                  className="flex-1 sm:flex-none bg-white border-2 border-teal-600 text-teal-600 px-6 py-3 rounded-xl font-semibold hover:bg-teal-50 transition-colors duration-200 text-center"
                >
                  View Live Demo
                </Link>
                <Link
                  href="/signup"
                  className="flex-1 sm:flex-none bg-gradient-to-r from-teal-600 to-teal-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-teal-700 hover:to-teal-800 transition-colors duration-200 text-center"
                >
                  Start For Free
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white/90 rounded-2xl p-3 border border-white/20 shadow-xl" style={{ willChange: 'transform' }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <div className="flex-1 bg-gray-100 rounded px-3 py-1 text-xs text-gray-600">
                    clinicclerk.com
                  </div>
                </div>

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

              <div className="absolute -top-2 -right-2 sm:-top-4 sm:-right-4 w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center shadow-lg">
                <CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>
      </section> */}

      {/* CTA Section */}
      <section className="py-12 sm:py-16 lg:py-20" style={{ willChange: 'transform' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12 text-white" style={{ willChange: 'transform' }}>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
              Ready to Modernize Your Practice?
            </h2>
            <p className="text-lg sm:text-xl mb-6 sm:mb-8 opacity-90">
              Join the beta and help shape the future of digital medical records.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Link
                href="/signup"
                className="w-full sm:w-auto bg-white text-teal-700 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center gap-2 text-base sm:text-lg"
              >
                Start For Free
                <ArrowRightIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto border-2 border-white text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold hover:bg-white/10 transition-colors duration-200 text-base sm:text-lg"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Beta Notice */}
      <div className="py-6 sm:py-6 text-center">
        <div className="mb-8 sm:mb-12">
          <span className="inline-flex items-center gap-2 border-2 border-orange-400 bg-orange-50 text-orange-700 px-4 py-2 rounded-full text-sm font-semibold shadow-sm">
            🚀 Currently in Beta
          </span>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 sm:py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
            {/* Company Info */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <Image
                  src="/logo.png"
                  alt="ClinicClerk Logo"
                  width={56}
                  height={56}
                  className="w-7 h-7 rounded-lg"
                  quality={100}
                />
                <h3 className="text-lg sm:text-xl font-bold">
                  <span className="text-white">Clinic</span>
                  <span className="text-teal-400">Clerk</span>
                </h3>
              </div>
              <p className="text-gray-400 text-sm sm:text-base mb-4 sm:mb-6 max-w-md leading-relaxed">
                Digital patient management made simple for Indian doctors. Secure, intuitive, and designed specifically for solo medical practices.
              </p>
              <div className="flex gap-3 sm:gap-4">
                <Link href="mailto:support@clinicclerk.com" className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </Link>
                <Link href="tel:+91-9876543210" className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                </Link>
                <Link href="https://twitter.com/clinicclerk" className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Product and Support Links - Side by side on mobile */}
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-6 lg:gap-0 lg:contents">
              {/* Product Links */}
              <div>
                <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-white">Product</h4>
                <ul className="space-y-2 sm:space-y-3">
                  <li><Link href="/features" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base block py-1">Features</Link></li>
                  <li><Link
                    href="#pricing"
                    onClick={(e) => {
                      e.preventDefault();
                      const element = document.getElementById('pricing');
                      if (element) {
                        const yOffset = -24;
                        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
                        window.scrollTo({ top: y, behavior: 'smooth' });
                      }
                    }}
                    className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base block py-1">Pricing</Link></li>
                  <li><Link href="/security" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base block py-1">Security</Link></li>
                  <li><Link href="/demo" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base block py-1">Live Demo</Link></li>
                </ul>
              </div>

              {/* Support Links */}
              <div>
                <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-white">Support</h4>
                <ul className="space-y-2 sm:space-y-3">
                  <li><Link href="/help" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base block py-1">Help Center</Link></li>
                  <li><Link href="/contact" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base block py-1">Contact Us</Link></li>
                  <li><Link href="/privacy" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base block py-1">Privacy Policy</Link></li>
                  <li><Link href="/terms" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base block py-1">Terms of Service</Link></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 pt-6 sm:pt-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
              <div className="text-gray-400 text-xs sm:text-sm text-center sm:text-left">
                <p>
                  <span className="block sm:inline">&copy; {new Date().getFullYear()} ClinicClerk.</span>{' '}
                  <span className="block sm:inline mt-1 sm:mt-0">
                    Built with{' '}
                    <Image src="/heart.svg" alt="Love" width={16} height={16} className="inline-block align-middle" />{' '}
                    for modern medical practices in India.
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
