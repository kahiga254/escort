// src/app/page.tsx
import UserGrid from "@/app/components/UserGrid/UserGrid";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Hero Section */}
      <section className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Find Trusted Service Providers
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Connect with verified professionals in your area for all your service needs
          </p>
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-full shadow-lg p-2 flex items-center">
              <input
                type="text"
                placeholder="Search for plumbers, electricians, carpenters..."
                className="flex-1 px-6 py-3 outline-none text-gray-700 placeholder-gray-400"
              />
              <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-full font-medium hover:opacity-90 transition-opacity">
                Search
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <UserGrid />
        </div>
      </section>
    </main>
  );
}