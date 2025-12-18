'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, Button, Input, Modal } from '@/components/ui';
import { 
  Building2, 
  MapPin, 
  Plus, 
  Search, 
  MoreVertical,
  Edit,
  Trash2,
  MessageSquare,
  Settings,
  Upload,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Company } from '@/types';

export default function CompaniesPage() {
  const [search, setSearch] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

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

  const handleDeleteCompany = async (companyId: string) => {
    if (!confirm('Are you sure you want to delete this company?')) return;
    try {
      const res = await fetch(`/api/companies/${companyId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete company');
      await fetchCompanies();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete company');
    }
  };

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
        <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2">
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

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
        </div>
      )}

      {error && (
        <div className="text-center py-12">
          <p className="text-red-600">{error}</p>
          <Button onClick={fetchCompanies} variant="outline" className="mt-4">
            Try Again
          </Button>
        </div>
      )}

      {!isLoading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompanies.map((company) => (
            <CompanyCard 
              key={company.id} 
              company={company}
              onEdit={() => setEditingCompany(company)}
              onDelete={() => handleDeleteCompany(company.id)}
            />
          ))}
        </div>
      )}

      {!isLoading && !error && filteredCompanies.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No companies found</h3>
          <p className="text-gray-500">Try adjusting your search or add a new company.</p>
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
    </div>
  );
}

function CompanyCard({ company, onEdit, onDelete }: { company: Company; onEdit: () => void; onDelete: () => void }) {
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
              <button 
                onClick={() => { onEdit(); setShowMenu(false); }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Edit className="h-4 w-4" /> Edit Company
              </button>
              <Link 
                href={`/feedback?company=${company.id}`}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <MessageSquare className="h-4 w-4" /> View Feedback
              </Link>
              <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                <Settings className="h-4 w-4" /> Diagnostics
              </button>
              <hr className="my-1" />
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

      <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
        <div className="flex items-center gap-1">
          <MapPin className="h-4 w-4" />
          <span>{company._count?.locations ?? company.locationCount ?? 0} locations</span>
        </div>
        <div className={cn(
          "px-2 py-0.5 rounded-full text-xs font-medium",
          (company._count?.locations ?? company.locationCount ?? 0) > 0 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
        )}>
          active
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
        <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          {formData.logo ? (
            <div className="flex items-center justify-center gap-4">
              <img src={formData.logo} alt="Logo" className="h-16 w-16 rounded-lg object-cover" />
              <button
                type="button"
                onClick={() => setFormData({ ...formData, logo: '' })}
                className="text-sm text-red-600 hover:underline"
              >
                Remove
              </button>
            </div>
          ) : (
            <div>
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
              <p className="text-xs text-gray-400">PNG, JPG up to 2MB</p>
            </div>
          )}
        </div>
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
