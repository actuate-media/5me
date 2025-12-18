import prisma from '@/lib/prisma';
import type { FeedbackStatus } from '@prisma/client';

export interface CreateFeedbackInput {
  locationId: string;
  rating: number;
  name: string;
  email: string;
  phone?: string;
  message: string;
}

export interface UpdateFeedbackInput {
  status?: FeedbackStatus;
  assignedTo?: string | null;
}

/**
 * Get all feedback with optional filters
 */
export async function getAllFeedback(filters?: {
  companyId?: string;
  locationId?: string;
  status?: FeedbackStatus;
  search?: string;
}) {
  const where: Record<string, unknown> = {};

  if (filters?.locationId) {
    where.locationId = filters.locationId;
  }

  if (filters?.companyId) {
    where.location = { companyId: filters.companyId };
  }

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } },
      { message: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const feedback = await prisma.feedback.findMany({
    where,
    include: {
      location: {
        include: {
          company: true,
        },
      },
      assignedUser: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return feedback;
}

/**
 * Get feedback by ID
 */
export async function getFeedbackById(id: string) {
  return prisma.feedback.findUnique({
    where: { id },
    include: {
      location: {
        include: {
          company: true,
        },
      },
      assignedUser: true,
    },
  });
}

/**
 * Create new feedback (from public review funnel)
 */
export async function createFeedback(data: CreateFeedbackInput) {
  return prisma.feedback.create({
    data: {
      locationId: data.locationId,
      rating: data.rating,
      name: data.name,
      email: data.email,
      phone: data.phone,
      message: data.message,
      status: 'NEW',
    },
  });
}

/**
 * Update feedback status
 */
export async function updateFeedback(id: string, data: UpdateFeedbackInput) {
  return prisma.feedback.update({
    where: { id },
    data: {
      ...(data.status && { status: data.status }),
      ...(data.assignedTo !== undefined && { assignedTo: data.assignedTo }),
    },
  });
}

/**
 * Delete feedback
 */
export async function deleteFeedback(id: string) {
  return prisma.feedback.delete({
    where: { id },
  });
}

/**
 * Get feedback stats
 */
export async function getFeedbackStats(companyId?: string) {
  const where = companyId ? { location: { companyId } } : {};

  const [total, newCount, readCount, resolvedCount] = await Promise.all([
    prisma.feedback.count({ where }),
    prisma.feedback.count({ where: { ...where, status: 'NEW' } }),
    prisma.feedback.count({ where: { ...where, status: 'READ' } }),
    prisma.feedback.count({ where: { ...where, status: 'RESOLVED' } }),
  ]);

  return { total, new: newCount, read: readCount, resolved: resolvedCount };
}
