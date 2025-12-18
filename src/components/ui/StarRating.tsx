import { Star } from 'lucide-react';
import { cn, getStarRating } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  className?: string;
}

export function StarRating({ rating, size = 'md', showValue = false, className }: StarRatingProps) {
  const { filled, half, empty } = getStarRating(rating);

  const sizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={cn('inline-flex items-center gap-1', className)}>
      <div className="flex">
        {/* Filled stars */}
        {Array.from({ length: filled }).map((_, i) => (
          <Star
            key={`filled-${i}`}
            className={cn(sizes[size], 'text-yellow-400 fill-yellow-400')}
          />
        ))}
        
        {/* Half star */}
        {half && (
          <div className="relative">
            <Star className={cn(sizes[size], 'text-gray-300')} />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <Star className={cn(sizes[size], 'text-yellow-400 fill-yellow-400')} />
            </div>
          </div>
        )}
        
        {/* Empty stars */}
        {Array.from({ length: empty }).map((_, i) => (
          <Star
            key={`empty-${i}`}
            className={cn(sizes[size], 'text-gray-300')}
          />
        ))}
      </div>
      
      {showValue && (
        <span className={cn('font-medium text-gray-700 ml-1', textSizes[size])}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
