'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button, Input, Card, Badge, Select } from '@/components/ui';
import {
  X,
  Database,
  LayoutGrid,
  Type,
  MessageSquare,
  Palette,
  Settings,
  Check,
  Loader2,
  Cloud,
  CloudOff,
  ChevronLeft,
  ChevronRight,
  Smartphone,
  Monitor,
  Copy,
  Eye,
  Code,
  Search,
  MapPin,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WidgetConfig } from '@/types/widget-config';
import {
  createDefaultWidgetConfig,
  parseWidgetConfig,
  WIDGET_TEMPLATES,
} from '@/types/widget-config';

// =============================================================================
// Types
// =============================================================================

interface WidgetData {
  id: string;
  name: string;
  type: string;
  status: 'DRAFT' | 'PUBLISHED';
  configJson: WidgetConfig;
  companyId: string;
  embedCode?: string;
}

interface WidgetBuilderModalProps {
  widgetId: string | null; // null = new widget
  companyId: string;
  onClose: () => void;
  onSaved?: (widget: WidgetData) => void;
}

// Builder navigation steps
const BUILDER_STEPS = [
  { id: 'source', label: 'Source', icon: Database },
  { id: 'layout', label: 'Layout', icon: LayoutGrid },
  { id: 'header', label: 'Header', icon: Type },
  { id: 'reviews', label: 'Reviews', icon: MessageSquare },
  { id: 'style', label: 'Style', icon: Palette },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const;

type BuilderStep = typeof BUILDER_STEPS[number]['id'];

// =============================================================================
// Main Component
// =============================================================================

export function WidgetBuilderModal({
  widgetId,
  companyId,
  onClose,
  onSaved,
}: WidgetBuilderModalProps) {
  const isNew = !widgetId;
  const [mounted, setMounted] = useState(false);

  // Widget state
  const [widget, setWidget] = useState<WidgetData | null>(null);
  const [widgetName, setWidgetName] = useState('Untitled Widget');
  const [config, setConfig] = useState<WidgetConfig>(createDefaultWidgetConfig('carousel'));
  const [activeStep, setActiveStep] = useState<BuilderStep>('source');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  // Loading/saving state
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | 'unsaved'>('saved');
  const [error, setError] = useState<string | null>(null);

  // Template selection (for new widgets)
  const [showTemplates, setShowTemplates] = useState(isNew);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('carousel');

  // Autosave debounce ref
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedConfigRef = useRef<string>('');

  // Mount portal
  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Fetch widget data if editing
  useEffect(() => {
    if (isNew) return;

    const fetchWidget = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/widgets/${widgetId}`);
        if (!res.ok) throw new Error('Failed to fetch widget');
        const data = await res.json();
        setWidget(data);
        setWidgetName(data.name);
        if (data.configJson) {
          const parsedConfig = parseWidgetConfig(data.configJson);
          setConfig(parsedConfig);
          lastSavedConfigRef.current = JSON.stringify(parsedConfig);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWidget();
  }, [widgetId, isNew]);

  // Autosave effect
  useEffect(() => {
    if (isNew && showTemplates) return; // Don't autosave before template selected
    if (!widget && !isNew) return; // Don't save if still loading

    const currentConfig = JSON.stringify(config);
    if (currentConfig === lastSavedConfigRef.current) return; // No changes

    setSaveStatus('unsaved');

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounced save (1.5 seconds after last change)
    saveTimeoutRef.current = setTimeout(() => {
      handleAutosave();
    }, 1500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [config, widget, isNew, showTemplates]);

  // Autosave handler
  const handleAutosave = async () => {
    if (!widget && !isNew) return;

    try {
      setSaveStatus('saving');
      setIsSaving(true);

      const payload = {
        name: widgetName,
        configJson: config,
      };

      let res: Response;
      if (widget) {
        res = await fetch(`/api/widgets/${widget.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        // Create new widget
        res = await fetch('/api/widgets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyId,
            name: widgetName,
            type: 'CAROUSEL',
            configJson: config,
          }),
        });
      }

      if (!res.ok) throw new Error('Failed to save');

      const savedWidget = await res.json();
      setWidget(savedWidget);
      lastSavedConfigRef.current = JSON.stringify(config);
      setSaveStatus('saved');
      onSaved?.(savedWidget);
    } catch (err) {
      setSaveStatus('error');
      console.error('Autosave failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Update config and trigger autosave
  const updateConfig = useCallback((updates: Partial<WidgetConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  // Handle template selection
  const handleSelectTemplate = (templateKey: string) => {
    setSelectedTemplate(templateKey);
    const template = WIDGET_TEMPLATES[templateKey];
    if (template) {
      const newConfig = createDefaultWidgetConfig(templateKey as keyof typeof WIDGET_TEMPLATES);
      setConfig(newConfig);
    }
  };

  // Confirm template and start editing
  const handleConfirmTemplate = async () => {
    setShowTemplates(false);
    // Create the widget immediately
    try {
      setSaveStatus('saving');
      const res = await fetch('/api/widgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          name: widgetName,
          type: 'CAROUSEL',
          configJson: config,
        }),
      });
      if (!res.ok) throw new Error('Failed to create widget');
      const savedWidget = await res.json();
      setWidget(savedWidget);
      lastSavedConfigRef.current = JSON.stringify(config);
      setSaveStatus('saved');
      onSaved?.(savedWidget);
    } catch (err) {
      setError('Failed to create widget');
    }
  };

  // Publish handler
  const handlePublish = async () => {
    if (!widget) return;

    try {
      setIsSaving(true);
      const res = await fetch(`/api/widgets/${widget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PUBLISHED', configJson: config }),
      });
      if (!res.ok) throw new Error('Failed to publish');
      const updated = await res.json();
      setWidget(updated);
      onSaved?.(updated);
    } catch (err) {
      setError('Failed to publish');
    } finally {
      setIsSaving(false);
    }
  };

  // Save status indicator
  const SaveStatusIndicator = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <span className="flex items-center gap-1.5 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            Saving...
          </span>
        );
      case 'saved':
        return (
          <span className="flex items-center gap-1.5 text-sm text-green-600">
            <Cloud className="w-4 h-4" />
            Saved
          </span>
        );
      case 'error':
        return (
          <span className="flex items-center gap-1.5 text-sm text-red-600">
            <CloudOff className="w-4 h-4" />
            Save failed
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 text-sm text-amber-600">
            <Cloud className="w-4 h-4" />
            Unsaved
          </span>
        );
    }
  };

  if (!mounted) return null;

  // Loading state
  if (isLoading) {
    return createPortal(
      <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>,
      document.body
    );
  }

  // Template selection screen
  if (showTemplates) {
    return createPortal(
      <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b">
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">Choose a Template</h1>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Template Grid */}
          <div className="w-64 bg-gray-900 p-4 overflow-y-auto">
            <p className="text-sm text-gray-400 mb-4">Select a template to start with</p>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(WIDGET_TEMPLATES).map(([key, template]) => (
                <button
                  key={key}
                  onClick={() => handleSelectTemplate(key)}
                  className={cn(
                    'aspect-square rounded-lg border-2 p-2 transition-all bg-gray-800 hover:border-[#ee5f64]',
                    selectedTemplate === key
                      ? 'border-[#ee5f64] ring-2 ring-[#ee5f64]/20'
                      : 'border-gray-700'
                  )}
                >
                  <div className="w-full h-full bg-gray-700 rounded flex items-center justify-center text-xs text-gray-400">
                    {template.name}
                  </div>
                </button>
              ))}
            </div>

            <Button
              variant="primary"
              className="w-full mt-6"
              onClick={handleConfirmTemplate}
            >
              Continue with this template
            </Button>
          </div>

          {/* Preview - centered in the middle of the page */}
          <div className="flex-1 bg-white flex items-center justify-center p-8">
            <div className="w-full max-w-4xl">
              <WidgetPreview config={config} />
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // Main builder
  return createPortal(
    <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={widgetName}
              onChange={(e) => setWidgetName(e.target.value)}
              onBlur={handleAutosave}
              className="text-lg font-semibold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-[#ee5f64]/20 rounded px-2 py-1"
              placeholder="Widget name"
            />
            <SaveStatusIndicator />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {widget?.status === 'PUBLISHED' && (
            <Badge variant="success">Published</Badge>
          )}
          {widget?.status === 'DRAFT' && (
            <Badge variant="warning">Draft</Badge>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={handlePublish}
            disabled={isSaving || !widget}
          >
            {widget?.status === 'PUBLISHED' ? 'Update' : 'Publish'}
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Icon Rail */}
        <nav className="w-16 bg-gray-900 flex flex-col items-center py-4 gap-1">
          {BUILDER_STEPS.map((step) => {
            const Icon = step.icon;
            const isActive = activeStep === step.id;
            return (
              <button
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className={cn(
                  'w-12 h-12 rounded-lg flex flex-col items-center justify-center gap-1 transition-colors',
                  isActive
                    ? 'bg-[#ee5f64] text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                )}
                title={step.label}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px]">{step.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Settings Panel */}
        <div className="w-72 bg-gray-900 text-white overflow-y-auto">
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-4">
              {BUILDER_STEPS.find((s) => s.id === activeStep)?.label}
            </h2>

            {activeStep === 'source' && <SourcePanel config={config} onUpdate={updateConfig} />}
            {activeStep === 'layout' && <LayoutPanel config={config} onUpdate={updateConfig} />}
            {activeStep === 'header' && <HeaderPanel config={config} onUpdate={updateConfig} />}
            {activeStep === 'reviews' && <ReviewsPanel config={config} onUpdate={updateConfig} />}
            {activeStep === 'style' && <StylePanel config={config} onUpdate={updateConfig} />}
            {activeStep === 'settings' && <SettingsPanel config={config} onUpdate={updateConfig} />}
          </div>
        </div>

        {/* Preview Canvas */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          {/* Preview Controls */}
          <div className="flex items-center justify-center gap-2 py-3 border-b shrink-0">
            <button
              onClick={() => setPreviewDevice('desktop')}
              className={cn(
                'p-2 rounded-lg transition-colors',
                previewDevice === 'desktop' ? 'bg-gray-100 text-gray-900' : 'text-gray-400'
              )}
              title="Desktop preview"
            >
              <Monitor className="w-5 h-5" />
            </button>
            <button
              onClick={() => setPreviewDevice('mobile')}
              className={cn(
                'p-2 rounded-lg transition-colors',
                previewDevice === 'mobile' ? 'bg-gray-100 text-gray-900' : 'text-gray-400'
              )}
              title="Mobile preview"
            >
              <Smartphone className="w-5 h-5" />
            </button>
          </div>

          {/* Preview Area - centered in the middle like Elfsight */}
          <div className="flex-1 bg-white flex items-center justify-center p-8">
            <div className={cn('w-full', previewDevice === 'mobile' ? 'max-w-[375px]' : 'max-w-4xl')}>
              <WidgetPreview config={config} />
            </div>
          </div>

          {/* Embed Code Footer */}
          {widget && (
            <div className="bg-white border-t px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const code = `<script src="${window.location.origin}/widget-platform.js" data-widget-id="${widget.id}"></script>`;
                    navigator.clipboard.writeText(code);
                  }}
                >
                  <Code className="w-4 h-4 mr-2" />
                  Copy Embed Code
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

// =============================================================================
// Panel Components
// =============================================================================

interface PanelProps {
  config: WidgetConfig;
  onUpdate: (updates: Partial<WidgetConfig>) => void;
}

function SourcePanel({ config, onUpdate }: PanelProps) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-gray-400 mb-2">Business Name and Address</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for business..."
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#ee5f64]"
          />
          <Button variant="outline" size="sm" className="shrink-0">
            <Search className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {config.source.locations.length > 0 ? (
        <div className="space-y-2">
          {config.source.locations.map((loc, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
              <MapPin className="w-4 h-4 text-gray-400" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{loc.label || loc.placeId}</p>
                <p className="text-xs text-gray-500">{loc.provider}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No locations connected</p>
          <p className="text-xs mt-1">Search for your business above</p>
        </div>
      )}

      <div className="pt-4 border-t border-gray-700">
        <p className="text-xs text-gray-500">
          Or use a Google Maps link if no physical address is available.
          <br />
          Example: https://maps.app.goo.gl/...
        </p>
      </div>
    </div>
  );
}

function LayoutPanel({ config, onUpdate }: PanelProps) {
  const layout = config.layout;

  const feedLayouts = [
    { id: 'carousel', label: 'Carousel' },
    { id: 'grid', label: 'Grid' },
    { id: 'masonry', label: 'Masonry' },
    { id: 'list', label: 'List' },
    { id: 'slider', label: 'Slider' },
  ];

  const badgeLayouts = [
    { id: 'badge', label: 'Card Badge' },
    // Coming soon:
    // { id: 'compact-badge', label: 'Compact Badge' },
    // { id: 'reviews-button', label: 'Reviews Button' },
    // { id: 'review-request', label: 'Review Request' },
  ];

  const handleLayoutChange = (type: string) => {
    onUpdate({
      layout: { ...layout, type: type as typeof layout.type },
    });
  };

  return (
    <div className="space-y-6">
      {/* FEEDS Section */}
      <div>
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Feeds</h3>
        <div className="grid grid-cols-2 gap-2">
          {feedLayouts.map((opt) => (
            <button
              key={opt.id}
              onClick={() => handleLayoutChange(opt.id)}
              className={cn(
                'aspect-[4/3] rounded-lg border-2 p-2 transition-all',
                'bg-white hover:border-[#ee5f64]',
                layout.type === opt.id
                  ? 'border-[#ee5f64] ring-2 ring-[#ee5f64]/20'
                  : 'border-gray-200'
              )}
            >
              <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center text-[10px] text-gray-600 font-medium">
                {opt.label}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* BADGES Section */}
      <div>
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Badges</h3>
        <div className="grid grid-cols-2 gap-2">
          {badgeLayouts.map((opt) => (
            <button
              key={opt.id}
              onClick={() => handleLayoutChange(opt.id)}
              className={cn(
                'aspect-[4/3] rounded-lg border-2 p-2 transition-all',
                'bg-white hover:border-[#ee5f64]',
                layout.type === opt.id
                  ? 'border-[#ee5f64] ring-2 ring-[#ee5f64]/20'
                  : 'border-gray-200'
              )}
            >
              <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center text-[10px] text-gray-600 font-medium">
                {opt.label}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Customize Layout - only show for feed layouts */}
      {layout.type !== 'badge' && (
        <div className="space-y-4 pt-4 border-t border-gray-700">
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
            Customize Layout
          </h3>

          <SettingRow
            label="Width"
            value={layout.width === 'responsive' ? '100%' : `${layout.width}px`}
          />
          
          {(layout.type === 'grid' || layout.type === 'masonry') && (
            <>
              <SettingRow
                label="Columns"
                value={layout.columns === 'auto' ? 'Auto' : String(layout.columns)}
              />
              <SettingRow label="Rows" value={String(layout.rowsDesktop)} />
              <SettingRow label="Rows on Mobile" value={String(layout.rowsMobile)} />
            </>
          )}
          
          <SettingRow label="Item Spacing" value={`${layout.itemSpacing}px`} />

          {(layout.type === 'carousel' || layout.type === 'slider') && (
            <SettingToggle
              label="Auto Play"
              checked={layout.autoplay.enabled}
              onChange={(checked) =>
                onUpdate({
                  layout: { ...layout, autoplay: { ...layout.autoplay, enabled: checked } },
                })
              }
            />
          )}

          <SettingRow
            label="Animation"
            value={layout.animation.charAt(0).toUpperCase() + layout.animation.slice(1)}
          />

          {layout.type === 'carousel' && (
            <SettingRow
              label="Scroll Mode"
              value={layout.scrollMode === 'item' ? 'Scroll per Item' : 'Scroll per Page'}
            />
          )}
        </div>
      )}

      {/* Navigation options */}
      {(layout.type === 'carousel' || layout.type === 'slider') && (
        <>
          <CollapsibleSection title="Pagination">
            <SettingToggle
              label="Show Dots"
              checked={layout.navigation.dots}
              onChange={(checked) =>
                onUpdate({
                  layout: { ...layout, navigation: { ...layout.navigation, dots: checked } },
                })
              }
            />
          </CollapsibleSection>

          <CollapsibleSection title="Navigation Arrows">
            <SettingToggle
              label="Show Arrows"
              checked={layout.navigation.arrows}
              onChange={(checked) =>
                onUpdate({
                  layout: { ...layout, navigation: { ...layout.navigation, arrows: checked } },
                })
              }
            />
          </CollapsibleSection>

          <CollapsibleSection title="Swipe Navigation">
            <SettingToggle
              label="Enable Swipe"
              checked={layout.navigation.swipe}
              onChange={(checked) =>
                onUpdate({
                  layout: { ...layout, navigation: { ...layout.navigation, swipe: checked } },
                })
              }
            />
          </CollapsibleSection>
        </>
      )}
    </div>
  );
}

function HeaderPanel({ config, onUpdate }: PanelProps) {
  const header = config.header;

  return (
    <div className="space-y-6">
      <SettingToggle
        label="Show Header"
        checked={header.enabled}
        onChange={(checked) => onUpdate({ header: { ...header, enabled: checked } })}
      />

      {header.enabled && (
        <>
          {/* Header Style Carousel - simplified */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-3">Style</h3>
            <div className="flex items-center gap-2">
              <button className="p-1 text-gray-500 hover:text-white">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex-1 bg-gray-800 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <div className="text-xs">Google Reviews</div>
                  <div className="text-yellow-400 text-xs">★★★★★</div>
                </div>
              </div>
              <button className="p-1 text-gray-500 hover:text-white">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Elements */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-3">Elements</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={header.title !== ''}
                  onChange={(e) =>
                    onUpdate({
                      header: { ...header, title: e.target.checked ? 'What Our Customers Say' : '' },
                    })
                  }
                  className="rounded border-gray-600 bg-gray-800"
                />
                <span className="text-sm">Heading</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={header.showRatingSummary}
                  onChange={(e) =>
                    onUpdate({ header: { ...header, showRatingSummary: e.target.checked } })
                  }
                  className="rounded border-gray-600 bg-gray-800"
                />
                <span className="text-sm">Rating</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={header.showReviewCount}
                  onChange={(e) =>
                    onUpdate({ header: { ...header, showReviewCount: e.target.checked } })
                  }
                  className="rounded border-gray-600 bg-gray-800"
                />
                <span className="text-sm">Number of Reviews</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={header.writeReviewButton.enabled}
                  onChange={(e) =>
                    onUpdate({
                      header: {
                        ...header,
                        writeReviewButton: { ...header.writeReviewButton, enabled: e.target.checked },
                      },
                    })
                  }
                  className="rounded border-gray-600 bg-gray-800"
                />
                <span className="text-sm">Write a Review Button</span>
              </label>
            </div>
          </div>

          {/* Widget Title */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">Widget Title</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={header.title !== ''}
                  onChange={(e) =>
                    onUpdate({
                      header: { ...header, title: e.target.checked ? 'What Our Customers Say' : '' },
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-700 rounded-full peer peer-checked:bg-[#ee5f64] peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
              </label>
            </div>
            {header.title !== '' && (
              <div className="space-y-2">
                <label className="block text-xs text-gray-500">Title</label>
                <input
                  type="text"
                  value={header.title}
                  onChange={(e) => onUpdate({ header: { ...header, title: e.target.value } })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#ee5f64]"
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function ReviewsPanel({ config, onUpdate }: PanelProps) {
  const reviews = config.reviews;

  return (
    <div className="space-y-6">
      <SettingToggle
        label="Show Reviews without Text"
        checked={reviews.showWithoutText}
        onChange={(checked) => onUpdate({ reviews: { ...reviews, showWithoutText: checked } })}
        description="Reviews without text will be displayed with prefilled text based on the review rating."
      />

      <SettingRow
        label="Rating at Least"
        value={`${'★'.repeat(reviews.minRating)} (${reviews.minRating} stars)`}
        valueColor="text-yellow-400"
      />

      <SettingRow
        label="Total Number of Reviews to Show"
        value={reviews.maxReviews === 'all' ? 'All' : String(reviews.maxReviews)}
      />

      <CollapsibleSection title="Filters">
        <p className="text-xs text-gray-500 mb-3">
          Set the filters to remove some reviews from your widget.
        </p>
        <Button variant="ghost" size="sm" className="w-full text-[#ee5f64]">
          + Add Filter
        </Button>
      </CollapsibleSection>

      <CollapsibleSection title="Sorting">
        <SettingRow
          label="Sort By"
          value={reviews.sortBy === 'newest' ? 'Newest' : reviews.sortBy === 'highest' ? 'Highest Rated' : 'Lowest Rated'}
        />
      </CollapsibleSection>
    </div>
  );
}

function StylePanel({ config, onUpdate }: PanelProps) {
  const style = config.style;

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm text-gray-400 mb-2">Color Scheme</label>
        <div className="flex gap-2">
          <button
            onClick={() => onUpdate({ style: { ...style, colorScheme: 'light' } })}
            className={cn(
              'flex-1 py-2 px-4 rounded-lg border text-sm',
              style.colorScheme === 'light'
                ? 'bg-white text-gray-900 border-[#ee5f64]'
                : 'bg-gray-800 text-gray-400 border-gray-700'
            )}
          >
            Light
          </button>
          <button
            onClick={() => onUpdate({ style: { ...style, colorScheme: 'dark' } })}
            className={cn(
              'flex-1 py-2 px-4 rounded-lg border text-sm',
              style.colorScheme === 'dark'
                ? 'bg-gray-900 text-white border-[#ee5f64]'
                : 'bg-gray-800 text-gray-400 border-gray-700'
            )}
          >
            Dark
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-2">Accent Color</label>
        <div className="flex gap-2">
          <input
            type="color"
            value={style.accentColor}
            onChange={(e) => onUpdate({ style: { ...style, accentColor: e.target.value } })}
            className="w-10 h-10 rounded border border-gray-700 cursor-pointer"
          />
          <input
            type="text"
            value={style.accentColor}
            onChange={(e) => onUpdate({ style: { ...style, accentColor: e.target.value } })}
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#ee5f64]"
          />
        </div>
      </div>

      <CollapsibleSection title="Custom CSS">
        <textarea
          value={style.customCss}
          onChange={(e) => onUpdate({ style: { ...style, customCss: e.target.value } })}
          placeholder=".rc-widget { /* your styles */ }"
          rows={4}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm font-mono focus:outline-none focus:border-[#ee5f64]"
        />
      </CollapsibleSection>
    </div>
  );
}

function SettingsPanel({ config, onUpdate }: PanelProps) {
  const settings = config.settings;

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm text-gray-400 mb-2">Language</label>
        <Select
          value={settings.language}
          onChange={(e) => onUpdate({ settings: { ...settings, language: e.target.value } })}
        >
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="de">German</option>
        </Select>
      </div>

      <SettingToggle
        label="Auto-translate Reviews"
        checked={settings.autoTranslate}
        onChange={(checked) => onUpdate({ settings: { ...settings, autoTranslate: checked } })}
      />

      <CollapsibleSection title="External Links">
        <SettingToggle
          label="Enable External Links"
          checked={settings.externalLinks.enabled}
          onChange={(checked) =>
            onUpdate({
              settings: { ...settings, externalLinks: { ...settings.externalLinks, enabled: checked } },
            })
          }
        />
        <SettingToggle
          label="Open in New Tab"
          checked={settings.externalLinks.openInNewTab}
          onChange={(checked) =>
            onUpdate({
              settings: { ...settings, externalLinks: { ...settings.externalLinks, openInNewTab: checked } },
            })
          }
        />
      </CollapsibleSection>

      <CollapsibleSection title="SEO Schema">
        <SettingToggle
          label="Generate Schema.org JSON-LD"
          checked={settings.schema.enabled}
          onChange={(checked) =>
            onUpdate({
              settings: { ...settings, schema: { ...settings.schema, enabled: checked } },
            })
          }
        />
        <p className="text-xs text-gray-500 mt-2">
          Note: Schema inside an iframe won&apos;t help SEO. Copy the generated snippet to your page.
        </p>
      </CollapsibleSection>
    </div>
  );
}

// =============================================================================
// Helper Components
// =============================================================================

function SettingRow({
  label,
  value,
  valueColor = 'text-[#ee5f64]',
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-300">{label}</span>
      <span className={cn('text-sm', valueColor)}>{value}</span>
    </div>
  );
}

function SettingToggle({
  label,
  checked,
  onChange,
  description,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-300">{label}</span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-gray-700 rounded-full peer peer-checked:bg-[#ee5f64] peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
        </label>
      </div>
      {description && <p className="text-xs text-gray-500">{description}</p>}
    </div>
  );
}

function CollapsibleSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-t border-gray-700 pt-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-sm text-gray-300 hover:text-white"
      >
        <span>{title}</span>
        <ChevronRight className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-90')} />
      </button>
      {isOpen && <div className="mt-3 space-y-3">{children}</div>}
    </div>
  );
}

// =============================================================================
// Widget Preview Component
// =============================================================================

function WidgetPreview({ config }: { config: WidgetConfig }) {
  // Mock reviews matching Elfsight screenshot
  const mockReviews = [
    { id: '1', authorName: 'lowell stanley', rating: 5, text: 'Todd Wiseman of accutate is the wonder of the age. I have been a lawyer...', date: '6 months ago', initial: 'l', color: '#9c27b0', hasPhoto: false },
    { id: '2', authorName: 'Sawkhar Das', rating: 5, text: 'Actuate Media has significantly improved our online presence through...', date: '1 year ago', initial: 'S', color: '#4285f4', hasPhoto: true },
    { id: '3', authorName: 'Jyothiprakash n...', rating: 5, text: 'Thank you, i am delighted to work with you.', date: '1 year ago', initial: 'J', color: '#34a853', hasPhoto: false },
    { id: '4', authorName: 'Joe Kaiser', rating: 5, text: 'Highly recommend the team at Actuate Media! We own several...', date: '1 year ago', initial: 'J', color: '#607d8b', hasPhoto: true },
    { id: '5', authorName: 'Christina Vertus', rating: 5, text: 'The team at Acutate Media is always so helpful with all of our company...', date: '1 year ago', initial: 'C', color: '#00bcd4', hasPhoto: false },
  ];

  const isDark = config.style.colorScheme === 'dark';

  // Verified checkmark badge (blue circle with white check)
  const VerifiedBadge = () => (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#4285f4" />
      <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  // Review Card Component - matches Elfsight exactly
  const ReviewCard = ({ review, fullWidth = false }: { review: typeof mockReviews[0]; fullWidth?: boolean }) => (
    <div
      className={cn(
        'p-5 rounded-xl shadow-sm',
        isDark ? 'bg-gray-800' : 'bg-gray-50',
        fullWidth ? 'w-full' : 'shrink-0 w-56'
      )}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="relative">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-lg"
            style={{ backgroundColor: review.color }}
          >
            {review.initial}
          </div>
          {/* Google G icon overlay in grey circle */}
          <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-white border border-gray-200 flex items-center justify-center">
            <img
              src="/assets/review-sources/google-icon.svg"
              alt=""
              className="w-3 h-3"
            />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <p className={cn('font-medium text-sm truncate', isDark ? 'text-white' : 'text-gray-900')}>
              {review.authorName}
            </p>
            <VerifiedBadge />
          </div>
          <p className="text-xs text-gray-500">{review.date}</p>
        </div>
      </div>
      <div className="flex gap-0.5 mb-3">
        {[...Array(5)].map((_, i) => (
          <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <p className={cn('text-sm leading-relaxed', isDark ? 'text-gray-300' : 'text-gray-700')}>
        {review.text}
      </p>
      <button className="text-sm mt-3 font-medium" style={{ color: '#4285f4' }}>
        Read more
      </button>
    </div>
  );

  // Header Component - matches Elfsight exactly
  const WidgetHeader = () => (
    <div className={cn('px-6 py-5 rounded-xl mb-5', isDark ? 'bg-gray-800' : 'bg-gray-50')}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Google Reviews branding */}
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-normal">
              <span style={{ color: '#4285f4' }}>G</span>
              <span style={{ color: '#ea4335' }}>o</span>
              <span style={{ color: '#fbbc05' }}>o</span>
              <span style={{ color: '#4285f4' }}>g</span>
              <span style={{ color: '#34a853' }}>l</span>
              <span style={{ color: '#ea4335' }}>e</span>
            </span>
            <span className={cn('text-lg', isDark ? 'text-gray-300' : 'text-gray-600')}>Reviews</span>
          </div>
        </div>
        {config.header.writeReviewButton.enabled && (
          <button
            className="px-5 py-2.5 rounded-full text-white text-sm font-medium"
            style={{ backgroundColor: '#4285f4' }}
          >
            Review us on Google
          </button>
        )}
      </div>
      <div className="flex items-center gap-2 mt-2">
        <span className={cn('text-2xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>5.0</span>
        <div className="flex gap-0.5">
          {[...Array(5)].map((_, i) => (
            <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
        {config.header.showReviewCount && (
          <span className="text-gray-500 text-sm">(41)</span>
        )}
      </div>
    </div>
  );

  return (
    <div className={cn('font-sans max-w-4xl mx-auto', isDark ? 'text-white' : 'text-gray-900')}>
      {/* Title */}
      {config.header.enabled && config.header.title && (
        <h2 className="text-2xl font-bold mb-6 text-center">{config.header.title}</h2>
      )}

      {/* Header with Google branding */}
      {config.header.enabled && config.header.showRatingSummary && <WidgetHeader />}

      {/* Carousel Layout */}
      {config.layout.type === 'carousel' && (
        <div className="relative">
          <div className="flex gap-4 overflow-x-auto pb-4">
            {mockReviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
          {/* Right navigation arrow */}
          {config.layout.navigation.arrows && (
            <button className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors">
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          )}
          {config.layout.navigation.dots && (
            <div className="flex justify-center gap-2 mt-6">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-800" />
              <div className={cn('w-2.5 h-2.5 rounded-full', isDark ? 'bg-gray-600' : 'bg-gray-300')} />
              <div className={cn('w-2.5 h-2.5 rounded-full', isDark ? 'bg-gray-600' : 'bg-gray-300')} />
              <div className={cn('w-2.5 h-2.5 rounded-full', isDark ? 'bg-gray-600' : 'bg-gray-300')} />
            </div>
          )}
        </div>
      )}

      {/* Grid Layout */}
      {config.layout.type === 'grid' && (
        <>
          <div className="grid grid-cols-3 gap-4">
            {mockReviews.map((review) => (
              <ReviewCard key={review.id} review={review} fullWidth />
            ))}
          </div>
          <div className="flex justify-center mt-6">
            <button className={cn(
              'px-6 py-2 rounded-full border text-sm font-medium',
              isDark ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'
            )}>
              Load More
            </button>
          </div>
        </>
      )}

      {/* Masonry Layout */}
      {config.layout.type === 'masonry' && (
        <>
          <div className="columns-3 gap-4 space-y-4">
            {mockReviews.map((review, i) => (
              <div key={review.id} className="break-inside-avoid">
                <ReviewCard review={review} fullWidth />
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-6">
            <button className={cn(
              'px-6 py-2 rounded-full border text-sm font-medium',
              isDark ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'
            )}>
              Load More
            </button>
          </div>
        </>
      )}

      {/* List Layout */}
      {config.layout.type === 'list' && (
        <div className="space-y-4">
          {mockReviews.slice(0, 3).map((review) => (
            <div
              key={review.id}
              className={cn(
                'p-6 rounded-lg border',
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              )}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                    style={{ backgroundColor: review.color }}
                  >
                    {review.initial}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                    <img
                      src="/assets/review-sources/google-icon.svg"
                      alt=""
                      className="w-3 h-3"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <p className="font-medium">{review.authorName}</p>
                    <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                    </svg>
                  </div>
                  <p className="text-xs text-gray-500">{review.date}</p>
                </div>
              </div>
              <div className="text-yellow-400 mb-3">★★★★★</div>
              <p className={cn('text-sm', isDark ? 'text-gray-300' : 'text-gray-600')}>
                {review.text}
              </p>
              <button className="text-sm mt-3" style={{ color: config.style.accentColor }}>
                Read more
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Slider Layout */}
      {config.layout.type === 'slider' && mockReviews[0] && (
        <>
          <div className={cn(
            'p-6 rounded-lg border relative',
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          )}>
            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                  style={{ backgroundColor: mockReviews[0].color }}
                >
                  {mockReviews[0].initial}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                  <img
                    src="/assets/review-sources/google-icon.svg"
                    alt=""
                    className="w-3 h-3"
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <p className="font-medium">{mockReviews[0].authorName}</p>
                  <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                </div>
                <p className="text-xs text-gray-500">{mockReviews[0].date}</p>
              </div>
            </div>
            <div className="text-yellow-400 mb-3">★★★★★</div>
            <p className={cn('text-sm', isDark ? 'text-gray-300' : 'text-gray-600')}>
              Todd Wiseman of accutate is the wonder of the age. I have been a lawyer advertiser for over 30 years. 
              I thought I knew everything. I did not. Todd does. He revitalized the marketing of my personal injury 
              practice such that I am making more dollars than I ever have in my life.
            </p>
            {/* Navigation arrows */}
            {config.layout.navigation.arrows && (
              <button className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            )}
          </div>
          {config.layout.navigation.dots && (
            <div className="flex justify-center gap-2 mt-4">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: config.style.accentColor }} />
              <div className={cn('w-2 h-2 rounded-full', isDark ? 'bg-gray-600' : 'bg-gray-300')} />
              <div className={cn('w-2 h-2 rounded-full', isDark ? 'bg-gray-600' : 'bg-gray-300')} />
            </div>
          )}
        </>
      )}

      {/* Badge Layout (Card Badge) */}
      {config.layout.type === 'badge' && (
        <div className="flex justify-center py-8">
          <div className="text-center">
            <img
              src="/assets/review-sources/google-icon.svg"
              alt="Google"
              className="w-12 h-12 mx-auto mb-2"
            />
            <p className={cn('text-sm font-medium mb-1', isDark ? 'text-gray-300' : 'text-gray-600')}>
              Google Rating
            </p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl font-bold">5.0</span>
              <div className="flex text-yellow-400 text-lg">★★★★★</div>
            </div>
            <p className="text-sm text-gray-500 mt-1">41 reviews</p>
          </div>
        </div>
      )}
    </div>
  );
}
