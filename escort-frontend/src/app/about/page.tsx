'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function About() {
  return (
    <div className="w-full overflow-x-hidden">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-red-50 to-red-100 py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              About Escorthub254
            </h1>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              The discreet, no-nonsense platform where independent escorts and discerning gentlemen (and ladies) meet on their own terms.
            </p>
          </div>
        </div>
      </section>

      {/* Welcome & Our Role */}
      <section className="py-12 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Welcome to Escorthub254
              </h2>
              <p className="text-gray-700 text-lg mb-4 leading-relaxed">
                We know the game. You’re an escort — a call girl, a night companion — and you want to connect with clients who respect your time, your boundaries, and your desires. You’re not looking for a pimp, a middleman, or a shady agency taking a cut. You want a clean, simple space to post your profile, set your rates, and let the right people find you.
              </p>
              <p className="text-gray-700 text-lg leading-relaxed">
                That’s where we come in.
              </p>
            </div>
            <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-lg h-96 flex items-center justify-center shadow-lg">
              <div className="text-center text-white p-8">
                <div className="text-6xl mb-4">🔑</div>
                <p className="text-xl font-semibold">Your Terms. Your Night.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What We Do & Don't Do */}
      <section className="py-12 md:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-2xl font-bold text-green-600 mb-4">✓ What we do:</h3>
              <p className="text-gray-700 text-lg leading-relaxed">
                Escorthub254 provides a secure, user-friendly online directory where escorts can create detailed listings — photos, services, availability, rates — and where potential clients can browse, message, and arrange private meetings. Think of us as the bridge. Nothing more, nothing less.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-2xl font-bold text-red-600 mb-4">✗ What we don’t do:</h3>
              <p className="text-gray-700 text-lg leading-relaxed">
                We do not book appointments. We do not negotiate payments. We do not screen clients. We do not accompany anyone anywhere. Our role ends the moment two parties exchange contact information. Every meeting, every transaction, every act that happens afterward is solely between the individuals involved.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Plans - NEW SECTION */}
      <section className="py-12 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-center">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Escorthub254 works on a subscription basis. Choose the plan that fits your needs — no hidden fees, no commissions, just full control.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* 5 Days Plan */}
            <div className="bg-gray-50 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow border-2 border-transparent hover:border-red-200">
              <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white text-center">
                <h3 className="text-2xl font-bold">5 Days</h3>
                <p className="text-red-100 mt-1">Perfect for trying us out</p>
              </div>
              <div className="p-8 text-center">
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  KSh 500
                </div>
                <p className="text-gray-600 mb-6">for 5 days of access</p>
                <ul className="text-left space-y-3 mb-8">
                  <li className="flex items-center text-gray-700">
                    <span className="text-green-500 mr-2">✓</span> Full profile listing
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="text-green-500 mr-2">✓</span> Photo uploads
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="text-green-500 mr-2">✓</span> Direct messaging
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="text-green-500 mr-2">✓</span> 24/7 visibility
                  </li>
                </ul>
                <Link
                  href="/register?plan=5days"
                  className="block w-full bg-red-600 text-white text-center py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                >
                  Get Started
                </Link>
              </div>
            </div>

            {/* 2 Weeks Plan - Recommended */}
            <div className="bg-gray-50 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-transform transform hover:scale-105 border-2 border-red-500 relative">
              <div className="absolute top-0 right-0 bg-red-500 text-white px-4 py-1 rounded-bl-lg text-sm font-semibold">
                POPULAR
              </div>
              <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 text-white text-center">
                <h3 className="text-2xl font-bold">2 Weeks</h3>
                <p className="text-red-100 mt-1">Best value for regulars</p>
              </div>
              <div className="p-8 text-center">
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  KSh 1,500
                </div>
                <p className="text-gray-600 mb-6">for 14 days of access</p>
                <ul className="text-left space-y-3 mb-8">
                  <li className="flex items-center text-gray-700">
                    <span className="text-green-500 mr-2">✓</span> Everything in 5-day plan
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="text-green-500 mr-2">✓</span> Featured placement
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="text-green-500 mr-2">✓</span> Priority support
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="text-green-500 mr-2">✓</span> Verified badge
                  </li>
                </ul>
                <Link
                  href="/register?plan=2weeks"
                  className="block w-full bg-red-600 text-white text-center py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                >
                  Get Started
                </Link>
              </div>
            </div>

            {/* 1 Month Plan */}
            <div className="bg-gray-50 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow border-2 border-transparent hover:border-red-200">
              <div className="bg-gradient-to-r from-red-700 to-red-800 p-6 text-white text-center">
                <h3 className="text-2xl font-bold">1 Month</h3>
                <p className="text-red-100 mt-1">Maximum exposure</p>
              </div>
              <div className="p-8 text-center">
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  KSh 3,000
                </div>
                <p className="text-gray-600 mb-6">for 30 days of access</p>
                <ul className="text-left space-y-3 mb-8">
                  <li className="flex items-center text-gray-700">
                    <span className="text-green-500 mr-2">✓</span> Everything in 2-week plan
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="text-green-500 mr-2">✓</span> Premium placement
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="text-green-500 mr-2">✓</span> Unlimited photo uploads
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="text-green-500 mr-2">✓</span> Best value (save 33%)
                  </li>
                </ul>
                <Link
                  href="/register?plan=1month"
                  className="block w-full bg-red-700 text-white text-center py-3 rounded-lg font-semibold hover:bg-red-800 transition-colors"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
          <p className="text-center text-gray-500 text-sm mt-8">
            All subscriptions are prepaid and non-refundable. Cancel anytime — no auto-renewal.
          </p>
        </div>
      </section>

      {/* Legal Disclaimer / Important Notice */}
      <section className="py-8 md:py-12 bg-red-50 border-y-2 border-red-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-red-800 mb-4">⚠️ Important – Please Read</h2>
          <div className="bg-white p-6 rounded-lg shadow-inner text-left">
            <p className="text-gray-800 leading-relaxed">
              Escorthub254 is a platform for connection only. We are not an agency, a brothel, or a facilitator of any illegal activity. The website, its owners, operators, and affiliates are in no way liable for any meetings, arrangements, disputes, injuries, or legal consequences that may arise between users. All parties meet at their own risk. By using this site, you acknowledge that you are responsible for your own safety, your own conduct, and your own choices.
            </p>
          </div>
        </div>
      </section>

      {/* Why Choose Us - Updated */}
      <section className="py-12 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12 text-center">
            Why choose us?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: '🤫',
                title: 'Total discretion',
                description: 'Your identity and data are protected.'
              },
              {
                icon: '🕊️',
                title: 'Freedom',
                description: 'No contracts, no obligations, no cut of your earnings.'
              },
              {
                icon: '⚙️',
                title: 'Support',
                description: 'We keep the platform running smooth so you can focus on your business.'
              },
              {
                icon: '💯',
                title: 'Real',
                description: 'No bots, no fake profiles — real people looking for real connections.'
              }
            ].map((feature, index) => (
              <div key={index} className="bg-gray-50 p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow text-center">
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-700">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Services - Streamlined */}
      <section className="py-12 md:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12 text-center">
            How We Connect You
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'For Escorts',
                description: 'Create a detailed listing with photos, services, availability, and your own rates. Stay independent. Keep 100% of your earnings.'
              },
              {
                title: 'For Clients',
                description: 'Browse authentic profiles. Find exactly what you’re looking for. Message directly and arrange private meetings on your terms.'
              },
              {
                title: 'The Bridge',
                description: 'We facilitate the connection, nothing more. After that, the arrangement is solely between you and the other party.'
              }
            ].map((item, index) => (
              <div key={index} className="bg-white border-l-4 border-red-600 rounded-r-lg shadow-md p-8">
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">{item.title}</h3>
                <p className="text-gray-700 text-lg">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Simplified Steps */}
      <section className="py-12 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12 text-center">
            Get Started in 3 Steps
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Choose Plan', desc: 'Pick from 5-day, 2-week, or 1-month subscription.' },
              { step: '2', title: 'Create Profile', desc: 'Sign up and create your listing in minutes.' },
              { step: '3', title: 'Connect', desc: 'Get discovered and message clients directly.' }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="bg-red-600 text-white rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 text-3xl font-bold">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-700">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Escorthub254 Ethos */}
      <section className="py-12 md:py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Own Your Night.
          </h2>
          <p className="text-xl text-gray-700 mb-8 leading-relaxed">
            So whether you’re a high-end companion seeking a regular or a night girl looking for a one-off thrill, Escorthub254 is your open door. Choose a subscription plan that works for you. Create your profile. Set your terms. Own your night.
          </p>
          <div className="border-t-2 border-red-200 pt-8 mt-4">
            <p className="text-2xl font-light text-gray-600">No liability. No limits. Just connection.</p>
            <p className="text-lg text-gray-500 mt-4">— The Escorthub254 Team</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-red-600 to-red-700 py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to take control?
          </h2>
          <p className="text-xl text-red-100 mb-8 max-w-2xl mx-auto">
            Join Escorthub254 today. Choose from our flexible subscription plans — no commissions, just real connections on your terms.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-3 bg-white text-red-600 rounded-lg font-semibold hover:bg-red-50 transition-colors"
            >
              View Plans
            </Link>
            <Link
              href="/providers"
              className="px-8 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-800 transition-colors border-2 border-white"
            >
              Browse Providers
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}