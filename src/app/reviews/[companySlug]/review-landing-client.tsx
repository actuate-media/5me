'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, ArrowRight } from 'lucide-react';
import { StarfieldBackground } from '@/components/ui/StarfieldBackground';

interface Company {
  id: string;
  name: string;
  slug: string;
  logo?: string;
}

interface Location {
  id: string;
  name: string;
  slug: string;
  address?: string;
}

interface ReviewLandingClientProps {
  company: Company;
  locations: Location[];
}

export function ReviewLandingClient({ company, locations }: ReviewLandingClientProps) {
  const [search, setSearch] = useState('');

  const filteredLocations = locations.filter(
    (loc) =>
      loc.name.toLowerCase().includes(search.toLowerCase()) ||
      loc.address?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-gray-900 to-[#586c96]">
      <StarfieldBackground />

      {/* Fixed 5me logo top-left */}
      <a
        href="https://5me.io"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="5me.io - Review Generation Tools"
        className="fixed top-4 left-4 sm:top-6 sm:left-6 z-20"
      >
        <img
          src="/assets/logos/5me-logo.png"
          alt="5me.io"
          className="h-10 sm:h-14 w-auto"
        />
      </a>
      
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">
        {/* White Card Container */}
        <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl p-8 md:p-10">
          {/* Logo */}
          <div className="text-center mb-6">
            {company.logo ? (
              <div className="mx-auto mb-6 w-[200px] h-[200px] rounded-full border-8 border-gray-100 bg-white flex items-center justify-center overflow-hidden">
                <img 
                  src={company.logo} 
                  alt={company.name} 
                  className="max-h-[140px] max-w-[140px] object-contain" 
                />
              </div>
            ) : (
              <h1 className="text-2xl font-bold text-gray-900 mb-4">{company.name}</h1>
            )}
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Which location did you visit?</h2>
            <p className="text-gray-500">Please select your location to continue</p>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder=""
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-24 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4a6eb5] focus:border-transparent"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
              {filteredLocations.length} location{filteredLocations.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Location Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredLocations.map((location) => (
              <Link
                key={location.id}
                href={`/reviews/${company.slug}/${location.slug}`}
                className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl hover:bg-gray-100 hover:border-gray-200 transition-colors group"
              >
                <span className="font-medium text-gray-900">{location.name}</span>
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-[#4a6eb5] transition-colors" />
              </Link>
            ))}
          </div>

          {filteredLocations.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No locations found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
