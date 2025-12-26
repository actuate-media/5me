export const REVIEW_SOURCE_LOGO_SRC: Record<string, string> = {
  google: '/assets/review-sources/google.svg',
  facebook: '/assets/review-sources/facebook.svg',
  yelp: '/assets/review-sources/yelp.svg',
  bbb: '/assets/review-sources/bbb.svg',
  trustpilot: '/assets/review-sources/trustpilot.svg',
  clutch: '/assets/review-sources/clutch.svg',
  other: '/assets/review-sources/other.svg',
};

export function getReviewSourceLogoSrc(type: string | null | undefined) {
  const key = (type ?? '').toLowerCase();
  return REVIEW_SOURCE_LOGO_SRC[key] ?? null;
}
