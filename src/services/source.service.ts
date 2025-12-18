import prisma from '@/lib/prisma';
import type { ReviewSourceType } from '@prisma/client';

export interface CreateSourceInput {
  locationId: string;
  type: ReviewSourceType;
  name: string;
  url: string;
  icon?: string;
}

export interface UpdateSourceInput {
  type?: ReviewSourceType;
  name?: string;
  url?: string;
  icon?: string;
}

/**
 * Get all sources for a location
 */
export async function getSourcesByLocation(locationId: string) {
  const sources = await prisma.reviewSource.findMany({
    where: { locationId },
    include: {
      _count: {
        select: {
          clicks: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return sources.map((s) => ({
    ...s,
    clickCount: s._count.clicks,
  }));
}

/**
 * Get source by ID
 */
export async function getSourceById(id: string) {
  return prisma.reviewSource.findUnique({
    where: { id },
    include: {
      location: {
        include: {
          company: true,
        },
      },
      _count: {
        select: {
          clicks: true,
        },
      },
    },
  });
}

/**
 * Create a new source
 */
export async function createSource(data: CreateSourceInput) {
  return prisma.reviewSource.create({
    data: {
      locationId: data.locationId,
      type: data.type,
      name: data.name,
      url: data.url,
      icon: data.icon,
    },
  });
}

/**
 * Update a source
 */
export async function updateSource(id: string, data: UpdateSourceInput) {
  return prisma.reviewSource.update({
    where: { id },
    data: {
      ...(data.type && { type: data.type }),
      ...(data.name && { name: data.name }),
      ...(data.url && { url: data.url }),
      ...(data.icon !== undefined && { icon: data.icon }),
    },
  });
}

/**
 * Delete a source
 */
export async function deleteSource(id: string) {
  return prisma.reviewSource.delete({
    where: { id },
  });
}

/**
 * Record a click on a source
 */
export async function recordClick(sourceId: string, locationId: string, rating?: number, ipAddress?: string, userAgent?: string) {
  return prisma.reviewClick.create({
    data: {
      sourceId,
      locationId,
      rating,
      ipAddress,
      userAgent,
    },
  });
}

/**
 * Get click stats for a location
 */
export async function getClickStats(locationId: string, days: number = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const clicks = await prisma.reviewClick.groupBy({
    by: ['sourceId'],
    where: {
      locationId,
      createdAt: { gte: since },
    },
    _count: true,
  });

  return clicks;
}
