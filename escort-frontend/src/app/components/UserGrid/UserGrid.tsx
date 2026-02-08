// src/app/components/UserGrid/UserGrid.tsx
'use client';

import { useState, useEffect } from 'react';
import UserCard from '../UserCard/UserCard';
import { User, ApiResponse } from '@/app/types/user';

export default function UserGrid() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  
  // Search states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [locations, setLocations] = useState<string[]>([]);
  const [selectedService, setSelectedService] = useState<string>('');
  const [services, setServices] = useState<string[]>([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  // Base URL for Go Backend
  const API_BASE_URL = 'https://escort-vcix.onrender.com';

  // Fetch users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Extract unique locations and services
  useEffect(() => {
    if (users.length > 0) {
      // Extract unique locations
      const uniqueLocations = [...new Set(
        users
          .map(user => user.location)
          .filter((location): location is string => !!location && location.trim() !== '')
      )].sort();
      setLocations(uniqueLocations);

      // Extract unique services (flatten and deduplicate)
      const allServices = users.flatMap(user => user.services || []);
      const uniqueServices = [...new Set(allServices)]
        .filter(service => service && service.trim() !== '')
        .sort();
      setServices(uniqueServices);
    }
  }, [users]);

  // Filter users whenever search criteria changes
  useEffect(() => {
    applyFilters();
  }, [users, searchTerm, selectedLocation, selectedService]);

  // Main API CALL
  const fetchUsers = async (): Promise<void> => {
    try {
      setLoading(true);
      setError('');

      // CALL TO MY GO BACKEND
      const response = await fetch(`${API_BASE_URL}/users`);

      if (!response.ok) {
        throw new Error(`Failed to fetch users. Status: ${response.status}`);
      }

      const data: ApiResponse = await response.json();
      
      console.log('API Response:', data); // Debugging log

      if (data.success && data.data) {
        setUsers(data.data);
        setFilteredUsers(data.data);
      } else {
        throw new Error(data.error || 'No users found');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  // Apply all filters
  const applyFilters = () => {
    let filtered = [...users];

    // Filter by search term (full_name, location, services)
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        user.full_name?.toLowerCase().includes(term) ||
        user.location?.toLowerCase().includes(term) ||
        user.services?.some(service => service.toLowerCase().includes(term))
      );
    }

    // Filter by selected location
    if (selectedLocation.trim() !== '') {
      filtered = filtered.filter(user => 
        user.location?.toLowerCase().includes(selectedLocation.toLowerCase())
      );
    }

    // Filter by selected service
    if (selectedService.trim() !== '') {
      filtered = filtered.filter(user => 
        user.services?.some(service => 
          service.toLowerCase().includes(selectedService.toLowerCase())
        )
      );
    }

    setFilteredUsers(filtered);
  };

  const handleSearch = () => {
    applyFilters();
  };

  const clearFilters = (): void => {
    setSearchTerm('');
    setSelectedLocation('');
    setSelectedService('');
    setFilteredUsers(users);
  };

  const handleLocationSelect = (location: string) => {
    setSelectedLocation(location);
    setShowLocationDropdown(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
        <p className="text-gray-600">Loading service providers...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">⚠️ {error}</div>
        <button
          onClick={fetchUsers}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Enhanced Search Bar */}
      <div className="mb-10 bg-white rounded-2xl shadow-xl p-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Find Your Perfect Match</h3>
          <p className="text-gray-600">Search by location, services, or name</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          {/* Location Search */}
          <div className="relative">
            <div className="flex items-center border rounded-lg px-4 py-3 hover:border-purple-500 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-200">
              <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <input
                type="text"
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                onFocus={() => setShowLocationDropdown(true)}
                onBlur={() => setTimeout(() => setShowLocationDropdown(false), 200)}
                placeholder="Enter location..."
                className="w-full outline-none text-gray-700 placeholder-gray-400"
                onKeyPress={handleKeyPress}
              />
              {selectedLocation && (
                <button
                  onClick={() => setSelectedLocation('')}
                  className="ml-2 text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              )}
            </div>
            
            {/* Location Dropdown */}
            {showLocationDropdown && locations.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                <div className="p-2 border-b">
                  <p className="text-sm font-medium text-gray-700">Available Locations</p>
                </div>
                {locations.map((location, index) => (
                  <button
                    key={index}
                    onClick={() => handleLocationSelect(location)}
                    className="w-full text-left px-4 py-2 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                  >
                    {location}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Service Filter */}
          <div className="border rounded-lg px-4 py-3 hover:border-purple-500 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-200">
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="w-full outline-none text-gray-700 appearance-none bg-white"
            >
              <option value="">All Services</option>
              {services.map((service, index) => (
                <option key={index} value={service}>
                  {service}
                </option>
              ))}
            </select>
          </div>

          {/* Keyword Search */}
          <div className="border rounded-lg px-4 py-3 hover:border-purple-500 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-200">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search by name or services..."
              className="w-full outline-none text-gray-700 placeholder-gray-400"
            />
          </div>

          {/* Search Actions */}
          <div className="flex space-x-2">
            <button
              onClick={handleSearch}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search
            </button>
            {(searchTerm || selectedLocation || selectedService) && (
              <button
                onClick={clearFilters}
                className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                title="Clear all filters"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Quick Filters */}
        <div className="space-y-3">
          {/* Quick Location Filters */}
          {locations.length > 0 && (
            <div>
              <p className="text-sm text-gray-600 mb-2">Popular locations:</p>
              <div className="flex flex-wrap gap-2">
                {locations.slice(0, 6).map((location) => (
                  <button
                    key={location}
                    onClick={() => handleLocationSelect(location)}
                    className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                      selectedLocation === location
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {location}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Service Filters */}
          {services.length > 0 && (
            <div>
              <p className="text-sm text-gray-600 mb-2">Popular services:</p>
              <div className="flex flex-wrap gap-2">
                {services.slice(0, 8).map((service) => (
                  <button
                    key={service}
                    onClick={() => setSelectedService(service)}
                    className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                      selectedService === service
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {service}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Available Service Providers
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            {filteredUsers.length} {filteredUsers.length === 1 ? 'provider' : 'providers'} found
            {selectedLocation && ` in ${selectedLocation}`}
            {selectedService && ` offering ${selectedService}`}
            {searchTerm && ` matching "${searchTerm}"`}
          </p>
        </div>

        {(searchTerm || selectedLocation || selectedService) && (
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm whitespace-nowrap w-full sm:w-auto"
          >
            Clear All Filters
          </button>
        )}
      </div>

      {/* Users Grid */}
      {filteredUsers.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-gray-500 text-lg mb-4">
            {selectedLocation
              ? `No service providers found in ${selectedLocation}`
              : selectedService
              ? `No providers found offering ${selectedService}`
              : searchTerm
              ? `No results found for "${searchTerm}"`
              : 'No service providers available'
            }
          </div>
          {(searchTerm || selectedLocation || selectedService) && (
            <button
              onClick={clearFilters}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>
      )}
    </div>
  );
}