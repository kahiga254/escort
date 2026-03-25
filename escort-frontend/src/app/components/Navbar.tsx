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
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUser(null);
    setIsMenuOpen(false);
    router.push('/');
  };

  const getDashboardUrl = () => {
    if (!user) return '/dashboard';
    return user.role === 'admin' ? '/admin' : '/dashboard';
  };

  const handleDashboardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(getDashboardUrl());
  };

  if (loading) {
    return (
      <nav className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            {/* ✅ FIX: Responsive logo skeleton */}
            <div className="relative w-28 h-10 sm:w-40 sm:h-14 md:w-48 md:h-16 animate-pulse bg-gray-200 rounded"></div>
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
      {/* ✅ FIX: w-full ensures nav never exceeds screen */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">

          {/* ✅ FIX: Logo scales down on mobile — was fixed w-48 causing overflow */}
          <div className="flex items-center flex-shrink-0">
            <Link href="/" className="flex items-center group">
              <div className="relative w-28 h-10 sm:w-40 sm:h-14 md:w-48 md:h-16 lg:w-56 lg:h-20 transition-all duration-300 group-hover:scale-105">
                <Image
                  src="/Logo.png"
                  alt="Nairobi Escorts Logo"
                  fill
                  className="object-contain"
                  priority
                  sizes="(max-width: 640px) 112px, (max-width: 768px) 160px, (max-width: 1024px) 192px, 224px"
                />
              </div>
              <span className="ml-3 text-xl md:text-2xl lg:text-3xl font-bold text-red-700 hidden lg:inline tracking-tight">
                Nairobi Escorts
              </span>
            </Link>
          </div>

          {/* Desktop Navigation — Hidden on mobile */}
          <div className="hidden md:flex items-center space-x-8 xl:space-x-10">
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

            {isLoggedIn ? (
              <div className="flex items-center space-x-4 ml-2">
                <button
                  onClick={handleDashboardClick}
                  className={`px-5 py-2 rounded-lg font-semibold transition-all duration-300 text-base border-2 cursor-pointer
                    ${(pathname === '/dashboard' || pathname === '/admin')
                      ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-200'
                      : 'bg-white text-red-600 border-red-600 hover:bg-red-600 hover:text-white'
                    }`}
                >
                  {user?.role === 'admin' ? 'Admin' : 'Dashboard'}
                </button>

                <button
                  onClick={handleLogout}
                  className="px-5 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-300 font-semibold text-base border-2 border-red-600"
                >
                  Logout
                </button>

                {user && (
                  <div className="flex items-center space-x-2">
                    <div className="w-9 h-9 bg-red-100 rounded-full flex items-center justify-center border-2 border-red-200">
                      <span className="text-red-600 font-bold text-base">
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
              <div className="flex items-center space-x-4 ml-2">
                <Link
                  href="/login"
                  className={`px-5 py-2 rounded-lg font-semibold transition-all duration-300 text-base border-2
                    ${pathname === '/login'
                      ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-200'
                      : 'bg-white text-red-600 border-red-600 hover:bg-red-600 hover:text-white'
                    }`}
                >
                  Login
                </Link>

                <Link
                  href="/register"
                  className={`px-5 py-2 rounded-lg font-semibold transition-all duration-300 text-base border-2
                    ${pathname === '/register'
                      ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-200'
                      : 'bg-white text-red-600 border-red-600 hover:bg-red-600 hover:text-white'
                    }`}
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* ✅ Mobile top bar: compact buttons + hamburger */}
          <div className="md:hidden flex items-center space-x-2">
            {isLoggedIn ? (
              <>
                <button
                  onClick={handleDashboardClick}
                  className={`px-3 py-1.5 rounded-lg font-semibold text-xs border-2 cursor-pointer
                    ${(pathname === '/dashboard' || pathname === '/admin')
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-white text-red-600 border-red-600'
                    }`}
                >
                  {user?.role === 'admin' ? 'Admin' : 'Dashboard'}
                </button>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 bg-red-600 text-white rounded-lg font-semibold text-xs border-2 border-red-600"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className={`px-3 py-1.5 rounded-lg font-semibold text-xs border-2
                  ${pathname === '/login'
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-white text-red-600 border-red-600'
                  }`}
              >
                Login
              </Link>
            )}

            {/* Hamburger icon */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-gray-800 hover:text-red-600 hover:bg-red-50 focus:outline-none transition-all duration-300"
              aria-expanded={isMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              <div className="w-6 h-6 relative">
                <span className={`absolute left-0 top-1/2 h-0.5 w-6 bg-current transform transition-all duration-300 ${
                  isMenuOpen ? 'rotate-45 -translate-y-px' : '-translate-y-2'
                }`}></span>
                <span className={`absolute left-0 top-1/2 h-0.5 w-6 bg-current transform transition-all duration-300 ${
                  isMenuOpen ? 'opacity-0' : ''
                }`}></span>
                <span className={`absolute left-0 top-1/2 h-0.5 w-6 bg-current transform transition-all duration-300 ${
                  isMenuOpen ? '-rotate-45 translate-y-px' : 'translate-y-2'
                }`}></span>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-red-100 bg-gradient-to-b from-white to-red-50">
            <div className="px-4 pt-4 pb-6 space-y-3">
              <Link
                href="/"
                className={`block px-4 py-3 rounded-xl text-base font-semibold transition-all duration-300 ${
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
                className={`block px-4 py-3 rounded-xl text-base font-semibold transition-all duration-300 ${
                  pathname === '/about'
                    ? 'bg-red-600 text-white shadow-lg shadow-red-200'
                    : 'text-gray-800 hover:bg-red-50 hover:text-red-600 border border-transparent hover:border-red-200'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>

              <Link
                href="/providers"
                className={`block px-4 py-3 rounded-xl text-base font-semibold transition-all duration-300 ${
                  pathname === '/providers'
                    ? 'bg-red-600 text-white shadow-lg shadow-red-200'
                    : 'text-gray-800 hover:bg-red-50 hover:text-red-600 border border-transparent hover:border-red-200'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Service Providers
              </Link>

              {isLoggedIn ? (
                <div className="pt-4 space-y-3 border-t border-red-100">
                  <button
                    onClick={(e) => { handleDashboardClick(e); setIsMenuOpen(false); }}
                    className={`block w-full px-4 py-3 rounded-xl text-base font-semibold transition-all duration-300 text-center cursor-pointer ${
                      (pathname === '/dashboard' || pathname === '/admin')
                        ? 'bg-red-600 text-white border-2 border-red-600 shadow-lg shadow-red-200'
                        : 'bg-white text-red-600 border-2 border-red-600 hover:bg-red-600 hover:text-white'
                    }`}
                  >
                    {user?.role === 'admin' ? 'Admin Dashboard' : 'Dashboard'}
                  </button>

                  <button
                    onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                    className="block w-full px-4 py-3 rounded-xl text-base font-semibold text-center bg-gradient-to-r from-red-600 to-red-700 text-white border-2 border-red-600"
                  >
                    Logout
                  </button>

                  {user && (
                    <div className="px-4 py-3 border-t border-red-100 mt-2">
                      <p className="text-xs text-gray-500">Logged in as</p>
                      <p className="font-medium text-gray-900">{user.first_name} {user.last_name}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      {user.role === 'admin' && (
                        <p className="text-sm text-red-600 font-semibold">Admin User</p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="pt-4 space-y-3 border-t border-red-100">
                  <Link
                    href="/login"
                    className={`block w-full px-4 py-3 rounded-xl text-base font-semibold text-center transition-all duration-300 ${
                      pathname === '/login'
                        ? 'bg-red-600 text-white border-2 border-red-600 shadow-lg shadow-red-200'
                        : 'bg-white text-red-600 border-2 border-red-600 hover:bg-red-600 hover:text-white'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>

                  <Link
                    href="/register"
                    className={`block w-full px-4 py-3 rounded-xl text-base font-semibold text-center transition-all duration-300 ${
                      pathname === '/register'
                        ? 'bg-red-600 text-white border-2 border-red-600 shadow-lg shadow-red-200'
                        : 'bg-white text-red-600 border-2 border-red-600 hover:bg-red-600 hover:text-white'
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