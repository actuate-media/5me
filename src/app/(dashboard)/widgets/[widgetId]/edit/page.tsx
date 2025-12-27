'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, Button, Input, Select } from '@/components/ui';
import {
  ArrowLeft,
  Save,
  Eye,
  Code,
  Loader2,
  Database,
  LayoutGrid,
  Type,
  MessageSquare,
  Palette,
  Settings,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WidgetConfig } from '@/types/widget-config';
import { 
  createDefaultWidgetConfig, 
  parseWidgetConfig,
  WIDGET_TEMPLATES 
} from '@/types/widget-config';

// Builder navigation steps
const BUILDER_STEPS = [
  { id: 'source', label: 'Source', icon: Database, description: 'Connect review sources' },
  { id: 'layout', label: 'Layout', icon: LayoutGrid, description: 'Configure layout options' },
  { id: 'header', label: 'Header', icon: Type, description: 'Customize header content' },
  { id: 'reviews', label: 'Reviews', icon: MessageSquare, description: 'Filter and sort reviews' },
  { id: 'style', label: 'Style', icon: Palette, description: 'Design and colors' },
  { id: 'settings', label: 'Settings', icon: Settings, description: 'Advanced settings' },
] as const;

type BuilderStep = typeof BUILDER_STEPS[number]['id'];

interface WidgetData {
  id: string;
  name: string;
  type: string;
  status: string;
  configJson: WidgetConfig;
  companyId: string;
}

