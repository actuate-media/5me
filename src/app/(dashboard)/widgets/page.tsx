'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, Button, Input, Select, Modal, Badge } from '@/components/ui';
import { 
  Plus, 
  Search, 
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  Check,
  Eye,
  Code,
  Palette,
  LayoutGrid,
  Star,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReviewWidget, WidgetSettings } from '@/types';

const widgetTypeConfig = {
  CAROUSEL: { label: 'Carousel', icon: '🎠', description: 'Rotating reviews slider' },
  GRID: { label: 'Grid', icon: '⊞', description: 'Grid layout of reviews' },
  LIST: { label: 'List', icon: '☰', description: 'Vertical list of reviews' },
  BADGE: { label: 'Badge', icon: '🏷️', description: 'Compact rating badge' },
  SLIDER: { label: 'Slider', icon: '↔️', description: 'Horizontal scrolling slider' },
  // Also support lowercase for backward compatibility
  carousel: { label: 'Carousel', icon: '🎠', description: 'Rotating reviews slider' },
  grid: { label: 'Grid', icon: '⊞', description: 'Grid layout of reviews' },
  list: { label: 'List', icon: '☰', description: 'Vertical list of reviews' },
  badge: { label: 'Badge', icon: '🏷️', description: 'Compact rating badge' },
  slider: { label: 'Slider', icon: '↔️', description: 'Horizontal scrolling slider' },
};

export default function WidgetsPage() {
  const [widgets, setWidgets] = useState<ReviewWidget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState<ReviewWidget | null>(null);
  const [previewWidget, setPreviewWidget] = useState<ReviewWidget | null>(null);
  const [embedWidget, setEmbedWidget] = useState<ReviewWidget | null>(null);

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

  const handleCreateWidget = async (data: Partial<ReviewWidget>) => {
    try {
      const res = await fetch('/api/widgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create widget');
      await fetchWidgets();
      setIsCreateModalOpen(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create widget');
    }
  };

  const handleUpdateWidget = async (data: Partial<ReviewWidget>) => {
    if (!editingWidget) return;
    try {
      const res = await fetch(`/api/widgets/${editingWidget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update widget');
      await fetchWidgets();
      setEditingWidget(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update widget');
    }
  };

  const handleDeleteWidget = async (widgetId: string) => {
    if (!confirm('Are you sure you want to delete this widget?')) return;
    try {
      const res = await fetch(`/api/widgets/${widgetId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete widget');
      await fetchWidgets();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete widget');
    }
  };

  const filteredWidgets = widgets.filter(widget =>
    widget.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Widgets</h1>
          <p className="text-gray-600">Create and manage embeddable review widgets</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Widget
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search widgets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#586c96] focus:border-transparent"
          />
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-[#586c96] animate-spin" />
        </div>
      )}

      {error && (
        <div className="text-center py-12">
          <p className="text-red-600">{error}</p>
          <Button onClick={fetchWidgets} variant="outline" className="mt-4">
            Try Again
          </Button>
        </div>
      )}

      {!isLoading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWidgets.map((widget) => (
            <WidgetCard 
              key={widget.id} 
              widget={widget}
              onEdit={() => setEditingWidget(widget)}
              onPreview={() => setPreviewWidget(widget)}
              onEmbed={() => setEmbedWidget(widget)}
              onDelete={() => handleDeleteWidget(widget.id)}
            />
          ))}
        </div>
      )}

      {!isLoading && !error && filteredWidgets.length === 0 && (
        <div className="text-center py-12">
          <LayoutGrid className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No widgets found</h3>
          <p className="text-gray-500 mb-4">Create your first widget to display reviews on your website.</p>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Widget
          </Button>
        </div>
      )}

      {/* Create Widget Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Widget"
        size="xl"
      >
        <WidgetForm
          onSubmit={handleCreateWidget}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      </Modal>

      {/* Edit Widget Modal */}
      <Modal
        isOpen={!!editingWidget}
        onClose={() => setEditingWidget(null)}
        title="Edit Widget"
        size="xl"
      >
        {editingWidget && (
          <WidgetForm
            widget={editingWidget}
            onSubmit={handleUpdateWidget}
            onCancel={() => setEditingWidget(null)}
          />
        )}
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={!!previewWidget}
        onClose={() => setPreviewWidget(null)}
        title="Widget Preview"
        size="xl"
      >
        {previewWidget && <WidgetPreview widget={previewWidget} />}
      </Modal>

      {/* Embed Code Modal */}
      <Modal
        isOpen={!!embedWidget}
        onClose={() => setEmbedWidget(null)}
        title="Embed Widget"
        size="md"
      >
        {embedWidget && <EmbedCode widget={embedWidget} onClose={() => setEmbedWidget(null)} />}
      </Modal>
    </div>
  );
}

