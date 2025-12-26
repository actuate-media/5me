'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, Button, Input, Modal, ImageCropper, EmailTemplatesModal } from '@/components/ui';
import { 
  Building2, 
  MapPin, 
  Plus, 
  Search, 
  Edit,
  Trash2,
  Mail,
  Settings,
  Loader2,
  Copy,
  ExternalLink,
  Check,
  LayoutGrid,
  List,
  Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Company } from '@/types';

type ViewMode = 'cards' | 'table';

export default function CompaniesPage() {
  const [search, setSearch] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null);
  const [emailTemplateCompany, setEmailTemplateCompany] = useState<Company | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');

  const fetchCompanies = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/companies');
      if (!res.ok) throw new Error('Failed to fetch companies');
      const data = await res.json();
      setCompanies(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleCreateCompany = async (data: Partial<Company>) => {
    try {
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create company');
      }
      await fetchCompanies();
      setIsAddModalOpen(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create company');
    }
  };

  const handleUpdateCompany = async (data: Partial<Company>) => {
    if (!editingCompany) return;
    try {
      const res = await fetch(`/api/companies/${editingCompany.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update company');
      await fetchCompanies();
      setEditingCompany(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update company');
    }
  };

  const handleDeleteCompany = async () => {
    if (!deletingCompany) return;
    try {
      const res = await fetch(`/api/companies/${deletingCompany.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete company');
      await fetchCompanies();
      setDeletingCompany(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete company');
    }
  };

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
          <p className="text-gray-500 text-sm mt-1">
            {companies.length} {companies.length === 1 ? 'company' : 'companies'} total
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add New Company
        </Button>
      </div>

      {/* Search and View Toggle */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('cards')}
            className={cn(
              'p-2 rounded-md transition-all',
              viewMode === 'cards' 
                ? 'bg-white shadow-sm text-indigo-600' 
                : 'text-gray-500 hover:text-gray-700'
            )}
            title="Card View"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={cn(
              'p-2 rounded-md transition-all',
              viewMode === 'table' 
                ? 'bg-white shadow-sm text-indigo-600' 
                : 'text-gray-500 hover:text-gray-700'
            )}
            title="Table View"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <Loader2 className="h-10 w-10 text-indigo-600 animate-spin mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Loading companies...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-16">
          <div className="bg-red-50 text-red-600 rounded-lg p-4 inline-block">
            <p className="font-medium">{error}</p>
          </div>
          <Button onClick={fetchCompanies} variant="outline" className="mt-4">
            Try Again
          </Button>
        </div>
      )}

      {/* Cards View */}
      {!isLoading && !error && viewMode === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredCompanies.map((company) => (
            <CompanyCard 
              key={company.id} 
              company={company}
              onEdit={() => setEditingCompany(company)}
              onDelete={() => setDeletingCompany(company)}
              onEmail={() => setEmailTemplateCompany(company)}
            />
          ))}
        </div>
      )}

      {/* Table View */}
      {!isLoading && !error && viewMode === 'table' && (
        <CompanyTable 
          companies={filteredCompanies}
          onEdit={setEditingCompany}
          onDelete={setDeletingCompany}
          onEmail={setEmailTemplateCompany}
        />
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredCompanies.length === 0 && (
        <div className="text-center py-16">
          <div className="bg-gray-50 rounded-2xl p-8 inline-block">
            <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No companies found</h3>
            <p className="text-gray-500 text-sm mb-4">
              {search ? 'Try adjusting your search terms' : 'Get started by adding your first company'}
            </p>
            {!search && (
              <Button onClick={() => setIsAddModalOpen(true)} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Company
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Add Company Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Company"
        size="md"
      >
        <CompanyForm
          onSubmit={handleCreateCompany}
          onCancel={() => setIsAddModalOpen(false)}
        />
      </Modal>

      {/* Edit Company Modal */}
      <Modal
        isOpen={!!editingCompany}
        onClose={() => setEditingCompany(null)}
        title="Edit Company"
        size="md"
      >
        {editingCompany && (
          <CompanyForm
            company={editingCompany}
            onSubmit={handleUpdateCompany}
            onCancel={() => setEditingCompany(null)}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingCompany}
        onClose={() => setDeletingCompany(null)}
        title="Delete Company"
        size="sm"
      >
        <div className="text-center py-4">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <Trash2 className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Delete &quot;{deletingCompany?.name}&quot;?
          </h3>
          <p className="text-gray-500 text-sm mb-6">
            This will permanently delete the company, all its locations, review sources, and feedback. This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => setDeletingCompany(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteCompany}>
              Delete Company
            </Button>
          </div>
        </div>
      </Modal>

      {/* Email Templates Modal */}
      {emailTemplateCompany && (
        <EmailTemplatesModal
          isOpen={!!emailTemplateCompany}
          onClose={() => setEmailTemplateCompany(null)}
          company={{
            name: emailTemplateCompany.name,
            slug: emailTemplateCompany.slug,
            logo: emailTemplateCompany.logo,
          }}
        />
      )}
    </div>
  );
}

// ============================================================================
// Company Card Component
// ============================================================================

interface CompanyCardProps {
  company: Company;
  onEdit: () => void;
  onDelete: () => void;
  onEmail: () => void;
}

function CompanyCard({ company, onEdit, onDelete, onEmail }: CompanyCardProps) {
  const [copied, setCopied] = useState(false);
  
  const locationCount = company._count?.locations ?? company.locationCount ?? 0;
  const sourceCount = company.sourceCount ?? 0;
  const reviewUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/reviews/${company.slug}`;

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

  // Generate initials from company name
  const initials = company.name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card 
      variant="bordered" 
      className="p-0 overflow-hidden hover:shadow-lg hover:border-indigo-300 transition-all duration-200 group"
    >
      {/* Main Content */}
      <div className="p-4">
        {/* Header: Logo + Name */}
        <div className="flex items-center gap-3 mb-3">
          {company.logo ? (
            <img 
              src={company.logo} 
              alt={company.name} 
              className="h-12 w-12 rounded-lg object-cover flex-shrink-0"
            />
          ) : (
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-lg font-bold">{initials}</span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 truncate text-base" title={company.name}>
              {company.name}
            </h3>
            <p className="text-xs text-gray-500">{company.slug}</p>
          </div>
        </div>

        {/* URL Row */}
        <div className="flex items-center gap-2 mb-3 bg-gray-50 rounded-lg px-3 py-2">
          <Globe className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <span className="text-sm text-gray-600 truncate flex-1 font-mono">
            /reviews/{company.slug}
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
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-indigo-500" />
            <span className="text-sm font-medium text-gray-700">{locationCount}</span>
            <span className="text-sm text-gray-400">{locationCount === 1 ? 'Location' : 'Locations'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Globe className="h-4 w-4 text-indigo-500" />
            <span className="text-sm font-medium text-gray-700">{sourceCount}</span>
            <span className="text-sm text-gray-400">{sourceCount === 1 ? 'Source' : 'Sources'}</span>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="border-t border-gray-100 bg-gray-50/80 px-2 py-2 flex items-center justify-around">
        <ActionButton 
          icon={Edit} 
          label="Edit Company" 
          onClick={onEdit}
        />
        <ActionButton 
          icon={Mail} 
          label="Email Templates" 
          onClick={onEmail}
        />
        <Link href={`/companies/${company.id}/locations`} className="contents">
          <ActionButton 
            icon={Settings} 
            label="Manage Locations"
          />
        </Link>
        <ActionButton 
          icon={Trash2} 
          label="Delete" 
          onClick={onDelete}
          variant="danger"
        />
      </div>
    </Card>
  );
}

// ============================================================================
// Action Button Component
// ============================================================================

interface ActionButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
  variant?: 'default' | 'danger';
}

function ActionButton({ icon: Icon, label, onClick, variant = 'default' }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'p-2.5 rounded-lg transition-all duration-200',
        variant === 'danger' 
          ? 'text-gray-400 hover:text-red-600 hover:bg-red-50' 
          : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50'
      )}
      title={label}
    >
      <Icon className="h-5 w-5" />
      <span className="sr-only">{label}</span>
    </button>
  );
}

// ============================================================================
// Company Table Component
// ============================================================================

interface CompanyTableProps {
  companies: Company[];
  onEdit: (company: Company) => void;
  onDelete: (company: Company) => void;
  onEmail: (company: Company) => void;
}

function CompanyTable({ companies, onEdit, onDelete, onEmail }: CompanyTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyUrl = async (company: Company) => {
    const reviewUrl = `${window.location.origin}/reviews/${company.slug}`;
    try {
      await navigator.clipboard.writeText(reviewUrl);
      setCopiedId(company.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                Company
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                Review URL
              </th>
              <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                Locations
              </th>
              <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                Sources
              </th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {companies.map((company) => {
              const locationCount = company._count?.locations ?? company.locationCount ?? 0;
              const sourceCount = company.sourceCount ?? 0;
              
              return (
                <tr key={company.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {company.logo ? (
                        <img 
                          src={company.logo} 
                          alt={company.name} 
                          className="h-10 w-10 rounded-lg object-contain bg-gray-50"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                          <Building2 className="h-5 w-5 text-indigo-600" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{company.name}</p>
                        <p className="text-xs text-gray-500">{company.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                        /reviews/{company.slug}
                      </code>
                      <button
                        onClick={() => handleCopyUrl(company)}
                        className="p-1 text-gray-400 hover:text-indigo-600 rounded transition-colors"
                        title="Copy URL"
                      >
                        {copiedId === company.id ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                      <a
                        href={`/reviews/${company.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-gray-400 hover:text-indigo-600 rounded transition-colors"
                        title="Open"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      {locationCount}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                      <Globe className="h-4 w-4 text-gray-400" />
                      {sourceCount}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onEdit(company)}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onEmail(company)}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Email Marketing"
                      >
                        <Mail className="h-4 w-4" />
                      </button>
                      <Link
                        href={`/companies/${company.id}/locations`}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Manage Locations"
                      >
                        <Settings className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => onDelete(company)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// Company Form Component
// ============================================================================

interface CompanyFormProps {
  company?: Company;
  onSubmit: (data: Partial<Company>) => void;
  onCancel: () => void;
}

function CompanyForm({ company, onSubmit, onCancel }: CompanyFormProps) {
  const [formData, setFormData] = useState({
    name: company?.name || '',
    slug: company?.slug || '',
    logo: company?.logo || '',
  });

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: company ? formData.slug : name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
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
      <Input
        label="Company Name"
        value={formData.name}
        onChange={(e) => handleNameChange(e.target.value)}
        placeholder="e.g., Actuate Media"
        required
      />
      
      <Input
        label="Slug (URL-friendly name)"
        value={formData.slug}
        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
        placeholder="actuate-media"
        required
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
        <ImageCropper
          value={formData.logo}
          onChange={(url) => setFormData({ ...formData, logo: url })}
          onRemove={() => setFormData({ ...formData, logo: '' })}
          aspectRatio={1}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {company ? 'Save Changes' : 'Create Company'}
        </Button>
      </div>
    </form>
  );
}
