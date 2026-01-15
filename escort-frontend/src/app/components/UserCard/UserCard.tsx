// src/app/components/UserCard/UserCard.tsx
'use client';

import { useState } from 'react';
import { User } from '@/app/types/user';

interface UserCardProps {
  user: User;
}

export default function UserCard({ user }: UserCardProps) {
  const [showContact, setShowContact] = useState<boolean>(false);

  const handleContact = (): void => {
    setShowContact(!showContact);
  };

  const handleCall = (): void => {
    if (window.confirm(`Call ${user.full_name} at ${user.phone_no}?`)) {
      window.location.href = `tel:${user.phone_no}`;
    }
  };

  const handleCopyPhone = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(user.phone_no);
      alert('Phone number copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden flex flex-col h-full border border-gray-100">
      {/* User Image */}
      <div className="h-48 w-full bg-gradient-to-br from-purple-600 to-pink-600 relative overflow-hidden">
        {user.image_url ? (
          <img
            src={user.image_url}
            alt={user.full_name}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            onError={(e) => {
              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=667eea&color=fff&size=300`;
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white text-5xl font-bold">
            {user.full_name?.charAt(0) || 'U'}
          </div>
        )}
      </div>

      {/* User Info */}
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-1">
          {user.full_name}
        </h3>
        
        {/* Services */}
        {user.services && user.services.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {user.services.slice(0, 3).map((service, index) => (
              <span 
                key={index} 
                className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-medium"
              >
                {service}
              </span>
            ))}
            {user.services.length > 3 && (
              <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                +{user.services.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Location */}
        {user.location && (
          <div className="flex items-center text-gray-600 text-sm mb-5">
            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate">{user.location}</span>
          </div>
        )}

        {/* Contact Button */}
        <div className="mt-auto">
          {!showContact ? (
            <button
              onClick={handleContact}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:opacity-90 transition-all hover:-translate-y-0.5 active:scale-95"
            >
              Show Contact
            </button>
          ) : (
            <div className="animate-fadeIn">
              <div className="mb-3">
                <div className="text-xs text-gray-500 font-medium mb-1">Phone:</div>
                <div className="text-lg font-semibold text-gray-900 font-mono truncate">
                  {user.phone_no}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCall}
                  className="flex-1 py-2.5 bg-emerald-500 text-white font-medium rounded-lg hover:bg-emerald-600 transition-colors active:scale-95"
                >
                  Call Now
                </button>
                <button
                  onClick={handleCopyPhone}
                  className="flex-1 py-2.5 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors active:scale-95"
                >
                  Copy
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}