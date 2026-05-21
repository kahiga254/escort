'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function InactivityLogout() {
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      // Clear auth token/session
      sessionStorage.removeItem('authToken');
      localStorage.removeItem('authToken');
      
      // Logout
      router.push('/login');
    }, 5 * 60 * 1000); // 5 minutes
  };

  useEffect(() => {
    resetTimeout();

    // Listen for user activity
    window.addEventListener('mousemove', resetTimeout);
    window.addEventListener('keydown', resetTimeout);
    window.addEventListener('click', resetTimeout);
    window.addEventListener('scroll', resetTimeout);

    return () => {
      window.removeEventListener('mousemove', resetTimeout);
      window.removeEventListener('keydown', resetTimeout);
      window.removeEventListener('click', resetTimeout);
      window.removeEventListener('scroll', resetTimeout);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [router]);

  return null;
}