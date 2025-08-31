'use client';

import Image from 'next/image';
import HeroImage from '@/assets/images/hero-image.webp';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

// Move locationSuggestions outside component to prevent re-creation on every render
const locationSuggestions = [
    'Mumbai', 'Bandra West', 'Andheri West', 'Juhu', 'Worli',
    'Bangalore', 'Koramangala', 'Whitefield', 'Electronic City',
    'Delhi', 'Connaught Place', 'Gurgaon', 'Pune', 'Koregaon Park',
    'Hinjewadi', 'Hyderabad', 'Hitech City', 'Chennai', 'T Nagar', 'Kolkata'
];

export default function Hero() {
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const router = useRouter();
    const searchRef = useRef<HTMLDivElement>(null);

    // Simple filtering - no loading states or delays
    useEffect(() => {
        if (searchQuery.trim()) {
            const filtered = locationSuggestions
                .filter(location => location.toLowerCase().includes(searchQuery.toLowerCase()))
                .slice(0, 5); // Limit to 5 like Google/YouTube
            setSuggestions(filtered);
            setShowSuggestions(filtered.length > 0);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    }, [searchQuery]);

    // Handle suggestion click
    const handleSuggestionClick = (suggestion: string) => {
        setSearchQuery(suggestion);
        setShowSuggestions(false);
        router.push(`/projects?location=${encodeURIComponent(suggestion)}`);
    };

    // Handle search form submission
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            setShowSuggestions(false);
            router.push(`/projects?location=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <section className="relative min-h-[80vh] max-h-[80vh] flex items-start justify-center pt-28 sm:pt-32 md:pt-36">
            {/* Background Image */}
            <div className="absolute inset-0 w-full h-full">
                <Image
                    src={HeroImage} 
                    alt="Maharashtra Cityscape"
                    width={1920}
                    height={1080}
                    className="w-full h-full object-cover"
                    priority
                    quality={95}
                />
            </div>
            
            {/* Content */}
            <div className="relative flex flex-col justify-start items-center text-center px-6 w-full mt-10 sm:mt-0">
                <h1 className="text-3xl md:text-5xl lg:text-5xl font-extrabold mb-10 max-w-4xl leading-tight font-serif text-gray-900 drop-shadow-lg">
                    India&apos;s Most Trusted &amp; <span className="bg-gradient-to-r from-[#2c3e50] via-[#8e44ad] to-[#e74c3c] bg-clip-text text-transparent font-bold ">Verified Real Estate Experts</span>
                </h1>
                
                {/* Search Bar */}
                <div ref={searchRef} className="relative w-full max-w-md mt-8">
                    <form onSubmit={handleSearch} className="flex items-center w-full">
                        <div className="relative w-full flex flex-row justify-center items-center">
                            <input 
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by city, area, or location..."
                                className="w-full py-3 px-4 pr-12 rounded-full bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-lg"
                                autoComplete="off"
                            />
                            <button 
                                type="submit"
                                className="absolute right-1 bg-[#E7C873] p-[11px] rounded-full hover:bg-yellow-500 transition-colors shadow-md"
                            >
                                {searchQuery.trim() ? (
                                    // Send icon when user has typed something
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                ) : (
                                    // Search icon when input is empty
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Simple Autocomplete Suggestions */}
                    {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                            {suggestions.map((suggestion, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => handleSuggestionClick(suggestion)}
                                    className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors text-gray-700 first:rounded-t-lg last:rounded-b-lg flex items-center justify-between"
                                >
                                    <span>{suggestion}</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7v10" />
                                    </svg>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}