function WidgetCard({ 
  widget,
  onEdit,
  onPreview,
  onEmbed,
  onDelete
}: { 
  widget: ReviewWidget;
  onEdit: () => void;
  onPreview: () => void;
  onEmbed: () => void;
  onDelete: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const config = widgetTypeConfig[widget.type as keyof typeof widgetTypeConfig] || widgetTypeConfig.carousel;

  // Handle settings that might be stored as JSON string
  const settings = typeof widget.settings === 'string' 
    ? JSON.parse(widget.settings) 
    : (widget.settings || { theme: 'light', minRating: 4, maxReviews: 10 });

  return (
    <Card className="p-6 relative">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center text-2xl">
            {config.icon}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{widget.name}</h3>
            <p className="text-sm text-gray-500">{config.label}</p>
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
            <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 w-40">
              <button 
                onClick={() => { onEdit(); setShowMenu(false); }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Edit className="h-4 w-4" /> Edit
              </button>
              <button 
                onClick={() => { onPreview(); setShowMenu(false); }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Eye className="h-4 w-4" /> Preview
              </button>
              <button 
                onClick={() => { onEmbed(); setShowMenu(false); }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Code className="h-4 w-4" /> Get Code
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

      <div className="flex flex-wrap gap-2 mb-4">
        <Badge variant={settings.theme === 'dark' ? 'default' : 'info'}>
          {settings.theme || 'light'} theme
        </Badge>
        <Badge variant="success">
          {settings.minRating || 4}+ stars
        </Badge>
        <Badge>
          {settings.maxReviews || 10} reviews
        </Badge>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onPreview}>
          <Eye className="h-4 w-4 mr-1" />
          Preview
        </Button>
        <Button className="flex-1" onClick={onEmbed}>
          <Code className="h-4 w-4 mr-1" />
          Get Code
        </Button>
      </div>
    </Card>
  );
}

interface WidgetFormProps {
  widget?: ReviewWidget;
  onSubmit: (data: Partial<ReviewWidget>) => void;
  onCancel: () => void;
}

function WidgetForm({ widget, onSubmit, onCancel }: WidgetFormProps) {
  const [formData, setFormData] = useState({
    name: widget?.name || '',
    type: widget?.type || 'carousel' as ReviewWidget['type'],
    settings: widget?.settings || {
      theme: 'light' as const,
      primaryColor: '#4F46E5',
      showRating: true,
      showDate: true,
      showSource: true,
      minRating: 4,
      maxReviews: 10,
      autoRotate: true,
      rotateInterval: 5,
    },
  });

  const updateSettings = (key: keyof WidgetSettings, value: WidgetSettings[keyof WidgetSettings]) => {
    setFormData({
      ...formData,
      settings: { ...formData.settings, [key]: value },
    });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(formData);
      }}
      className="space-y-6"
    >
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Widget Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Homepage Carousel"
          required
        />
        <Select
          label="Widget Type"
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value as ReviewWidget['type'] })}
        >
          {Object.entries(widgetTypeConfig).map(([key, config]) => (
            <option key={key} value={key}>{config.icon} {config.label}</option>
          ))}
        </Select>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Appearance
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Theme"
            value={formData.settings.theme}
            onChange={(e) => updateSettings('theme', e.target.value as WidgetSettings['theme'])}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="auto">Auto (match site)</option>
          </Select>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={formData.settings.primaryColor}
                onChange={(e) => updateSettings('primaryColor', e.target.value)}
                className="h-10 w-14 rounded border border-gray-300 cursor-pointer"
              />
              <Input
                value={formData.settings.primaryColor}
                onChange={(e) => updateSettings('primaryColor', e.target.value)}
                className="flex-1"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Star className="h-4 w-4" />
          Content Settings
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Minimum Rating"
            value={formData.settings.minRating.toString()}
            onChange={(e) => updateSettings('minRating', parseInt(e.target.value))}
          >
            <option value="1">1+ Stars</option>
            <option value="2">2+ Stars</option>
            <option value="3">3+ Stars</option>
            <option value="4">4+ Stars</option>
            <option value="5">5 Stars Only</option>
          </Select>
          <Input
            label="Max Reviews"
            type="number"
            min={1}
            max={50}
            value={formData.settings.maxReviews}
            onChange={(e) => updateSettings('maxReviews', parseInt(e.target.value))}
          />
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.settings.showRating}
              onChange={(e) => updateSettings('showRating', e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">Show Rating</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.settings.showDate}
              onChange={(e) => updateSettings('showDate', e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">Show Date</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.settings.showSource}
              onChange={(e) => updateSettings('showSource', e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">Show Source</span>
          </label>
        </div>
      </div>

      {(formData.type === 'carousel' || formData.type === 'slider') && (
        <div className="border-t pt-6">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Animation</h3>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.settings.autoRotate}
                onChange={(e) => updateSettings('autoRotate', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Auto-rotate</span>
            </label>
            {formData.settings.autoRotate && (
              <Input
                label="Interval (seconds)"
                type="number"
                min={1}
                max={30}
                value={formData.settings.rotateInterval}
                onChange={(e) => updateSettings('rotateInterval', parseInt(e.target.value))}
              />
            )}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {widget ? 'Save Changes' : 'Create Widget'}
        </Button>
      </div>
    </form>
  );
}

function WidgetPreview({ widget }: { widget: ReviewWidget }) {
  const mockReviews = [
    { name: 'John D.', rating: 5, text: 'Absolutely amazing service! Highly recommend.', date: '2 days ago', source: 'Google' },
    { name: 'Sarah M.', rating: 5, text: 'Best experience I\'ve ever had. Will definitely come back!', date: '1 week ago', source: 'Facebook' },
    { name: 'Mike R.', rating: 4, text: 'Great quality and fast delivery. Very satisfied.', date: '2 weeks ago', source: 'Yelp' },
  ];

  const bgClass = widget.settings.theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900';

  return (
    <div className={cn('rounded-lg p-6', bgClass)}>
      <p className="text-sm text-gray-500 mb-4">Preview of &quot;{widget.name}&quot;</p>
      
      {widget.type === 'carousel' && (
        <div className="space-y-4">
          {mockReviews.slice(0, 1).map((review, i) => (
            <div key={i} className={cn('p-4 rounded-lg', widget.settings.theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50')}>
              <div className="flex items-center gap-2 mb-2">
                {widget.settings.showRating && (
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={cn('h-4 w-4', star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300')}
                      />
                    ))}
                  </div>
                )}
                {widget.settings.showSource && (
                  <span className="text-xs text-gray-500">via {review.source}</span>
                )}
              </div>
              <p className="text-sm mb-2">&quot;{review.text}&quot;</p>
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{review.name}</span>
                {widget.settings.showDate && (
                  <span className="text-xs text-gray-500">{review.date}</span>
                )}
              </div>
            </div>
          ))}
          <div className="flex justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className={cn('h-2 w-2 rounded-full', i === 0 ? 'bg-[#ee5f64]' : 'bg-gray-300')} />
            ))}
          </div>
        </div>
      )}

      {widget.type === 'grid' && (
        <div className="grid grid-cols-2 gap-4">
          {mockReviews.slice(0, 2).map((review, i) => (
            <div key={i} className={cn('p-4 rounded-lg', widget.settings.theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50')}>
              {widget.settings.showRating && (
                <div className="flex mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn('h-3 w-3', star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300')}
                    />
                  ))}
                </div>
              )}
              <p className="text-xs mb-2">&quot;{review.text}&quot;</p>
              <span className="font-medium text-xs">{review.name}</span>
            </div>
          ))}
        </div>
      )}

      {widget.type === 'badge' && (
        <div className={cn('inline-flex items-center gap-3 p-3 rounded-lg', widget.settings.theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50')}>
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
          <div>
            <p className="font-bold">4.9</p>
            <p className="text-xs text-gray-500">127 reviews</p>
          </div>
        </div>
      )}

      {widget.type === 'list' && (
        <div className="space-y-3">
          {mockReviews.map((review, i) => (
            <div key={i} className={cn('p-3 rounded-lg border', widget.settings.theme === 'dark' ? 'border-gray-700' : 'border-gray-200')}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm">{review.name}</span>
                {widget.settings.showRating && (
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={cn('h-3 w-3', star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300')}
                      />
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs">&quot;{review.text}&quot;</p>
            </div>
          ))}
        </div>
      )}

      {widget.type === 'slider' && (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {mockReviews.map((review, i) => (
            <div key={i} className={cn('flex-shrink-0 w-64 p-4 rounded-lg', widget.settings.theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50')}>
              {widget.settings.showRating && (
                <div className="flex mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn('h-4 w-4', star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300')}
                    />
                  ))}
                </div>
              )}
              <p className="text-sm mb-2">&quot;{review.text}&quot;</p>
              <span className="font-medium text-sm">{review.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmbedCode({ widget, onClose }: { widget: ReviewWidget; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const embedCode = `<!-- 5me Review Widget -->
<div id="5me-widget-${widget.id}"></div>
<script src="https://5me.io/widget/${widget.id}.js" async></script>`;

  const copyCode = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Copy and paste this code into your website where you want the widget to appear.
      </p>
      
      <div className="relative">
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
          <code>{embedCode}</code>
        </pre>
        <button
          onClick={copyCode}
          className="absolute top-2 right-2 p-2 bg-gray-700 hover:bg-gray-600 rounded text-white"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-1">Installation Tips</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Place the code where you want the widget to appear</li>
          <li>• The widget will automatically adapt to your site&apos;s width</li>
          <li>• Works with any website builder or CMS</li>
        </ul>
      </div>

      <div className="flex justify-end">
        <Button onClick={onClose}>Done</Button>
      </div>
    </div>
  );
}
