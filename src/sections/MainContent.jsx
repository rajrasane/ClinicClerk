'use client';

import PropertyCard from "@/components/PropertyCard";
import { useState, useEffect } from "react";

export const MainContent = () => {
  const [trendingProperties, setTrendingProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrendingProperties = async () => {
      try {
        // Get curated trending property IDs from localStorage
        const savedTrending = localStorage.getItem('trendingProperties');
        let trendingIds = [1, 2, 3]; // Default to first 3 properties
        
        if (savedTrending) {
          trendingIds = JSON.parse(savedTrending);
        }

        // Fetch all properties
        const response = await fetch('/api/properties');
        const allProperties = await response.json();
        
        // Filter to only show curated trending properties
        const filteredProperties = allProperties.filter(property => 
          trendingIds.includes(property.p_id)
        );
        
        setTrendingProperties(filteredProperties);
      } catch (error) {
        console.error('Error fetching trending properties:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingProperties();
  }, []);

  return (
    <>
      {/* Dark Blue Background Section */}
      <div className="min-h-[70vh] lg:min-h-[70vh] w-full bg-[#0f172a] relative -mt-1">
        {/* Blue Radial Glow Background */}
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `radial-gradient(circle 600px at 50% 50%, rgba(59,130,246,0.3), transparent)`,
          }}
        />

        {/* Content */}
        <div className="relative z-10 pt-20 lg:pt-20 pb-16 px-5">
          <div className="max-w-7xl mx-auto">
            <header className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4">
                Our <span className="text-[#D4AF37]">Services</span>
              </h2>
              <p className="text-base text-gray-300 max-w-2xl mx-auto leading-relaxed">
                Comprehensive real estate solutions across multiple locations in India.
              </p>
            </header>

            {/* Featured Properties Preview */}
            {/* 
              To make the 3 cards responsive and center the 3rd card on md and lg screens,
              use flex-col for mobile, flex-row for md+, and center the 3rd card with mx-auto on md and lg.
            */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <div className="h-80 bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-8">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-6 mx-auto">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="font-bold text-gray-800 text-lg mb-2">REAL ESTATE</h3>
                    <h4 className="font-semibold text-blue-600 text-base mb-4">DOCUMENT EXPERTS</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Complete documentation support for all your property transactions
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <div className="h-80 bg-gradient-to-br from-green-50 to-emerald-100 flex flex-col items-center justify-center p-8">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-6 mx-auto">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <h3 className="font-bold text-gray-800 text-lg mb-2">DIVERSE INVESTMENTS</h3>
                    <h4 className="font-semibold text-green-600 text-base mb-4">IN REAL ESTATE</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Land, apartments, and commercial property solutions
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <div className="h-80 bg-gradient-to-br from-purple-50 to-pink-100 flex flex-col items-center justify-center p-8">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mb-6 mx-auto">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="font-bold text-gray-800 text-lg mb-2">TRUSTED ADVISORY</h3>
                    <h4 className="font-semibold text-purple-600 text-base mb-4">FINANCIAL GUIDANCE</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Expert financial advice and market insights for smart property investments
                    </p>
                  </div>
                </div>
              </div>
            </div>
            {/* End Featured Properties Preview */}
          </div>
        </div>
      </div>

      {/* Trending Properties Section */}
      <section className="min-h-screen w-full bg-gradient-to-br from-gray-50 via-white to-blue-50 relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 z-0">
          {/* Subtle grid pattern */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(to right, #3B82F6 1px, transparent 1px),
                linear-gradient(to bottom, #3B82F6 1px, transparent 1px)
              `,
              backgroundSize: "40px 40px",
            }}
          />
          {/* Floating shapes */}
          <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full opacity-20 blur-xl"></div>
          <div className="absolute bottom-20 right-10 w-24 h-24 bg-gradient-to-br from-yellow-200 to-orange-200 rounded-full opacity-20 blur-xl"></div>
          <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-gradient-to-br from-green-200 to-blue-200 rounded-full opacity-15 blur-lg"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 py-20 px-5">
          <div className="max-w-7xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-16">
              <h3 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Featured <span className="bg-gradient-to-r from-[#2c3e50] via-[#8e44ad] to-[#e74c3c] bg-clip-text text-transparent">Properties</span>
              </h3>
              <p className="text-base md:text-lg lg:xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Discover our most popular and in-demand properties, carefully curated for discerning buyers
              </p>
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#D4AF37] to-[#BFA14A] text-white px-6 py-2 rounded-full text-sm font-semibold mt-10">
                <span>🔥</span>
                <span>Trending Now</span>
              </div>
            </div>

            {/* Properties Grid */}
            <div className="mb-16">
              {loading ? (
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#D4AF37] to-[#BFA14A] rounded-full mb-6">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-white border-t-transparent"></div>
                  </div>
                  <h4 className="text-xl font-semibold text-gray-800 mb-2">Loading Amazing Properties</h4>
                  <p className="text-gray-600">Discovering the best properties for you...</p>
                </div>
              ) : trendingProperties.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {trendingProperties.map((property) => (
                    <PropertyCard key={property.p_id} property={property} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full mb-6">
                    <span className="text-4xl">🏠</span>
                  </div>
                  <h4 className="text-2xl font-semibold text-gray-800 mb-3">No Trending Properties</h4>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">We&apos;re currently updating our featured properties. Check back soon for amazing new listings!</p>
                  <button 
                    onClick={() => window.location.href = '/projects'}
                    className="inline-flex items-center gap-2 bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <span>Browse All Properties</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Call to Action Section */}
            <div className="text-center">
              <div className="bg-gradient-to-r from-[#2c3e50] via-[#8e44ad] to-[#e74c3c] rounded-3xl p-8 md:p-12 relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12"></div>
                </div>
                
                <div className="relative z-10">
                  <h4 className="text-2xl md:text-3xl font-bold text-white mb-4">
                    Ready to Find Your Dream Property?
                  </h4>
                  <p className="text-gray-200 mb-8 max-w-2xl mx-auto text-sm md:text-base lg:text-lg leading-relaxed">
                    Explore our complete collection of premium properties and find the perfect home that matches your lifestyle.
                  </p>
                  <a
                    href="/projects"
                    className="inline-flex items-center gap-3 bg-white text-gray-900 px-8 py-4 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:bg-gray-50"
                  >
                    <span className="text-base lg:text-lg">Explore All Properties</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
