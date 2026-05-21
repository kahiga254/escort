'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function InactivityLogout() {
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const [showWarning, setShowWarning] = useState(false);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Trigger storage event so navbar updates
    window.dispatchEvent(new Event('storage'));
    
    router.push('/login');
  };

  const resetTimeout = () => {
    setShowWarning(false);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);

    // Show warning at 4 minutes
    warningRef.current = setTimeout(() => {
      setShowWarning(true);
    }, 4 * 60 * 1000);

    // Logout at 5 minutes
    timeoutRef.current = setTimeout(() => {
      logout();
    }, 5 * 60 * 1000);
  };

  useEffect(() => {
    resetTimeout();

    window.addEventListener('mousemove', resetTimeout);
    window.addEventListener('keydown', resetTimeout);
    window.addEventListener('click', resetTimeout);
    window.addEventListener('scroll', resetTimeout);

    return () => {
      window.removeEventListener('mousemove', resetTimeout);
      window.removeEventListener('keydown', resetTimeout);
      window.removeEventListener('click', resetTimeout);
      window.removeEventListener('scroll', resetTimeout);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
    };
  }, [router]);

  return (
    showWarning && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
          <h2 className="text-lg font-semibold text-gray-900">Session expiring</h2>
          <p className="mt-2 text-gray-700">You'll be logged out in 1 minute due to inactivity.</p>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => setShowWarning(false)}
              className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
            >
              Stay logged in
            </button>
            <button
              onClick={logout}
              className="flex-1 rounded-md bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700"
            >
              Logout now
            </button>
          </div>
        </div>
      </div>
    )
  );
}