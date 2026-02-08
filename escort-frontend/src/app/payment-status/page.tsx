'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface SubscriptionData {
  status: 'pending' | 'active' | 'failed';
  plan_name?: string;
  amount?: number;
  expiry_date?: string;
  duration_days?: number;
  mpesa_receipt?: string;
}

const BACKEND_URL = 'https://escort-vcix.onrender.com';

export default function PaymentStatusPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkoutId = searchParams.get('checkout_id');
  
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [polling, setPolling] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Helper functions
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-KE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const calculateExpiryDate = (durationDays: number) => {
    const now = new Date();
    const expiry = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
    return expiry.toISOString();
  };

  const getTimeRemaining = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} remaining`;
    } else if (diffDays === 0) {
      return 'Expires today';
    } else {
      return 'Expired';
    }
  };

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
    intervalRef.current = setInterval(checkPaymentStatus, 5000);
  };

  const checkPaymentStatus = async () => {
    if (!checkoutId) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${BACKEND_URL}/auth/subscription/check-status?checkout_id=${checkoutId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      
      const data = await response.json();
      console.log('Payment status response:', data); // Debug log
      
      if (data.success) {
        // Calculate expiry date if backend doesn't provide it
        const expiryDate = data.expiry_date || 
          (data.duration_days ? calculateExpiryDate(data.duration_days) : undefined);
        
        const subscriptionData: SubscriptionData = {
          status: data.status,
          plan_name: data.plan_name,
          amount: data.amount,
          expiry_date: expiryDate,
          duration_days: data.duration_days,
          mpesa_receipt: data.mpesa_receipt,
        };
        
        setSubscription(subscriptionData);
        
        if (data.status === 'active') {
          setPolling(false);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          
          // Update localStorage user data
          const userData = localStorage.getItem('user');
          if (userData) {
            const user = JSON.parse(userData);
            user.has_subscription = true;
            user.subscription_expiry = expiryDate;
            localStorage.setItem('user', JSON.stringify(user));
          }
        } else if (data.status === 'failed') {
          setPolling(false);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
        }
      }
    } catch (error) {
      console.error('Error checking status:', error);
    }
  };

  // Handle initial state - no subscription data yet
  if (!subscription) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center">
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
              <p className="text-sm text-purple-600 mb-2 animate-pulse">
                🔄 Checking payment status...
              </p>
            )}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Reference ID</p>
              <p className="font-mono text-sm text-gray-900 break-all">{checkoutId}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handle active subscription
  if (subscription.status === 'active') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center px-4 py-8">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-4xl w-full">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Account Activated Successfully! 🎉
            </h1>
            <p className="text-lg text-gray-600">
              Your profile is now active and visible to clients
            </p>
          </div>

          {/* Subscription Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
            {/* Plan Details Card */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Subscription Plan
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Plan Name</p>
                  <p className="text-xl font-bold text-gray-900">
                    {subscription.plan_name || 'Basic Plan'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Investment</p>
                  <p className="text-2xl font-bold text-green-600">
                    {subscription.amount ? formatCurrency(subscription.amount) : 'KES 0'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Duration</p>
                  <p className="text-lg font-medium text-gray-900">
                    {subscription.duration_days || 5} days
                  </p>
                </div>
                {subscription.mpesa_receipt && (
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Transaction Receipt</p>
                    <p className="font-mono text-gray-900 bg-gray-100 p-2 rounded">
                      {subscription.mpesa_receipt}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Expiry Details Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Subscription Timeline
              </h3>
              
              {subscription.expiry_date ? (
                <div className="space-y-6">
                  {/* Time Remaining Badge */}
                  <div className="text-center">
                    <div className="inline-flex items-center px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full mb-4 shadow-lg">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      <span className="font-bold">{getTimeRemaining(subscription.expiry_date)}</span>
                    </div>
                  </div>

                  {/* Date Details */}
                  <div className="space-y-4">
                    <div className="bg-white rounded-xl p-4 border border-blue-100">
                      <p className="text-sm text-gray-600 mb-1">Activation Date</p>
                      <p className="font-medium text-gray-900">
                        {formatDate(new Date().toISOString())}
                      </p>
                    </div>
                    
                    <div className="bg-white rounded-xl p-4 border border-blue-100">
                      <p className="text-sm text-gray-600 mb-1">Expiry Date</p>
                      <p className="text-xl font-bold text-gray-900">
                        {formatDate(subscription.expiry_date)}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Expiry information not available</p>
                </div>
              )}
            </div>

            {/* Next Steps Card */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Next Steps
              </h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <span className="text-purple-600 font-bold">1</span>
                  </div>
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Complete your profile</span> - Add photos and services to attract more clients
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <span className="text-purple-600 font-bold">2</span>
                  </div>
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Share your profile</span> - Send your profile link to potential clients
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <span className="text-purple-600 font-bold">3</span>
                  </div>
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Track performance</span> - Monitor views, calls, and bookings in your dashboard
                  </p>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-purple-100">
                <p className="text-sm text-purple-600 font-semibold mb-2">
                  ⏰ Set a reminder
                </p>
                <p className="text-xs text-gray-600">
                  Renew {subscription.duration_days ? Math.max(1, subscription.duration_days - 2) : 3} days before expiry to avoid interruption
                </p>
              </div>
            </div>
          </div>

          {/* Important Notice */}
          <div className="mb-8 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-6">
            <div className="flex items-start">
              <svg className="w-6 h-6 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <h4 className="font-semibold text-yellow-800 mb-2">Important Information</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Your profile is now live and visible to all clients</li>
                  <li>• You'll receive notifications for new inquiries and messages</li>
                  <li>• Update your availability regularly for better visibility</li>
                  <li>• Contact support for any issues or questions</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/dashboard')}
              className="px-10 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-lg font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              🚀 Go to Dashboard
            </button>
            
            <Link
              href="/profile"
              className="px-10 py-4 bg-white border-2 border-purple-600 text-purple-600 text-lg font-semibold rounded-xl hover:bg-purple-50 transition-all text-center"
            >
              ✏️ Complete Profile
            </Link>
            
            <button
              onClick={() => window.print()}
              className="px-10 py-4 bg-gray-100 text-gray-700 text-lg font-semibold rounded-xl hover:bg-gray-200 transition-all"
            >
              🖨️ Print Receipt
            </button>
          </div>

          {/* Footer Note */}
          <div className="text-center mt-10 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Thank you for choosing our platform. We're excited to help you grow your business! 💼
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Transaction ID: <span className="font-mono">{checkoutId}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Handle failed payment
  if (subscription.status === 'failed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center">
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
            
            <div className="space-y-3">
              <Link
                href="/activate"
                className="block w-full py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg hover:from-red-700 hover:to-orange-700 transition-all text-center"
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

  // Default fallback (pending state)
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 relative">
            <div className="absolute inset-0 border-4 border-purple-200 rounded-full"></div>
            <div className="absolute inset-4 border-4 border-purple-500 rounded-full animate-spin"></div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Processing Payment
          </h2>
          <p className="text-gray-600 mb-6">
            Please wait while we confirm your payment...
          </p>
        </div>
      </div>
    </div>
  );
}