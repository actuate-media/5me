import prisma from '@/lib/prisma';

export interface CreateLocationInput {
  companyId: string;
  name: string;
  slug: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  ratingThreshold?: number;
  notificationEmails?: string[];
}

export interface UpdateLocationInput {
  name?: string;
  slug?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  ratingThreshold?: number;
  notificationEmails?: string[];
}

/**
 * Get all locations for a company
 */
export async function getLocationsByCompany(companyId: string) {
  const locations = await prisma.location.findMany({
    where: { companyId },
    include: {
      _count: {
        select: {
          sources: true,
          clicks: true,
          feedback: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return locations.map((l) => ({
    ...l,
    sourceCount: l._count.sources,
    clickCount: l._count.clicks,
    feedbackCount: l._count.feedback,
  }));
}

/**
 * Get location by ID
 */
export async function getLocationById(id: string) {
  return prisma.location.findUnique({
    where: { id },
    include: {
      company: true,
      sources: true,
      _count: {
        select: {
          sources: true,
          clicks: true,
          feedback: true,
        },
      },
    },
  });
}

/**
 * Get location by company slug and location slug
 */
export async function getLocationBySlug(companySlug: string, locationSlug: string) {
  const company = await prisma.company.findUnique({
    where: { slug: companySlug },
  });

  if (!company) return null;

  return prisma.location.findUnique({
    where: {
      companyId_slug: {
        companyId: company.id,
        slug: locationSlug,
      },
    },
    include: {
      company: true,
      sources: true,
    },
  });
}

/**
 * Create a new location
 */
export async function createLocation(data: CreateLocationInput) {
  return prisma.location.create({
    data: {
      companyId: data.companyId,
      name: data.name,
      slug: data.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      address: data.address,
      city: data.city,
      state: data.state,
      zip: data.zip,
      phone: data.phone,
      ratingThreshold: data.ratingThreshold ?? 4,
      notificationEmails: data.notificationEmails ?? [],
    },
  });
}

/**
 * Update a location
 */
export async function updateLocation(id: string, data: UpdateLocationInput) {
  return prisma.location.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.slug && { slug: data.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-') }),
      ...(data.address !== undefined && { address: data.address }),
      ...(data.city !== undefined && { city: data.city }),
      ...(data.state !== undefined && { state: data.state }),
      ...(data.zip !== undefined && { zip: data.zip }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.ratingThreshold !== undefined && { ratingThreshold: data.ratingThreshold }),
      ...(data.notificationEmails !== undefined && { notificationEmails: data.notificationEmails }),
    },
  });
}

/**
 * Delete a location
 */
export async function deleteLocation(id: string) {
  return prisma.location.delete({
    where: { id },
  });
}
