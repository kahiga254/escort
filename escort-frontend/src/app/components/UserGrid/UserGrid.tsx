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
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [locations, setLocations] = useState<string[]>([]);

  // Base URL for Go Backend
  const API_BASE_URL = 'http://localhost:8080';

  // Fetch users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Extract unique locations
  useEffect(() => {
    if (users.length > 0) {
      const uniqueLocations = [...new Set(
        users
          .map(user => user.location)
          .filter((location): location is string => !!location)
      )].sort();
      setLocations(uniqueLocations);
    }
  }, [users]);

  // Filter users
  useEffect(() => {
    if (selectedLocation) {
      const filtered = users.filter(user => 
        user.location?.toLowerCase().includes(selectedLocation.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [users, selectedLocation]);

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

  const clearFilters = (): void => {
    setSelectedLocation('');
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Available Service Providers
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            {filteredUsers.length} providers found
          </p>
        </div>

        {/* Location Filter */}
        {locations.length > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <label htmlFor="location-filter" className="text-gray-600 text-sm font-medium whitespace-nowrap">
                Filter by Location:
              </label>
              <select
                id="location-filter"
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none w-full sm:w-auto"
              >
                <option value="">All Locations</option>
                {locations.map((location, index) => (
                  <option key={index} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>
            {selectedLocation && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm whitespace-nowrap w-full sm:w-auto"
              >
                Clear Filter
              </button>
            )}
          </div>
        )}
      </div>

      {/* Users Grid */}
      {filteredUsers.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <div className="text-gray-500 text-lg mb-4">
            {selectedLocation
              ? `No service providers found in ${selectedLocation}`
              : 'No service providers available'
            }
          </div>
          {selectedLocation && (
            <button
              onClick={clearFilters}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Clear Filter
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