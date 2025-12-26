'use client';

import { useState, use, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, Button, Input, Select, Modal, Badge } from '@/components/ui';
import { 
  ArrowLeft,
  Plus, 
  MoreVertical,
  Edit,
  Trash2,
  ExternalLink,
  Globe,
  MapPin,
  Star,
  MessageSquare,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Location, ReviewSource, ReviewSourceType } from '@/types';

// Source icons/colors - support both uppercase and lowercase
const sourceConfig = {
  google: { icon: 'G', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  GOOGLE: { icon: 'G', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  facebook: { icon: 'f', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  FACEBOOK: { icon: 'f', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  yelp: { icon: 'Y', color: 'text-red-600', bgColor: 'bg-red-100' },
  YELP: { icon: 'Y', color: 'text-red-600', bgColor: 'bg-red-100' },
  tripadvisor: { icon: 'T', color: 'text-green-600', bgColor: 'bg-green-100' },
  TRIPADVISOR: { icon: 'T', color: 'text-green-600', bgColor: 'bg-green-100' },
  clutch: { icon: 'C', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  CLUTCH: { icon: 'C', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  other: { icon: '★', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  OTHER: { icon: '★', color: 'text-gray-600', bgColor: 'bg-gray-100' },
} as const;

const defaultSourceConfig = { icon: '★', color: 'text-gray-600', bgColor: 'bg-gray-100' };

function getSourceConfig(type: string) {
  return sourceConfig[type as keyof typeof sourceConfig] ?? defaultSourceConfig;
}

interface LocationWithCompany extends Location {
  company?: {
    name: string;
    slug: string;
  };
}

export default function LocationSourcesPage({ 
  params 
}: { 
  params: Promise<{ companyId: string; locationId: string }> 
}) {
  const { companyId, locationId } = use(params);
  const [location, setLocation] = useState<LocationWithCompany | null>(null);
  const [sources, setSources] = useState<ReviewSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<ReviewSource | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [locationRes, sourcesRes] = await Promise.all([
        fetch(`/api/companies/${companyId}/locations/${locationId}`),
        fetch(`/api/companies/${companyId}/locations/${locationId}/sources`)
      ]);
      
      if (!locationRes.ok) throw new Error('Failed to fetch location');
      if (!sourcesRes.ok) throw new Error('Failed to fetch sources');
      
      const locationData = await locationRes.json();
      const sourcesData = await sourcesRes.json();
      
      setLocation(locationData);
      setSources(sourcesData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [companyId, locationId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateSource = async (data: Partial<ReviewSource>) => {
    try {
      const res = await fetch(`/api/companies/${companyId}/locations/${locationId}/sources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create source');
      await fetchData();
      setIsAddModalOpen(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create source');
    }
  };

  const handleUpdateSource = async (data: Partial<ReviewSource>) => {
    if (!editingSource) return;
    try {
      const res = await fetch(`/api/companies/${companyId}/locations/${locationId}/sources/${editingSource.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update source');
      await fetchData();
      setEditingSource(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update source');
    }
  };

  const handleDeleteSource = async (sourceId: string) => {
    if (!confirm('Are you sure you want to delete this source?')) return;
    try {
      const res = await fetch(`/api/companies/${companyId}/locations/${locationId}/sources/${sourceId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete source');
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete source');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (error || !location) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error || 'Location not found'}</p>
        <Link href={`/companies/${companyId}/locations`}>
          <Button variant="outline" className="mt-4">
            Back to Locations
          </Button>
        </Link>
      </div>
    );
  }

  const companyName = location.company?.name || 'Company';
  const companySlug = location.company?.slug || '';

  return (
    <div>
      <div className="mb-6">
        <Link 
          href={`/companies/${companyId}/locations`}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {companyName} Locations
        </Link>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{location.name}</h1>
            <div className="flex items-center gap-2 text-gray-600 mt-1">
              <MapPin className="h-4 w-4" />
              <span>{location.city}, {location.state}</span>
            </div>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Source
          </Button>
        </div>
      </div>

      {/* Review Link Card */}
      <Card className="p-6 mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg mb-1">Review Collection Link</h3>
            <p className="text-indigo-100 text-sm mb-3">
              Share this link with customers to collect reviews
            </p>
            <code className="bg-white/20 px-3 py-1.5 rounded text-sm">
              {typeof window !== 'undefined' ? window.location.origin : ''}/reviews/{companySlug}/{location.slug}
            </code>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="border-white/30 text-white hover:bg-white/10"
              onClick={() => {
                navigator.clipboard.writeText(
                  `${typeof window !== 'undefined' ? window.location.origin : ''}/reviews/${companySlug}/${location.slug}`
                );
              }}
            >
              Copy Link
            </Button>
            <a
              href={`/reviews/${companySlug}/${location.slug}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Globe className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{sources.length}</p>
              <p className="text-sm text-gray-500">Review Sources</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Star className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">--</p>
              <p className="text-sm text-gray-500">Total Clicks</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">--</p>
              <p className="text-sm text-gray-500">Feedback Received</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Sources List */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Review Sources</h2>
      <div className="space-y-4">
        {sources.map((source) => (
          <SourceCard 
            key={source.id} 
            source={source}
            onEdit={() => setEditingSource(source)}
            onDelete={() => handleDeleteSource(source.id)}
          />
        ))}
      </div>

      {sources.length === 0 && (
        <Card className="p-12 text-center">
          <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No review sources</h3>
          <p className="text-gray-500 mb-4">Add your first review source to start collecting reviews.</p>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Source
          </Button>
        </Card>
      )}

      {/* Add Source Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Review Source"
        size="md"
      >
        <SourceForm
          onSubmit={handleCreateSource}
          onCancel={() => setIsAddModalOpen(false)}
        />
      </Modal>

      {/* Edit Source Modal */}
      <Modal
        isOpen={!!editingSource}
        onClose={() => setEditingSource(null)}
        title="Edit Review Source"
        size="md"
      >
        {editingSource && (
          <SourceForm
            source={editingSource}
            onSubmit={handleUpdateSource}
            onCancel={() => setEditingSource(null)}
          />
        )}
      </Modal>
    </div>
  );
}

function SourceCard({ 
  source,
  onEdit,
  onDelete
}: { 
  source: ReviewSource; 
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const config = getSourceConfig(source.type);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={cn(
            'h-12 w-12 rounded-lg flex items-center justify-center text-xl font-bold',
            config.bgColor,
            config.color
          )}>
            {config.icon}
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{source.name}</h3>
            <a 
              href={source.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-indigo-600 hover:underline flex items-center gap-1"
            >
              {source.url}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="success">Active</Badge>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded hover:bg-gray-100"
            >
              <MoreVertical className="h-5 w-5 text-gray-400" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 w-40">
                <button 
                  onClick={() => { onEdit(); setShowMenu(false); }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" /> Edit
                </button>
                <button 
                  onClick={() => { onDelete(); setShowMenu(false); }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

interface SourceFormProps {
  source?: ReviewSource;
  onSubmit: (data: Partial<ReviewSource>) => void;
  onCancel: () => void;
}

function SourceForm({ source, onSubmit, onCancel }: SourceFormProps) {
  // Check if existing source URL is a Google Place ID URL
  const isGooglePlaceIdUrl = source?.url?.includes('search.google.com/local/writereview?placeid=');
  const extractedPlaceId = isGooglePlaceIdUrl 
    ? source?.url?.split('placeid=')[1]?.split('&')[0] || ''
    : '';

  const [formData, setFormData] = useState({
    type: source?.type || 'google' as ReviewSourceType,
    name: source?.name || '',
    url: source?.url || '',
  });
  
  // For Google: toggle between Place ID mode (auto) and manual URL mode
  const [useAutoUrl, setUseAutoUrl] = useState(source ? isGooglePlaceIdUrl : true);
  const [placeId, setPlaceId] = useState(extractedPlaceId);

  const sourceNames: Record<ReviewSourceType, string> = {
    google: 'Google Business Profile',
    facebook: 'Facebook Page',
    yelp: 'Yelp',
    tripadvisor: 'TripAdvisor',
    clutch: 'Clutch',
    other: 'Other',
  };

  const handleTypeChange = (type: ReviewSourceType) => {
    setFormData({
      ...formData,
      type,
      name: source ? formData.name : sourceNames[type],
      url: '', // Reset URL when type changes
    });
    setPlaceId('');
    setUseAutoUrl(true);
  };

  // Build the final URL for Google when using auto mode
  const getFinalUrl = () => {
    if (formData.type === 'google' && useAutoUrl && placeId) {
      return `https://search.google.com/local/writereview?placeid=${placeId}`;
    }
    return formData.url;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      url: getFinalUrl(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Select
        label="Source Type"
        value={formData.type}
        onChange={(e) => handleTypeChange(e.target.value as ReviewSourceType)}
      >
        <option value="google">Google</option>
        <option value="facebook">Facebook</option>
        <option value="yelp">Yelp</option>
        <option value="tripadvisor">TripAdvisor</option>
        <option value="clutch">Clutch</option>
        <option value="other">Other</option>
      </Select>

      <Input
        label="Display Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="e.g., Google Business Profile"
        required
      />

      {/* Google: Toggle between Place ID and Manual URL */}
      {formData.type === 'google' && (
        <div className="flex items-center justify-between py-2">
          <div>
            <span className="text-sm font-medium text-gray-700">Use Place ID</span>
            <p className="text-xs text-gray-500">Auto-generate URL from Place ID</p>
          </div>
          <button
            type="button"
            onClick={() => setUseAutoUrl(!useAutoUrl)}
            className={cn(
              "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2",
              useAutoUrl ? "bg-indigo-600" : "bg-gray-200"
            )}
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                useAutoUrl ? "translate-x-5" : "translate-x-0"
              )}
            />
          </button>
        </div>
      )}

      {/* Google with Auto URL: Place ID Input */}
      {formData.type === 'google' && useAutoUrl ? (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Google Place ID <span className="text-red-500">*</span>
          </label>
          <Input
            value={placeId}
            onChange={(e) => setPlaceId(e.target.value.trim())}
            placeholder="ChIJA1z8o5hCkFQRS-wiGKp5U3Q"
            required
          />
          {placeId && (
            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Generated URL:</p>
              <code className="text-xs text-green-700 font-mono break-all">
                https://search.google.com/local/writereview?placeid={placeId}
              </code>
            </div>
          )}
        </div>
      ) : (
        <Input
          label="Review URL"
          value={formData.url}
          onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          placeholder={formData.type === 'google' 
            ? 'https://search.google.com/local/writereview?placeid=...' 
            : 'https://example.com/your-business/review'}
          required
        />
      )}

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm">
        <p className="font-semibold text-gray-900 mb-2">How to get your review link:</p>
        {formData.type === 'google' && (
          <div className="space-y-2">
            <p className="text-gray-700">
              Find your <strong>Place ID</strong> using Google's tool:
            </p>
            <a 
              href="https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-blue-200 rounded-lg text-indigo-600 hover:bg-blue-50 font-medium transition-colors"
            >
              <Globe className="h-4 w-4" />
              Open Google Place ID Finder
              <ExternalLink className="h-3 w-3" />
            </a>
            <ol className="list-decimal list-inside space-y-1 text-gray-600 mt-3">
              <li>Search for your business name and address</li>
              <li>Copy the Place ID (starts with "ChIJ...")</li>
              <li>Paste it above</li>
            </ol>
          </div>
        )}
        {formData.type === 'facebook' && (
          <p className="text-gray-700">Go to your Facebook Page → Reviews tab → Copy the page URL</p>
        )}
        {formData.type === 'yelp' && (
          <p className="text-gray-700">Go to your Yelp business page → Copy the URL</p>
        )}
        {formData.type === 'tripadvisor' && (
          <p className="text-gray-700">Go to your TripAdvisor listing → Copy the URL</p>
        )}
        {formData.type === 'clutch' && (
          <p className="text-gray-700">Go to your Clutch profile → Reviews → Copy the review link</p>
        )}
        {formData.type === 'other' && (
          <p className="text-gray-700">Enter the direct URL where customers can leave a review</p>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {source ? 'Save Changes' : 'Add Source'}
        </Button>
      </div>
    </form>
  );
}
