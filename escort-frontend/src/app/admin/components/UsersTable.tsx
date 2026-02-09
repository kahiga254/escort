// app/admin/components/UsersTable.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';

interface UsersTableProps {
  users: any[];
  loading: boolean;
  error: string;
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  onPageChange: (page: number) => void;
  onRefresh: () => void;
}

export default function UsersTable({
  users,
  loading,
  error,
  pagination,
  onPageChange,
  onRefresh,
}: UsersTableProps) {
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
        Active
      </span>
    ) : (
      <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
        Inactive
      </span>
    );
  };

  const getSubscriptionBadge = (hasSubscription: boolean, subscriptionExpiry?: string) => {
    if (!hasSubscription) {
      return (
        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
          No Subscription
        </span>
      );
    }
    
    if (subscriptionExpiry) {
      const expiry = new Date(subscriptionExpiry);
      const now = new Date();
      
      if (expiry < now) {
        return (
          <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
            Expired
          </span>
        );
      }
    }
    
    return (
      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
        Subscribed
      </span>
    );
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    if (!confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this user?`)) {
      return;
    }

    setActionLoading(userId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://https://escort-vcix.onrender.com/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (response.ok) {
        alert(`User ${currentStatus ? 'deactivated' : 'activated'} successfully!`);
        onRefresh();
      } else {
        throw new Error('Failed to update user status');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Failed to update user status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      return;
    }

    setActionLoading(`delete-${userId}`);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://https://escort-vcix.onrender.com/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert('User deleted successfully!');
        onRefresh();
      } else {
        throw new Error('Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">Error: {error}</div>
        <button
          onClick={onRefresh}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl shadow">
        <div className="text-gray-500 text-lg mb-4">No users found</div>
        <button
          onClick={onRefresh}
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      {/* Table Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Users ({pagination.total.toLocaleString()})
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Page {pagination.page} of {pagination.total_pages}
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subscription
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      {user.image_url ? (
                        <img
                          className="h-10 w-10 rounded-full object-cover"
                          src={user.image_url}
                          alt={user.first_name}
                          onError={(e) => {
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.first_name)}&background=667eea&color=fff`;
                          }}
                        />
                      ) : (
                        <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-purple-600 font-medium">
                            {user.first_name?.charAt(0) || 'U'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {user.first_name} {user.last_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {user.email || user.phone_no}
                      </div>
                      <div className="text-xs text-gray-400">
                        {user.location || 'No location'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(user.is_active)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getSubscriptionBadge(user.has_subscription, user.subscription_expiry)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(user.created_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSelectedUser(user)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleToggleStatus(user._id, user.is_active)}
                      disabled={actionLoading === user._id}
                      className={`${user.is_active ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'} ${actionLoading === user._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {actionLoading === user._id ? 'Updating...' : user.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user._id, `${user.first_name} ${user.last_name}`)}
                      disabled={actionLoading === `delete-${user._id}`}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoading === `delete-${user._id}` ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
            <span className="font-medium">
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>{' '}
            of <span className="font-medium">{pagination.total}</span> users
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
              let pageNum: number;
              if (pagination.total_pages <= 5) {
                pageNum = i + 1;
              } else if (pagination.page <= 3) {
                pageNum = i + 1;
              } else if (pagination.page >= pagination.total_pages - 2) {
                pageNum = pagination.total_pages - 4 + i;
              } else {
                pageNum = pagination.page - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`px-3 py-1 border rounded text-sm ${pagination.page === pageNum
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.total_pages}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-xl bg-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">User Details</h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                {selectedUser.image_url ? (
                  <img
                    className="h-20 w-20 rounded-full object-cover"
                    src={selectedUser.image_url}
                    alt={selectedUser.first_name}
                  />
                ) : (
                  <div className="h-20 w-20 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl text-purple-600 font-medium">
                      {selectedUser.first_name?.charAt(0) || 'U'}
                    </span>
                  </div>
                )}
                <div>
                  <h4 className="text-lg font-semibold">{selectedUser.first_name} {selectedUser.last_name}</h4>
                  <p className="text-gray-600">{selectedUser.email}</p>
                  <p className="text-gray-600">{selectedUser.phone_no}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.location || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Gender</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.gender || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Age</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.age || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <p className="mt-1">{getStatusBadge(selectedUser.is_active)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Account Created</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(selectedUser.created_at)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedUser.updated_at ? formatDate(selectedUser.updated_at) : 'Never'}
                  </p>
                </div>
              </div>
              
              {selectedUser.services && selectedUser.services.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Services</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedUser.services.map((service: string, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedUser.has_subscription && selectedUser.subscription_expiry && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Subscription</label>
                  <div className="mt-2">
                    <p className="text-sm text-gray-900">
                      Expires: {formatDate(selectedUser.subscription_expiry)}
                    </p>
                    {getSubscriptionBadge(selectedUser.has_subscription, selectedUser.subscription_expiry)}
                  </div>
                </div>
              )}
              
              <div className="pt-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => handleToggleStatus(selectedUser._id, selectedUser.is_active)}
                  className={`px-4 py-2 rounded-lg ${selectedUser.is_active ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'} text-white`}
                >
                  {selectedUser.is_active ? 'Deactivate User' : 'Activate User'}
                </button>
                <Link
                  href={`/provider/${selectedUser._id}`}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  target="_blank"
                >
                  View Public Profile
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}