import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create default superadmin user
  const superadmin = await prisma.user.upsert({
    where: { email: 'strategize@actuatemedia.com' },
    update: {},
    create: {
      email: 'strategize@actuatemedia.com',
      firstName: 'Brad',
      lastName: 'Holly',
      role: 'SUPERADMIN',
      isActive: true,
    },
  });
  console.log(`✅ User: ${superadmin.email}`);

  // Create Actuate Media company
  const actuateMedia = await prisma.company.upsert({
    where: { slug: 'actuate-media' },
    update: {},
    create: {
      name: 'Actuate Media',
      slug: 'actuate-media',
      logo: null,
    },
  });
  console.log(`✅ Company: ${actuateMedia.name}`);

  // Link superadmin to company
  await prisma.companyUser.upsert({
    where: {
      userId_companyId: {
        userId: superadmin.id,
        companyId: actuateMedia.id,
      },
    },
    update: {},
    create: {
      userId: superadmin.id,
      companyId: actuateMedia.id,
      role: 'owner',
    },
  });
  console.log(`✅ Linked ${superadmin.email} to ${actuateMedia.name}`);

  // Create sample locations
  const locations = [
    { name: 'Seattle', slug: 'seattle', city: 'Seattle', state: 'WA' },
    { name: 'Tampa', slug: 'tampa', city: 'Tampa', state: 'FL' },
    { name: 'Orlando', slug: 'orlando', city: 'Orlando', state: 'FL' },
  ];

  for (const loc of locations) {
    const location = await prisma.location.upsert({
      where: {
        companyId_slug: {
          companyId: actuateMedia.id,
          slug: loc.slug,
        },
      },
      update: {},
      create: {
        companyId: actuateMedia.id,
        name: loc.name,
        slug: loc.slug,
        city: loc.city,
        state: loc.state,
        ratingThreshold: 4,
        notificationEmails: ['strategize@actuatemedia.com'],
      },
    });
    console.log(`✅ Location: ${location.name}`);

    // Add Google My Business source
    await prisma.reviewSource.upsert({
      where: {
        id: `${location.id}-google`, // Use a predictable ID for upsert
      },
      update: {},
      create: {
        id: `${location.id}-google`,
        locationId: location.id,
        type: 'GOOGLE',
        name: 'Google My Business',
        url: `https://search.google.com/local/writereview?placeid=PLACEHOLDER_${loc.slug}`,
      },
    });
    console.log(`  └─ Source: Google My Business`);
  }

  console.log('\n🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
