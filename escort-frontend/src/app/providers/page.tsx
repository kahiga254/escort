'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { User, ApiResponse } from '@/app/types/user';

export default function Providers() {
  const [providers, setProviders] = useState<User[]>([]);
  const [filteredProviders, setFilteredProviders] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [imageIndices, setImageIndices] = useState<{ [key: string]: number }>({});

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/users`);
      if (!response.ok) throw new Error('Failed to fetch providers');
      const data: ApiResponse = await response.json();
      if (data.success && data.data) {
        setProviders(data.data);
        setFilteredProviders(data.data);
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
      setProviders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = [...providers];
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.full_name?.toLowerCase().includes(term) ||
        p.location?.toLowerCase().includes(term) ||
        p.services?.some(s => s.toLowerCase().includes(term))
      );
    }

    setFilteredProviders(filtered);
  }, [providers, searchTerm]);

  // Rotate images every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setImageIndices(prev => {
        const updated = { ...prev };
        filteredProviders.forEach(provider => {
          updated[provider.id] = ((updated[provider.id] || 0) + 1) % (provider.services?.length || 1);
        });
        return updated;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [filteredProviders]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Service Providers</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg overflow-hidden shadow-md animate-pulse">
                <div className="w-full h-64 bg-gray-200"></div>
                <div className="p-6 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-red-600 to-red-700 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Verified Service Providers
          </h1>
          <p className="text-xl text-red-100">
            Browse our collection of verified, professional service providers in Nairobi
          </p>
        </div>
      </section>

      {/* Filters & Search */}
      <section className="bg-white shadow-sm py-6 md:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Search by name, location, or service..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600 transition-colors"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Providers Grid */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredProviders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-2xl text-gray-600 mb-4">No providers found</p>
              <p className="text-gray-500">Try adjusting your search filters</p>
            </div>
          ) : (
            <>
              <p className="text-gray-600 mb-8">
                Showing <span className="font-bold text-red-600">{filteredProviders.length}</span> verified provider{filteredProviders.length !== 1 ? 's' : ''}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProviders.map((provider) => (
                  <Link key={provider.id} href={`/provider/${provider.id}`} className="group">
                    <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                      <div className="relative w-full h-64 bg-gray-200 overflow-hidden flex items-center justify-center">
                        {provider.image_url ? (
                          <img
                            src={provider.image_url}
                            alt={provider.full_name}
                            className="w-full h-full object-contain transition-opacity duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-red-200 to-red-300 flex items-center justify-center">
                            <span className="text-6xl">👤</span>
                          </div>
                        )}
                      </div>

                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-red-600 transition-colors">
                          {provider.full_name}
                        </h3>

                        <div className="flex items-center gap-2 text-gray-600 mb-4">
                          <span>📍</span>
                          <span>{provider.location}</span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-600 mb-4">
                          <span>📞</span>
                          <span>{provider.phone_no}</span>
                        </div>

                        {provider.services && provider.services.length > 0 && (
                          <div className="mb-4">
                            <div className="flex flex-wrap gap-2">
                              {provider.services.slice(0, 3).map((service, idx) => (
                                <span key={idx} className="bg-red-100 text-red-700 text-xs px-3 py-1 rounded-full">
                                  {service}
                                </span>
                              ))}
                              {provider.services.length > 3 && (
                                <span className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full">
                                  +{provider.services.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="border-t border-gray-200 pt-4 mt-auto">
                          <button className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold text-sm">
                            View Profile
                          </button>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}