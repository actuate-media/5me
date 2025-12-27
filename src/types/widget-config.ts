import { z } from 'zod';

// =============================================================================
// WIDGET CONFIG SCHEMA - Version 1
// =============================================================================

export const WIDGET_CONFIG_VERSION = 1;

// -----------------------------------------------------------------------------
// Source Configuration (Reviews Data)
// -----------------------------------------------------------------------------

export const WidgetSourceLocationSchema = z.object({
  placeId: z.string(),
  label: z.string().optional(),
  provider: z.enum(['google', 'facebook', 'yelp']).default('google'),
  enabled: z.boolean().default(true),
});

export const WidgetSourceSchema = z.object({
  locations: z.array(WidgetSourceLocationSchema).default([]),
  syncEnabled: z.boolean().default(true),
}).default(() => ({
  locations: [],
  syncEnabled: true,
}));

// -----------------------------------------------------------------------------
// Layout Configuration - Autoplay
// -----------------------------------------------------------------------------

const AutoplaySchema = z.object({
  enabled: z.boolean().default(false),
  interval: z.number().min(1000).max(30000).default(5000),
  pauseOnHover: z.boolean().default(true),
}).default(() => ({
  enabled: false,
  interval: 5000,
  pauseOnHover: true,
}));

// -----------------------------------------------------------------------------
// Layout Configuration - Navigation
// -----------------------------------------------------------------------------

const NavigationSchema = z.object({
  arrows: z.boolean().default(true),
  dots: z.boolean().default(true),
  swipe: z.boolean().default(true),
}).default(() => ({
  arrows: true,
  dots: true,
  swipe: true,
}));

// -----------------------------------------------------------------------------
// Layout Configuration
// -----------------------------------------------------------------------------

export const WidgetLayoutTypeSchema = z.enum([
  'carousel',
  'grid',
  'masonry',
  'list',
  'slider',
  'badge',
  // Coming soon:
  // 'compact-badge',
  // 'reviews-button',
  // 'review-request',
]);

export type WidgetLayoutType = z.infer<typeof WidgetLayoutTypeSchema>;

export const WidgetLayoutSchema = z.object({
  type: WidgetLayoutTypeSchema.default('carousel'),
  width: z.union([z.number(), z.literal('auto'), z.literal('responsive')]).default('responsive'),
  columns: z.union([z.number().min(1).max(6), z.literal('auto')]).default('auto'),
  rowsDesktop: z.number().min(1).max(10).default(1),
  rowsMobile: z.number().min(1).max(10).default(1),
  itemSpacing: z.number().min(0).max(100).default(16),
  scrollMode: z.enum(['item', 'page']).default('item'),
  animation: z.enum(['slide', 'fade']).default('slide'),
  autoplay: AutoplaySchema,
  navigation: NavigationSchema,
}).default(() => ({
  type: 'carousel' as const,
  width: 'responsive' as const,
  columns: 'auto' as const,
  rowsDesktop: 1,
  rowsMobile: 1,
  itemSpacing: 16,
  scrollMode: 'item' as const,
  animation: 'slide' as const,
  autoplay: { enabled: false, interval: 5000, pauseOnHover: true },
  navigation: { arrows: true, dots: true, swipe: true },
}));

// -----------------------------------------------------------------------------
// Header Configuration - Write Review Button
// -----------------------------------------------------------------------------

const WriteReviewButtonSchema = z.object({
  enabled: z.boolean().default(true),
  text: z.string().default('Write a Review'),
  url: z.string().optional(),
}).default(() => ({
  enabled: true,
  text: 'Write a Review',
  url: undefined,
}));

// -----------------------------------------------------------------------------
// Header Configuration
// -----------------------------------------------------------------------------

export const WidgetHeaderSchema = z.object({
  enabled: z.boolean().default(true),
  title: z.string().default('What Our Customers Say'),
  showRatingSummary: z.boolean().default(true),
  showReviewCount: z.boolean().default(true),
  writeReviewButton: WriteReviewButtonSchema,
}).default(() => ({
  enabled: true,
  title: 'What Our Customers Say',
  showRatingSummary: true,
  showReviewCount: true,
  writeReviewButton: { enabled: true, text: 'Write a Review', url: undefined },
}));

// -----------------------------------------------------------------------------
// Reviews Filtering Configuration
// -----------------------------------------------------------------------------

export const WidgetReviewsFilterSchema = z.object({
  minRating: z.number().min(1).max(5).default(1),
  maxReviews: z.union([z.number().min(1).max(100), z.literal('all')]).default('all'),
  showWithoutText: z.boolean().default(false),
  sortBy: z.enum(['newest', 'highest', 'lowest']).default('newest'),
  includeFilters: z.array(z.object({
    type: z.enum(['author', 'text', 'tag']),
    value: z.string(),
  })).default([]),
  excludeFilters: z.array(z.object({
    type: z.enum(['author', 'text', 'tag']),
    value: z.string(),
  })).default([]),
}).default(() => ({
  minRating: 1,
  maxReviews: 'all' as const,
  showWithoutText: false,
  sortBy: 'newest' as const,
  includeFilters: [],
  excludeFilters: [],
}));