export default function WidgetEditorPage() {
  const params = useParams();
  const router = useRouter();
  const widgetId = params.widgetId as string;
  const isNew = widgetId === 'new';

  const [widget, setWidget] = useState<WidgetData | null>(null);
  const [config, setConfig] = useState<WidgetConfig>(createDefaultWidgetConfig('carousel'));
  const [activeStep, setActiveStep] = useState<BuilderStep>('source');
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch widget data if editing existing
  useEffect(() => {
    if (isNew) return;

    const fetchWidget = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/widgets/${widgetId}`);
        if (!res.ok) throw new Error('Failed to fetch widget');
        const data = await res.json();
        setWidget(data);
        // Parse config from JSON
        if (data.configJson) {
          setConfig(parseWidgetConfig(data.configJson));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWidget();
  }, [widgetId, isNew]);

  // Update config and mark as changed
  const updateConfig = useCallback((updates: Partial<WidgetConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  }, []);

  // Save widget
  const handleSave = async (publish = false) => {
    try {
      setIsSaving(true);
      
      const payload = {
        configJson: config,
        status: publish ? 'PUBLISHED' : 'DRAFT',
      };

      const res = await fetch(`/api/widgets/${widgetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to save widget');
      
      setHasChanges(false);
      if (publish) {
        // Show success message or redirect
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-red-500">{error}</p>
        <Button variant="outline" onClick={() => router.push('/widgets')}>
          Back to Widgets
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-4">
          <Link href="/widgets" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="font-semibold text-gray-900">
              {isNew ? 'New Widget' : widget?.name || 'Widget Editor'}
            </h1>
            <p className="text-sm text-gray-500">
              {BUILDER_STEPS.find(s => s.id === activeStep)?.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {hasChanges && (
            <span className="text-sm text-amber-600">Unsaved changes</span>
          )}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleSave(false)}
            disabled={isSaving || !hasChanges}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
          <Button 
            variant="primary" 
            size="sm"
            onClick={() => handleSave(true)}
            disabled={isSaving}
            isLoading={isSaving}
          >
            <Check className="w-4 h-4 mr-2" />
            Publish
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Navigation */}
        <nav className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Configuration
            </h2>
            <ul className="space-y-1">
              {BUILDER_STEPS.map((step) => {
                const Icon = step.icon;
                const isActive = activeStep === step.id;
                return (
                  <li key={step.id}>
                    <button
                      onClick={() => setActiveStep(step.id)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors',
                        isActive
                          ? 'bg-[#ee5f64]/10 text-[#ee5f64]'
                          : 'text-gray-700 hover:bg-gray-100'
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{step.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Quick Actions */}
          <div className="p-4 border-t border-gray-200">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Actions
            </h2>
            <div className="space-y-2">
              <Button variant="ghost" size="sm" className="w-full justify-start">
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                <Code className="w-4 h-4 mr-2" />
                Get Embed Code
              </Button>
            </div>
          </div>
        </nav>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Settings Panel */}
          <div className="w-96 bg-white border-r border-gray-200 overflow-y-auto p-6">
            {activeStep === 'source' && (
              <SourcePanel config={config} onUpdate={updateConfig} />
            )}
            {activeStep === 'layout' && (
              <LayoutPanel config={config} onUpdate={updateConfig} />
            )}
            {activeStep === 'header' && (
              <HeaderPanel config={config} onUpdate={updateConfig} />
            )}
            {activeStep === 'reviews' && (
              <ReviewsPanel config={config} onUpdate={updateConfig} />
            )}
            {activeStep === 'style' && (
              <StylePanel config={config} onUpdate={updateConfig} />
            )}
            {activeStep === 'settings' && (
              <SettingsPanel config={config} onUpdate={updateConfig} />
            )}
          </div>

          {/* Live Preview Canvas */}
          <div className="flex-1 bg-gray-100 overflow-auto p-8">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-xl shadow-lg p-6 min-h-[400px]">
                <WidgetPreview config={config} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
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
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Review Sources</h3>
        <p className="text-sm text-gray-500">Connect Google Business profiles to display reviews</p>
      </div>

      <Card className="p-4">
        <div className="text-center py-8 text-gray-500">
          <Database className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-medium">No sources connected</p>
          <p className="text-sm mt-1">Add a Google Business profile to get started</p>
          <Button variant="primary" size="sm" className="mt-4">
            Connect Google Business
          </Button>
        </div>
      </Card>

      <div className="text-sm text-gray-500">
        <p>Connected sources: {config.source.locations.length}</p>
      </div>
    </div>
  );
}

function LayoutPanel({ config, onUpdate }: PanelProps) {
  const layout = config.layout;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Layout Options</h3>
        <p className="text-sm text-gray-500">Configure how reviews are displayed</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Columns</label>
          <Select
            value={String(layout.columns)}
            onChange={(e) => onUpdate({
              layout: { ...layout, columns: e.target.value === 'auto' ? 'auto' : Number(e.target.value) }
            })}
          >
            <option value="auto">Auto</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rows (Desktop)</label>
          <Input
            type="number"
            min={1}
            max={10}
            value={layout.rowsDesktop}
            onChange={(e) => onUpdate({
              layout: { ...layout, rowsDesktop: Number(e.target.value) }
            })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rows (Mobile)</label>
          <Input
            type="number"
            min={1}
            max={10}
            value={layout.rowsMobile}
            onChange={(e) => onUpdate({
              layout: { ...layout, rowsMobile: Number(e.target.value) }
            })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Item Spacing (px)</label>
          <Input
            type="number"
            min={0}
            max={100}
            value={layout.itemSpacing}
            onChange={(e) => onUpdate({
              layout: { ...layout, itemSpacing: Number(e.target.value) }
            })}
          />
        </div>

        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-3">Autoplay</h4>
          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={layout.autoplay.enabled}
                onChange={(e) => onUpdate({
                  layout: { ...layout, autoplay: { ...layout.autoplay, enabled: e.target.checked } }
                })}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Enable autoplay</span>
            </label>

            {layout.autoplay.enabled && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Interval (ms)
                  </label>
                  <Input
                    type="number"
                    min={1000}
                    max={30000}
                    step={500}
                    value={layout.autoplay.interval}
                    onChange={(e) => onUpdate({
                      layout: { ...layout, autoplay: { ...layout.autoplay, interval: Number(e.target.value) } }
                    })}
                  />
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={layout.autoplay.pauseOnHover}
                    onChange={(e) => onUpdate({
                      layout: { ...layout, autoplay: { ...layout.autoplay, pauseOnHover: e.target.checked } }
                    })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Pause on hover</span>
                </label>
              </>
            )}
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-3">Navigation</h4>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={layout.navigation.arrows}
                onChange={(e) => onUpdate({
                  layout: { ...layout, navigation: { ...layout.navigation, arrows: e.target.checked } }
                })}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Show arrows</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={layout.navigation.dots}
                onChange={(e) => onUpdate({
                  layout: { ...layout, navigation: { ...layout.navigation, dots: e.target.checked } }
                })}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Show dots</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={layout.navigation.swipe}
                onChange={(e) => onUpdate({
                  layout: { ...layout, navigation: { ...layout.navigation, swipe: e.target.checked } }
                })}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Enable swipe</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

function HeaderPanel({ config, onUpdate }: PanelProps) {
  const header = config.header;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Header Options</h3>
        <p className="text-sm text-gray-500">Customize the widget header</p>
      </div>

      <div className="space-y-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={header.enabled}
            onChange={(e) => onUpdate({
              header: { ...header, enabled: e.target.checked }
            })}
            className="rounded border-gray-300"
          />
          <span className="text-sm font-medium text-gray-700">Show header</span>
        </label>

        {header.enabled && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <Input
                value={header.title}
                onChange={(e) => onUpdate({
                  header: { ...header, title: e.target.value }
                })}
                placeholder="What Our Customers Say"
              />
            </div>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={header.showRatingSummary}
                onChange={(e) => onUpdate({
                  header: { ...header, showRatingSummary: e.target.checked }
                })}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Show rating summary</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={header.showReviewCount}
                onChange={(e) => onUpdate({
                  header: { ...header, showReviewCount: e.target.checked }
                })}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Show review count</span>
            </label>

            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-3">Write a Review Button</h4>
              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={header.writeReviewButton.enabled}
                    onChange={(e) => onUpdate({
                      header: { ...header, writeReviewButton: { ...header.writeReviewButton, enabled: e.target.checked } }
                    })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Show button</span>
                </label>

                {header.writeReviewButton.enabled && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Button Text</label>
                      <Input
                        value={header.writeReviewButton.text}
                        onChange={(e) => onUpdate({
                          header: { ...header, writeReviewButton: { ...header.writeReviewButton, text: e.target.value } }
                        })}
                        placeholder="Write a Review"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Custom URL (optional)
                      </label>
                      <Input
                        value={header.writeReviewButton.url || ''}
                        onChange={(e) => onUpdate({
                          header: { ...header, writeReviewButton: { ...header.writeReviewButton, url: e.target.value || undefined } }
                        })}
                        placeholder="https://..."
                      />
                      <p className="text-xs text-gray-500 mt-1">Leave empty to use Google review URL</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ReviewsPanel({ config, onUpdate }: PanelProps) {
  const reviews = config.reviews;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Review Filters</h3>
        <p className="text-sm text-gray-500">Control which reviews are displayed</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Rating</label>
          <Select
            value={String(reviews.minRating)}
            onChange={(e) => onUpdate({
              reviews: { ...reviews, minRating: Number(e.target.value) }
            })}
          >
            <option value="1">1+ stars</option>
            <option value="2">2+ stars</option>
            <option value="3">3+ stars</option>
            <option value="4">4+ stars</option>
            <option value="5">5 stars only</option>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Reviews</label>
          <Select
            value={String(reviews.maxReviews)}
            onChange={(e) => onUpdate({
              reviews: { ...reviews, maxReviews: e.target.value === 'all' ? 'all' : Number(e.target.value) }
            })}
          >
            <option value="all">All reviews</option>
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
          <Select
            value={reviews.sortBy}
            onChange={(e) => onUpdate({
              reviews: { ...reviews, sortBy: e.target.value as 'newest' | 'highest' | 'lowest' }
            })}
          >
            <option value="newest">Newest first</option>
            <option value="highest">Highest rated</option>
            <option value="lowest">Lowest rated</option>
          </Select>
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={reviews.showWithoutText}
            onChange={(e) => onUpdate({
              reviews: { ...reviews, showWithoutText: e.target.checked }
            })}
            className="rounded border-gray-300"
          />
          <span className="text-sm text-gray-700">Show reviews without text</span>
        </label>
      </div>
    </div>
  );
}

function StylePanel({ config, onUpdate }: PanelProps) {
  const style = config.style;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Style Options</h3>
        <p className="text-sm text-gray-500">Customize the widget appearance</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Color Scheme</label>
          <Select
            value={style.colorScheme}
            onChange={(e) => onUpdate({
              style: { ...style, colorScheme: e.target.value as 'light' | 'dark' }
            })}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Accent Color</label>
          <div className="flex gap-2">
            <input
              type="color"
              value={style.accentColor}
              onChange={(e) => onUpdate({
                style: { ...style, accentColor: e.target.value }
              })}
              className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
            />
            <Input
              value={style.accentColor}
              onChange={(e) => onUpdate({
                style: { ...style, accentColor: e.target.value }
              })}
              placeholder="#ee5f64"
              className="flex-1"
            />
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-3">Custom CSS</h4>
          <textarea
            value={style.customCss}
            onChange={(e) => onUpdate({
              style: { ...style, customCss: e.target.value }
            })}
            placeholder=".rc-widget { /* your styles */ }"
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#ee5f64] focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">Advanced: Add custom CSS to override widget styles</p>
        </div>
      </div>
    </div>
  );
}

function SettingsPanel({ config, onUpdate }: PanelProps) {
  const settings = config.settings;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Advanced Settings</h3>
        <p className="text-sm text-gray-500">Configure advanced options</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
          <Select
            value={settings.language}
            onChange={(e) => onUpdate({
              settings: { ...settings, language: e.target.value }
            })}
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
          </Select>
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.autoTranslate}
            onChange={(e) => onUpdate({
              settings: { ...settings, autoTranslate: e.target.checked }
            })}
            className="rounded border-gray-300"
          />
          <span className="text-sm text-gray-700">Auto-translate reviews</span>
        </label>

        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-3">External Links</h4>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.externalLinks.enabled}
                onChange={(e) => onUpdate({
                  settings: { ...settings, externalLinks: { ...settings.externalLinks, enabled: e.target.checked } }
                })}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Enable external links</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.externalLinks.openInNewTab}
                onChange={(e) => onUpdate({
                  settings: { ...settings, externalLinks: { ...settings.externalLinks, openInNewTab: e.target.checked } }
                })}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Open in new tab</span>
            </label>
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-3">SEO Schema</h4>
          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.schema.enabled}
                onChange={(e) => onUpdate({
                  settings: { ...settings, schema: { ...settings.schema, enabled: e.target.checked } }
                })}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Generate Schema.org JSON-LD</span>
            </label>
            <p className="text-xs text-gray-500">
              Note: Schema inside an iframe won&apos;t help SEO. Copy the generated snippet to your page.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Widget Preview Component
// =============================================================================

function WidgetPreview({ config }: { config: WidgetConfig }) {
  // Mock reviews for preview
  const mockReviews = [
    { id: '1', authorName: 'John Smith', rating: 5, text: 'Excellent service! Highly recommend to anyone looking for quality work.', date: '2 days ago' },
    { id: '2', authorName: 'Sarah Johnson', rating: 5, text: 'Very professional team. They went above and beyond my expectations.', date: '1 week ago' },
    { id: '3', authorName: 'Mike Davis', rating: 4, text: 'Great experience overall. Would use again for future projects.', date: '2 weeks ago' },
  ];

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={cn(
              'w-4 h-4',
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            )}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <div className={cn(
      'transition-colors',
      config.style.colorScheme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
    )}>
      {/* Header */}
      {config.header.enabled && (
        <div className="text-center mb-6">
          {config.header.title && (
            <h2 className="text-2xl font-bold mb-2">{config.header.title}</h2>
          )}
          {config.header.showRatingSummary && (
            <div className="flex items-center justify-center gap-2 mb-2">
              {renderStars(5)}
              <span className="font-semibold">4.9</span>
              {config.header.showReviewCount && (
                <span className="text-gray-500">based on 127 reviews</span>
              )}
            </div>
          )}
          {config.header.writeReviewButton.enabled && (
            <Button 
              variant="primary" 
              size="sm"
              style={{ backgroundColor: config.style.accentColor }}
            >
              {config.header.writeReviewButton.text}
            </Button>
          )}
        </div>
      )}

      {/* Reviews */}
      <div className="grid gap-4" style={{ 
        gridTemplateColumns: config.layout.columns === 'auto' 
          ? 'repeat(auto-fit, minmax(300px, 1fr))' 
          : `repeat(${config.layout.columns}, 1fr)`,
        gap: `${config.layout.itemSpacing}px`
      }}>
        {mockReviews.map((review) => (
          <Card 
            key={review.id} 
            className={cn(
              'p-4',
              config.style.colorScheme === 'dark' ? 'bg-gray-800 border-gray-700' : ''
            )}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold">
                {review.authorName.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{review.authorName}</span>
                  <span className="text-sm text-gray-500">{review.date}</span>
                </div>
                {renderStars(review.rating)}
                <p className={cn(
                  'mt-2 text-sm',
                  config.style.colorScheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                )}>
                  {review.text}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Navigation */}
      {config.layout.navigation.dots && (
        <div className="flex justify-center gap-2 mt-4">
          <div 
            className="w-2 h-2 rounded-full" 
            style={{ backgroundColor: config.style.accentColor }} 
            aria-hidden="true"
          />
          <div className="w-2 h-2 rounded-full bg-gray-300" aria-hidden="true" />
          <div className="w-2 h-2 rounded-full bg-gray-300" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}
