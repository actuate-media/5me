'use client';

import { useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { WidgetConfig } from '@/types/widget-config';

interface WidgetPayload {
  config: WidgetConfig;
  summary: {
    avgRating: number;
    totalReviews: number;
  } | null;
  reviews: Array<{
    id: string;
    authorName: string;
    authorAvatarUrl: string | null;
    rating: number;
    text: string | null;
    date: Date | string;
    reviewUrl: string | null;
    pinned: boolean;
  }>;
}

interface WidgetRendererProps {
  payload: WidgetPayload;
}

export function WidgetRenderer({ payload }: WidgetRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { config, summary, reviews } = payload;

  // Post height to parent for auto-resize
  const postHeight = useCallback(() => {
    if (containerRef.current && typeof window !== 'undefined' && window.parent !== window) {
      const height = containerRef.current.scrollHeight;
      window.parent.postMessage(
        { type: 'rc-widget-height', height },
        '*'
      );
    }
  }, []);

  useEffect(() => {
    // Post initial height
    postHeight();

    // Observe for size changes
    const resizeObserver = new ResizeObserver(postHeight);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [postHeight]);

  // Filter reviews based on config
  const filteredReviews = reviews
    .filter(r => {
      // Min rating filter
      if (r.rating < config.reviews.minRating) return false;
      // Text filter
      if (!config.reviews.showWithoutText && !r.text) return false;
      return true;
    })
    .slice(0, config.reviews.maxReviews === 'all' ? undefined : config.reviews.maxReviews);

  // Sort reviews
  const sortedReviews = [...filteredReviews].sort((a, b) => {
    // Pinned always first
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    
    switch (config.reviews.sortBy) {
      case 'highest':
        return b.rating - a.rating;
      case 'lowest':
        return a.rating - b.rating;
      case 'newest':
      default:
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
  });

  const isDark = config.style.colorScheme === 'dark';

  return (
    <div
      ref={containerRef}
      className={cn(
        'rc-widget p-4 font-sans',
        isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
      )}
      style={{
        width: config.layout.width === 'responsive' ? '100%' : config.layout.width,
        maxWidth: '100%',
      }}
    >
      {/* Header */}
      {config.header.enabled && (
        <header className="text-center mb-6">
          {config.header.title && (
            <h2 className={cn(
              'text-2xl font-bold mb-2',
              isDark ? 'text-white' : 'text-gray-900'
            )}>
              {config.header.title}
            </h2>
          )}
          
          {config.header.showRatingSummary && summary && (
            <div className="flex items-center justify-center gap-2 mb-2">
              <StarRating rating={Math.round(summary.avgRating)} accentColor={config.style.accentColor} />
              <span className="font-semibold">{summary.avgRating.toFixed(1)}</span>
              {config.header.showReviewCount && (
                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                  based on {summary.totalReviews} reviews
                </span>
              )}
            </div>
          )}

          {config.header.writeReviewButton.enabled && (
            <a
              href={config.header.writeReviewButton.url || '#'}
              target={config.settings.externalLinks.openInNewTab ? '_blank' : '_self'}
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 rounded-lg text-white font-medium transition-opacity hover:opacity-90"
              style={{ backgroundColor: config.style.accentColor }}
            >
              {config.header.writeReviewButton.text}
            </a>
          )}
        </header>
      )}

      {/* Reviews Grid/Carousel */}
      {sortedReviews.length === 0 ? (
        <div className={cn(
          'text-center py-12',
          isDark ? 'text-gray-400' : 'text-gray-500'
        )}>
          <p>No reviews to display</p>
        </div>
      ) : (
        <div 
          className="grid gap-4"
          style={{
            gridTemplateColumns: config.layout.columns === 'auto' 
              ? 'repeat(auto-fit, minmax(280px, 1fr))' 
              : `repeat(${config.layout.columns}, 1fr)`,
            gap: `${config.layout.itemSpacing}px`,
          }}
        >
          {sortedReviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              config={config}
              isDark={isDark}
            />
          ))}
        </div>
      )}

      {/* Powered by (if enabled in settings) */}
      <footer className={cn(
        'mt-6 text-center text-xs',
        isDark ? 'text-gray-500' : 'text-gray-400'
      )}>
        Powered by <a href="https://5me.vercel.app" target="_blank" rel="noopener noreferrer" className="underline">5me</a>
      </footer>

      {/* Inject custom CSS */}
      {config.style.customCss && (
        <style dangerouslySetInnerHTML={{ __html: config.style.customCss }} />
      )}

      {/* Schema.org JSON-LD (if enabled) */}
      {config.settings.schema.enabled && summary && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'AggregateRating',
              ratingValue: summary.avgRating.toFixed(1),
              reviewCount: summary.totalReviews,
              bestRating: 5,
              worstRating: 1,
            }),
          }}
        />
      )}
    </div>
  );
}