// -----------------------------------------------------------------------------
// Style Configuration
// -----------------------------------------------------------------------------

export const WidgetElementStyleSchema = z.object({
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
  borderRadius: z.number().optional(),
  borderColor: z.string().optional(),
  borderWidth: z.number().optional(),
}).default(() => ({}));

const StarsStyleSchema = z.object({
  filledColor: z.string().default('#fbbf24'),
  emptyColor: z.string().default('#e5e7eb'),
}).default(() => ({
  filledColor: '#fbbf24',
  emptyColor: '#e5e7eb',
}));

const LinksStyleSchema = z.object({
  color: z.string().optional(),
  hoverColor: z.string().optional(),
}).default(() => ({}));

const ElementsSchema = z.object({
  background: WidgetElementStyleSchema,
  card: WidgetElementStyleSchema,
  title: WidgetElementStyleSchema,
  stars: StarsStyleSchema,
  button: WidgetElementStyleSchema,
  links: LinksStyleSchema,
}).default(() => ({
  background: {},
  card: {},
  title: {},
  stars: { filledColor: '#fbbf24', emptyColor: '#e5e7eb' },
  button: {},
  links: {},
}));

export const WidgetStyleSchema = z.object({
  colorScheme: z.enum(['light', 'dark']).default('light'),
  accentColor: z.string().default('#ee5f64'),
  fontFamily: z.string().optional(),
  elements: ElementsSchema,
  customCss: z.string().default(''),
}).default(() => ({
  colorScheme: 'light' as const,
  accentColor: '#ee5f64',
  fontFamily: undefined,
  elements: {
    background: {},
    card: {},
    title: {},
    stars: { filledColor: '#fbbf24', emptyColor: '#e5e7eb' },
    button: {},
    links: {},
  },
  customCss: '',
}));

// -----------------------------------------------------------------------------
// Settings Configuration
// -----------------------------------------------------------------------------

const ExternalLinksSchema = z.object({
  enabled: z.boolean().default(true),
  openInNewTab: z.boolean().default(true),
}).default(() => ({
  enabled: true,
  openInNewTab: true,
}));

const SchemaOrgSchema = z.object({
  enabled: z.boolean().default(true),
  type: z.enum(['aggregate', 'individual']).default('aggregate'),
}).default(() => ({
  enabled: true,
  type: 'aggregate' as const,
}));

export const WidgetSettingsSchema = z.object({
  language: z.string().default('en'),
  autoTranslate: z.boolean().default(false),
  externalLinks: ExternalLinksSchema,
  ratingFormat: z.enum(['decimal', 'integer']).default('decimal'),
  schema: SchemaOrgSchema,
  customJs: z.string().default(''),
}).default(() => ({
  language: 'en',
  autoTranslate: false,
  externalLinks: { enabled: true, openInNewTab: true },
  ratingFormat: 'decimal' as const,
  schema: { enabled: true, type: 'aggregate' as const },
  customJs: '',
}));

// -----------------------------------------------------------------------------
// Complete Widget Config
// -----------------------------------------------------------------------------

export const WidgetConfigSchema = z.object({
  version: z.number().default(WIDGET_CONFIG_VERSION),
  source: WidgetSourceSchema,
  layout: WidgetLayoutSchema,
  header: WidgetHeaderSchema,
  reviews: WidgetReviewsFilterSchema,
  style: WidgetStyleSchema,
  settings: WidgetSettingsSchema,
});

// -----------------------------------------------------------------------------
// TypeScript Types (inferred from Zod schemas)
// -----------------------------------------------------------------------------

export type WidgetSourceLocation = z.infer<typeof WidgetSourceLocationSchema>;
export type WidgetSource = z.infer<typeof WidgetSourceSchema>;
export type WidgetLayout = z.infer<typeof WidgetLayoutSchema>;
export type WidgetHeader = z.infer<typeof WidgetHeaderSchema>;
export type WidgetReviewsFilter = z.infer<typeof WidgetReviewsFilterSchema>;
export type WidgetElementStyle = z.infer<typeof WidgetElementStyleSchema>;
export type WidgetStyle = z.infer<typeof WidgetStyleSchema>;
export type WidgetSettings = z.infer<typeof WidgetSettingsSchema>;
export type WidgetConfig = z.infer<typeof WidgetConfigSchema>;

// -----------------------------------------------------------------------------
// Template Presets
// -----------------------------------------------------------------------------

export type WidgetTemplate = {
  name: string;
  description: string;
  thumbnail: string;
  config: Partial<WidgetConfig>;
};

