'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

interface Provider {
  _id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone_no: string;
  email?: string;
  image_url?: string;
  images?: string[];
  services: string[];
  location: string;
  gender?: string;
  sexual_orientation?: string;
  age?: number;
  nationality?: string;
  is_active: boolean;
  has_subscription: boolean;
  subscription_expiry?: string;
  stats?: {
    views: number;
    calls: number;
    bookings: number;
  };
  created_at?: string;
}

const API_BASE_URL = 'http://https://escort-vcix.onrender.com';

export default function ProviderProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showFullPhone, setShowFullPhone] = useState(false);

  const providerId = params.id as string;

  useEffect(() => {
    if (providerId) {
      fetchProviderDetails();
    }
  }, [providerId]);

  const fetchProviderDetails = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${API_BASE_URL}/user/${providerId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch provider details. Status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.user) {
        // Ensure images array exists
        const userData = {
          ...data.user,
          full_name: data.user.full_name || `${data.user.first_name || ''} ${data.user.last_name || ''}`.trim(),
          images: Array.isArray(data.user.images) ? data.user.images : 
                 (data.user.image_url ? [data.user.image_url] : []),
        };
        setProvider(userData);
      } else {
        throw new Error(data.error || 'Provider not found');
      }
    } catch (err) {
      console.error('Error fetching provider:', err);
      setError(err instanceof Error ? err.message : 'Failed to load provider profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCall = () => {
    if (provider?.phone_no && window.confirm(`Call ${provider.full_name} at ${provider.phone_no}?`)) {
      window.location.href = `tel:${provider.phone_no}`;
    }
  };

  const handleCopyPhone = async () => {
    if (provider?.phone_no) {
      try {
        await navigator.clipboard.writeText(provider.phone_no);
        alert('Phone number copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const formatPhoneNumber = (phone: string) => {
    if (showFullPhone || phone.length <= 12) return phone;
    return `${phone.slice(0, 4)}****${phone.slice(-4)}`;
  };

  const getImageSrc = (index: number) => {
    if (!provider?.images || provider.images.length === 0) return '';
    return provider.images[index] || provider.images[0] || '';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Profile Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The provider profile you are looking for does not exist.'}</p>
          <div className="space-x-4">
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Back to Home
            </button>
            <button
              onClick={fetchProviderDetails}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const allImages = provider.images || [];
  const mainImage = getImageSrc(selectedImageIndex);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Navigation */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Providers
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Photos & Contact */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow p-6">
              {/* Main Profile Header */}
              <div className="flex flex-col md:flex-row gap-6 mb-8">
                {/* Profile Image */}
                <div className="md:w-48 md:h-48 w-full h-64 rounded-xl overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100">
                  {mainImage ? (
                    <img
                      src={mainImage}
                      alt={provider.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-5xl font-bold text-purple-300">
                        {provider.full_name?.charAt(0) || 'P'}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Info */}
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">{provider.full_name}</h1>
                      <div className="flex items-center text-gray-600 mt-2">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="font-medium">{provider.location || 'Location not specified'}</span>
                      </div>
                    </div>
                    
                    {/* Status Badges */}
                    <div className="flex flex-wrap gap-2">
                      {provider.is_active && (
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                          ✓ Active
                        </span>
                      )}
                      {provider.has_subscription && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          Premium
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{provider.stats?.views || 0}</div>
                      <div className="text-sm text-gray-600">Profile Views</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{provider.stats?.calls || 0}</div>
                      <div className="text-sm text-gray-600">Calls Received</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{provider.stats?.bookings || 0}</div>
                      <div className="text-sm text-gray-600">Bookings</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gallery Thumbnails */}
              {allImages.length > 1 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Photos ({allImages.length})</h3>
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                    {allImages.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`aspect-square rounded-lg overflow-hidden border-2 ${
                          selectedImageIndex === index 
                            ? 'border-purple-500' 
                            : 'border-transparent hover:border-gray-300'
                        }`}
                      >
                        <img
                          src={image}
                          alt={`${provider.full_name} - Photo ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact Section */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="mb-4">
                    <div className="text-sm text-gray-600 font-medium mb-2">Phone Number</div>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold text-gray-900 font-mono">
                        {formatPhoneNumber(provider.phone_no)}
                      </div>
                      {!showFullPhone && provider.phone_no.length > 12 && (
                        <button
                          onClick={() => setShowFullPhone(true)}
                          className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                        >
                          Show Full Number
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleCall}
                      className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-medium rounded-lg hover:opacity-90 transition-all flex items-center justify-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      Call Now
                    </button>
                    <button
                      onClick={handleCopyPhone}
                      className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium rounded-lg hover:opacity-90 transition-all flex items-center justify-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy Number
                    </button>
                    <button
                      onClick={() => {
                        const message = `Hello ${provider.full_name}, I saw your profile on the website and I'm interested in your services.`;
                        window.open(`https://wa.me/${provider.phone_no.replace('+', '')}?text=${encodeURIComponent(message)}`, '_blank');
                      }}
                      className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-lg hover:opacity-90 transition-all flex items-center justify-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.76.982.998-3.675-.236-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.9 6.994c-.004 5.45-4.438 9.88-9.888 9.88m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.333.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.333 11.893-11.893 0-3.18-1.24-6.162-3.495-8.411"/>
                      </svg>
                      WhatsApp
                    </button>
                  </div>
                </div>
              </div>

              {/* About Section */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">About</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-gray-600 font-medium mb-1">Gender</div>
                      <div className="text-gray-900">{provider.gender || 'Not specified'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 font-medium mb-1">Age</div>
                      <div className="text-gray-900">{provider.age ? `${provider.age} years` : 'Not specified'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 font-medium mb-1">Nationality</div>
                      <div className="text-gray-900">{provider.nationality || 'Not specified'}</div>
                    </div>
                  </div>
                  <div>
                    <div>
                      <div className="text-sm text-gray-600 font-medium mb-1">Sexual Orientation</div>
                      <div className="text-gray-900">{provider.sexual_orientation || 'Not specified'}</div>
                    </div>
                    <div className="mt-4">
                      <div className="text-sm text-gray-600 font-medium mb-1">Member Since</div>
                      <div className="text-gray-900">
                        {provider.created_at 
                          ? new Date(provider.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })
                          : 'Not available'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Services & Actions */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Services Offered */}
              <div className="bg-white rounded-xl shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Services Offered</h3>
                <div className="space-y-3">
                  {provider.services && provider.services.length > 0 ? (
                    provider.services.map((service, index) => (
                      <div 
                        key={index} 
                        className="flex items-center p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                      >
                        <div className="w-8 h-8 flex items-center justify-center bg-purple-100 text-purple-600 rounded-lg mr-3">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-gray-900 font-medium">{service}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      No services listed
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      const message = `I'm interested in booking an appointment with ${provider.full_name}.`;
                      window.open(`sms:${provider.phone_no}&body=${encodeURIComponent(message)}`);
                    }}
                    className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:opacity-90 transition-all flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Send SMS
                  </button>
                  
                  <button
                    onClick={() => {
                      navigator.share({
                        title: `${provider.full_name} - Service Provider`,
                        text: `Check out ${provider.full_name}'s profile on our platform!`,
                        url: window.location.href,
                      }).catch(console.error);
                    }}
                    className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:opacity-90 transition-all flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    Share Profile
                  </button>

                  <button
                    onClick={() => {
                      if (window.confirm('Report this profile for inappropriate content?')) {
                        alert('Thank you for reporting. Our team will review this profile.');
                      }
                    }}
                    className="w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    Report Profile
                  </button>
                </div>
              </div>

              {/* Safety Tips */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                <h4 className="text-sm font-semibold text-blue-800 mb-3 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Safety Tips
                </h4>
                <ul className="text-xs text-blue-700 space-y-2">
                  <li>• Meet in public places first</li>
                  <li>• Inform a friend about your plans</li>
                  <li>• Trust your instincts</li>
                  <li>• Keep personal information private</li>
                  <li>• Verify identity before meeting</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}