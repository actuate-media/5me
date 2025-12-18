import prisma from '@/lib/prisma';
import type { WidgetType, Prisma } from '@prisma/client';

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
  settings: WidgetSettings;
}

export interface UpdateWidgetInput {
  name?: string;
  type?: WidgetType;
  settings?: WidgetSettings;
  isActive?: boolean;
}

/**
 * Get all widgets for a company
 */
export async function getWidgetsByCompany(companyId: string) {
  return prisma.widget.findMany({
    where: { companyId },
    include: {
      company: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get widget by ID
 */
export async function getWidgetById(id: string) {
  return prisma.widget.findUnique({
    where: { id },
    include: {
      company: true,
    },
  });
}

/**
 * Create a new widget
 */
export async function createWidget(data: CreateWidgetInput) {
  // Generate embed code
  const embedCode = `<script src="https://5me.vercel.app/widget.js" data-widget-id="${Date.now()}"></script>`;

  return prisma.widget.create({
    data: {
      companyId: data.companyId,
      name: data.name,
      type: data.type,
      settings: data.settings,
      embedCode,
      isActive: true,
    },
  });
}

/**
 * Update a widget
 */
export async function updateWidget(id: string, data: UpdateWidgetInput) {
  return prisma.widget.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.type && { type: data.type }),
      ...(data.settings && { settings: data.settings }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });
}

/**
 * Delete a widget
 */
export async function deleteWidget(id: string) {
  return prisma.widget.delete({
    where: { id },
  });
}

/**
 * Get all widgets (for admin)
 */
export async function getAllWidgets() {
  return prisma.widget.findMany({
    include: {
      company: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}
