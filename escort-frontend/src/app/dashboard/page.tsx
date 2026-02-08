'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  _id?: string;
  id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_no: string;
  gender?: string;
  sexual_orientation?: string;
  age?: number;
  nationality?: string;
  location: string;
  services: string[];
  image_url?: string;
  images?: string[];
  is_active: boolean;
  role: string;
  has_subscription: boolean;
  subscription_expiry?: string;
  subscription_status?: 'active' | 'pending' | 'expired' | 'cancelled';
  payment_date?: string;
  activation_date?: string;
  stats?: {
    views: number;
    calls: number;
    bookings: number;
  };
}

const serviceOptions = [
  'Three some',
  'Incalls',
  'Outcalls',
  'Blow job',
  'Anal',
  'Erotic Massage',
  'Deep Throats',
  'Cum on Body',
  'GFE',
  'PSE',
  'BDSM',
  'Role Play'
];

const genderOptions = ['Male', 'Female', 'Non-binary', 'Other'];
const orientationOptions = ['Straight', 'Gay', 'Lesbian', 'Bisexual', 'Pansexual', 'Asexual'];
const nationalityOptions = ['Kenyan', 'Ugandan', 'Tanzanian', 'Rwandan', 'Burundian', 'Other'];

const BACKEND_URL = 'https://escort-vcix.onrender.com';
const MAX_IMAGES = 5;

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchUserData();
    
    // Check if user just returned from payment page
    const checkPaymentReturn = () => {
      const paymentReturn = localStorage.getItem('payment_return');
      if (paymentReturn === 'true') {
        console.log('User returned from payment, refreshing data...');
        fetchUserData(true);
        localStorage.removeItem('payment_return');
      }
    };
    
    checkPaymentReturn();
  }, []);

  useEffect(() => {
    // Auto-refresh user data every 30 seconds if account is not active but has subscription
    let interval: NodeJS.Timeout;
    
    if (user && user.has_subscription && !user.is_active) {
      interval = setInterval(() => {
        console.log('Auto-refreshing user data for pending activation...');
        fetchUserData(false, true); // Silent refresh
      }, 30000); // 30 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [user?.has_subscription, user?.is_active]);

  const fetchUserData = async (forceRefresh = false, silent = false) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      router.push('/login');
      return;
    }

    if (!silent) {
      setLoading(true);
    }
    setError(null);

    try {
      // Clear cache if forced refresh
      if (forceRefresh) {
        localStorage.removeItem('user');
      }

      // Use minimal headers to avoid CORS issues
      const headers: HeadersInit = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      // Add cache busting parameter if forcing refresh
      const url = forceRefresh ? `${BACKEND_URL}/auth/me?t=${Date.now()}` : `${BACKEND_URL}/auth/me`;
      
      const response = await fetch(url, {
        headers,
        // Use fetch cache control instead of custom headers
        cache: forceRefresh ? 'no-cache' : 'default',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch profile`);
      }

      const data = await response.json();
      console.log('User data fetched:', data);
      
      if (data.success && data.user) {
        // Ensure images array exists
        const images = Array.isArray(data.user.images) 
          ? data.user.images 
          : (data.user.image_url ? [data.user.image_url] : []);
        
        const userData = {
          ...data.user,
          images: images,
          image_url: images[0] || data.user.image_url || '',
          services: Array.isArray(data.user.services) ? data.user.services : [],
          is_active: data.user.is_active || false,
          has_subscription: data.user.has_subscription || false,
          subscription_status: data.user.subscription_status || 'pending',
          payment_date: data.user.payment_date || data.user.updatedAt || null,
          activation_date: data.user.activation_date || data.user.updatedAt || null
        };
        
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Log activation status for debugging
        console.log('Account Status:', {
          is_active: userData.is_active,
          has_subscription: userData.has_subscription,
          subscription_status: userData.subscription_status,
          payment_date: userData.payment_date,
          activation_date: userData.activation_date
        });
        
      } else {
        throw new Error(data.error || 'Failed to fetch user data');
      }
    } catch (error: any) {
      console.error('Error fetching user data:', error);
      setError(error.message || 'Network error. Please check your connection.');
    } finally {
      if (!silent) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  const handleInputChange = (field: keyof User, value: any) => {
    if (!user) return;
    
    setUser(prev => {
      if (!prev) return null;
      
      if (field === 'age') {
        const numValue = parseInt(value) || 0;
        return { ...prev, [field]: numValue >= 18 ? numValue : 18 };
      }
      
      return { ...prev, [field]: value };
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;

    const maxSize = 5 * 1024 * 1024; // 5MB
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    
    // Filter valid files
    const validFiles = Array.from(files).filter(file => 
      file.size <= maxSize && validTypes.includes(file.type)
    );
    
    if (validFiles.length === 0) {
      alert('Please select valid image files (JPG, PNG, WebP, max 5MB each)');
      return;
    }

    const currentImages = user.images || [];
    const availableSlots = MAX_IMAGES - currentImages.length;
    
    if (availableSlots <= 0) {
      alert(`You have reached the maximum of ${MAX_IMAGES} photos. Please remove some before uploading more.`);
      return;
    }

    const filesToUpload = validFiles.slice(0, availableSlots);
    
    if (filesToUpload.length < validFiles.length) {
      alert(`You can only upload ${availableSlots} more photo(s) (${MAX_IMAGES} total)`);
    }

    setUploading(true);
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/login');
        return;
      }

      const formData = new FormData();
      filesToUpload.forEach(file => {
        formData.append('images', file);
      });

      console.log('Uploading files:', filesToUpload);

      const response = await fetch(`${BACKEND_URL}/auth/upload-images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('Upload response:', data);

      if (data.success && data.imageUrls && data.imageUrls.length > 0) {
        // Update user with all images
        const updatedImages = [...currentImages, ...data.imageUrls];
        setUser({
          ...user,
          images: updatedImages,
          image_url: updatedImages[0] || ''
        });
        alert(`Successfully uploaded ${data.imageUrls.length} photo(s)! Total: ${updatedImages.length}/${MAX_IMAGES}`);
        await fetchUserData(); // Refresh to get updated data
      } else {
        throw new Error(data.error || 'Failed to upload images');
      }
    } catch (error: any) {
      console.error('Error uploading images:', error);
      alert(`Failed to upload images: ${error.message}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteImage = async (index: number) => {
    if (!user || !user.images || index >= user.images.length) return;
    
    const imageUrl = user.images[index];
    if (!imageUrl) return;
    
    // Confirm deletion
    if (!window.confirm('Are you sure you want to delete this photo? This action cannot be undone.')) {
      return;
    }
    
    setDeletingIndex(index);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }
      
      // Extract filename from URL
      const urlParts = imageUrl.split('/');
      const filename = urlParts[urlParts.length - 1];
      
      // Send DELETE request to backend
      const response = await fetch(`${BACKEND_URL}/auth/delete-image`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          imageUrl: imageUrl,
          filename: filename 
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Delete failed: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Update local state to remove the image
        const updatedImages = [...user.images];
        updatedImages.splice(index, 1);
        
        setUser({
          ...user,
          images: updatedImages,
          image_url: updatedImages[0] || ''
        });
        
        alert('Photo deleted successfully!');
      } else {
        throw new Error(data.error || 'Failed to delete image');
      }
    } catch (error: any) {
      console.error('Error deleting image:', error);
      alert(`Failed to delete photo: ${error.message}`);
      
      // Even if backend fails, we can still remove from frontend state
      // but inform the user it might still exist on server
      const updatedImages = [...user.images || []];
      updatedImages.splice(index, 1);
      
      setUser({
        ...user!,
        images: updatedImages,
        image_url: updatedImages[0] || ''
      });
      
      alert('Photo removed from your profile, but may still exist on the server.');
    } finally {
      setDeletingIndex(null);
    }
  };

  const handleServiceToggle = (service: string) => {
    if (!user) return;
    
    const currentServices = Array.isArray(user.services) ? user.services : [];
    
    const newServices = currentServices.includes(service)
      ? currentServices.filter(s => s !== service)
      : [...currentServices, service];
    
    setUser({ ...user, services: newServices });
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setSaving(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/login');
        return;
      }

      const updateData = {
        first_name: user.first_name,
        last_name: user.last_name,
        phone_no: user.phone_no,
        location: user.location || 'Nairobi',
        gender: user.gender || '',
        sexual_orientation: user.sexual_orientation || '',
        age: user.age || 0,
        nationality: user.nationality || '',
        services: Array.isArray(user.services) ? user.services : []
      };

      console.log('Sending update data:', updateData);

      const response = await fetch(`${BACKEND_URL}/auth/update-profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const responseText = await response.text();
      console.log('Response text:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse response:', e);
        throw new Error('Invalid server response');
      }

      if (response.ok && data.success) {
        alert('Profile updated successfully!');
        setEditMode(false);
        await fetchUserData();
      } else {
        setError(data.error || 'Failed to update profile');
        alert(data.error || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error('Error saving profile:', error);
      setError(error.message || 'Failed to update profile');
      alert(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await fetchUserData(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const getFullName = () => {
    if (!user) return '';
    return `${user.first_name} ${user.last_name}`;
  };

  const getImageCount = () => {
    if (!user || !user.images) return 0;
    return user.images.length;
  };

  const getAccountStatus = () => {
    if (!user) return { text: 'Loading...', color: 'gray' };
    
    if (user.is_active) {
      return { 
        text: 'Active', 
        color: 'green',
        badgeColor: 'bg-green-100 text-green-800',
        bgColor: 'bg-green-50'
      };
    }
    
    if (user.has_subscription) {
      return { 
        text: 'Payment Received - Processing', 
        color: 'blue',
        badgeColor: 'bg-blue-100 text-blue-800',
        bgColor: 'bg-blue-50'
      };
    }
    
    return { 
      text: 'Inactive', 
      color: 'yellow',
      badgeColor: 'bg-yellow-100 text-yellow-800',
      bgColor: 'bg-yellow-50'
    };
  };

  const getActivationMessage = () => {
    if (!user) return '';
    
    if (user.is_active) {
      return 'Your account is active and visible to clients';
    }
    
    if (user.has_subscription) {
      if (user.payment_date) {
        const paymentDate = new Date(user.payment_date);
        const now = new Date();
        const diffHours = Math.floor((now.getTime() - paymentDate.getTime()) / (1000 * 60 * 60));
        
        if (diffHours > 2) {
          return `Payment received ${diffHours} hours ago. Activation is taking longer than expected.`;
        } else if (diffHours > 1) {
          return 'Payment received. Activation should complete shortly...';
        } else {
          return 'Payment verified! Your account will be activated within the next hour.';
        }
      }
      return 'Payment received! Your account is being activated...';
    }
    
    return 'Your account is pending activation';
  };

  const shouldShowActivateButton = () => {
    if (!user) return false;
    return !user.is_active && !user.has_subscription;
  };

  if (loading && !refreshing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => fetchUserData(true)}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 mr-4"
          >
            Retry
          </button>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-4">No user data found</h2>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const accountStatus = getAccountStatus();

  return (
    <div className="min-h-screen bg-gray-50">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome back, {user.first_name}!</p>
            </div>
            <div className="flex items-center space-x-4">
              {user.has_subscription && !user.is_active && (
                <button
                  onClick={handleManualRefresh}
                  disabled={refreshing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center disabled:opacity-50"
                >
                  {refreshing ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Checking...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Check Status
                    </>
                  )}
                </button>
              )}
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Activation Alert Banner */}
        {user.has_subscription && !user.is_active && (
          <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-blue-100 rounded-full">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-semibold text-blue-900">Payment Successfully Received!</h3>
                <p className="text-blue-700 mt-1">
                  Your payment has been verified. We're currently processing your account activation.
                  {user.payment_date && (
                    <span className="block text-sm text-blue-600 mt-1">
                      Payment received: {new Date(user.payment_date).toLocaleDateString()} at {new Date(user.payment_date).toLocaleTimeString()}
                    </span>
                  )}
                </p>
                <div className="mt-4 flex items-center">
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '75%' }}></div>
                  </div>
                  <span className="ml-4 text-sm font-medium text-blue-700">Processing...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Profile Views</p>
                <p className="text-2xl font-bold text-gray-900">{user.stats?.views || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Calls Received</p>
                <p className="text-2xl font-bold text-gray-900">{user.stats?.calls || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{user.stats?.bookings || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Pictures */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Profile Pictures</h2>
                <span className="text-sm font-medium text-purple-600">
                  {getImageCount()}/{MAX_IMAGES} photos
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                Upload up to {MAX_IMAGES} photos (Max 5MB each). Clear, high-quality photos get more views.
              </p>

              {/* Profile Picture Grid */}
              <div className="mb-6">
                {(() => {
                  const images = user.images || [];
                  const imageCount = images.length;
                  
                  if (imageCount > 0) {
                    return (
                      <div className="grid grid-cols-2 gap-4">
                        {/* Main Profile Picture - first image */}
                        <div className="col-span-2">
                          <div className="relative">
                            <div className="w-full h-48 rounded-lg overflow-hidden border border-gray-200">
                              <img
                                src={images[0]}
                                alt="Profile"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                                Main Photo
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteImage(0)}
                              disabled={deletingIndex === 0}
                              className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Delete photo"
                            >
                              {deletingIndex === 0 ? (
                                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Additional Photos */}
                        <div className="grid grid-cols-2 gap-4 col-span-2">
                          {images.slice(1).map((image, index) => (
                            <div key={index + 1} className="relative">
                              <div className="aspect-square w-full rounded-lg overflow-hidden border border-gray-200">
                                <img
                                  src={image}
                                  alt={`Profile ${index + 2}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => handleDeleteImage(index + 1)}
                                disabled={deletingIndex === index + 1}
                                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Delete photo"
                              >
                                {deletingIndex === index + 1 ? (
                                  <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                ) : (
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                )}
                              </button>
                              <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 py-0.5 rounded">
                                Photo {index + 2}
                              </div>
                            </div>
                          ))}
                          
                          {/* Empty slots */}
                          {Array.from({ length: MAX_IMAGES - imageCount }).map((_, index) => (
                            <div
                              key={`empty-${index}`}
                              className="aspect-square w-full border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-gray-50"
                            >
                              <svg className="w-8 h-8 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                              <span className="text-xs text-gray-500">
                                Slot {imageCount + index + 1}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  } else {
                    /* No photos yet - show all empty slots */
                    return (
                      <div className="grid grid-cols-2 gap-4">
                        {Array.from({ length: MAX_IMAGES }).map((_, index) => (
                          <div
                            key={index}
                            className={`aspect-square w-full border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-gray-50 ${
                              index === 0 ? 'col-span-2 h-48' : ''
                            }`}
                          >
                            <svg className="w-8 h-8 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            <span className="text-xs text-gray-500">
                              {index === 0 ? 'Main Photo' : `Photo ${index + 1}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                })()}
              </div>

              {/* Upload Button */}
              <div className="mb-6">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  multiple
                  className="hidden"
                  id="profile-upload"
                  disabled={getImageCount() >= MAX_IMAGES || uploading}
                />
                <label htmlFor="profile-upload">
                  <div className={`w-full py-3 px-4 text-white rounded-lg transition-all flex items-center justify-center ${
                    getImageCount() >= MAX_IMAGES
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 cursor-pointer'
                  }`}>
                    {uploading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Uploading...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        {getImageCount() >= MAX_IMAGES ? 'Maximum Reached' : 'Upload Photos'}
                      </span>
                    )}
                  </div>
                </label>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  JPG, PNG or WebP. Max 5MB per photo
                </p>
              </div>

              {/* Photo Tips */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-semibold text-blue-800 mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Photo Tips
                </h4>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Use clear, well-lit photos</li>
                  <li>• Smile and look friendly</li>
                  <li>• Show your full face</li>
                  <li>• Avoid filters and sunglasses</li>
                  <li>• Update photos regularly</li>
                </ul>
              </div>

              {/* Account Status */}
              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Account Status</h3>
                <div className={`p-4 rounded-lg ${accountStatus.bgColor} border`} style={{ borderColor: `var(--${accountStatus.color}-200)` }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{accountStatus.text}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {getActivationMessage()}
                      </p>
                      {user.payment_date && !user.is_active && (
                        <p className="text-xs text-gray-500 mt-1">
                          Payment made: {new Date(user.payment_date).toLocaleString()}
                        </p>
                      )}
                      {user.activation_date && user.is_active && (
                        <p className="text-xs text-green-600 mt-1">
                          Activated: {new Date(user.activation_date).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${accountStatus.badgeColor}`}>
                      {user.is_active 
                        ? '✓ Active' 
                        : user.has_subscription 
                          ? '✓ Payment Complete' 
                          : 'Pending'}
                    </div>
                  </div>
                  
                  {/* Activation Button */}
                  {shouldShowActivateButton() ? (
                    <Link href="/activate">
                      <button className="w-full mt-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg hover:from-red-700 hover:to-orange-700 transition-all">
                        Activate Now
                      </button>
                    </Link>
                  ) : user.has_subscription && !user.is_active ? (
                    <div className="mt-4">
                      <button
                        onClick={handleManualRefresh}
                        disabled={refreshing}
                        className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center disabled:opacity-50"
                      >
                        {refreshing ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Checking Status...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Refresh Activation Status
                          </>
                        )}
                      </button>
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        Activation may take a few minutes after payment
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Profile Info */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Profile Information</h2>
                <button
                  onClick={() => setEditMode(!editMode)}
                  className={`px-4 py-2 rounded-lg ${editMode ? 'bg-gray-200 text-gray-800 hover:bg-gray-300' : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 transition-all'}`}
                >
                  {editMode ? 'Cancel' : 'Edit Profile'}
                </button>
              </div>

              {editMode ? (
                <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSaveProfile(); }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* First Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={user.first_name}
                        onChange={(e) => handleInputChange('first_name', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                        placeholder="Enter first name"
                      />
                    </div>

                    {/* Last Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={user.last_name}
                        onChange={(e) => handleInputChange('last_name', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                        placeholder="Enter last name"
                      />
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={user.phone_no}
                        onChange={(e) => handleInputChange('phone_no', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                        placeholder="+254712345678"
                      />
                    </div>

                    {/* Email (read-only) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email (Cannot be changed)
                      </label>
                      <input
                        type="email"
                        value={user.email}
                        readOnly
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
                      />
                    </div>

                    {/* Gender */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gender
                      </label>
                      <select
                        value={user.gender || ''}
                        onChange={(e) => handleInputChange('gender', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                      >
                        <option value="" className="text-gray-500">Select Gender</option>
                        {genderOptions.map(option => (
                          <option key={option} value={option} className="text-gray-900">{option}</option>
                        ))}
                      </select>
                    </div>

                    {/* Sexual Orientation */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sexual Orientation
                      </label>
                      <select
                        value={user.sexual_orientation || ''}
                        onChange={(e) => handleInputChange('sexual_orientation', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                      >
                        <option value="" className="text-gray-500">Select Orientation</option>
                        {orientationOptions.map(option => (
                          <option key={option} value={option} className="text-gray-900">{option}</option>
                        ))}
                      </select>
                    </div>

                    {/* Age */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Age
                      </label>
                      <input
                        type="number"
                        min="18"
                        max="100"
                        value={user.age || ''}
                        onChange={(e) => handleInputChange('age', parseInt(e.target.value) || 0)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                        placeholder="Enter age"
                      />
                    </div>

                    {/* Nationality */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nationality
                      </label>
                      <select
                        value={user.nationality || ''}
                        onChange={(e) => handleInputChange('nationality', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                      >
                        <option value="" className="text-gray-500">Select Nationality</option>
                        {nationalityOptions.map(option => (
                          <option key={option} value={option} className="text-gray-900">{option}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      value={user.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                      placeholder="City, Country"
                    />
                  </div>

                  {/* Services */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Services Offered
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {serviceOptions.map(service => {
                        const isSelected = Array.isArray(user.services) && user.services.includes(service);
                        
                        return (
                          <div key={service} className="flex items-center">
                            <input
                              type="checkbox"
                              id={`service-${service}`}
                              checked={isSelected}
                              onChange={() => handleServiceToggle(service)}
                              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                            />
                            <label
                              htmlFor={`service-${service}`}
                              className="ml-2 text-sm text-gray-900"
                            >
                              {service}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Selected: {Array.isArray(user.services) ? user.services.length : 0} services
                    </p>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setEditMode(false)}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 transition-all"
                    >
                      {saving ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </span>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                /* View Mode */
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-600">Full Name</p>
                      <p className="font-medium text-gray-900">{getFullName()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Phone Number</p>
                      <p className="font-medium text-gray-900">{user.phone_no}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium text-gray-900">{user.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Gender</p>
                      <p className="font-medium text-gray-900">{user.gender || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Sexual Orientation</p>
                      <p className="font-medium text-gray-900">{user.sexual_orientation || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Age</p>
                      <p className="font-medium text-gray-900">{user.age ? `${user.age} years` : 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Nationality</p>
                      <p className="font-medium text-gray-900">{user.nationality || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Location</p>
                      <p className="font-medium text-gray-900">{user.location}</p>
                    </div>
                  </div>

                  {/* Services in View Mode */}
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Services Offered</p>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(user.services) && user.services.length > 0 ? (
                        user.services.map(service => (
                          <span
                            key={service}
                            className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm"
                          >
                            {service}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500">No services selected</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}