// app/admin/components/DashboardStats.tsx
'use client';

interface DashboardStatsProps {
  stats: any;
}

export default function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Users */}
      <StatCard
        title="Total Users"
        value={stats.users.total}
        change={`${stats.users.growth_rate.toFixed(1)}%`}
        icon="users"
        color="purple"
      />
      
      {/* Active Users */}
      <StatCard
        title="Active Users"
        value={stats.users.active}
        change={`${((stats.users.active / stats.users.total) * 100).toFixed(1)}% of total`}
        icon="active"
        color="green"
      />
      
      {/* Today's Registrations */}
      <StatCard
        title="Today's Registrations"
        value={stats.users.today}
        change={`vs ${stats.users.yesterday} yesterday`}
        icon="today"
        color="blue"
      />
      
      {/* Active Subscriptions */}
      <StatCard
        title="Active Subscriptions"
        value={stats.subscriptions.active}
        change={`${((stats.subscriptions.active / stats.subscriptions.total) * 100).toFixed(1)}% active rate`}
        icon="subscriptions"
        color="orange"
      />
    </div>
  );
}

// Stat Card Component
function StatCard({ title, value, change, icon, color }: any) {
  const getIcon = () => {
    switch (icon) {
      case 'users':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case 'active':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
      case 'today':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'subscriptions':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'purple':
        return 'bg-purple-100 text-purple-600';
      case 'green':
        return 'bg-green-100 text-green-600';
      case 'blue':
        return 'bg-blue-100 text-blue-600';
      case 'orange':
        return 'bg-orange-100 text-orange-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-1">{change}</p>
        </div>
        <div className={`p-3 rounded-full ${getColorClasses(color)}`}>
          {getIcon()}
        </div>
      </div>
    </div>
  );
}