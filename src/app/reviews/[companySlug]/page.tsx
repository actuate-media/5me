import { notFound } from 'next/navigation';
import { ReviewLandingClient } from './review-landing-client';

// Mock data - replace with database lookup
async function getCompanyBySlug(slug: string) {
  const companies: Record<string, { id: string; name: string; slug: string; logo?: string }> = {
    'actuate-media': { id: '1', name: 'Actuate Media', slug: 'actuate-media' },
    'seattle-coffee-co': { id: '2', name: 'Seattle Coffee Co', slug: 'seattle-coffee-co' },
  };
  return companies[slug] || null;
}

async function getLocationsByCompany(companyId: string) {
  const locations: Record<string, Array<{ id: string; name: string; slug: string; address?: string }>> = {
    '1': [
      { id: 'loc1', name: 'Seattle HQ', slug: 'seattle', address: '123 Main St, Seattle, WA' },
      { id: 'loc2', name: 'Portland Office', slug: 'portland', address: '456 Oak Ave, Portland, OR' },
      { id: 'loc3', name: 'San Francisco', slug: 'san-francisco', address: '789 Market St, San Francisco, CA' },
    ],
    '2': [
      { id: 'loc4', name: 'Downtown', slug: 'downtown', address: '100 Pike Place, Seattle, WA' },
      { id: 'loc5', name: 'Capitol Hill', slug: 'capitol-hill', address: '200 Broadway, Seattle, WA' },
    ],
  };
  return locations[companyId] || [];
}

interface PageProps {
  params: Promise<{ companySlug: string }>;
}

export default async function ReviewLandingPage({ params }: PageProps) {
  const { companySlug } = await params;
  const company = await getCompanyBySlug(companySlug);

  if (!company) {
    notFound();
  }

  const locations = await getLocationsByCompany(company.id);

  return <ReviewLandingClient company={company} locations={locations} />;
}

export async function generateMetadata({ params }: PageProps) {
  const { companySlug } = await params;
  const company = await getCompanyBySlug(companySlug);

  return {
    title: company ? `Leave a Review for ${company.name}` : 'Leave a Review',
    description: company ? `Share your experience with ${company.name}` : 'Share your experience',
  };
}
