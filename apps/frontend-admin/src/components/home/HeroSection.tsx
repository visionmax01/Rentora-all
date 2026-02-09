'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MapPinIcon, HomeIcon, WrenchIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';

export function HeroSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'rent' | 'services' | 'buy'>('rent');

  const tabs = [
    { id: 'rent', label: 'Rent', icon: HomeIcon, href: '/properties' },
    { id: 'services', label: 'Services', icon: WrenchIcon, href: '/services' },
    { id: 'buy', label: 'Buy/Sell', icon: ShoppingBagIcon, href: '/marketplace' },
  ];

  return (
    <section className="relative bg-gradient-to-br from-primary-600 to-primary-800 text-white">
      <div className="absolute inset-0 bg-black/20" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Find Your Perfect Home in Nepal
          </h1>
          <p className="text-xl md:text-2xl text-primary-100 mb-10">
            Discover rooms, apartments, and houses. Book professional services. 
            Buy and sell items in our marketplace.
          </p>

          {/* Search Box */}
          <div className="bg-white rounded-2xl shadow-2xl p-4 md:p-6">
            {/* Tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto">
              {tabs.map((tab) => (
                <Link
                  key={tab.id}
                  href={tab.href}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab(tab.id as typeof activeTab);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </Link>
              ))}
            </div>

            {/* Search Input */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by city, area, or property name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>
              <Link
                href={`${tabs.find((t) => t.id === activeTab)?.href}?q=${encodeURIComponent(
                  searchQuery
                )}`}
              >
                <Button size="lg" className="w-full md:w-auto">
                  Search
                </Button>
              </Link>
            </div>

            {/* Quick Links */}
            <div className="flex flex-wrap gap-2 mt-4 text-sm">
              <span className="text-gray-500">Popular:</span>
              {['Kathmandu', 'Lalitpur', 'Bhaktapur', 'Pokhara'].map((city) => (
                <Link
                  key={city}
                  href={`/properties?city=${city}`}
                  className="text-primary-600 hover:text-primary-700"
                >
                  {city}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 text-center">
          {[
            { value: '10K+', label: 'Properties' },
            { value: '50K+', label: 'Users' },
            { value: '100+', label: 'Services' },
            { value: '5K+', label: 'Items Sold' },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-3xl md:text-4xl font-bold">{stat.value}</div>
              <div className="text-primary-200">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}