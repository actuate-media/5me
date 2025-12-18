'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MapPin, Search, ChevronRight } from 'lucide-react';
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
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-gray-900 to-indigo-900">
      <StarfieldBackground />
      
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            {company.logo ? (
              <img src={company.logo} alt={company.name} className="h-16 mx-auto mb-4" />
            ) : (
              <h1 className="text-3xl font-bold text-white mb-2">{company.name}</h1>
            )}
            <p className="text-gray-300">Select your location to leave a review</p>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search locations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Location List */}
          <div className="space-y-3">
            {filteredLocations.map((location) => (
              <Link
                key={location.id}
                href={`/reviews/${company.slug}/${location.slug}`}
                className="block p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl hover:bg-white/20 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/20 rounded-lg">
                      <MapPin className="h-5 w-5 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white">{location.name}</h3>
                      {location.address && (
                        <p className="text-sm text-gray-400">{location.address}</p>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
                </div>
              </Link>
            ))}
          </div>

          {filteredLocations.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-400">No locations found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
