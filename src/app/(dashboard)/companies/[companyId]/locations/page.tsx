'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import { Card, Button, Input, Modal, Badge } from '@/components/ui';
import { 
  ArrowLeft,
  MapPin, 
  Plus, 
  Search, 
  MoreVertical,
  Edit,
  Trash2,
  ExternalLink,
  Globe,
  Building2,
  Copy,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Company, Location } from '@/types';

// Mock data - replace with API call
const mockCompany: Company & { locations: Location[] } = {
  id: '1',
  name: 'Actuate Media',
  slug: 'actuate-media',
  logo: undefined,
  locationCount: 3,
  sourceCount: 9,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  locations: [
    {
      id: '1',
      companyId: '1',
      name: 'Seattle HQ',
      slug: 'seattle-hq',
      address: '123 Main St',
      city: 'Seattle',
      state: 'WA',
      zip: '98101',
      phone: '(206) 555-1234',
      sourceCount: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      companyId: '1',
      name: 'Portland Office',
      slug: 'portland-office',
      address: '456 Oak Ave',
      city: 'Portland',
      state: 'OR',
      zip: '97201',
      phone: '(503) 555-5678',
      sourceCount: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '3',
      companyId: '1',
      name: 'San Francisco',
      slug: 'san-francisco',
      address: '789 Market St',
      city: 'San Francisco',
      state: 'CA',
      zip: '94102',
      phone: '(415) 555-9012',
      sourceCount: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
};

export default function CompanyLocationsPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = use(params);
  const [search, setSearch] = useState('');
  const [company] = useState<Company & { locations: Location[] }>(mockCompany);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  const filteredLocations = company.locations.filter(location =>
    location.name.toLowerCase().includes(search.toLowerCase()) ||
    location.city?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6">
        <Link 
          href="/companies" 
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Companies
        </Link>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {company.logo ? (
              <img src={company.logo} alt={company.name} className="h-16 w-16 rounded-xl object-cover" />
            ) : (
              <div className="h-16 w-16 rounded-xl bg-indigo-100 flex items-center justify-center">
                <Building2 className="h-8 w-8 text-indigo-600" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
              <p className="text-gray-600">Manage locations and review sources</p>
            </div>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Location
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search locations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLocations.map((location) => (
          <LocationCard 
            key={location.id} 
            location={location} 
            companySlug={company.slug}
            onEdit={() => setEditingLocation(location)}
          />
        ))}
      </div>

      {filteredLocations.length === 0 && (
        <div className="text-center py-12">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No locations found</h3>
          <p className="text-gray-500">Try adjusting your search or add a new location.</p>
        </div>
      )}

      {/* Add Location Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Location"
        size="lg"
      >
        <LocationForm
          onSubmit={(data) => {
            console.log('Create location:', data);
            setIsAddModalOpen(false);
          }}
          onCancel={() => setIsAddModalOpen(false)}
        />
      </Modal>

      {/* Edit Location Modal */}
      <Modal
        isOpen={!!editingLocation}
        onClose={() => setEditingLocation(null)}
        title="Edit Location"
        size="lg"
      >
        {editingLocation && (
          <LocationForm
            location={editingLocation}
            onSubmit={(data) => {
              console.log('Update location:', data);
              setEditingLocation(null);
            }}
            onCancel={() => setEditingLocation(null)}
          />
        )}
      </Modal>
    </div>
  );
}

function LocationCard({ 
  location, 
  companySlug,
  onEdit 
}: { 
  location: Location; 
  companySlug: string;
  onEdit: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const reviewUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/reviews/${companySlug}/${location.slug}`;

  const copyUrl = () => {
    navigator.clipboard.writeText(reviewUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="p-6 relative">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">{location.name}</h3>
          <p className="text-sm text-gray-500">{location.slug}</p>
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
              <button 
                onClick={() => { onEdit(); setShowMenu(false); }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Edit className="h-4 w-4" /> Edit Location
              </button>
              <a
                href={reviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" /> Preview Review Page
              </a>
              <hr className="my-1" />
              <button className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {(location.address || location.city) && (
        <div className="flex items-start gap-2 text-sm text-gray-600 mb-3">
          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>
            {location.address && <>{location.address}<br /></>}
            {location.city}, {location.state} {location.zip}
          </span>
        </div>
      )}

      <div className="flex items-center gap-2 mb-4">
        <Badge variant={location.sourceCount > 0 ? 'success' : 'default'}>
          {location.sourceCount} sources
        </Badge>
      </div>

      <div className="space-y-2">
        <Link
          href={`/companies/${location.companyId}/locations/${location.id}`}
          className="block w-full text-center py-2 px-4 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          Manage Sources
        </Link>
        <button
          onClick={copyUrl}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-green-600" />
              <span className="text-green-600">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy Review Link
            </>
          )}
        </button>
      </div>
    </Card>
  );
}

interface LocationFormProps {
  location?: Location;
  onSubmit: (data: Partial<Location>) => void;
  onCancel: () => void;
}

function LocationForm({ location, onSubmit, onCancel }: LocationFormProps) {
  const [formData, setFormData] = useState({
    name: location?.name || '',
    slug: location?.slug || '',
    address: location?.address || '',
    city: location?.city || '',
    state: location?.state || '',
    zip: location?.zip || '',
    phone: location?.phone || '',
  });

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: location ? formData.slug : name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(formData);
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Location Name"
          value={formData.name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="e.g., Downtown Seattle"
          required
        />
        <Input
          label="Slug"
          value={formData.slug}
          onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
          placeholder="downtown-seattle"
          required
        />
      </div>
      
      <Input
        label="Street Address"
        value={formData.address}
        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        placeholder="123 Main St"
      />
      
      <div className="grid grid-cols-3 gap-4">
        <Input
          label="City"
          value={formData.city}
          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          placeholder="Seattle"
        />
        <Input
          label="State"
          value={formData.state}
          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
          placeholder="WA"
        />
        <Input
          label="ZIP"
          value={formData.zip}
          onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
          placeholder="98101"
        />
      </div>
      
      <Input
        label="Phone"
        value={formData.phone}
        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        placeholder="(206) 555-1234"
      />

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {location ? 'Save Changes' : 'Create Location'}
        </Button>
      </div>
    </form>
  );
}
