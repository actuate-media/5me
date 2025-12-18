import { notFound } from 'next/navigation';
import { ReviewFlowClient } from './review-flow-client';

// Mock data - replace with database lookup
async function getLocationBySlug(companySlug: string, locationSlug: string) {
  const locations: Record<string, { id: string; name: string; slug: string; companyName: string; companySlug: string }> = {
    'actuate-media/seattle': { id: 'loc1', name: 'Seattle HQ', slug: 'seattle', companyName: 'Actuate Media', companySlug: 'actuate-media' },
    'actuate-media/portland': { id: 'loc2', name: 'Portland Office', slug: 'portland', companyName: 'Actuate Media', companySlug: 'actuate-media' },
    'actuate-media/san-francisco': { id: 'loc3', name: 'San Francisco', slug: 'san-francisco', companyName: 'Actuate Media', companySlug: 'actuate-media' },
  };
  return locations[`${companySlug}/${locationSlug}`] || null;
}

async function getSourcesByLocation(locationId: string) {
  const sources: Record<string, Array<{ id: string; type: string; name: string; url: string }>> = {
    'loc1': [
      { id: 's1', type: 'google', name: 'Google', url: 'https://g.page/review/actuate-media' },
      { id: 's2', type: 'facebook', name: 'Facebook', url: 'https://facebook.com/actuatemedia/reviews' },
      { id: 's3', type: 'yelp', name: 'Yelp', url: 'https://yelp.com/biz/actuate-media' },
    ],
    'loc2': [
      { id: 's4', type: 'google', name: 'Google', url: 'https://g.page/review/actuate-media-portland' },
    ],
    'loc3': [
      { id: 's5', type: 'google', name: 'Google', url: 'https://g.page/review/actuate-media-sf' },
      { id: 's6', type: 'yelp', name: 'Yelp', url: 'https://yelp.com/biz/actuate-media-sf' },
    ],
  };
  return sources[locationId] || [];
}

interface PageProps {
  params: Promise<{ companySlug: string; locationSlug: string }>;
}

export default async function ReviewFlowPage({ params }: PageProps) {
  const { companySlug, locationSlug } = await params;
  const location = await getLocationBySlug(companySlug, locationSlug);

  if (!location) {
    notFound();
  }

  const sources = await getSourcesByLocation(location.id);

  return <ReviewFlowClient location={location} sources={sources} />;
}

export async function generateMetadata({ params }: PageProps) {
  const { companySlug, locationSlug } = await params;
  const location = await getLocationBySlug(companySlug, locationSlug);

  return {
    title: location ? `Review ${location.companyName} - ${location.name}` : 'Leave a Review',
    description: location ? `Share your experience at ${location.companyName} ${location.name}` : 'Share your experience',
  };
}
