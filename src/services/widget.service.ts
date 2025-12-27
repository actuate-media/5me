import { widgetsDb } from '@/lib/prisma';
import type { WidgetType, WidgetStatus, Prisma } from '../../node_modules/.prisma/client-widgets';
import type { WidgetConfig } from '@/types/widget-config';
import { createDefaultWidgetConfig } from '@/types/widget-config';

export interface WidgetSettings {
  theme: 'light' | 'dark';
  primaryColor: string;
  showRating: boolean;
  showDate: boolean;
  autoplay: boolean;
  interval: number;
  maxReviews: number;
  [key: string]: string | boolean | number; // Index signature for Prisma JSON compatibility
}

export interface CreateWidgetInput {
  companyId: string;
  name: string;
  type: WidgetType;
  settings?: WidgetSettings;
  configJson?: WidgetConfig;
}

export interface UpdateWidgetInput {
  name?: string;
  type?: WidgetType;
  settings?: WidgetSettings;
  configJson?: WidgetConfig;
  status?: WidgetStatus;
  isActive?: boolean;
}

/**
 * Get all widgets for a company
 */
export async function getWidgetsByCompany(companyId: string) {
  return widgetsDb.widget.findMany({
    where: { companyId },
    include: {
      locations: true,
      summary: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}

/**
 * Get widget by ID
 */
export async function getWidgetById(id: string) {
  return widgetsDb.widget.findUnique({
    where: { id },
    include: {
      locations: {
        include: {
          reviews: {
            where: { override: { isNot: { hidden: true } } },
            orderBy: { reviewCreatedAt: 'desc' },
            take: 50,
          },
        },
      },
      summary: true,
    },
  });
}

/**
 * Get widget payload for rendering (optimized for embed)
 */
export async function getWidgetPayload(id: string) {
  const widget = await widgetsDb.widget.findUnique({
    where: { id, status: 'PUBLISHED' },
    select: {
      id: true,
      name: true,
      type: true,
      configJson: true,
      summary: {
        select: {
          avgRating: true,
          totalReviews: true,
        },
      },
      locations: {
        where: { enabled: true },
        select: {
          id: true,
          provider: true,
          placeId: true,
          label: true,
          reviews: {
            orderBy: { reviewCreatedAt: 'desc' },
            take: 50,
            select: {
              id: true,
              authorName: true,
              authorAvatarUrl: true,
              rating: true,
              text: true,
              reviewCreatedAt: true,
              reviewUrl: true,
              override: {
                select: {
                  hidden: true,
                  pinned: true,
                  customExcerpt: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!widget) return null;

  // Filter out hidden reviews and apply overrides
  const reviews = widget.locations.flatMap(loc => 
    loc.reviews
      .filter(r => !r.override?.hidden)
      .map(r => ({
        id: r.id,
        authorName: r.authorName,
        authorAvatarUrl: r.authorAvatarUrl,
        rating: r.rating,
        text: r.override?.customExcerpt || r.text,
        date: r.reviewCreatedAt,
        reviewUrl: r.reviewUrl,
        pinned: r.override?.pinned || false,
      }))
  );

  // Sort: pinned first, then by date
  reviews.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  return {
    config: widget.configJson as WidgetConfig,
    summary: widget.summary,
    reviews,
  };
}

/**
 * Create a new widget
 */
export async function createWidget(data: CreateWidgetInput) {
  // Generate embed code
  const widgetId = `w_${Date.now()}`;
  const embedCode = `<script src="${process.env.NEXT_PUBLIC_APP_URL || 'https://5me.vercel.app'}/widget-platform.js" data-widget-id="${widgetId}"></script>`;

  // Use provided configJson or create default
  const configJson = data.configJson || createDefaultWidgetConfig('carousel');

  return widgetsDb.widget.create({
    data: {
      companyId: data.companyId,
      name: data.name,
      type: data.type,
      configJson: configJson as unknown as Prisma.InputJsonValue,
      embedCode,
      status: 'DRAFT',
      isActive: true,
    },
  });
}

/**
 * Update a widget
 */
export async function updateWidget(id: string, data: UpdateWidgetInput) {
  const updateData: Prisma.WidgetUpdateInput = {};
  
  if (data.name !== undefined) updateData.name = data.name;
  if (data.type !== undefined) updateData.type = data.type;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.status !== undefined) {
    updateData.status = data.status;
    // Set publishedAt when first published
    if (data.status === 'PUBLISHED') {
      const widget = await widgetsDb.widget.findUnique({ where: { id }, select: { publishedAt: true } });
      if (!widget?.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }
  }
  if (data.configJson !== undefined) {
    updateData.configJson = data.configJson as unknown as Prisma.InputJsonValue;
  }
  if (data.settings !== undefined) {
    // Legacy settings field - migrate to configJson structure if needed
    updateData.configJson = data.settings as unknown as Prisma.InputJsonValue;
  }

  return widgetsDb.widget.update({
    where: { id },
    data: updateData,
  });
}

/**
 * Delete a widget
 */
export async function deleteWidget(id: string) {
  return widgetsDb.widget.delete({
    where: { id },
  });
}

/**
 * Get all widgets (for admin)
 */
export async function getAllWidgets() {
  return widgetsDb.widget.findMany({
    include: {
      summary: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}

/**
 * Update widget summary (called after review sync)
 */
export async function updateWidgetSummary(widgetId: string) {
  // Calculate aggregate stats from reviews
  const stats = await widgetsDb.review.aggregate({
    where: {
      widgetLocation: { widgetId },
      override: { is: { hidden: false } },
    },
    _avg: { rating: true },
    _count: { id: true },
  });

  return widgetsDb.widgetSummary.upsert({
    where: { widgetId },
    update: {
      avgRating: stats._avg.rating || 0,
      totalReviews: stats._count.id,
      lastSyncedAt: new Date(),
    },
    create: {
      widgetId,
      avgRating: stats._avg.rating || 0,
      totalReviews: stats._count.id,
      lastSyncedAt: new Date(),
    },
  });
}
