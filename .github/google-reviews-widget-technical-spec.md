# Google Reviews Widget Builder - Technical Specification

**Project:** Google Reviews Widget Platform  
**Client:** Actuate Media  
**Tech Stack:** Next.js 14+, TypeScript, Prisma, PostgreSQL, Vercel Blob  
**Version:** 1.0  
**Date:** December 2024  

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Database Schema](#database-schema)
4. [Widget Builder Interface](#widget-builder-interface)
5. [Frontend Widget Component](#frontend-widget-component)
6. [Google Places API Integration](#google-places-api-integration)
7. [Embed Script System](#embed-script-system)
8. [Performance Optimization](#performance-optimization)
9. [Implementation Roadmap](#implementation-roadmap)
10. [Testing & QA](#testing--qa)

---

## Executive Summary

### Project Goal
Build a white-label Google Reviews widget platform similar to Elfsight but optimized for:
- **Performance:** No conflicts with WP Rocket or caching plugins
- **Speed:** Faster load times with optimized asset delivery
- **Flexibility:** Multiple layout options and deep customization
- **Scalability:** Support multiple client GMB accounts

### Core Features
- Visual widget builder with live preview
- Google Places API integration for review fetching
- Daily automated review syncing
- Multiple layout options (Carousel, Grid, Masonry, List, Slider, Card Badge)
- Embed script generation for easy client integration
- Review filtering (min rating, keyword, date range)
- Full style customization
- Multi-language support with auto-translation
- Schema.org markup for SEO

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Websites                         │
│                   (Embedded Widgets)                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              CDN (Vercel Edge Network)                      │
│         - Widget JS Bundle (widget.js)                      │
│         - CSS Styles (widget.css)                           │
│         - Cached Review Data (JSON)                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│           Next.js Application (Vercel)                      │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐  │
│  │ Widget Builder │  │  Public API    │  │  Admin Panel │  │
│  │   Interface    │  │  /api/widgets  │  │              │  │
│  └────────────────┘  └────────────────┘  └──────────────┘  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  Background Jobs (Cron)                     │
│         - Daily Review Sync                                 │
│         - Image Optimization                                │
│         - Cache Invalidation                                │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        ▼                             ▼
┌──────────────────┐         ┌────────────────────┐
│  PostgreSQL DB   │         │   Vercel Blob      │
│  (Prisma)        │         │   (Images)         │
│  - Widgets       │         │   - Profile Pics   │
│  - Reviews       │         │   - Logos          │
│  - GMB Accounts  │         └────────────────────┘
│  - Clients       │
└──────────────────┘
        │
        ▼
┌──────────────────┐
│ Google Places    │
│     API          │
└──────────────────┘
```

### Tech Stack Details

**Frontend:**
- Next.js 14+ (App Router)
- TypeScript 5+
- Tailwind CSS 3+
- shadcn/ui components
- React Hook Form + Zod validation
- Zustand (state management)
- Embla Carousel (carousel functionality)

**Backend:**
- Next.js API Routes (serverless)
- Prisma ORM
- PostgreSQL (separate database from main Actuate Media DB)
- Vercel Blob Storage
- Vercel Cron Jobs

**External Services:**
- Google Places API (New) for review fetching
- Google Cloud Translation API (optional, for auto-translate)

---

## Database Schema

### Prisma Schema

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Client accounts (Actuate Media clients)
model Client {
  id            String   @id @default(cuid())
  name          String
  email         String   @unique
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  gmbAccounts   GMBAccount[]
  widgets       Widget[]
  
  @@index([email])
}

// Google My Business Accounts
model GMBAccount {
  id            String   @id @default(cuid())
  clientId      String
  businessName  String
  businessAddress String?
  placeId       String   @unique  // Google Place ID
  googleMapsUrl String?
  
  rating        Float    @default(0)
  totalReviews  Int      @default(0)
  
  lastSyncedAt  DateTime?
  syncEnabled   Boolean  @default(true)
  syncFrequency String   @default("daily") // daily, weekly, manual
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  client        Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)
  reviews       Review[]
  widgets       Widget[]
  
  @@index([clientId])
  @@index([placeId])
}

// Reviews
model Review {
  id              String   @id @default(cuid())
  gmbAccountId    String
  
  // Review data from Google
  googleReviewId  String   @unique
  authorName      String
  authorPhotoUrl  String?
  authorPhotoBlob String?  // Vercel Blob URL
  rating          Int      // 1-5
  text            String?  @db.Text
  timeCreated     DateTime
  
  // Translation (if enabled)
  translatedText  String?  @db.Text
  translatedLang  String?
  
  // Metadata
  isVerified      Boolean  @default(false)
  isHidden        Boolean  @default(false)  // Manual hide by client
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  gmbAccount      GMBAccount @relation(fields: [gmbAccountId], references: [id], onDelete: Cascade)
  
  @@index([gmbAccountId])
  @@index([rating])
  @@index([timeCreated])
}

// Widget Configurations
model Widget {
  id              String   @id @default(cuid())
  clientId        String
  gmbAccountId    String
  name            String   // e.g., "Homepage Reviews"
  
  // Source Settings
  aiSummaryEnabled Boolean @default(false)
  
  // Layout Settings
  layout          String   @default("carousel") // carousel, grid, masonry, list, slider, card-badge
  width           String   @default("1268px")
  columns         String   @default("auto")
  rows            Int      @default(1)
  rowsMobile      Int      @default(1)
  itemSpacing     String   @default("20px")
  autoPlay        Boolean  @default(false)
  animation       String   @default("slide")
  scrollMode      String   @default("scroll-per-item")
  
  // Header Settings
  showHeader      Boolean  @default(true)
  headerStyle     String   @default("default")
  showHeading     Boolean  @default(true)
  showRating      Boolean  @default(true)
  showReviewCount Boolean  @default(true)
  showWriteButton Boolean  @default(true)
  widgetTitle     String   @default("What Our Customers Say")
  
  // Review Settings
  reviewStyle     String   @default("default")
  reviewSourceStyle String @default("default")
  minRating       Int      @default(1) // Filter: only show reviews >= this rating
  maxReviews      Int?     // Limit number of reviews displayed
  
  // Style Settings
  colorScheme     String   @default("light") // light, dark
  accentColor     String   @default("#4285F4")
  fontFamily      String   @default("default")
  customCSS       String?  @db.Text
  
  // Settings
  language        String   @default("en")
  autoTranslate   Boolean  @default(false)
  enableSchemaOrg Boolean  @default(true)
  enableExternalLinks Boolean @default(true)
  openLinksNewTab Boolean  @default(true)
  ratingFormat    String   @default("5.0")
  customJS        String?  @db.Text
  
  // Embed Info
  embedCode       String   @db.Text
  isPublished     Boolean  @default(false)
  
  // Metadata
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  client          Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)
  gmbAccount      GMBAccount @relation(fields: [gmbAccountId], references: [id], onDelete: Cascade)
  
  @@index([clientId])
  @@index([gmbAccountId])
}

// Analytics (future feature)
model WidgetAnalytics {
  id          String   @id @default(cuid())
  widgetId    String
  
  impressions Int      @default(0)
  clicks      Int      @default(0)
  date        DateTime @default(now())
  
  @@index([widgetId, date])
}
```

---

## Widget Builder Interface

### Component Structure

```
/app
  /dashboard
    /layout.tsx                 # Dashboard layout with sidebar
    /page.tsx                   # Dashboard home
    /widgets
      /page.tsx                 # Widget list
      /new
        /page.tsx               # Create new widget
      /[id]
        /edit
          /page.tsx             # Edit widget (main builder)
          /_components
            /BuilderSidebar.tsx      # Left sidebar with tabs
            /WidgetPreview.tsx       # Live preview panel
            /SourceTab.tsx           # Source configuration
            /LayoutTab.tsx           # Layout options
            /HeaderTab.tsx           # Header settings
            /ReviewTab.tsx           # Review styling
            /StyleTab.tsx            # Color/font customization
            /SettingsTab.tsx         # General settings
```

### Builder Interface Requirements

#### 1. Sidebar Navigation (Left Panel - 244px width)

**Tabs (Icon + Label):**
- Source (🔗 icon)
- Layout (📐 icon)
- Header (📝 icon)
- Review (⭐ icon)
- Style (🎨 icon)
- Settings (⚙️ icon)

**Top Actions:**
- Widget Name (editable inline)
- Save Status Indicator
- Preview/Edit toggle

**Bottom Actions:**
- Help (? icon)
- Publish Button (green)
- Close Button

#### 2. Source Tab

**Business Search:**
```tsx
interface SourceSettings {
  businessName: string;
  businessAddress?: string;
  googleMapsUrl?: string;
  placeId?: string; // Auto-populated after search
  
  // AI Features
  aiSummaryEnabled: boolean;
  
  // Filters
  filters: {
    minRating: number; // 1-5
    dateRange?: { start: Date; end: Date };
    keywords?: string[];
  };
  
  // Sorting
  sorting: 'newest' | 'oldest' | 'highest-rated' | 'lowest-rated';
}
```

**UI Components:**
- Search input with autocomplete (Google Places Autocomplete API)
- Business info card (once connected)
- AI Summary toggle
- Expandable "Filters" section
- Expandable "Sorting" section

#### 3. Layout Tab

**Layout Options (Visual Selector):**
```tsx
interface LayoutSettings {
  layout: 'carousel' | 'grid' | 'masonry' | 'list' | 'slider' | 'card-badge';
  
  // Customize Layout Section
  width: string; // e.g., "1268px", "100%"
  columns: 'auto' | number;
  rows: number;
  rowsMobile: number;
  itemSpacing: string; // e.g., "20px"
  
  // Animation
  autoPlay: boolean;
  animation: 'slide' | 'fade' | 'none';
  scrollMode: 'scroll-per-item' | 'scroll-free';
  
  // Navigation (expandable)
  pagination: {
    enabled: boolean;
    position: 'below' | 'inside';
    style: 'dots' | 'numbers';
  };
  
  navigationArrows: {
    enabled: boolean;
    position: 'sides' | 'bottom';
    style: 'default' | 'custom';
  };
  
  swipeNavigation: {
    enabled: boolean;
  };
}
```

**UI Components:**
- Layout thumbnails (6 options)
- "See All Layouts" link
- Width input with unit selector (px, %, vw)
- Columns dropdown (auto, 1-6)
- Rows number input
- Item Spacing input with unit
- Toggle switches for Auto Play, etc.
- Expandable sections: Pagination, Navigation Arrows, Swipe Navigation

#### 4. Header Tab

```tsx
interface HeaderSettings {
  showHeader: boolean;
  
  // Style selector (carousel of options)
  headerStyle: string;
  
  // Elements
  elements: {
    heading: boolean;
    rating: boolean;
    numberOfReviews: boolean;
    writeReviewButton: boolean;
  };
  
  // Widget Title
  widgetTitleEnabled: boolean;
  widgetTitle: string;
  widgetTitleTag?: 'h1' | 'h2' | 'h3' | 'h4';
}
```

**UI Components:**
- Show Header toggle
- Style carousel (visual previews)
- Element checkboxes with icons
- Widget Title toggle + text input
- Optional: Title tag selector (accessibility)

#### 5. Review Tab

```tsx
interface ReviewSettings {
  // Review Card Style
  reviewStyle: string; // carousel of style options
  
  // Review Source Style
  reviewSourceStyle: string; // carousel of source badge styles
  
  // Advanced customization
  showReviewText: boolean;
  textTruncate: number | null; // characters before "Read more"
  showReadMore: boolean;
  showReviewDate: boolean;
  dateFormat: 'relative' | 'absolute'; // "1 year ago" vs "Dec 2023"
  showVerifiedBadge: boolean;
}
```

**UI Components:**
- Review Style carousel
- Review Source Style carousel
- "Customize" expandable section with advanced options

#### 6. Style Tab

```tsx
interface StyleSettings {
  // Color Scheme
  colorScheme: 'light' | 'dark';
  
  // Accent Color
  accentColor: string; // hex color
  
  // Font
  fontFamily: string;
  
  // Customize Elements (expandable sections)
  background: {
    color?: string;
    transparency?: number;
  };
  
  widgetTitle: {
    color?: string;
    fontSize?: string;
    fontWeight?: number;
  };
  
  header: {
    backgroundColor?: string;
    textColor?: string;
  };
  
  rating: {
    starColor?: string;
    textColor?: string;
  };
  
  review: {
    backgroundColor?: string;
    textColor?: string;
    borderRadius?: string;
    shadow?: boolean;
  };
  
  navigationArrows: {
    color?: string;
    backgroundColor?: string;
    borderRadius?: string;
  };
  
  pagination: {
    activeColor?: string;
    inactiveColor?: string;
  };
  
  // Custom CSS
  customCSS?: string;
}
```

**UI Components:**
- Light/Dark toggle buttons
- Color picker grid (preset colors + custom)
- Font dropdown (Google Fonts integration)
- Expandable sections for each element
- Custom CSS code editor (Monaco Editor)

#### 7. Settings Tab

```tsx
interface WidgetSettings {
  // Language
  language: string; // ISO code
  editTexts?: Record<string, string>; // Custom text overrides
  
  // Translation
  autoTranslate: boolean;
  
  // Schema.org (expandable)
  schemaOrgEnabled: boolean;
  schemaOrgConfig?: {
    businessType?: string;
    priceRange?: string;
  };
  
  // Links
  enableExternalLinks: boolean;
  openLinksInNewTab: boolean;
  
  // Rating Format
  ratingFormat: 'integer' | 'decimal'; // "5" vs "5.0"
  
  // Custom JS
  customJS?: string;
}
```

**UI Components:**
- Language dropdown (multi-language support)
- "Edit Texts" button (opens modal for text overrides)
- Auto-translate toggle with info tooltip
- Schema.org expandable section
- Link behavior toggles
- Rating Format selector
- Custom JS code editor

---

### Preview Panel (Right Side)

**Requirements:**
- Real-time updates as settings change
- Responsive preview toggle (Desktop/Tablet/Mobile)
- Device frame wrapper for visual context
- "Preview" and "Copy Embed Code" buttons at top
- Scrollable if widget exceeds viewport

**Implementation:**
```tsx
// _components/WidgetPreview.tsx

interface WidgetPreviewProps {
  widgetConfig: WidgetConfig;
  reviews: Review[];
}

export function WidgetPreview({ widgetConfig, reviews }: WidgetPreviewProps) {
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  
  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex gap-2">
          <Button 
            variant={previewMode === 'desktop' ? 'default' : 'outline'}
            onClick={() => setPreviewMode('desktop')}
          >
            Desktop
          </Button>
          <Button 
            variant={previewMode === 'tablet' ? 'default' : 'outline'}
            onClick={() => setPreviewMode('tablet')}
          >
            Tablet
          </Button>
          <Button 
            variant={previewMode === 'mobile' ? 'default' : 'outline'}
            onClick={() => setPreviewMode('mobile')}
          >
            Mobile
          </Button>
        </div>
        
        <Button variant="outline" onClick={handleCopyEmbedCode}>
          Copy Embed Code
        </Button>
      </div>
      
      {/* Preview Frame */}
      <div className="flex-1 overflow-auto bg-gray-50 p-8">
        <div 
          className={cn(
            "mx-auto bg-white",
            previewMode === 'desktop' && "max-w-[1400px]",
            previewMode === 'tablet' && "max-w-[768px]",
            previewMode === 'mobile' && "max-w-[375px]"
          )}
        >
          {/* Actual widget rendered here */}
          <ReviewWidget config={widgetConfig} reviews={reviews} />
        </div>
      </div>
    </div>
  );
}
```

---

## Frontend Widget Component

### Widget Architecture

The widget must be:
1. **Standalone** - Works independently on any website
2. **Performant** - Minimal bundle size, lazy loading
3. **Responsive** - Adapts to container width
4. **Customizable** - Respects all configuration options
5. **Accessible** - WCAG 2.1 AA compliant
6. **SEO-Friendly** - Schema.org markup

### Component Structure

```
/widget
  /dist
    /widget.js          # Main widget bundle (minified)
    /widget.css         # Styles (minified)
  /src
    /core
      /Widget.tsx       # Main widget component
      /WidgetLoader.tsx # Initialization script
    /layouts
      /CarouselLayout.tsx
      /GridLayout.tsx
      /MasonryLayout.tsx
      /ListLayout.tsx
      /SliderLayout.tsx
      /CardBadgeLayout.tsx
    /components
      /ReviewCard.tsx
      /Header.tsx
      /Navigation.tsx
      /Pagination.tsx
      /StarRating.tsx
      /VerifiedBadge.tsx
      /ReadMoreButton.tsx
    /hooks
      /useReviews.ts
      /useCarousel.ts
      /useResponsive.ts
    /lib
      /api.ts           # Fetch widget config + reviews
      /utils.ts
    /types
      /index.ts
```

### Main Widget Component

```tsx
// widget/src/core/Widget.tsx

import { useEffect, useState } from 'react';
import { WidgetConfig, Review } from '../types';
import { CarouselLayout } from '../layouts/CarouselLayout';
import { GridLayout } from '../layouts/GridLayout';
// ... other layouts

interface WidgetProps {
  widgetId: string;
  config?: WidgetConfig; // Optional: pre-loaded config
  reviews?: Review[];    // Optional: pre-loaded reviews
}

export function Widget({ widgetId, config: initialConfig, reviews: initialReviews }: WidgetProps) {
  const [config, setConfig] = useState<WidgetConfig | null>(initialConfig || null);
  const [reviews, setReviews] = useState<Review[]>(initialReviews || []);
  const [loading, setLoading] = useState(!initialConfig);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialConfig && initialReviews) return; // Already loaded

    // Fetch widget config and reviews
    fetch(`/api/widgets/${widgetId}/data`)
      .then(res => res.json())
      .then(data => {
        setConfig(data.config);
        setReviews(data.reviews);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load reviews');
        setLoading(false);
      });
  }, [widgetId, initialConfig, initialReviews]);

  if (loading) return <WidgetSkeleton />;
  if (error) return <WidgetError message={error} />;
  if (!config) return null;

  // Apply filters
  const filteredReviews = reviews.filter(review => {
    if (config.minRating && review.rating < config.minRating) return false;
    return true;
  });

  // Limit reviews
  const displayReviews = config.maxReviews 
    ? filteredReviews.slice(0, config.maxReviews)
    : filteredReviews;

  // Render appropriate layout
  const LayoutComponent = getLayoutComponent(config.layout);

  return (
    <div 
      className="actuate-reviews-widget"
      data-widget-id={widgetId}
      style={{
        '--accent-color': config.accentColor,
        '--font-family': config.fontFamily !== 'default' ? config.fontFamily : undefined,
      } as React.CSSProperties}
    >
      {config.showHeader && (
        <Header 
          title={config.widgetTitle}
          rating={calculateAverageRating(reviews)}
          totalReviews={reviews.length}
          showRating={config.showRating}
          showReviewCount={config.showReviewCount}
          showWriteButton={config.showWriteButton}
          gmbUrl={config.gmbAccount.googleMapsUrl}
        />
      )}
      
      <LayoutComponent 
        reviews={displayReviews}
        config={config}
      />

      {config.enableSchemaOrg && (
        <script 
          type="application/ld+json"
          dangerouslySetInnerHTML={{ 
            __html: JSON.stringify(generateSchemaOrg(config, reviews))
          }}
        />
      )}
    </div>
  );
}

function getLayoutComponent(layout: string) {
  switch (layout) {
    case 'carousel': return CarouselLayout;
    case 'grid': return GridLayout;
    case 'masonry': return MasonryLayout;
    case 'list': return ListLayout;
    case 'slider': return SliderLayout;
    case 'card-badge': return CardBadgeLayout;
    default: return CarouselLayout;
  }
}
```

### Carousel Layout (Primary Implementation)

```tsx
// widget/src/layouts/CarouselLayout.tsx

import { useRef } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { ReviewCard } from '../components/ReviewCard';
import { Navigation } from '../components/Navigation';
import { Pagination } from '../components/Pagination';

interface CarouselLayoutProps {
  reviews: Review[];
  config: WidgetConfig;
}

export function CarouselLayout({ reviews, config }: CarouselLayoutProps) {
  const plugins = config.autoPlay 
    ? [Autoplay({ delay: 4000, stopOnInteraction: true })]
    : [];

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      align: 'start',
      slidesToScroll: config.scrollMode === 'scroll-per-item' ? 1 : 'auto',
      containScroll: 'trimSnaps',
      breakpoints: {
        '(min-width: 768px)': { slidesToScroll: 1 },
        '(min-width: 1024px)': { slidesToScroll: 1 },
      },
    },
    plugins
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  useEffect(() => {
    if (!emblaApi) return;

    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on('select', () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    });
  }, [emblaApi]);

  return (
    <div className="embla" style={{ width: config.width }}>
      <div className="embla__viewport" ref={emblaRef}>
        <div className="embla__container" style={{ gap: config.itemSpacing }}>
          {reviews.map((review) => (
            <div 
              key={review.id} 
              className="embla__slide"
              style={{ flex: `0 0 calc((100% - ${config.itemSpacing} * ${getVisibleSlides() - 1}) / ${getVisibleSlides()})` }}
            >
              <ReviewCard 
                review={review}
                config={config}
              />
            </div>
          ))}
        </div>
      </div>

      {config.navigationArrows?.enabled && (
        <Navigation 
          onPrev={() => emblaApi?.scrollPrev()}
          onNext={() => emblaApi?.scrollNext()}
          canScrollPrev={emblaApi?.canScrollPrev() || false}
          canScrollNext={emblaApi?.canScrollNext() || false}
          position={config.navigationArrows.position}
        />
      )}

      {config.pagination?.enabled && (
        <Pagination 
          slides={scrollSnaps}
          selectedIndex={selectedIndex}
          onDotClick={(index) => emblaApi?.scrollTo(index)}
          style={config.pagination.style}
        />
      )}
    </div>
  );

  function getVisibleSlides() {
    // Responsive breakpoints
    const width = window.innerWidth;
    if (width < 640) return 1;
    if (width < 1024) return 2;
    if (width < 1280) return 3;
    return 4;
  }
}
```

### Review Card Component

```tsx
// widget/src/components/ReviewCard.tsx

import { useState } from 'react';
import { Review, WidgetConfig } from '../types';
import { StarRating } from './StarRating';
import { VerifiedBadge } from './VerifiedBadge';
import { ReadMoreButton } from './ReadMoreButton';

interface ReviewCardProps {
  review: Review;
  config: WidgetConfig;
}

export function ReviewCard({ review, config }: ReviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const displayText = config.autoTranslate && review.translatedText
    ? review.translatedText
    : review.text;

  const shouldTruncate = displayText && displayText.length > 150;
  const truncatedText = shouldTruncate && !isExpanded
    ? displayText.substring(0, 150) + '...'
    : displayText;

  return (
    <div className="review-card">
      <div className="review-card__header">
        <img 
          src={review.authorPhotoBlob || review.authorPhotoUrl || '/default-avatar.png'}
          alt={review.authorName}
          className="review-card__avatar"
          loading="lazy"
        />
        <div className="review-card__author">
          <div className="review-card__name">
            {review.authorName}
            {review.isVerified && <VerifiedBadge />}
          </div>
          <div className="review-card__date">
            {formatDate(review.timeCreated, config.dateFormat)}
          </div>
        </div>
        <img 
          src="/google-icon.svg" 
          alt="Google" 
          className="review-card__source-icon"
        />
      </div>

      <StarRating rating={review.rating} />

      {displayText && (
        <div className="review-card__text">
          {truncatedText}
          {shouldTruncate && (
            <ReadMoreButton 
              isExpanded={isExpanded}
              onClick={() => setIsExpanded(!isExpanded)}
            />
          )}
        </div>
      )}
    </div>
  );
}

function formatDate(date: Date, format: 'relative' | 'absolute'): string {
  if (format === 'relative') {
    return formatRelativeTime(date);
  }
  return new Intl.DateTimeFormat('en-US', { 
    month: 'short', 
    year: 'numeric' 
  }).format(new Date(date));
}
```

---

## Google Places API Integration

### API Setup

1. **Enable Google Places API (New)**
2. **Enable Google Cloud Translation API** (optional)
3. **Create API Key** with restrictions:
   - Application restrictions: IP addresses (your server IPs)
   - API restrictions: Places API (New), Translation API

### Review Sync Service

```typescript
// lib/services/reviewSync.ts

import { prisma } from '@/lib/prisma';
import { Client } from '@googlemaps/google-maps-services-js';
import { put } from '@vercel/blob';

const googleMapsClient = new Client({});

export async function syncGMBReviews(gmbAccountId: string) {
  const gmbAccount = await prisma.gMBAccount.findUnique({
    where: { id: gmbAccountId },
  });

  if (!gmbAccount || !gmbAccount.placeId) {
    throw new Error('GMB account not found or missing Place ID');
  }

  try {
    // Fetch place details with reviews
    const response = await googleMapsClient.placeDetails({
      params: {
        place_id: gmbAccount.placeId,
        fields: ['name', 'rating', 'user_ratings_total', 'reviews'],
        key: process.env.GOOGLE_PLACES_API_KEY!,
      },
    });

    const { result } = response.data;
    const reviews = result.reviews || [];

    // Update GMB account stats
    await prisma.gMBAccount.update({
      where: { id: gmbAccountId },
      data: {
        rating: result.rating || 0,
        totalReviews: result.user_ratings_total || 0,
        lastSyncedAt: new Date(),
      },
    });

    // Process each review
    for (const googleReview of reviews) {
      // Check if review already exists
      const existingReview = await prisma.review.findUnique({
        where: { googleReviewId: googleReview.author_name + googleReview.time },
      });

      if (existingReview) continue; // Skip if already synced

      // Download and store author photo to Vercel Blob
      let authorPhotoBlob: string | null = null;
      if (googleReview.profile_photo_url) {
        try {
          const photoResponse = await fetch(googleReview.profile_photo_url);
          const photoBuffer = await photoResponse.arrayBuffer();
          const blob = await put(
            `reviews/${gmbAccountId}/${Date.now()}-${googleReview.author_name}.jpg`,
            photoBuffer,
            { access: 'public' }
          );
          authorPhotoBlob = blob.url;
        } catch (err) {
          console.error('Failed to download author photo:', err);
        }
      }

      // Create review record
      await prisma.review.create({
        data: {
          gmbAccountId,
          googleReviewId: googleReview.author_name + googleReview.time,
          authorName: googleReview.author_name,
          authorPhotoUrl: googleReview.profile_photo_url,
          authorPhotoBlob,
          rating: googleReview.rating,
          text: googleReview.text || null,
          timeCreated: new Date(googleReview.time * 1000),
          isVerified: true, // All Google reviews are verified
        },
      });
    }

    console.log(`Synced ${reviews.length} reviews for GMB account ${gmbAccountId}`);
  } catch (error) {
    console.error('Error syncing reviews:', error);
    throw error;
  }
}

// Cron job to sync all accounts daily
export async function syncAllGMBAccounts() {
  const accounts = await prisma.gMBAccount.findMany({
    where: { syncEnabled: true },
  });

  for (const account of accounts) {
    try {
      await syncGMBReviews(account.id);
    } catch (err) {
      console.error(`Failed to sync account ${account.id}:`, err);
    }
  }
}
```

### Vercel Cron Job Setup

```typescript
// app/api/cron/sync-reviews/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { syncAllGMBAccounts } from '@/lib/services/reviewSync';

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await syncAllGMBAccounts();
    return NextResponse.json({ success: true, message: 'Reviews synced successfully' });
  } catch (error) {
    console.error('Cron job failed:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
```

**Vercel cron configuration (vercel.json):**
```json
{
  "crons": [
    {
      "path": "/api/cron/sync-reviews",
      "schedule": "0 2 * * *"
    }
  ]
}
```

---

## Embed Script System

### Script Generation

When a user publishes a widget, generate:

1. **Unique Widget ID** (already in database)
2. **Embed Script** with optimized loading

```typescript
// lib/embedCode.ts

export function generateEmbedCode(widgetId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  
  return `<!-- Actuate Media Reviews Widget -->
<script>
(function() {
  var script = document.createElement('script');
  script.src = '${baseUrl}/widget/loader.js';
  script.async = true;
  script.defer = true;
  script.setAttribute('data-widget-id', '${widgetId}');
  script.setAttribute('data-version', '1.0.0');
  document.head.appendChild(script);
})();
</script>
<div id="actuate-widget-${widgetId}"></div>
<!-- End Actuate Media Reviews Widget -->`;
}
```

### Widget Loader Script

```typescript
// public/widget/loader.js

(function() {
  'use strict';

  // Get widget configuration from script tag
  const currentScript = document.currentScript;
  const widgetId = currentScript.getAttribute('data-widget-id');
  const version = currentScript.getAttribute('data-version') || '1.0.0';

  if (!widgetId) {
    console.error('[Actuate Reviews] Widget ID not found');
    return;
  }

  const BASE_URL = currentScript.src.replace('/widget/loader.js', '');

  // Check if widget already loaded (prevent double-loading)
  if (window.__ACTUATE_WIDGETS__ && window.__ACTUATE_WIDGETS__[widgetId]) {
    console.warn('[Actuate Reviews] Widget already loaded:', widgetId);
    return;
  }

  // Initialize widgets tracker
  window.__ACTUATE_WIDGETS__ = window.__ACTUATE_WIDGETS__ || {};
  window.__ACTUATE_WIDGETS__[widgetId] = { loading: true };

  // Load CSS (only once)
  if (!document.getElementById('actuate-widget-styles')) {
    const link = document.createElement('link');
    link.id = 'actuate-widget-styles';
    link.rel = 'stylesheet';
    link.href = `${BASE_URL}/widget/widget.css?v=${version}`;
    document.head.appendChild(link);
  }

  // Fetch widget config and reviews
  fetch(`${BASE_URL}/api/widgets/${widgetId}/data`)
    .then(response => response.json())
    .then(data => {
      // Load React bundle (only once)
      if (!window.ActuateReactWidget) {
        return loadReactBundle().then(() => data);
      }
      return data;
    })
    .then(data => {
      // Render widget
      const container = document.getElementById(`actuate-widget-${widgetId}`);
      if (!container) {
        console.error('[Actuate Reviews] Container not found:', widgetId);
        return;
      }

      window.ActuateReactWidget.render(container, {
        widgetId,
        config: data.config,
        reviews: data.reviews,
      });

      window.__ACTUATE_WIDGETS__[widgetId] = { loaded: true };
    })
    .catch(error => {
      console.error('[Actuate Reviews] Failed to load widget:', error);
      window.__ACTUATE_WIDGETS__[widgetId] = { error: error.message };
    });

  function loadReactBundle() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `${BASE_URL}/widget/widget.js?v=${version}`;
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
})();
```

### Widget Data API

```typescript
// app/api/widgets/[id]/data/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const widgetId = params.id;

  try {
    const widget = await prisma.widget.findUnique({
      where: { id: widgetId, isPublished: true },
      include: {
        gmbAccount: {
          include: {
            reviews: {
              where: { isHidden: false },
              orderBy: { timeCreated: 'desc' },
              take: 50, // Limit to 50 most recent reviews
            },
          },
        },
      },
    });

    if (!widget) {
      return NextResponse.json(
        { error: 'Widget not found' },
        { status: 404 }
      );
    }

    // Apply filters
    let reviews = widget.gmbAccount.reviews;
    
    if (widget.minRating) {
      reviews = reviews.filter(r => r.rating >= widget.minRating!);
    }

    if (widget.maxReviews) {
      reviews = reviews.slice(0, widget.maxReviews);
    }

    // Format response
    const response = {
      config: {
        // Layout
        layout: widget.layout,
        width: widget.width,
        columns: widget.columns,
        rows: widget.rows,
        rowsMobile: widget.rowsMobile,
        itemSpacing: widget.itemSpacing,
        autoPlay: widget.autoPlay,
        animation: widget.animation,
        scrollMode: widget.scrollMode,

        // Header
        showHeader: widget.showHeader,
        headerStyle: widget.headerStyle,
        showHeading: widget.showHeading,
        showRating: widget.showRating,
        showReviewCount: widget.showReviewCount,
        showWriteButton: widget.showWriteButton,
        widgetTitle: widget.widgetTitle,

        // Style
        colorScheme: widget.colorScheme,
        accentColor: widget.accentColor,
        fontFamily: widget.fontFamily,

        // Settings
        language: widget.language,
        autoTranslate: widget.autoTranslate,
        enableSchemaOrg: widget.enableSchemaOrg,
        enableExternalLinks: widget.enableExternalLinks,
        openLinksNewTab: widget.openLinksNewTab,
        ratingFormat: widget.ratingFormat,

        // GMB Account
        gmbAccount: {
          businessName: widget.gmbAccount.businessName,
          googleMapsUrl: widget.gmbAccount.googleMapsUrl,
          rating: widget.gmbAccount.rating,
          totalReviews: widget.gmbAccount.totalReviews,
        },
      },
      reviews: reviews.map(review => ({
        id: review.id,
        authorName: review.authorName,
        authorPhotoUrl: review.authorPhotoBlob || review.authorPhotoUrl,
        rating: review.rating,
        text: review.text,
        translatedText: review.translatedText,
        timeCreated: review.timeCreated,
        isVerified: review.isVerified,
      })),
    };

    // Cache for 5 minutes
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Error fetching widget data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## Performance Optimization

### 1. Bundle Size Optimization

**Widget Bundle Requirements:**
- Total bundle size: < 50KB gzipped
- CSS: < 10KB gzipped
- Initial render: < 200ms

**Techniques:**
- Tree-shaking unused code
- Code splitting for layouts
- Lazy loading images
- Minification + compression
- Use Preact instead of React (3KB vs 40KB)

**Build Configuration:**
```javascript
// webpack.config.js for widget build

module.exports = {
  entry: './widget/src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'public/widget'),
    filename: 'widget.js',
    library: 'ActuateReactWidget',
    libraryTarget: 'umd',
  },
  externals: {
    react: 'React',
    'react-dom': 'ReactDOM',
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true,
            passes: 2,
          },
        },
      }),
    ],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
    ],
  },
};
```

### 2. Caching Strategy

**Multi-Layer Caching:**

1. **CDN Edge Caching** (Vercel Edge Network)
   - Widget scripts: 1 year (immutable with version)
   - Widget data API: 5 minutes (public, stale-while-revalidate)

2. **Browser Caching**
   - Scripts: Aggressive caching with version query param
   - Images: Long-lived cache (1 year)

3. **Database Query Optimization**
   - Index on frequently queried fields
   - Materialized views for aggregations
   - Connection pooling

**Cache Headers:**
```typescript
// For static widget assets
res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

// For widget data
res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
```

### 3. Image Optimization

**Profile Photo Handling:**
- Download from Google → Store in Vercel Blob
- Convert to WebP format
- Generate multiple sizes (48px, 96px for retina)
- Lazy load with Intersection Observer

```typescript
// lib/imageOptimization.ts

import sharp from 'sharp';
import { put } from '@vercel/blob';

export async function optimizeAndStoreProfilePhoto(
  originalUrl: string,
  gmbAccountId: string,
  authorName: string
): Promise<string> {
  // Fetch original image
  const response = await fetch(originalUrl);
  const buffer = await response.arrayBuffer();

  // Optimize with sharp
  const optimized = await sharp(Buffer.from(buffer))
    .resize(96, 96, { fit: 'cover' })
    .webp({ quality: 85 })
    .toBuffer();

  // Upload to Vercel Blob
  const blob = await put(
    `reviews/${gmbAccountId}/${Date.now()}-${slugify(authorName)}.webp`,
    optimized,
    {
      access: 'public',
      contentType: 'image/webp',
    }
  );

  return blob.url;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
```

### 4. WordPress/Caching Plugin Compatibility

**Preventing Conflicts with WP Rocket, W3 Total Cache, etc.:**

1. **Async/Defer Script Loading**
   - Scripts load asynchronously
   - Won't block page render

2. **No Inline Styles/Scripts**
   - All styles in external CSS file
   - No inline `<style>` or `<script>` tags that caching plugins might strip

3. **Client-Side Hydration**
   - Widget renders on client-side
   - Works with HTML caching

4. **Exclusion Rules Documentation**
   - Provide cache exclusion patterns for popular plugins
   - Example: Exclude `/api/widgets/*/data` from server-side caching

**Documentation for clients:**
```markdown
## WordPress Caching Plugin Configuration

### WP Rocket
Add to "Never Cache URL(s)":
- `/api/widgets/(.*)/data`

Add to "Excluded Inline JavaScript":
- `actuate-widget-`

### W3 Total Cache
Add to "Never cache the following pages":
- `/api/widgets/*/data`

### LiteSpeed Cache
Add to "Do Not Cache URIs":
- `/api/widgets/*/data`
```

### 5. Lazy Loading & Intersection Observer

```typescript
// widget/src/hooks/useLazyLoad.ts

import { useEffect, useRef, useState } from 'react';

export function useLazyLoad() {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '50px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

// Usage in ReviewCard
export function ReviewCard({ review }: ReviewCardProps) {
  const { ref, isVisible } = useLazyLoad();

  return (
    <div ref={ref} className="review-card">
      {isVisible ? (
        <img src={review.authorPhotoUrl} alt={review.authorName} />
      ) : (
        <div className="avatar-skeleton" />
      )}
      {/* ... */}
    </div>
  );
}
```

---

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)

**Week 1:**
- [ ] Set up Next.js project structure
- [ ] Configure Prisma with PostgreSQL
- [ ] Create database schema and run migrations
- [ ] Set up Vercel Blob for image storage
- [ ] Build authentication system for dashboard
- [ ] Create basic dashboard layout with sidebar navigation

**Week 2:**
- [ ] Implement Google Places API integration
- [ ] Build review sync service
- [ ] Create manual GMB account connection flow
- [ ] Set up Vercel cron job for daily syncs
- [ ] Build basic review storage and retrieval

### Phase 2: Widget Builder Interface (Weeks 3-4)

**Week 3:**
- [ ] Build Source tab with business search
- [ ] Build Layout tab with visual layout selector
- [ ] Build Header tab with element toggles
- [ ] Implement live preview panel
- [ ] Create responsive preview modes

**Week 4:**
- [ ] Build Review tab with style options
- [ ] Build Style tab with color/font customization
- [ ] Build Settings tab with all options
- [ ] Implement real-time preview updates
- [ ] Add save/publish functionality

### Phase 3: Frontend Widget Component (Weeks 5-6)

**Week 5:**
- [ ] Set up widget build pipeline (Webpack/Vite)
- [ ] Build core Widget component
- [ ] Implement Carousel layout with Embla
- [ ] Build ReviewCard component
- [ ] Add Navigation and Pagination components
- [ ] Implement responsive breakpoints

**Week 6:**
- [ ] Build Grid layout
- [ ] Build List layout
- [ ] Build Slider layout
- [ ] Build Masonry layout
- [ ] Build Card Badge layout
- [ ] Implement animations and transitions

### Phase 4: Embed System & API (Week 7)

- [ ] Build widget data API endpoint
- [ ] Create embed code generator
- [ ] Build widget loader script
- [ ] Implement caching headers
- [ ] Add error handling and fallbacks
- [ ] Create Schema.org markup generator

### Phase 5: Optimization & Testing (Week 8)

- [ ] Bundle size optimization
- [ ] Image optimization with sharp
- [ ] Lazy loading implementation
- [ ] Cross-browser testing
- [ ] WordPress plugin compatibility testing
- [ ] Performance testing (Lighthouse scores)
- [ ] Load testing with Artillery/k6

### Phase 6: Polish & Launch (Week 9-10)

**Week 9:**
- [ ] Build client onboarding flow
- [ ] Create documentation (embed guide, troubleshooting)
- [ ] Add analytics tracking (optional)
- [ ] Implement error logging (Sentry)
- [ ] Build widget gallery/templates
- [ ] Create demo widgets

**Week 10:**
- [ ] Final QA and bug fixes
- [ ] Security audit
- [ ] Load testing and optimization
- [ ] Create video tutorials
- [ ] Soft launch with beta clients
- [ ] Full production launch

---

## Testing & QA

### Testing Strategy

**1. Unit Tests (Jest + React Testing Library)**
```bash
npm run test
```

Test coverage targets:
- Components: 80%
- Services: 90%
- Utilities: 95%

Example test:
```typescript
// __tests__/ReviewCard.test.tsx

