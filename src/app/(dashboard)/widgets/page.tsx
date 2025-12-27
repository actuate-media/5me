'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, Button, Badge, Modal } from '@/components/ui';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Code,
  LayoutGrid,
  Loader2,
  ExternalLink,
  List,
  Copy,
  Check,
  Eye,
  Star,
} from 'lucide-react';
import { WidgetBuilderModal } from '@/components/widgets/WidgetBuilderModal';
import { cn } from '@/lib/utils';
import type { WidgetConfig } from '@/types/widget-config';

// =============================================================================
// Types
// =============================================================================

interface Widget {
  id: string;
  name: string;
  type: string;
  status: 'DRAFT' | 'PUBLISHED';
  configJson: WidgetConfig | null;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

type ViewMode = 'cards' | 'table';

const widgetTypeLabels: Record<string, { label: string; icon: string }> = {
  CAROUSEL: { label: 'Carousel', icon: '🎠' },
  GRID: { label: 'Grid', icon: '⊞' },
  LIST: { label: 'List', icon: '☰' },
  BADGE: { label: 'Badge', icon: '🏷️' },
  SLIDER: { label: 'Slider', icon: '↔️' },
};

// =============================================================================
// Page Component
// =============================================================================

export default function WidgetsPage() {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [deletingWidget, setDeletingWidget] = useState<Widget | null>(null);

  // Modal state
  const [builderWidgetId, setBuilderWidgetId] = useState<string | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);

  // Temporary company ID (in production, get from session/context)
  const companyId = 'temp-company-id';

  const fetchWidgets = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/widgets');
      if (!res.ok) throw new Error('Failed to fetch widgets');
      const data = await res.json();
      setWidgets(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWidgets();
  }, [fetchWidgets]);

  const handleCreateWidget = () => {
    setBuilderWidgetId(null);
    setShowBuilder(true);
  };

  const handleEditWidget = (widgetId: string) => {
    setBuilderWidgetId(widgetId);
    setShowBuilder(true);
  };

  const handleDeleteWidget = async () => {
    if (!deletingWidget) return;
    try {
      const res = await fetch(`/api/widgets/${deletingWidget.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete widget');
      await fetchWidgets();
      setDeletingWidget(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete widget');
    }
  };

  const handleBuilderClose = () => {
    setShowBuilder(false);
    setBuilderWidgetId(null);
    fetchWidgets();
  };

  const filteredWidgets = widgets.filter((widget) =>
    widget.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Widgets</h1>
          <p className="text-gray-500 text-sm mt-1">
            {widgets.length} {widgets.length === 1 ? 'widget' : 'widgets'} total
          </p>
        </div>
        <Button onClick={handleCreateWidget} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Widget
        </Button>
      </div>

      {/* Search and View Toggle */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search widgets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#586c96] focus:border-transparent transition-all"
          />
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('cards')}
            className={cn(
              'p-2 rounded-md transition-all',
              viewMode === 'cards'
                ? 'bg-white shadow-sm text-[#586c96]'
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
                ? 'bg-white shadow-sm text-[#586c96]'
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
            <Loader2 className="h-10 w-10 text-[#ee5f64] animate-spin mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Loading widgets...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-16">
          <div className="bg-red-50 text-red-600 rounded-lg p-4 inline-block">
            <p className="font-medium">{error}</p>
          </div>
          <Button onClick={fetchWidgets} variant="outline" className="mt-4">
            Try Again
          </Button>
        </div>
      )}

      {/* Cards View */}
      {!isLoading && !error && viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredWidgets.map((widget) => (
            <WidgetCard
              key={widget.id}
              widget={widget}
              onEdit={() => handleEditWidget(widget.id)}
              onDelete={() => setDeletingWidget(widget)}
            />
          ))}
        </div>
      )}

      {/* Table View */}
      {!isLoading && !error && viewMode === 'table' && (
        <WidgetTable
          widgets={filteredWidgets}
          onEdit={handleEditWidget}
          onDelete={setDeletingWidget}
        />
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredWidgets.length === 0 && (
        <div className="text-center py-16">
          <div className="bg-gray-50 rounded-2xl p-8 inline-block">
            <LayoutGrid className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No widgets found</h3>
            <p className="text-gray-500 text-sm mb-4">
              {search ? 'Try adjusting your search terms' : 'Create your first widget to display reviews'}
            </p>
            {!search && (
              <Button onClick={handleCreateWidget} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Create Widget
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingWidget}
        onClose={() => setDeletingWidget(null)}
        title="Delete Widget"
        size="sm"
      >
        <div className="text-center py-4">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <Trash2 className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Delete &quot;{deletingWidget?.name}&quot;?
          </h3>
          <p className="text-gray-500 text-sm mb-6">
            This will permanently delete the widget. Any embedded instances will stop working.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => setDeletingWidget(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteWidget}>
              Delete Widget
            </Button>
          </div>
        </div>
      </Modal>

      {/* Builder Modal */}
      {showBuilder && (
        <WidgetBuilderModal
          widgetId={builderWidgetId}
          companyId={companyId}
          onClose={handleBuilderClose}
          onSaved={() => {}}
        />
      )}
    </div>
  );
}

// =============================================================================
// Widget Card Component
// =============================================================================

interface WidgetCardProps {
  widget: Widget;
  onEdit: () => void;
  onDelete: () => void;
}

function WidgetCard({ widget, onEdit, onDelete }: WidgetCardProps) {
  const [copied, setCopied] = useState(false);
  const typeConfig = widgetTypeLabels[widget.type.toUpperCase()] ?? { label: 'Carousel', icon: '🎠' };

  const config = widget.configJson;
  const theme = config?.style?.colorScheme || 'light';
  const minRating = config?.reviews?.minRating || 4;
  const maxReviews = config?.reviews?.maxReviews || 10;

  const handleCopyEmbed = async () => {
    const code = `<script src="${window.location.origin}/widget-platform.js" data-widget-id="${widget.id}"></script>`;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handlePreview = () => {
    window.open(`/w/${widget.id}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card
      variant="bordered"
      className="p-0 overflow-hidden hover:shadow-lg hover:border-[#586c96]/40 transition-all duration-200 group"
    >
      {/* Main Content */}
      <div className="p-5">
        {/* Header: Icon + Name + Status */}
        <div className="flex items-center gap-4 mb-4">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-[#586c96] to-[#ee5f64] flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-2xl">{typeConfig.icon}</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900 truncate text-lg leading-tight" title={widget.name}>
                {widget.name}
              </h3>
              <Badge 
                variant={widget.status === 'PUBLISHED' ? 'success' : 'warning'}
                className="flex-shrink-0"
              >
                {widget.status === 'PUBLISHED' ? 'Live' : 'Draft'}
              </Badge>
            </div>
            <p className="text-sm text-gray-500">{typeConfig.label}</p>
          </div>
        </div>

        {/* Widget Info */}
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="flex items-center gap-1.5 text-sm text-gray-600 bg-gray-100 rounded-md px-2 py-1">
            <span className={theme === 'dark' ? '🌙' : '☀️'}></span>
            <span className="capitalize">{theme}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-gray-600 bg-gray-100 rounded-md px-2 py-1">
            <Star className="h-3.5 w-3.5 text-yellow-500" />
            <span>{minRating}+ stars</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-gray-600 bg-gray-100 rounded-md px-2 py-1">
            <span>{maxReviews === 'all' ? 'All' : maxReviews} reviews</span>
          </div>
        </div>

        {/* Created Date */}
        <p className="text-xs text-gray-400">
          Created {new Date(widget.createdAt).toLocaleDateString()}
        </p>
      </div>

      {/* Actions Bar */}
      <div className="border-t border-gray-100 bg-gray-50/80 px-4 py-2.5 flex items-center justify-center gap-1">
        <ActionButton icon={Edit} label="Edit" onClick={onEdit} />
        <ActionButton icon={Eye} label="Preview" onClick={handlePreview} />
        <ActionButton 
          icon={copied ? Check : Code} 
          label={copied ? "Copied!" : "Copy Embed"} 
          onClick={handleCopyEmbed}
          highlight={copied}
        />
        <ActionButton icon={Trash2} label="Delete" onClick={onDelete} variant="danger" />
      </div>
    </Card>
  );
}

// =============================================================================
// Action Button Component
// =============================================================================

interface ActionButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
  variant?: 'default' | 'danger';
  highlight?: boolean;
}

function ActionButton({ icon: Icon, label, onClick, variant = 'default', highlight }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'p-2.5 rounded-lg transition-all flex items-center justify-center',
        variant === 'danger'
          ? 'text-gray-400 hover:text-red-600 hover:bg-red-50'
          : highlight
          ? 'text-green-600 bg-green-50'
          : 'text-gray-400 hover:text-[#586c96] hover:bg-[#f0f3f8]'
      )}
      title={label}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

