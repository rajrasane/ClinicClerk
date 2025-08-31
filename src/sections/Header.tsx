'use client'
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from 'next/link';
import Logo from "@/assets/images/logo.png";
import MenuIcon from "@/assets/icons/menu-icon.png";
import CloseIcon from "@/assets/icons/close-icon.png";

const navLinks = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About Us" },
    { href: "/projects", label: "Our Projects" },
    { href: "/contact", label: "Contact Us" },
];

export const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [showCopyTooltip, setShowCopyTooltip] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleCopyPhone = async () => {
        try {
            await navigator.clipboard.writeText('02425 225660');
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch {
            console.error('Navigation error');
            const textArea = document.createElement('textarea');
            textArea.value = '02425 225660';
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        }
    };

    return (
        <header className={`
            fixed top-0 left-0 right-0 z-50
            flex flex-col md:flex-row items-center justify-between 
            px-6 py-4 bg-white transition-all duration-300
            ${isScrolled ? 'shadow-lg' : 'shadow-md'}
        `}>
            <div className="flex items-center justify-between w-full md:w-auto">
                <Link href="/" className="flex items-center gap-4 hover:opacity-90 transition ml-0 lg:ml-9">
                    <Image 
                        src={Logo} 
                        alt="Swadesh Properties Logo" 
                        width={100} 
                        height={50} 
                        className="h-12 w-auto"
                        priority
                    />
                    <span>
                    <h1 className="text-[17px] md:text-[17px] lg:text-xl font-extrabold text-red-700 tracking-wide mt-[1px] uppercase">
                        Swadesh Properties
                    </h1>
                    <hr className="my-1 text-gray-300" />
                    <p className="text-xs font-semibold text-gray-700 text-center">We Nurture Trust</p>
                    </span>
                </Link>
                <button 
                    className="md:hidden p-2 hover:bg-gray-50 rounded-full transition  cursor-pointer"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
                    aria-expanded={isMenuOpen}
                >
                    <Image 
                        src={isMenuOpen ? CloseIcon : MenuIcon} 
                        alt="Menu" 
                        className="h-[19px] w-[19px]" 
                    />
                </button>
            </div>
            <nav className={`
                w-full md:w-auto transition-all duration-300
                text-base md:text-[14.5px] lg:text-[16.5px] text-gray-700
                ${isMenuOpen ? 'block' : 'hidden md:block'}
                ${isMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 md:opacity-100 md:translate-y-0'}
            `}>
                <ul className="flex flex-col md:flex-row items-center  gap-5 md:gap-4 lg:gap-7 mt-4 md:mt-0 mr-0 lg:mr-9">
                    {navLinks.map(({ href, label }) => (
                        <li key={href}>
                            <Link 
                                href={href}
                                className="relative group hover:text-gray-900 transition"
                            >
                                {label}
                                <span className="absolute left-0 bottom-0 w-0 h-[2px] bg-red-700 transition-all duration-300 group-hover:w-full"></span>
                            </Link>
                        </li>
                    ))}
                    <li>
                        <div 
                            className="relative flex items-center gap-2 ml-0 md:ml-1 lg:ml-6 cursor-pointer group"
                            onMouseEnter={() => setShowCopyTooltip(true)}
                            onMouseLeave={() => setShowCopyTooltip(false)}
                            onClick={handleCopyPhone}
                        >
                            {/* Better Phone Icon */}
                            <svg 
                                className="w-6 h-6 text-gray-600 group-hover:text-red-700 transition-colors" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24" 
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth={2} 
                                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" 
                                />
                            </svg>
                            <span className="font-bold group-hover:text-red-700 transition-colors">
                                {copySuccess ? 'Copied!' : '02425 225660'}
                            </span>
                            
                            {/* Copy Tooltip */}
                            {showCopyTooltip && (
                                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                                    Click to copy
                                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
                                </div>
                            )}
                        </div>
                    </li>
                </ul>
            </nav>
        </header>
    );
};