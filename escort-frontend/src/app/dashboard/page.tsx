'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

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
  is_active: boolean;
  role: string;
  has_subscription: boolean;
  subscription_expiry?: string;
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

const BACKEND_URL = 'http://localhost:8080';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      router.push('/login');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('User data fetched:', data);
        
        if (data.success && data.user) {
          // Ensure services is always an array
          const userData = {
            ...data.user,
            services: Array.isArray(data.user.services) ? data.user.services : []
          };
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        } else {
          setError(data.error || 'Failed to fetch user data');
        }
      } else {
        setError(`HTTP ${response.status}: Failed to fetch profile`);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof User, value: any) => {
    if (!user) return;
    
    setUser(prev => {
      if (!prev) return null;
      
      // Handle special cases
      if (field === 'age') {
        const numValue = parseInt(value) || 0;
        return { ...prev, [field]: numValue >= 18 ? numValue : 18 };
      }
      
      return { ...prev, [field]: value };
    });
  };

  // Update your handleFileUpload function:
const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files;
  if (!files || files.length === 0 || !user) return;

  // Validate file size and type
  const maxSize = 5 * 1024 * 1024; // 5MB
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  
  const invalidFiles = Array.from(files).filter(file => 
    file.size > maxSize || !validTypes.includes(file.type)
  );
  
  if (invalidFiles.length > 0) {
    alert('Some files are too large or invalid type. Max 5MB, JPG/PNG/WebP only.');
    return;
  }

  setUploading(true);
  
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      router.push('/login');
      return;
    }

    const formData = new FormData();
    
    // Add all files (limit to 5 total)
    const filesToUpload = Array.from(files).slice(0, 5);
    filesToUpload.forEach(file => {
      formData.append('images', file);
    });

    console.log('Uploading files:', filesToUpload);

    const response = await fetch(`${BACKEND_URL}/auth/upload-images`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type header for FormData - browser will set it automatically
      },
      body: formData,
    });

    // Check if response is OK
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('Upload response:', data);

    if (data.success && data.imageUrls && data.imageUrls.length > 0) {
      // Update user with first image URL
      setUser({
        ...user,
        image_url: data.imageUrls[0]
      });
      alert('Photos uploaded successfully!');
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

  // FIXED: Safe service toggle function
  const handleServiceToggle = (service: string) => {
    if (!user) return;
    
    // Ensure services is always an array
    const currentServices = Array.isArray(user.services) ? user.services : [];
    
    const newServices = currentServices.includes(service)
      ? currentServices.filter(s => s !== service)
      : [...currentServices, service];
    
    setUser({ ...user, services: newServices });
  };

  // FIXED: Save profile function
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

      // Prepare update data
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
        // Refresh user data
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  // Helper function to get user's full name
  const getFullName = () => {
    if (!user) return '';
    return `${user.first_name} ${user.last_name}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchUserData}
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Error Display */}
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
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome back, {user.first_name}!</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
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
                <span className="text-sm text-gray-500">
                  {user.image_url ? '1/5' : '0/5'} photos
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                Upload 1-5 photos (Max 5MB each). Clear, high-quality photos get more views.
              </p>

              {/* Profile Picture Grid */}
              <div className="mb-6">
                <div className="grid grid-cols-2 gap-4">
                  {/* Main Profile Picture */}
                  <div className="col-span-2">
                    <div className="relative">
                      <div className={`w-full h-48 rounded-lg overflow-hidden ${!user.image_url ? 'border-2 border-dashed border-gray-300' : ''}`}>
                        {user.image_url ? (
                          <img
                            src={user.image_url}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50">
                            <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-sm text-gray-500">Main Photo</span>
                          </div>
                        )}
                      </div>
                      {user.image_url && (
                        <button
                          type="button"
                          onClick={() => {
                            // Remove image logic
                            setUser({ ...user, image_url: '' });
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors"
                          title="Remove photo"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-center">Main Profile Picture</p>
                  </div>

                  {/* Additional Photo Slots */}
                  <div className="grid grid-cols-2 gap-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div
                        key={index}
                        className="aspect-square w-full border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-gray-50"
                      >
                        <svg className="w-8 h-8 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span className="text-xs text-gray-500">Slot {index + 2}</span>
                      </div>
                    ))}
                  </div>
                </div>
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
                />
                <label htmlFor="profile-upload">
                  <div className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all cursor-pointer flex items-center justify-center">
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
                        Upload Photos
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
                <div className={`p-4 rounded-lg ${user.is_active ? 'bg-green-50' : 'bg-yellow-50'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{user.is_active ? 'Active' : 'Inactive'}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {user.is_active 
                          ? 'Your account is active and visible to clients' 
                          : 'Your account is pending activation'}
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {user.is_active ? '✓ Active' : 'Pending'}
                    </div>
                  </div>
                  
                  {!user.is_active && (
                    <Link href="/activate">
                      <button className="w-full mt-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg hover:from-red-700 hover:to-orange-700 transition-all">
                        Activate Now
                      </button>
                    </Link>
                  )}
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

                  {/* Services - FIXED */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Services Offered
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {serviceOptions.map(service => {
                        // SAFE check: Ensure user.services is an array
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