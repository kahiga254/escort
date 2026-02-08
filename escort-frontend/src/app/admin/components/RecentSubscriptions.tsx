'use client';

import Link from 'next/link';

interface RecentSubscriptionsProps {
  subscriptions: any[];
}

export default function RecentSubscriptions({ subscriptions }: RecentSubscriptionsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string, expiryDate: string) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    
    if (expiry < now) {
      return (
        <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
          Expired
        </span>
      );
    }
    
    switch (status) {
      case 'active':
        return (
          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
            Active
          </span>
        );
      case 'pending':
        return (
          <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
            Pending
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
            {status}
          </span>
        );
    }
  };

  if (subscriptions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Subscriptions</h2>
        <div className="text-center py-8 text-gray-500">
          No recent subscriptions found
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Recent Subscriptions</h2>
        <Link
          href="/admin/subscriptions"
          className="text-sm text-purple-600 hover:text-purple-700 font-medium"
        >
          View all →
        </Link>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Plan
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Expires
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {subscriptions.map((subscription) => (
              <tr key={subscription._id} className="hover:bg-gray-50">
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {subscription.plan_name || 'Unknown Plan'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {subscription.duration_days} days
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatCurrency(subscription.amount || 0)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {getStatusBadge(subscription.status, subscription.expiry_date)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(subscription.expiry_date)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}