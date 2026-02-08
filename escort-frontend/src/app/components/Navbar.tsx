'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  // Check if user is logged in on component mount and when pathname changes
  useEffect(() => {
    checkAuthStatus();
  }, [pathname]);

  const checkAuthStatus = () => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      const parsedUser = JSON.parse(userData);
      setIsLoggedIn(true);
      setUser(parsedUser);
      
      // If user is admin and on user dashboard, redirect to admin dashboard
      if (parsedUser.role === 'admin' && pathname === '/dashboard') {
        router.push('/admin');
      }
    } else {
      setIsLoggedIn(false);
      setUser(null);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    // Clear local storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Update state
    setIsLoggedIn(false);
    setUser(null);
    
    // Close mobile menu if open
    setIsMenuOpen(false);
    
    // Redirect to home page
    router.push('/');
  };

  // Get the correct dashboard URL based on user role
  const getDashboardUrl = () => {
    if (!user) return '/dashboard'; // Default fallback
    
    // Check user role and return appropriate dashboard URL
    if (user.role === 'admin') {
      return '/admin'; // Admin dashboard
    } else {
      return '/dashboard'; // Regular user dashboard
    }
  };

  // Handle dashboard click
  const handleDashboardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const dashboardUrl = getDashboardUrl();
    router.push(dashboardUrl);
  };

  if (loading) {
    return (
      <nav className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo skeleton */}
            <div className="flex items-center">
              <div className="relative w-48 h-16 md:w-56 md:h-20 lg:w-64 lg:h-24 animate-pulse bg-gray-200 rounded"></div>
            </div>
            {/* Loading skeleton for buttons */}
            <div className="hidden md:flex space-x-4">
              <div className="w-24 h-10 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-24 h-10 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo Section - Made Larger */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="relative w-48 h-16 md:w-56 md:h-20 lg:w-64 lg:h-24 transition-all duration-300 group-hover:scale-105">
                <Image
                  src="/Logo.png"
                  alt="Nairobi Escorts Logo"
                  fill
                  className="object-contain scale-300"
                  priority
                  sizes="(max-width: 768px) 192px, (max-width: 1024px) 224px, 256px"
                />
              </div>
              <span className="ml-3 text-xl md:text-2xl lg:text-3xl font-bold text-red-700 hidden lg:inline tracking-tight">
                Nairobi Escorts
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links - Hidden on mobile */}
          <div className="hidden md:flex items-center space-x-10 xl:space-x-12">
            <Link 
              href="/" 
              className={`text-gray-800 hover:text-red-600 font-semibold transition-all duration-300 text-base lg:text-lg relative group ${
                pathname === '/' ? 'text-red-600' : ''
              }`}
            >
              Home
              <span className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-red-600 transition-all duration-300 group-hover:w-full ${
                pathname === '/' ? 'w-full' : ''
              }`}></span>
            </Link>
            
            <Link 
              href="/about" 
              className={`text-gray-800 hover:text-red-600 font-semibold transition-all duration-300 text-base lg:text-lg relative group ${
                pathname === '/about' ? 'text-red-600' : ''
              }`}
            >
              About
              <span className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-red-600 transition-all duration-300 group-hover:w-full ${
                pathname === '/about' ? 'w-full' : ''
              }`}></span>
            </Link>
            
            <Link 
              href="/providers" 
              className={`text-gray-800 hover:text-red-600 font-semibold transition-all duration-300 text-base lg:text-lg relative group ${
                pathname === '/providers' ? 'text-red-600' : ''
              }`}
            >
              Service Providers
              <span className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-red-600 transition-all duration-300 group-hover:w-full ${
                pathname === '/providers' ? 'w-full' : ''
              }`}></span>
            </Link>
            
            {/* Conditional rendering based on login status */}
            {isLoggedIn ? (
              <div className="flex items-center space-x-6 ml-4">
                {/* Dashboard button - FIXED */}
                <button
                  onClick={handleDashboardClick}
                  className={`px-6 py-2.5 rounded-lg font-semibold transition-all duration-300 text-base lg:text-lg border-2 cursor-pointer
                    ${(pathname === '/dashboard' || pathname === '/admin') 
                      ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-200' 
                      : 'bg-white text-red-600 border-red-600 hover:bg-red-600 hover:text-white hover:shadow-lg hover:shadow-red-200'
                    }`}
                >
                  {user?.role === 'admin' ? 'Admin Dashboard' : 'Dashboard'}
                </button>
                
                {/* Logout button */}
                <button
                  onClick={handleLogout}
                  className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 hover:shadow-lg hover:shadow-red-200 transition-all duration-300 font-semibold text-base lg:text-lg border-2 border-red-600"
                >
                  Logout
                </button>
                
                {/* User profile info */}
                {user && (
                  <div className="flex items-center space-x-2 ml-2">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center border-2 border-red-200">
                      <span className="text-red-600 font-bold text-lg">
                        {user.first_name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <span className="text-sm text-gray-700 font-medium hidden lg:inline">
                      {user.first_name} {user.role === 'admin' && '(Admin)'}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-6 ml-4">
                <Link 
                  href="/login" 
                  className={`px-6 py-2.5 rounded-lg font-semibold transition-all duration-300 text-base lg:text-lg border-2 
                    ${pathname === '/login' 
                      ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-200' 
                      : 'bg-white text-red-600 border-red-600 hover:bg-red-600 hover:text-white hover:shadow-lg hover:shadow-red-200'
                    }`}
                >
                  Login
                </Link>
                
                <Link 
                  href="/register" 
                  className={`px-6 py-2.5 rounded-lg font-semibold transition-all duration-300 text-base lg:text-lg border-2
                    ${pathname === '/register' 
                      ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-200' 
                      : 'bg-white text-red-600 border-red-600 hover:bg-red-600 hover:text-white hover:shadow-lg hover:shadow-red-200'
                    }`}
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-4">
            {/* Conditional mobile buttons */}
            {isLoggedIn ? (
              <>
                {/* Mobile dashboard button - FIXED */}
                <button
                  onClick={handleDashboardClick}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 text-sm border-2 cursor-pointer
                    ${(pathname === '/dashboard' || pathname === '/admin') 
                      ? 'bg-red-600 text-white border-red-600' 
                      : 'bg-white text-red-600 border-red-600 hover:bg-red-600 hover:text-white'
                    }`}
                >
                  {user?.role === 'admin' ? 'Admin' : 'Dashboard'}
                </button>
                
                {/* Mobile logout button */}
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-300 font-semibold text-sm border-2 border-red-600"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link 
                href="/login" 
                className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 text-sm border-2
                  ${pathname === '/login' 
                    ? 'bg-red-600 text-white border-red-600' 
                    : 'bg-white text-red-600 border-red-600 hover:bg-red-600 hover:text-white'
                  }`}
              >
                Login
              </Link>
            )}
            
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-3 rounded-lg text-gray-800 hover:text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-300"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {/* Animated Hamburger icon */}
              <div className="w-6 h-6 relative">
                <span className={`absolute left-0 top-1/2 h-0.5 w-6 bg-current transform transition-all duration-300 ${
                  isMenuOpen ? 'rotate-45 -translate-y-1' : '-translate-y-2'
                }`}></span>
                <span className={`absolute left-0 top-1/2 h-0.5 w-6 bg-current transform transition-all duration-300 ${
                  isMenuOpen ? 'opacity-0' : ''
                }`}></span>
                <span className={`absolute left-0 top-1/2 h-0.5 w-6 bg-current transform transition-all duration-300 ${
                  isMenuOpen ? '-rotate-45 translate-y-1' : 'translate-y-2'
                }`}></span>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile menu, show/hide based on menu state */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-red-100 bg-gradient-to-b from-white to-red-50">
            <div className="px-4 pt-4 pb-6 space-y-3">
              <Link
                href="/"
                className={`block px-4 py-3.5 rounded-xl text-lg font-semibold transition-all duration-300 ${
                  pathname === '/' 
                    ? 'bg-red-600 text-white shadow-lg shadow-red-200' 
                    : 'text-gray-800 hover:bg-red-50 hover:text-red-600 border border-transparent hover:border-red-200'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              
              <Link
                href="/about"
                className={`block px-4 py-3.5 rounded-xl text-lg font-semibold transition-all duration-300 ${
                  pathname === '/about' 
                    ? 'bg-red-600 text-white shadow-lg shadow-red-200' 
                    : 'text-gray-800 hover:bg-red-50 hover:text-red-600 border border-transparent hover:border-red-200'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              
              {isLoggedIn ? (
                <div className="pt-6 space-y-4">
                  {/* Mobile dashboard button - FIXED */}
                  <button
                    onClick={(e) => {
                      handleDashboardClick(e);
                      setIsMenuOpen(false);
                    }}
                    className={`block w-full px-4 py-3.5 rounded-xl text-lg font-semibold transition-all duration-300 text-center cursor-pointer ${
                      (pathname === '/dashboard' || pathname === '/admin') 
                        ? 'bg-red-600 text-white border-2 border-red-600 shadow-lg shadow-red-200' 
                        : 'bg-white text-red-600 border-2 border-red-600 hover:bg-red-600 hover:text-white hover:shadow-lg hover:shadow-red-200'
                    }`}
                  >
                    {user?.role === 'admin' ? 'Admin Dashboard' : 'Dashboard'}
                  </button>
                  
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="block w-full px-4 py-3.5 rounded-xl text-lg font-semibold transition-all duration-300 text-center bg-gradient-to-r from-red-600 to-red-700 text-white border-2 border-red-600 hover:from-red-700 hover:to-red-800 hover:shadow-lg hover:shadow-red-200"
                  >
                    Logout
                  </button>
                  
                  {user && (
                    <div className="px-4 py-3 border-t border-red-100 mt-4">
                      <p className="text-sm text-gray-500">Logged in as</p>
                      <p className="font-medium text-gray-900 text-lg">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      {user.role === 'admin' && (
                        <p className="text-sm text-red-600 font-semibold">Admin User</p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="pt-6 space-y-4">
                  <Link
                    href="/login"
                    className={`block w-full px-4 py-3.5 rounded-xl text-lg font-semibold transition-all duration-300 text-center ${
                      pathname === '/login' 
                        ? 'bg-red-600 text-white border-2 border-red-600 shadow-lg shadow-red-200' 
                        : 'bg-white text-red-600 border-2 border-red-600 hover:bg-red-600 hover:text-white hover:shadow-lg hover:shadow-red-200'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  
                  <Link
                    href="/register"
                    className={`block w-full px-4 py-3.5 rounded-xl text-lg font-semibold transition-all duration-300 text-center ${
                      pathname === '/register' 
                        ? 'bg-red-600 text-white border-2 border-red-600 shadow-lg shadow-red-200' 
                        : 'bg-white text-red-600 border-2 border-red-600 hover:bg-red-600 hover:text-white hover:shadow-lg hover:shadow-red-200'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}