// =============================================================================
// Widget Table Component
// =============================================================================

interface WidgetTableProps {
  widgets: Widget[];
  onEdit: (id: string) => void;
  onDelete: (widget: Widget) => void;
}

function WidgetTable({ widgets, onEdit, onDelete }: WidgetTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyEmbed = async (widget: Widget) => {
    const code = `<script src="${window.location.origin}/widget-platform.js" data-widget-id="${widget.id}"></script>`;
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(widget.id);
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
                Widget
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                Type
              </th>
              <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                Status
              </th>
              <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                Settings
              </th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {widgets.map((widget) => {
              const typeConfig = widgetTypeLabels[widget.type.toUpperCase()] ?? { label: 'Carousel', icon: '🎠' };
              const config = widget.configJson;
              const theme = config?.style?.colorScheme || 'light';
              const minRating = config?.reviews?.minRating || 4;

              return (
                <tr key={widget.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#586c96] to-[#ee5f64] flex items-center justify-center flex-shrink-0">
                        <span className="text-lg">{typeConfig.icon}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{widget.name}</p>
                        <p className="text-xs text-gray-500">
                          Created {new Date(widget.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-700">{typeConfig.label}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Badge variant={widget.status === 'PUBLISHED' ? 'success' : 'warning'}>
                      {widget.status === 'PUBLISHED' ? 'Live' : 'Draft'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-xs text-gray-500 bg-gray-100 rounded px-2 py-0.5 capitalize">{theme}</span>
                      <span className="text-xs text-gray-500 bg-gray-100 rounded px-2 py-0.5">{minRating}+ ⭐</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onEdit(widget.id)}
                        className="p-2 text-gray-400 hover:text-[#586c96] hover:bg-[#f0f3f8] rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => window.open(`/w/${widget.id}`, '_blank')}
                        className="p-2 text-gray-400 hover:text-[#586c96] hover:bg-[#f0f3f8] rounded-lg transition-colors"
                        title="Preview"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleCopyEmbed(widget)}
                        className={cn(
                          "p-2 rounded-lg transition-colors",
                          copiedId === widget.id
                            ? "text-green-600 bg-green-50"
                            : "text-gray-400 hover:text-[#586c96] hover:bg-[#f0f3f8]"
                        )}
                        title={copiedId === widget.id ? "Copied!" : "Copy Embed Code"}
                      >
                        {copiedId === widget.id ? <Check className="h-4 w-4" /> : <Code className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => onDelete(widget)}
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
