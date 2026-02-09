// src/app/components/UserCard/UserCard.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { User } from '@/app/types/user';

interface UserCardProps {
  user: User;
}

export default function UserCard({ user }: UserCardProps) {
  const [showContact, setShowContact] = useState<boolean>(false);
  const [imgError, setImgError] = useState<boolean>(false);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);

  const handleContact = (e: React.MouseEvent): void => {
    e.preventDefault(); // Prevent Link navigation
    e.stopPropagation(); // Stop event bubbling
    setShowContact(!showContact);
  };

  const handleCall = (e: React.MouseEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm(`Call ${user.full_name} at ${user.phone_no}?`)) {
      window.location.href = `tel:${user.phone_no}`;
    }
  };

  const handleCopyPhone = async (e: React.MouseEvent): Promise<void> => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(user.phone_no);
      alert('Phone number copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Get user ID for the link
  const userId = user.id || user._id;

  // Generate fallback avatar URL
  const fallbackAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=667eea&color=fff&size=300&bold=true&font-size=0.8`;

  return (
    <Link href={`/provider/${userId}`} className="block">
      <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden flex flex-col h-full border border-gray-100 cursor-pointer group">
        {/* User Image - UPDATED: Added container with padding/margin */}
        <div className="relative w-full aspect-[4/3] overflow-hidden bg-gradient-to-br from-purple-600/10 to-pink-600/10">
          <div className="absolute inset-0 p-2"> {/* Added padding container */}
            {user.image_url && !imgError ? (
              <>
                {/* Main image with fitting options */}
                <img
                  src={user.image_url}
                  alt={user.full_name}
                  className={`w-full h-full object-contain transition-transform duration-700 group-hover:scale-105 ${
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImgError(true)}
                  loading="lazy"
                  decoding="async"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    margin: '0 auto', // Center the image
                    display: 'block'
                  }}
                />
                
                {/* Loading skeleton */}
                {!imageLoaded && (
                  <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg"></div>
                )}
              </>
            ) : (
              // Fallback avatar - also with margin
              <div className="w-full h-full flex items-center justify-center p-2">
                <div className="w-full h-full rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                  <div className="text-white text-5xl font-bold">
                    {user.full_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* View Profile Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-6">
            <span className="bg-white/95 backdrop-blur-sm text-purple-700 px-5 py-2.5 rounded-xl font-semibold text-sm shadow-xl transform -translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
              View Profile →
            </span>
          </div>
        </div>

        {/* User Info */}
        <div className="p-5 flex-1 flex flex-col">
          <h3 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-1 group-hover:text-purple-600 transition-colors">
            {user.full_name}
          </h3>
          
          {/* Services */}
          {user.services && user.services.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {user.services.slice(0, 3).map((service, index) => (
                <span 
                  key={index} 
                  className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full text-xs font-medium hover:bg-indigo-100 transition-colors"
                >
                  {service}
                </span>
              ))}
              {user.services.length > 3 && (
                <span className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full text-xs hover:bg-gray-200 transition-colors">
                  +{user.services.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Location */}
          {user.location && (
            <div className="flex items-center text-gray-600 text-sm mb-5">
              <svg 
                className="w-4 h-4 mr-2 flex-shrink-0 text-gray-500" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="truncate hover:text-gray-900 transition-colors">
                {user.location}
              </span>
            </div>
          )}

          {/* Contact Button */}
          <div className="mt-auto" onClick={(e) => e.stopPropagation()}>
            {!showContact ? (
              <button
                onClick={handleContact}
                className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:opacity-95 transition-all hover:-translate-y-0.5 active:scale-[0.98] shadow-md hover:shadow-lg"
              >
                Show Contact
              </button>
            ) : (
              <div className="animate-fadeIn space-y-3">
                <div>
                  <div className="text-xs text-gray-500 font-medium mb-1.5">Phone Number:</div>
                  <div className="text-lg font-semibold text-gray-900 font-mono truncate bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                    {user.phone_no}
                  </div>
                </div>
                <div className="flex gap-2.5">
                  <button
                    onClick={handleCall}
                    className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all active:scale-[0.98] shadow hover:shadow-md flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Call Now
                  </button>
                  <button
                    onClick={handleCopyPhone}
                    className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all active:scale-[0.98] shadow hover:shadow-md flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </button>
                </div>
                <button
                  onClick={() => setShowContact(false)}
                  className="w-full text-sm text-gray-500 hover:text-gray-700 font-medium py-2 transition-colors"
                >
                  Hide contact
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}