import { render, screen } from '@testing-library/react';
import { ReviewCard } from '@/widget/components/ReviewCard';

describe('ReviewCard', () => {
  const mockReview = {
    id: '1',
    authorName: 'John Doe',
    authorPhotoUrl: '/photo.jpg',
    rating: 5,
    text: 'Great service!',
    timeCreated: new Date('2024-01-01'),
    isVerified: true,
  };

  it('renders review author name', () => {
    render(<ReviewCard review={mockReview} config={defaultConfig} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('displays correct star rating', () => {
    render(<ReviewCard review={mockReview} config={defaultConfig} />);
    const stars = screen.getAllByTestId('star-filled');
    expect(stars).toHaveLength(5);
  });

  it('shows verified badge for verified reviews', () => {
    render(<ReviewCard review={mockReview} config={defaultConfig} />);
    expect(screen.getByTestId('verified-badge')).toBeInTheDocument();
  });
});
```

**2. Integration Tests (Playwright)**
```bash
npm run test:e2e
```

Test scenarios:
- Widget builder flow (create, configure, publish)
- GMB account connection
- Review sync process
- Embed code generation
- Widget rendering on test page

**3. Visual Regression Tests (Percy/Chromatic)**
- Capture screenshots of all layout options
- Test responsive breakpoints
- Verify style customizations

**4. Performance Tests**

**Lighthouse Targets:**
- Performance: > 90
- Accessibility: > 95
- Best Practices: > 90
- SEO: > 90

**Bundle Size Limits:**
- widget.js: < 50KB gzipped
- widget.css: < 10KB gzipped

**Load Time Targets:**
- Time to Interactive: < 1.5s
- First Contentful Paint: < 0.8s
- Cumulative Layout Shift: < 0.1

**5. Compatibility Testing**

**Browsers:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**WordPress Caching Plugins:**
- WP Rocket
- W3 Total Cache
- WP Super Cache
- LiteSpeed Cache
- WP Fastest Cache

**6. Security Testing**

- [ ] SQL injection prevention (Prisma ORM)
- [ ] XSS prevention (React auto-escaping + DOMPurify)
- [ ] CSRF protection (Next.js built-in)
- [ ] API rate limiting
- [ ] Environment variable security
- [ ] Dependency vulnerability scanning (npm audit)

---

## Deployment

### Environment Variables

```bash
# .env.local

# Database
DATABASE_URL="postgresql://user:password@host:5432/reviews_db"

# Google APIs
GOOGLE_PLACES_API_KEY="your-api-key"
GOOGLE_TRANSLATE_API_KEY="your-api-key" # Optional

# Vercel Blob
BLOB_READ_WRITE_TOKEN="your-blob-token"

# Application
NEXT_PUBLIC_APP_URL="https://widgets.actuatemedia.com"
CRON_SECRET="your-secret-for-cron"

# Optional
SENTRY_DSN="your-sentry-dsn"
```

### Vercel Deployment

**1. Database Setup:**
```bash
# Create production database
npx prisma migrate deploy

# Seed initial data (optional)
npx prisma db seed
```

**2. Deploy to Vercel:**
```bash
vercel --prod
```

**3. Configure Cron Job:**
- Vercel automatically picks up cron config from `vercel.json`
- Runs daily at 2 AM UTC

**4. Set Environment Variables:**
- Add all env vars in Vercel dashboard
- Regenerate Blob token for production

### Monitoring

**1. Application Monitoring (Vercel Analytics)**
- Real-time performance metrics
- Error tracking
- Function execution times

**2. Error Tracking (Sentry - Optional)**
```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
});
```

**3. Uptime Monitoring**
- Vercel built-in uptime monitoring
- Alternative: UptimeRobot, Pingdom

---

## TypeScript Interfaces

```typescript
// types/index.ts

export interface Client {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GMBAccount {
  id: string;
  clientId: string;
  businessName: string;
  businessAddress?: string;
  placeId: string;
  googleMapsUrl?: string;
  rating: number;
  totalReviews: number;
  lastSyncedAt?: Date;
  syncEnabled: boolean;
  syncFrequency: 'daily' | 'weekly' | 'manual';
  createdAt: Date;
  updatedAt: Date;
}

export interface Review {
  id: string;
  gmbAccountId: string;
  googleReviewId: string;
  authorName: string;
  authorPhotoUrl?: string;
  authorPhotoBlob?: string;
  rating: 1 | 2 | 3 | 4 | 5;
  text?: string;
  timeCreated: Date;
  translatedText?: string;
  translatedLang?: string;
  isVerified: boolean;
  isHidden: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WidgetConfig {
  id: string;
  clientId: string;
  gmbAccountId: string;
  name: string;

  // Source
  aiSummaryEnabled: boolean;

  // Layout
  layout: 'carousel' | 'grid' | 'masonry' | 'list' | 'slider' | 'card-badge';
  width: string;
  columns: string;
  rows: number;
  rowsMobile: number;
  itemSpacing: string;
  autoPlay: boolean;
  animation: 'slide' | 'fade' | 'none';
  scrollMode: 'scroll-per-item' | 'scroll-free';

  // Header
  showHeader: boolean;
  headerStyle: string;
  showHeading: boolean;
  showRating: boolean;
  showReviewCount: boolean;
  showWriteButton: boolean;
  widgetTitle: string;

  // Review
  reviewStyle: string;
  reviewSourceStyle: string;
  minRating: number;
  maxReviews?: number;

  // Style
  colorScheme: 'light' | 'dark';
  accentColor: string;
  fontFamily: string;
  customCSS?: string;

  // Settings
  language: string;
  autoTranslate: boolean;
  enableSchemaOrg: boolean;
  enableExternalLinks: boolean;
  openLinksNewTab: boolean;
  ratingFormat: 'integer' | 'decimal';
  customJS?: string;

  // Meta
  embedCode: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LayoutSettings {
  layout: string;
  width: string;
  columns: string;
  rows: number;
  rowsMobile: number;
  itemSpacing: string;
  autoPlay: boolean;
  animation: string;
  scrollMode: string;
  pagination?: {
    enabled: boolean;
    position: 'below' | 'inside';
    style: 'dots' | 'numbers';
  };
  navigationArrows?: {
    enabled: boolean;
    position: 'sides' | 'bottom';
    style: 'default' | 'custom';
  };
  swipeNavigation?: {
    enabled: boolean;
  };
}

export interface HeaderSettings {
  showHeader: boolean;
  headerStyle: string;
  elements: {
    heading: boolean;
    rating: boolean;
    numberOfReviews: boolean;
    writeReviewButton: boolean;
  };
  widgetTitleEnabled: boolean;
  widgetTitle: string;
}

export interface StyleSettings {
  colorScheme: 'light' | 'dark';
  accentColor: string;
  fontFamily: string;
  background?: {
    color?: string;
    transparency?: number;
  };
  widgetTitle?: {
    color?: string;
    fontSize?: string;
    fontWeight?: number;
  };
  header?: {
    backgroundColor?: string;
    textColor?: string;
  };
  rating?: {
    starColor?: string;
    textColor?: string;
  };
  review?: {
    backgroundColor?: string;
    textColor?: string;
    borderRadius?: string;
    shadow?: boolean;
  };
  navigationArrows?: {
    color?: string;
    backgroundColor?: string;
    borderRadius?: string;
  };
  pagination?: {
    activeColor?: string;
    inactiveColor?: string;
  };
  customCSS?: string;
}
```

---

## API Endpoints Reference

### Dashboard API

```
POST   /api/auth/login                    # Admin login
POST   /api/auth/logout                   # Admin logout
GET    /api/auth/me                       # Get current user

GET    /api/clients                       # List all clients
POST   /api/clients                       # Create client
GET    /api/clients/:id                   # Get client
PATCH  /api/clients/:id                   # Update client
DELETE /api/clients/:id                   # Delete client

GET    /api/gmb-accounts                  # List GMB accounts
POST   /api/gmb-accounts                  # Connect GMB account
GET    /api/gmb-accounts/:id              # Get GMB account
PATCH  /api/gmb-accounts/:id              # Update GMB account
DELETE /api/gmb-accounts/:id              # Disconnect GMB account
POST   /api/gmb-accounts/:id/sync         # Trigger manual sync

GET    /api/reviews                       # List reviews (with filters)
GET    /api/reviews/:id                   # Get single review
PATCH  /api/reviews/:id                   # Update review (hide/show)
DELETE /api/reviews/:id                   # Delete review

GET    /api/widgets                       # List widgets
POST   /api/widgets                       # Create widget
GET    /api/widgets/:id                   # Get widget
PATCH  /api/widgets/:id                   # Update widget
DELETE /api/widgets/:id                   # Delete widget
POST   /api/widgets/:id/publish           # Publish widget
POST   /api/widgets/:id/unpublish         # Unpublish widget
GET    /api/widgets/:id/embed-code        # Get embed code
```

### Public Widget API

```
GET    /api/widgets/:id/data              # Get widget config + reviews (public, cached)
```

### Cron Jobs

```
GET    /api/cron/sync-reviews             # Daily review sync (protected by CRON_SECRET)
```

---

## Additional Features (Future Enhancements)

### Phase 2 Features

1. **Review Response Management**
   - Allow clients to respond to reviews
   - Sync responses back to Google

2. **Advanced Filtering**
   - Filter by keyword
   - Filter by date range
   - Filter by sentiment (AI)

3. **Review Moderation**
   - Flag inappropriate reviews
   - AI-powered sentiment analysis
   - Profanity filter

4. **Analytics Dashboard**
   - Widget impressions
   - Click-through rates
   - Review engagement metrics
   - A/B testing support

5. **Multi-Source Reviews**
   - Yelp integration
   - Facebook reviews
   - Trustpilot
   - Custom review sources

6. **White-Label Option**
   - Custom domain support
   - Remove branding
   - Custom CSS injection

7. **Review Widgets as a Service (API)**
   - REST API for programmatic widget creation
   - Webhook support for review updates
   - GraphQL API

---

## Success Metrics

### Performance KPIs

- Widget load time: < 1.5s
- Time to First Review: < 0.5s
- Lighthouse Performance Score: > 90
- Bundle size: < 50KB gzipped
- API response time: < 200ms (p95)

### Business KPIs

- Zero conflicts with WordPress caching plugins
- 99.9% uptime
- Support <5% of installations (low support burden)
- Client satisfaction: > 4.5/5

---

## Support & Documentation

### Client Documentation

1. **Getting Started Guide**
   - Creating first widget
   - Connecting GMB account
   - Embedding widget on website

2. **Customization Guide**
   - Layout options explained
   - Style customization tips
   - Advanced CSS examples

3. **Troubleshooting**
   - Common issues and solutions
   - WordPress plugin compatibility
   - Browser compatibility

4. **API Documentation** (for developers)
   - Widget data API reference
   - Embed script customization
   - Custom event listeners

### Developer Documentation

1. **Architecture Overview**
2. **Contributing Guide**
3. **Testing Guide**
4. **Deployment Guide**

---

## Conclusion

This specification provides a complete blueprint for building a Google Reviews widget platform that:

✅ **Matches Elfsight functionality** with all layout options  
✅ **Outperforms competitors** with faster load times and better caching  
✅ **Integrates seamlessly** with WordPress and caching plugins  
✅ **Scales efficiently** with Vercel Edge Network + PostgreSQL  
✅ **Provides great UX** with visual builder and live preview  

### Next Steps

1. Review and approve this specification
2. Set up development environment
3. Create project repository
4. Begin Phase 1 implementation
5. Schedule weekly check-ins for progress review

**Estimated Timeline:** 10 weeks to MVP  
**Team Size:** 2-3 developers (1 full-stack, 1 frontend specialist, 1 optional QA)

---

**Questions or clarifications?** Let me know what needs adjustment!
