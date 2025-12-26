import prisma from '@/lib/prisma';

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
  const companies = await prisma.company.findMany({
    include: {
      _count: {
        select: {
          locations: true,
          widgets: true,
        },
      },
      locations: {
        include: {
          _count: {
            select: {
              sources: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return companies.map((c) => {
    // Sum up sources across all locations
    const sourceCount = c.locations.reduce((sum, loc) => sum + loc._count.sources, 0);
    
    return {
      id: c.id,
      name: c.name,
      slug: c.slug,
      logo: c.logo,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      locationCount: c._count.locations,
      widgetCount: c._count.widgets,
      sourceCount,
      _count: c._count,
    };
  });
}

/**
 * Get company by ID
 */
export async function getCompanyById(id: string) {
  return prisma.company.findUnique({
    where: { id },
    include: {
      locations: true,
      widgets: true,
      _count: {
        select: {
          locations: true,
          widgets: true,
        },
      },
    },
  });
}

/**
 * Get company by slug
 */
export async function getCompanyBySlug(slug: string) {
  return prisma.company.findUnique({
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
  return prisma.company.create({
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
  return prisma.company.update({
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
  return prisma.company.delete({
    where: { id },
  });
}
