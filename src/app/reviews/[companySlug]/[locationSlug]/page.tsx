import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { ReviewFlowClient } from './review-flow-client';

export const dynamic = 'force-dynamic';

async function getLocationBySlug(companySlug: string, locationSlug: string) {
  const company = await prisma.company.findUnique({
    where: { slug: companySlug },
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      _count: { select: { locations: true } },
    },
  });
  
  if (!company) return null;
  
  const location = await prisma.location.findFirst({
    where: { 
      companyId: company.id,
      slug: locationSlug,
    },
    select: { id: true, name: true, slug: true },
  });
  
  if (!location) return null;
  
  return {
    id: location.id,
    name: location.name,
    slug: location.slug,
    companyName: company.name,
    companySlug: company.slug,
    companyLogo: company.logo,
    companyLocationsCount: company._count.locations,
  };
}

async function getSourcesByLocation(locationId: string) {
  return prisma.reviewSource.findMany({
    where: { locationId },
    select: { id: true, type: true, name: true, url: true },
    take: 20,
  });
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
