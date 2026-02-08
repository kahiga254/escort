'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface SubscriptionPlan {
  _id?: string;      // MongoDB _id (optional)
  id?: string;       // API id field (optional)
  name: string;
  description: string;
  amount: number;
  duration_days: number;
  features?: string[];
  is_popular?: boolean;
}

const BACKEND_URL = 'http://https://escort-vcix.onrender.com';

export default function ActivationPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [subscribing, setSubscribing] = useState(false);
  const [userPhone, setUserPhone] = useState('');

  useEffect(() => {
    fetchPlans();
    checkUserStatus();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/subscription/plans`);
      const data = await response.json();
      
      console.log('📊 Plans response:', data);
      
      if (data.success) {
        // Use data.data (your backend returns "data" key)
        const plansArray = data.data || [];
        console.log(`✅ Loaded ${plansArray.length} plans`);
        setPlans(plansArray);
      }
    } catch (error) {
      console.error('Error:', error);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const checkUserStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log('❌ No token found in localStorage');
        router.push('/login');
        return;
      }
      
      console.log('🔍 Token from localStorage:', token.substring(0, 20) + '...');
      
      const response = await fetch(`${BACKEND_URL}/auth/subscription/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      console.log('🔍 Status response:', response.status);
      
      if (response.status === 401) {
        console.log('❌ Token is invalid or expired');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Status data:', data);
        
        if (data.has_active_subscription) {
          router.push('/dashboard');
        }
      }
    } catch (error) {
      console.error('Error checking status:', error);
    }
  };

  const handleSubscribe = async () => {
    if (!selectedPlan) {
      alert('Please select a subscription plan');
      return;
    }

    if (!userPhone.trim()) {
      alert('Please enter your phone number for MPESA payment');
      return;
    }

    setSubscribing(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login first');
        router.push('/login');
        return;
      }
      
      console.log('🔍 Subscribing with plan:', selectedPlan);
      
      const response = await fetch(`${BACKEND_URL}/auth/subscribe`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan_id: selectedPlan,
          phone: userPhone,
        }),
      });
      
      console.log('🔍 Subscribe response status:', response.status);
      
      const data = await response.json();
      console.log('🔍 Subscribe response data:', data);
      
      if (data.success) {
        alert(data.message || 'Payment initiated! Check your phone to complete MPESA payment.');
        router.push(`/payment-status?checkout_id=${data.checkout_id}`);
      } else {
        alert(data.error || 'Failed to initiate payment');
      }
    } catch (error: any) {
      console.error('Error subscribing:', error);
      alert(error.message || 'Network error');
    } finally {
      setSubscribing(false);
    }
  };

  // Helper function to get plan ID
  const getPlanId = (plan: SubscriptionPlan): string => {
    return plan.id || plan._id || plan.name;
  };

  // Helper function to get selected plan details
  const getSelectedPlanDetails = (): SubscriptionPlan | undefined => {
    if (!selectedPlan) return undefined;
    return plans.find(plan => getPlanId(plan) === selectedPlan);
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Link href="/dashboard" className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-6">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Activate Your Account
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Choose a subscription plan to activate your account and start receiving clients.
            Your profile will be visible to clients immediately after payment.
          </p>
        </div>

        {/* Phone Number Input */}
        <div className="max-w-md mx-auto mb-10">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            MPESA Phone Number
          </label>
          <div className="flex gap-3">
            <input
              type="tel"
              value={userPhone}
              onChange={(e) => setUserPhone(e.target.value)}
              placeholder="2547XXXXXXXX"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
            />
            <button
              onClick={() => setUserPhone('254792193308')}
              className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
            >
              Use Test Number
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Enter the phone number registered with MPESA. We'll send a payment request to this number.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => {
            const planId = getPlanId(plan);
            const isSelected = selectedPlan === planId;
            
            return (
              <div
                key={planId}
                className={`bg-white rounded-2xl shadow-xl p-8 border-2 ${isSelected ? 'border-purple-500 ring-2 ring-purple-200' : 'border-gray-100'} ${plan.is_popular ? 'relative transform scale-105' : ''}`}
              >
                {plan.is_popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900">
                      {formatPrice(plan.amount)}
                    </span>
                    <span className="text-gray-600"> / {plan.duration_days} days</span>
                  </div>
                  <p className="text-gray-600">{plan.description || 'No description available'}</p>
                </div>
                
                {plan.features && plan.features.length > 0 && (
                  <div className="mb-8">
                    <h4 className="font-semibold text-gray-900 mb-4">Features:</h4>
                    <ul className="space-y-3">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <button
                  onClick={() => setSelectedPlan(planId)}
                  className={`w-full py-4 rounded-lg font-semibold transition-all ${isSelected 
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700' 
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                >
                  {isSelected ? '✓ Selected' : 'Select Plan'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Subscribe Button */}
        <div className="text-center mt-12">
          <button
            onClick={handleSubscribe}
            disabled={!selectedPlan || subscribing}
            className="px-12 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-lg font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
          >
            {subscribing ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              `Activate Now with MPESA - ${selectedPlan ? formatPrice(getSelectedPlanDetails()?.amount || 0) : ''}`
            )}
          </button>
          
          <p className="text-sm text-gray-500 mt-4">
            You'll receive an MPESA prompt on your phone to enter your PIN
          </p>
        </div>

        {/* Payment Info */}
        <div className="max-w-3xl mx-auto mt-12 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">How Activation Works:</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h4 className="font-medium text-blue-900 mb-2">Select Plan</h4>
              <p className="text-sm text-blue-700">Choose your preferred subscription duration</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">2</span>
              </div>
              <h4 className="font-medium text-blue-900 mb-2">MPESA Payment</h4>
              <p className="text-sm text-blue-700">Enter your PIN to complete payment</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">3</span>
              </div>
              <h4 className="font-medium text-blue-900 mb-2">Instant Activation</h4>
              <p className="text-sm text-blue-700">Your account becomes active immediately</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}