import { coreDb, widgetsDb } from '@/lib/prisma';

export interface CreateCompanyInput {
  name: string;
  slug: string;
  logo?: string;
}

export interface UpdateCompanyInput {
  name?: string;
  slug?: string;
  logo?: string;
}

/**
 * Get all companies with location and source counts
 */
export async function getAllCompanies() {
  const companies = await coreDb.company.findMany({
    include: {
      _count: {
        select: {
          locations: true,
        },
      },
      locations: {
        include: {
          _count: {
            select: {
              sources: true,
              feedback: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  // Get widget counts from widgets DB (separate query since it's a different database)
  const companyIds = companies.map(c => c.id);
  const widgetCounts = await widgetsDb.widget.groupBy({
    by: ['companyId'],
    where: { companyId: { in: companyIds } },
    _count: { id: true },
  });
  const widgetCountMap = new Map(widgetCounts.map(w => [w.companyId, w._count.id]));

  return companies.map((c) => {
    // Sum up sources and feedback across all locations
    const sourceCount = c.locations.reduce((sum, loc) => sum + loc._count.sources, 0);
    const feedbackCount = c.locations.reduce((sum, loc) => sum + loc._count.feedback, 0);
    
    return {
      id: c.id,
      name: c.name,
      slug: c.slug,
      logo: c.logo,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      locationCount: c._count.locations,
      widgetCount: widgetCountMap.get(c.id) || 0,
      sourceCount,
      feedbackCount,
      _count: c._count,
    };
  });
}

/**
 * Get company by ID
 */
export async function getCompanyById(id: string) {
  const company = await coreDb.company.findUnique({
    where: { id },
    include: {
      locations: true,
      _count: {
        select: {
          locations: true,
        },
      },
    },
  });

  if (!company) return null;

  // Get widgets from widgets DB (separate database)
  const widgets = await widgetsDb.widget.findMany({
    where: { companyId: id },
    take: 100,
  });

  return {
    ...company,
    widgets,
    _count: {
      ...company._count,
      widgets: widgets.length,
    },
  };
}

/**
 * Get company by slug
 */
export async function getCompanyBySlug(slug: string) {
  return coreDb.company.findUnique({
    where: { slug },
    include: {
      locations: true,
    },
  });
}

/**
 * Create a new company
 */
export async function createCompany(data: CreateCompanyInput) {
  return coreDb.company.create({
    data: {
      name: data.name,
      slug: data.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      logo: data.logo,
    },
  });
}

/**
 * Update a company
 */
export async function updateCompany(id: string, data: UpdateCompanyInput) {
  return coreDb.company.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.slug && { slug: data.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-') }),
      ...(data.logo !== undefined && { logo: data.logo }),
    },
  });
}

/**
 * Delete a company
 */
export async function deleteCompany(id: string) {
  // Also delete widgets from widgets DB (separate database)
  await widgetsDb.widget.deleteMany({
    where: { companyId: id },
  });

  return coreDb.company.delete({
    where: { id },
  });
}
