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
  const [feedbackForm, setFeedbackForm] = useState({
    name: '',
    email: '',
    message: '',
  });

  const handleRatingClick = (value: number) => {
    setRating(value);
    if (value >= 4) {
      // High rating - show review sources
      setShowSourceModal(true);
    } else {
      // Low rating - show feedback form
      setStep('feedback');
    }
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
        aria-label="5me.io"
        className="fixed top-6 left-6 z-20"
      >
        <img
          src="/assets/logos/5me-logo.png"
          alt="5me.io"
          className="h-12 w-auto"
        />
      </a>

      {/* Conditional back-to-locations top-right */}
      {location.companyLocationsCount > 1 && (
        <Link
          href={`/reviews/${location.companySlug}`}
          className="fixed top-6 right-6 z-20 inline-flex items-center gap-2 text-gray-200 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to locations
        </Link>
      )}

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-xl">

          {step === 'rating' && (
            <Card className="px-12 py-14 bg-white border border-gray-200 shadow-lg rounded-2xl">
              <div className="flex flex-col items-center text-center mb-10">
                {location.companyLogo ? (
                  <img
                    src={location.companyLogo}
                    alt={location.companyName}
                    className="h-24 w-auto mb-6"
                  />
                ) : (
                  <div className="text-2xl font-bold text-gray-800 mb-6">{location.companyName}</div>
                )}

                <h2 className="text-2xl font-bold text-gray-900">
                  How was your experience?
                </h2>
                <p className="text-base text-gray-500 mt-1">Please rate your experience</p>
              </div>

              <div className="flex justify-center gap-3">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    onClick={() => handleRatingClick(value)}
                    onMouseEnter={() => setHoveredRating(value)}
                    onMouseLeave={() => setHoveredRating(0)}
                    aria-label={`Rate ${value} star${value === 1 ? '' : 's'}`}
                    className="p-2 transition-transform hover:scale-110"
                  >
                    <Star
                      className={cn(
                        'h-14 w-14 transition-colors',
                        (hoveredRating || rating) >= value
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      )}
                    />
                  </button>
                ))}
              </div>
            </Card>
          )}

          {step === 'feedback' && (
            <Card className="p-8 bg-white/10 backdrop-blur-sm border border-white/20">
              <h2 className="text-xl font-semibold text-white text-center mb-2">
                We&apos;re sorry to hear that
              </h2>
              <p className="text-gray-300 text-center mb-6">
                Please let us know how we can improve
              </p>
              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                <Input
                  label="Name"
                  value={feedbackForm.name}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, name: e.target.value })}
                  required
                  className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                />
                <Input
                  label="Email"
                  type="email"
                  value={feedbackForm.email}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, email: e.target.value })}
                  required
                  className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Message
                  </label>
                  <textarea
                    value={feedbackForm.message}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, message: e.target.value })}
                    rows={4}
                    required
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ee5f64]"
                    placeholder="Tell us about your experience..."
                  />
                </div>
                <Button type="submit" className="w-full">
                  Submit Feedback
                </Button>
              </form>
              <button
                onClick={() => setStep('rating')}
                className="w-full mt-4 text-sm text-gray-400 hover:text-white transition-colors"
              >
                ← Change rating
              </button>
            </Card>
          )}
        </div>
      </div>

      {/* Source Selection Modal */}
      {showSourceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-md p-6 bg-white relative">
            <button
              onClick={() => setShowSourceModal(false)}
              aria-label="Close"
              title="Close"
              className="absolute top-4 right-4 p-1 rounded hover:bg-gray-100"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>

            <h2 className="text-xl font-semibold text-gray-900 mb-2">
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
