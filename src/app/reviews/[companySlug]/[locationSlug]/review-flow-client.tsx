'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Star, ExternalLink, X } from 'lucide-react';
import { StarfieldBackground } from '@/components/ui/StarfieldBackground';
import { Button, Input, Card } from '@/components/ui';
import { cn } from '@/lib/utils';
import { getReviewSourceLogoSrc } from '@/lib/review-source-logos';

interface Location {
  id: string;
  name: string;
  slug: string;
  companyName: string;
  companySlug: string;
  companyLogo?: string | null;
  companyLocationsCount: number;
}

interface Source {
  id: string;
  type: string;
  name: string;
  url: string;
}

interface ReviewFlowClientProps {
  location: Location;
  sources: Source[];
}

const SOURCE_ICONS: Record<string, string> = {
  google: '🔍',
  facebook: '📘',
  yelp: '⭐',
  clutch: '🏆',
};

function getSourceIcon(type: string) {
  return SOURCE_ICONS[type.toLowerCase()] ?? '⭐';
}

function SourceLogo({ type, name }: { type: string; name: string }) {
  const logoSrc = getReviewSourceLogoSrc(type);
  if (!logoSrc) return <span className="text-2xl">{getSourceIcon(type)}</span>;

  return (
    <img
      src={logoSrc}
      alt={name}
      className="h-7 w-7"
    />
  );
}

