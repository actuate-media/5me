'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, Button } from '@/components/ui';
import { 
  Building2, 
  MapPin, 
  Plus, 
  Search, 
  MoreVertical,
  Edit,
  Trash2,
  MessageSquare,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Company } from '@/types';

// Mock data - replace with API call
const mockCompanies: Company[] = [
  { 
    id: '1', 
    name: 'Actuate Media', 
    slug: 'actuate-media', 
    locationCount: 3, 
    sourceCount: 9,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  { 
    id: '2', 
    name: 'Seattle Coffee Co', 
    slug: 'seattle-coffee-co', 
    locationCount: 5, 
    sourceCount: 15,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  { 
    id: '3', 
    name: 'Pacific Northwest Dental', 
    slug: 'pacific-northwest-dental', 
    locationCount: 2, 
    sourceCount: 6,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export default function CompaniesPage() {
  const [search, setSearch] = useState('');
  const [companies] = useState<Company[]>(mockCompanies);

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
          <p className="text-gray-600">Manage your companies and their locations</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Company
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCompanies.map((company) => (
          <CompanyCard key={company.id} company={company} />
        ))}
      </div>

      {filteredCompanies.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No companies found</h3>
          <p className="text-gray-500">Try adjusting your search or add a new company.</p>
        </div>
      )}
    </div>
  );
}

function CompanyCard({ company }: { company: Company }) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <Card className="p-6 relative">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {company.logo ? (
            <img src={company.logo} alt={company.name} className="h-12 w-12 rounded-lg object-cover" />
          ) : (
            <div className="h-12 w-12 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-indigo-600" />
            </div>
          )}
          <div>
            <h3 className="font-semibold text-gray-900">{company.name}</h3>
            <p className="text-sm text-gray-500">{company.slug}</p>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 rounded hover:bg-gray-100"
          >
            <MoreVertical className="h-5 w-5 text-gray-400" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 w-48">
              <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                <Edit className="h-4 w-4" /> Edit Company
              </button>
              <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" /> View Feedback
              </button>
              <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                <Settings className="h-4 w-4" /> Diagnostics
              </button>
              <hr className="my-1" />
              <button className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
        <div className="flex items-center gap-1">
          <MapPin className="h-4 w-4" />
          <span>{company.locationCount} locations</span>
        </div>
        <div className={cn(
          "px-2 py-0.5 rounded-full text-xs font-medium",
          company.sourceCount > 0 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
        )}>
          {company.sourceCount} sources
        </div>
      </div>

      <Link
        href={`/companies/${company.id}/locations`}
        className="block w-full text-center py-2 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        Manage Locations
      </Link>
    </Card>
  );
}
