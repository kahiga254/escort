'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';


const BACKEND_URL = 'http://https://escort-vcix.onrender.com';
export default function PaymentStatusPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkoutId = searchParams.get('checkout_id');
  
  const [status, setStatus] = useState<'pending' | 'success' | 'failed'>('pending');
  const [polling, setPolling] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (checkoutId) {
      startPolling();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [checkoutId]);

  const startPolling = () => {
    intervalRef.current = setInterval(checkPaymentStatus, 5000); // Check every 5 seconds
  };

  const checkPaymentStatus = async () => {
    if (!checkoutId) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/auth/subscription/check-status?checkout_id=${checkoutId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      
      if (data.status === 'active') {
        setStatus('success');
        setPolling(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        
        // Update user status in localStorage
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
      } else if (data.status === 'failed') {
        setStatus('failed');
        setPolling(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      }
    } catch (error) {
      console.error('Error checking status:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center">
          {status === 'pending' && (
            <>
              <div className="w-20 h-20 mx-auto mb-6 relative">
                <div className="absolute inset-0 border-4 border-purple-200 rounded-full"></div>
                <div className="absolute inset-4 border-4 border-purple-500 rounded-full animate-spin"></div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Waiting for Payment
              </h2>
              <p className="text-gray-600 mb-6">
                Please check your phone and enter your MPESA PIN to complete the payment.
              </p>
              {polling && (
                <p className="text-sm text-purple-600 mb-2">
                  Checking payment status...
                </p>
              )}
            </>
          )}
          
          {status === 'success' && (
            <>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Payment Successful!
              </h2>
              <p className="text-gray-600 mb-6">
                Your account has been activated. Redirecting to dashboard...
              </p>
            </>
          )}
          
          {status === 'failed' && (
            <>
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Payment Failed
              </h2>
              <p className="text-gray-600 mb-6">
                The payment was not completed. Please try again.
              </p>
            </>
          )}
          
          <div className="space-y-3">
            <Link
              href="/activate"
              className="block w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all text-center"
            >
              Try Again
            </Link>
            <Link
              href="/dashboard"
              className="block w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}