export function ReviewFlowClient({ location, sources }: ReviewFlowClientProps) {
  const [step, setStep] = useState<'rating' | 'feedback' | 'sources'>('rating');
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({
    name: '',
    email: '',
    message: '',
  });

  const handleRatingClick = (value: number) => {
    setRating(value);
    setIsTransitioning(true);
    
    // Show emoji for 1.5 seconds before transitioning
    setTimeout(() => {
      if (value >= 4) {
        // High rating - show review sources
        setShowSourceModal(true);
      } else {
        // Low rating - show feedback form
        setStep('feedback');
      }
      setIsTransitioning(false);
    }, 1500);
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Submit feedback to API
    alert('Thank you for your feedback!');
  };

  const handleSourceClick = (source: Source) => {
    // TODO: Track click via API
    window.open(source.url, '_blank');
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-linear-to-b from-gray-900 to-[#586c96]">
      <StarfieldBackground />

      {/* Fixed 5me logo top-left */}
      <a
        href="https://5me.io"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="5me.io - Review Generation Tools"
        className="fixed top-4 left-4 sm:top-6 sm:left-6 z-20"
      >
        <img
          src="/assets/logos/5me-logo.png"
          alt="5me.io"
          className="h-10 sm:h-14 w-auto"
        />
      </a>

      {/* Conditional back navigation top-right */}
      {step === 'rating' && location.companyLocationsCount > 1 && (
        <Link
          href={`/reviews/${location.companySlug}`}
          className="fixed top-4 right-4 sm:top-6 sm:right-6 z-20 inline-flex items-center gap-2 text-gray-200 hover:text-white transition-colors text-xs sm:text-sm"
        >
          <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
          Back to locations
        </Link>
      )}
      {step === 'feedback' && (
        <button
          onClick={() => {
            setStep('rating');
            setRating(0);
          }}
          className="fixed top-4 right-4 sm:top-6 sm:right-6 z-20 inline-flex items-center gap-2 text-gray-200 hover:text-white transition-colors text-xs sm:text-sm"
        >
          <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
          Back to rating
        </button>
      )}

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-xl">

          {step === 'rating' && (
            <Card className="px-10 py-8 sm:px-20 sm:py-14 bg-white border border-gray-200 shadow-lg rounded-2xl">
              <div className="flex flex-col items-center text-center mb-6 sm:mb-10">
                {location.companyLogo ? (
                  <div className="mb-4 w-[200px] h-[200px] rounded-full border-8 border-gray-100 bg-white flex items-center justify-center overflow-hidden">
                    <img
                      src={location.companyLogo}
                      alt={location.companyName}
                      className="max-h-[140px] max-w-[140px] object-contain"
                    />
                  </div>
                ) : (
                  <div className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">{location.companyName}</div>
                )}

                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  How was your experience?
                </h2>
                <p className="text-sm sm:text-base text-gray-600 mt-1">Please rate your experience</p>
              </div>

              <div className="flex justify-center gap-2 sm:gap-4" role="group" aria-label="Rating">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    onClick={() => handleRatingClick(value)}
                    onMouseEnter={() => setHoveredRating(value)}
                    onMouseLeave={() => setHoveredRating(0)}
                    aria-label={`Rate ${value} star${value === 1 ? '' : 's'}`}
                    className={cn(
                      'p-1 sm:p-2 transition-transform hover:scale-110 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#586c96] focus:ring-offset-2',
                      rating === value && 'ring-2 ring-[#586c96] ring-offset-2'
                    )}
                  >
                    <Star
                      className={cn(
                        'h-14 w-14 sm:h-20 sm:w-20 transition-colors',
                        (hoveredRating || rating) >= value
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      )}
                    />
                  </button>
                ))}
              </div>

              {/* Emoji feedback section */}
              {rating > 0 && (
                <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-100" aria-live="polite">
                  <div className="flex flex-col items-center text-center">
                    <span className="text-4xl sm:text-5xl mb-3" role="img" aria-label={rating >= 4 ? 'Happy face' : rating === 3 ? 'Neutral face' : 'Sad face'}>
                      {rating === 5 && '😃'}
                      {rating === 4 && '😊'}
                      {rating === 3 && '😐'}
                      {rating === 2 && '😕'}
                      {rating === 1 && '😞'}
                    </span>
                    <p className="text-sm sm:text-base text-gray-600">
                      {rating >= 4 && 'Excellent! Thank you for your feedback!'}
                      {rating === 3 && "Thank you for your feedback. We're always looking to improve."}
                      {rating <= 2 && "We're sorry to hear that. Please let us know how we can improve."}
                    </p>
                  </div>
                </div>
              )}
            </Card>
          )}

          {step === 'feedback' && (
            <Card className="px-10 py-8 sm:px-16 sm:py-12 bg-white border border-gray-200 shadow-lg rounded-2xl">
              {/* Company Logo */}
              <div className="flex flex-col items-center text-center mb-6">
                {location.companyLogo ? (
                  <div className="mb-4 w-[200px] h-[200px] rounded-full border-8 border-gray-100 bg-white flex items-center justify-center overflow-hidden">
                    <img
                      src={location.companyLogo}
                      alt={location.companyName}
                      className="max-h-[140px] max-w-[140px] object-contain"
                    />
                  </div>
                ) : (
                  <div className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">{location.companyName}</div>
                )}
                <p className="text-gray-600">
                  We value your feedback and would love to hear from you.
                </p>
              </div>

              <form onSubmit={handleFeedbackSubmit} className="space-y-5">
                <div>
                  <label htmlFor="feedback-name" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="feedback-name"
                    type="text"
                    value={feedbackForm.name}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, name: e.target.value })}
                    required
                    placeholder="John Doe"
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#586c96] focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="feedback-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="feedback-email"
                    type="email"
                    value={feedbackForm.email}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, email: e.target.value })}
                    required
                    placeholder="john@example.com"
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#586c96] focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="feedback-message" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="feedback-message"
                    value={feedbackForm.message}
                    onChange={(e) => {
                      if (e.target.value.length <= 2000) {
                        setFeedbackForm({ ...feedbackForm, message: e.target.value });
                      }
                    }}
                    rows={5}
                    required
                    maxLength={2000}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#586c96] focus:border-transparent resize-none"
                    placeholder="Tell us about your experience..."
                  />
                  <div className="text-right text-sm text-gray-400 mt-1">
                    {feedbackForm.message.length} / 2000 characters
                  </div>
                </div>

                <Button type="submit" className="w-full bg-[#586c96] hover:bg-[#4a5d82] text-white py-3 rounded-lg font-medium">
                  Submit Feedback
                </Button>
              </form>
            </Card>
          )}
        </div>
      </div>

      {/* Source Selection Modal */}
      {showSourceModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <Card className="w-full max-w-md p-4 sm:p-6 bg-white relative">
            <button
              onClick={() => setShowSourceModal(false)}
              aria-label="Close"
              title="Close"
              className="absolute top-4 right-4 p-1 rounded hover:bg-gray-100"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>

            <h2 id="modal-title" className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
              Thank you! 🎉
            </h2>
            <p className="text-gray-600 mb-6">
              Where would you like to leave your review?
            </p>

            <div className="space-y-3">
              {sources.map((source) => (
                <button
                  key={source.id}
                  onClick={() => handleSourceClick(source)}
                  className="w-full p-4 border border-gray-200 rounded-lg hover:border-[#ee5f64] hover:bg-[#fef2f2] transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <SourceLogo type={source.type} name={source.name} />
                    <span className="font-medium text-gray-900">{source.name}</span>
                  </div>
                  <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-[#ee5f64]" />
                </button>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
