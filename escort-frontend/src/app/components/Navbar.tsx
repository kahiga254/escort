'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo Section */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="relative w-32 h-12 md:w-40 md:h-14">
                <Image
                  src="/Logo.png"
                  alt="Nairobi Escorts Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <span className="ml-2 text-lg md:text-xl font-bold text-red-700 hidden sm:inline">
                Nairobi Escorts
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links - Hidden on mobile */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href="/" 
              className="text-gray-700 hover:text-red-600 font-medium transition-colors text-sm lg:text-base"
            >
              Home
            </Link>
            
            <Link 
              href="/about" 
              className="text-gray-700 hover:text-red-600 font-medium transition-colors text-sm lg:text-base"
            >
              About
            </Link>
            
            <Link 
              href="/providers" 
              className="text-gray-700 hover:text-red-600 font-medium transition-colors text-sm lg:text-base"
            >
              Service Providers
            </Link>
            
            <div className="flex items-center space-x-4">
              <Link 
                href="/login" 
                className="px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium text-sm lg:text-base"
              >
                Login
              </Link>
              
              <Link 
                href="/register" 
                className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all font-medium text-sm lg:text-base"
              >
                Register
              </Link>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-4">
            <Link 
              href="/login" 
              className="px-3 py-1.5 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium text-sm"
            >
              Login
            </Link>
            
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-red-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-500"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {/* Hamburger icon */}
              {!isMenuOpen ? (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu, show/hide based on menu state */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                href="/"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-red-600 hover:bg-gray-50"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              
              <Link
                href="/about"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-red-600 hover:bg-gray-50"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              
              <Link
                href="/providers"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-red-600 hover:bg-gray-50"
                onClick={() => setIsMenuOpen(false)}
              >
                Service Providers
              </Link>
              
              <div className="pt-4 pb-2">
                <Link
                  href="/register"
                  className="block w-full text-center px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-medium hover:from-red-700 hover:to-red-800 transition-all"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Register as Provider
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}