import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { ReviewLandingClient } from './review-landing-client';

export const dynamic = 'force-dynamic';

async function getCompanyBySlug(slug: string) {
  return prisma.company.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true, logo: true },
  });
}

async function getLocationsByCompany(companyId: string) {
  return prisma.location.findMany({
    where: { companyId },
    select: { id: true, name: true, slug: true, address: true },
    take: 100,
  });
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

  // Transform null to undefined for client component compatibility
  const clientCompany = {
    ...company,
    logo: company.logo ?? undefined,
  };

  const clientLocations = locations.map(loc => ({
    ...loc,
    address: loc.address ?? undefined,
  }));

  return <ReviewLandingClient company={clientCompany} locations={clientLocations} />;
}

export async function generateMetadata({ params }: PageProps) {
  const { companySlug } = await params;
  const company = await getCompanyBySlug(companySlug);

  return {
    title: company ? `Leave a Review for ${company.name}` : 'Leave a Review',
    description: company ? `Share your experience with ${company.name}` : 'Share your experience',
  };
}
