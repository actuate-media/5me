'use client';

import { useState, use, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, Button, Input, Modal } from '@/components/ui';
import { 
  ArrowLeft,
  MapPin, 
  Plus, 
  Search, 
  Edit,
  Trash2,
  ExternalLink,
  Globe,
  Building2,
  Copy,
  Check,
  Loader2,
  X,
  Mail,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Company, Location } from '@/types';

export default function CompanyLocationsPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = use(params);
  const [search, setSearch] = useState('');
  const [company, setCompany] = useState<Company | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [companyRes, locationsRes] = await Promise.all([
        fetch(`/api/companies/${companyId}`),
        fetch(`/api/companies/${companyId}/locations`)
      ]);
      
      if (!companyRes.ok) throw new Error('Failed to fetch company');
      if (!locationsRes.ok) throw new Error('Failed to fetch locations');
      
      const companyData = await companyRes.json();
      const locationsData = await locationsRes.json();
      
      setCompany(companyData);
      setLocations(locationsData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateLocation = async (data: Partial<Location>) => {
    try {
      const res = await fetch(`/api/companies/${companyId}/locations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create location');
      }
      await fetchData();
      setIsAddModalOpen(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create location');
    }
  };

  const handleUpdateLocation = async (data: Partial<Location>) => {
    if (!editingLocation) return;
    try {
      const res = await fetch(`/api/companies/${companyId}/locations/${editingLocation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update location');
      await fetchData();
      setEditingLocation(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update location');
    }
  };

  const handleDeleteLocation = async (locationId: string) => {
    if (!confirm('Are you sure you want to delete this location?')) return;
    try {
      const res = await fetch(`/api/companies/${companyId}/locations/${locationId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete location');
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete location');
    }
  };

  const filteredLocations = locations.filter(location =>
    location.name.toLowerCase().includes(search.toLowerCase()) ||
    location.city?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error || 'Company not found'}</p>
        <Link href="/companies">
          <Button variant="outline" className="mt-4">
            Back to Companies
          </Button>
        </Link>
      </div>
    );
  }

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
            companyId={companyId}
            onEdit={() => setEditingLocation(location)}
            onDelete={() => handleDeleteLocation(location.id)}
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
          onSubmit={handleCreateLocation}
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
            onSubmit={handleUpdateLocation}
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
  companyId,
  onEdit,
  onDelete
}: { 
  location: Location; 
  companySlug: string;
  companyId: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const reviewUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/reviews/${companySlug}/${location.slug}`;
  const sourceCount = location._count?.sources ?? location.sourceCount ?? 0;
  
  // Generate initials from location name
  const initials = location.name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(reviewUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleOpenUrl = () => {
    window.open(reviewUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card className="p-0 overflow-hidden hover:shadow-lg hover:border-indigo-300 transition-all duration-200 group">
      {/* Main Content */}
      <div className="p-5">
        {/* Header: Avatar + Name */}
        <div className="flex items-center gap-4 mb-4">
          <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-white text-2xl font-bold">{initials}</span>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-gray-900 truncate text-lg leading-tight" title={location.name}>
              {location.name}
            </h3>
            {location.city && (
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {location.city}{location.state ? `, ${location.state}` : ''}
              </p>
            )}
          </div>
        </div>

        {/* URL Row */}
        <div className="flex items-center gap-2 mb-4 bg-gray-50 rounded-lg px-3 py-2.5">
          <Globe className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <span className="text-sm text-gray-600 truncate flex-1 font-mono">
            /{companySlug}/{location.slug}
          </span>
          <button
            onClick={handleCopyUrl}
            className={cn(
              "p-1.5 rounded-md transition-all flex-shrink-0",
              copied 
                ? "bg-green-100 text-green-600" 
                : "text-gray-400 hover:text-indigo-600 hover:bg-white"
            )}
            title={copied ? "Copied!" : "Copy URL"}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
          <button
            onClick={handleOpenUrl}
            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-md transition-all flex-shrink-0"
            title="Open in new tab"
          >
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1.5">
            <Globe className="h-4 w-4 text-indigo-500" />
            <span className="text-sm font-semibold text-gray-700">{sourceCount}</span>
            <span className="text-sm text-gray-400">{sourceCount === 1 ? 'Source' : 'Sources'}</span>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="border-t border-gray-100 bg-gray-50/80 px-4 py-2.5 flex items-center justify-center gap-1">
        <button
          onClick={onEdit}
          className="p-2.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200"
          title="Edit Location"
        >
          <Edit className="h-5 w-5" />
        </button>
        <button
          onClick={() => {/* TODO: Email templates for location */}}
          className="p-2.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200"
          title="Email Templates"
        >
          <Mail className="h-5 w-5" />
        </button>
        <Link 
          href={`/companies/${companyId}/locations/${location.id}`}
          className="p-2.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200"
          title="Manage Review Sources"
        >
          <Settings className="h-5 w-5" />
        </Link>
        <button
          onClick={onDelete}
          className="p-2.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
          title="Delete Location"
        >
          <Trash2 className="h-5 w-5" />
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
    ratingThreshold: location?.ratingThreshold ?? 4,
    notificationEmails: location?.notificationEmails || [],
  });
  const [newEmail, setNewEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: location ? formData.slug : name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    });
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const addEmail = () => {
    const email = newEmail.trim().toLowerCase();
    setEmailError('');
    
    if (!email) return;
    
    if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    
    if (formData.notificationEmails.includes(email)) {
      setEmailError('This email is already added');
      return;
    }
    
    setFormData({
      ...formData,
      notificationEmails: [...formData.notificationEmails, email],
    });
    setNewEmail('');
  };

  const removeEmail = (emailToRemove: string) => {
    setFormData({
      ...formData,
      notificationEmails: formData.notificationEmails.filter(e => e !== emailToRemove),
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

      {/* Rating Threshold */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Rating Threshold <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.ratingThreshold}
          onChange={(e) => setFormData({ ...formData, ratingThreshold: parseInt(e.target.value, 10) })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          <option value={3}>3 Stars</option>
          <option value={4}>4 Stars</option>
          <option value={5}>5 Stars</option>
        </select>
        <p className="text-sm text-gray-500 mt-1">
          Ratings at or above this threshold will show review platforms
        </p>
      </div>

      {/* Notification Emails */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notification Emails
        </label>
        <div className="flex gap-2 mb-2">
          <div className="flex-1 relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="email"
              value={newEmail}
              onChange={(e) => { setNewEmail(e.target.value); setEmailError(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addEmail(); } }}
              placeholder="Enter email address"
              className={cn(
                "w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent",
                emailError ? "border-red-300" : "border-gray-300"
              )}
            />
          </div>
          <Button type="button" onClick={addEmail} variant="outline">
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
        {emailError && (
          <p className="text-sm text-red-500 mb-2">{emailError}</p>
        )}
        <p className="text-sm text-gray-500 mb-2">
          These emails will receive notifications when low-rating feedback is submitted
        </p>
        
        {formData.notificationEmails.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.notificationEmails.map((email) => (
              <span
                key={email}
                className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
              >
                {email}
                <button
                  type="button"
                  onClick={() => removeEmail(email)}
                  className="p-0.5 hover:bg-gray-200 rounded-full"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

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