// Star Rating Component
function StarRating({ rating, accentColor }: { rating: number; accentColor: string }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className="w-5 h-5"
          fill={star <= rating ? accentColor : '#e5e7eb'}
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

// Review Card Component
interface ReviewCardProps {
  review: {
    id: string;
    authorName: string;
    authorAvatarUrl: string | null;
    rating: number;
    text: string | null;
    date: Date | string;
    reviewUrl: string | null;
    pinned: boolean;
  };
  config: WidgetConfig;
  isDark: boolean;
}

function ReviewCard({ review, config, isDark }: ReviewCardProps) {
  const formattedDate = new Date(review.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const CardWrapper = config.settings.externalLinks.enabled && review.reviewUrl
    ? 'a'
    : 'div';

  const cardProps = config.settings.externalLinks.enabled && review.reviewUrl
    ? {
        href: review.reviewUrl,
        target: config.settings.externalLinks.openInNewTab ? '_blank' : '_self',
        rel: 'noopener noreferrer',
      }
    : {};

  return (
    <CardWrapper
      {...cardProps}
      className={cn(
        'rc-review-card block p-4 rounded-lg border transition-shadow',
        isDark 
          ? 'bg-gray-800 border-gray-700 hover:shadow-lg' 
          : 'bg-white border-gray-200 hover:shadow-md',
        review.pinned && 'ring-2',
        config.settings.externalLinks.enabled && review.reviewUrl && 'cursor-pointer'
      )}
      style={review.pinned ? { 
        borderColor: config.style.accentColor,
        boxShadow: `0 0 0 2px ${config.style.accentColor}20` 
      } : undefined}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div 
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold shrink-0',
          )}
          style={{ backgroundColor: config.style.accentColor }}
        >
          {review.authorAvatarUrl ? (
            <img 
              src={review.authorAvatarUrl} 
              alt={review.authorName}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            review.authorName.charAt(0).toUpperCase()
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Author & Date */}
          <div className="flex items-center gap-2 mb-1">
            <span className={cn('font-medium truncate', isDark ? 'text-white' : 'text-gray-900')}>
              {review.authorName}
            </span>
            <span className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-500')}>
              {formattedDate}
            </span>
          </div>

          {/* Rating */}
          <div className="mb-2">
            <StarRating rating={review.rating} accentColor={config.style.accentColor} />
          </div>

          {/* Review Text */}
          {review.text && (
            <p className={cn(
              'text-sm line-clamp-4',
              isDark ? 'text-gray-300' : 'text-gray-600'
            )}>
              {review.text}
            </p>
          )}

          {/* Pinned indicator */}
          {review.pinned && (
            <span 
              className="inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded"
              style={{ 
                backgroundColor: `${config.style.accentColor}20`,
                color: config.style.accentColor,
              }}
            >
              Featured
            </span>
          )}
        </div>
      </div>
    </CardWrapper>
  );
}