export const WIDGET_TEMPLATES: Record<string, WidgetTemplate> = {
  carousel: {
    name: 'Carousel',
    description: 'Rotating reviews slider with navigation arrows',
    thumbnail: '/assets/widget-templates/carousel.png',
    config: {
      layout: {
        type: 'carousel',
        width: 'responsive',
        columns: 'auto',
        rowsDesktop: 1,
        rowsMobile: 1,
        itemSpacing: 16,
        scrollMode: 'item',
        animation: 'slide',
        autoplay: { enabled: true, interval: 5000, pauseOnHover: true },
        navigation: { arrows: true, dots: true, swipe: true },
      },
    },
  },
  grid: {
    name: 'Grid',
    description: 'Display reviews in a responsive grid layout',
    thumbnail: '/assets/widget-templates/grid.png',
    config: {
      layout: {
        type: 'grid',
        width: 'responsive',
        columns: 3,
        rowsDesktop: 2,
        rowsMobile: 1,
        itemSpacing: 16,
        scrollMode: 'page',
        animation: 'slide',
        autoplay: { enabled: false, interval: 5000, pauseOnHover: true },
        navigation: { arrows: true, dots: true, swipe: true },
      },
    },
  },
  masonry: {
    name: 'Masonry',
    description: 'Pinterest-style staggered grid layout',
    thumbnail: '/assets/widget-templates/masonry.png',
    config: {
      layout: {
        type: 'masonry',
        width: 'responsive',
        columns: 4,
        rowsDesktop: 3,
        rowsMobile: 2,
        itemSpacing: 16,
        scrollMode: 'page',
        animation: 'fade',
        autoplay: { enabled: false, interval: 5000, pauseOnHover: true },
        navigation: { arrows: false, dots: false, swipe: true },
      },
    },
  },
  list: {
    name: 'List',
    description: 'Simple vertical list of reviews',
    thumbnail: '/assets/widget-templates/list.png',
    config: {
      layout: {
        type: 'list',
        width: 'responsive',
        columns: 1,
        rowsDesktop: 5,
        rowsMobile: 3,
        itemSpacing: 12,
        scrollMode: 'page',
        animation: 'slide',
        autoplay: { enabled: false, interval: 5000, pauseOnHover: true },
        navigation: { arrows: false, dots: true, swipe: true },
      },
    },
  },
  slider: {
    name: 'Slider',
    description: 'Full-width single review at a time',
    thumbnail: '/assets/widget-templates/slider.png',
    config: {
      layout: {
        type: 'slider',
        width: 'responsive',
        columns: 1,
        rowsDesktop: 1,
        rowsMobile: 1,
        itemSpacing: 0,
        scrollMode: 'item',
        animation: 'fade',
        autoplay: { enabled: true, interval: 4000, pauseOnHover: true },
        navigation: { arrows: true, dots: true, swipe: true },
      },
    },
  },
  badge: {
    name: 'Card Badge',
    description: 'Compact rating badge for headers or sidebars',
    thumbnail: '/assets/widget-templates/badge.png',
    config: {
      layout: {
        type: 'badge',
        width: 300,
        columns: 1,
        rowsDesktop: 1,
        rowsMobile: 1,
        itemSpacing: 0,
        scrollMode: 'item',
        animation: 'fade',
        autoplay: { enabled: false, interval: 5000, pauseOnHover: true },
        navigation: { arrows: false, dots: false, swipe: false },
      },
      header: {
        enabled: true,
        title: '',
        showRatingSummary: true,
        showReviewCount: true,
        writeReviewButton: { enabled: false, text: 'Write a Review', url: undefined },
      },
    },
  },
};

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

/**
 * Create a default widget config, optionally based on a template
 */
export function createDefaultWidgetConfig(template: keyof typeof WIDGET_TEMPLATES = 'carousel'): WidgetConfig {
  const baseConfig = WidgetConfigSchema.parse({});
  const templateConfig = WIDGET_TEMPLATES[template]?.config || {};
  
  return {
    ...baseConfig,
    ...templateConfig,
    layout: { ...baseConfig.layout, ...templateConfig.layout },
    header: { ...baseConfig.header, ...templateConfig.header },
    reviews: { ...baseConfig.reviews, ...templateConfig.reviews },
    style: { ...baseConfig.style, ...templateConfig.style },
    settings: { ...baseConfig.settings, ...templateConfig.settings },
  } as WidgetConfig;
}

/**
 * Parse and validate a widget config from JSON (e.g., from database)
 */
export function parseWidgetConfig(data: unknown): WidgetConfig {
  return WidgetConfigSchema.parse(data);
}

/**
 * Safe parse - returns default config on failure
 */
export function safeParseWidgetConfig(data: unknown): WidgetConfig {
  const result = WidgetConfigSchema.safeParse(data);
  if (result.success) {
    return result.data;
  }
  console.warn('Failed to parse widget config, using defaults:', result.error);
  return createDefaultWidgetConfig();
}
