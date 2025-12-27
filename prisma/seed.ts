// Seed script for split database setup
// Uses coreDb for User, Company, Location, ReviewSource
// Uses widgetsDb for Widget, WidgetLocation, Review, WidgetSummary

import { PrismaClient as CorePrismaClient } from '../node_modules/.prisma/client-core';
import { PrismaClient as WidgetsPrismaClient } from '../node_modules/.prisma/client-widgets';

const coreDb = new CorePrismaClient();
const widgetsDb = new WidgetsPrismaClient();

async function main() {
  console.log('🌱 Starting database seed (split DB mode)...\n');

  // ============================================
  // CORE DATABASE SEED
  // ============================================
  console.log('📦 Seeding Core Database...\n');

  // Create default superadmin user
  const superadmin = await coreDb.user.upsert({
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
  const actuateMedia = await coreDb.company.upsert({
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
  await coreDb.companyUser.upsert({
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
    const location = await coreDb.location.upsert({
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
    await coreDb.reviewSource.upsert({
      where: {
        id: `${location.id}-google`,
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

  console.log('\n✅ Core Database seeded!\n');

  // ============================================
  // WIDGETS DATABASE SEED
  // ============================================
  console.log('📦 Seeding Widgets Database...\n');

  // Check if widget already exists
  const existingWidget = await widgetsDb.widget.findFirst({
    where: { companyId: actuateMedia.id },
  });

  if (!existingWidget) {
    const widget = await widgetsDb.widget.create({
      data: {
        companyId: actuateMedia.id,
        name: 'Actuate Media Reviews',
        type: 'CAROUSEL',
        status: 'PUBLISHED',
        configJson: {
          version: 1,
          source: { locations: [], syncEnabled: true },
          layout: {
            type: 'carousel',
            width: 'responsive',
            columns: 'auto',
            rowsDesktop: 1,
            rowsMobile: 1,
            itemSpacing: 16,
            scrollMode: 'item',
            animation: 'slide',
            autoplay: { enabled: true, interval: 5000, pauseOnHover: true },
            navigation: { arrows: true, dots: true, swipe: true },
          },
          header: {
            enabled: true,
            title: 'What Our Customers Say',
            showRatingSummary: true,
            showReviewCount: true,
            writeReviewButton: { enabled: true, text: 'Review us on Google' },
          },
          reviews: { minRating: 1, maxReviews: 'all', sortBy: 'newest' },
          style: {
            colorScheme: 'light',
            accentColor: '#4285f4',
            elements: {},
            customCss: '',
          },
          settings: {
            language: 'en',
            autoTranslate: false,
            externalLinks: { enabled: true, openInNewTab: true },
            ratingFormat: 'decimal',
            schema: { enabled: true, type: 'aggregate' },
            customJs: '',
          },
        },
        isActive: true,
      },
    });
    console.log(`✅ Widget: ${widget.name}`);

    // Create a widget location
    const widgetLocation = await widgetsDb.widgetLocation.create({
      data: {
        widgetId: widget.id,
        placeId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
        label: 'Actuate Media HQ',
        provider: 'google',
        enabled: true,
      },
    });
    console.log(`  └─ Widget Location: ${widgetLocation.label}`);

    // Create sample reviews
    const sampleReviews = [
      {
        authorName: 'lowell stanley',
        rating: 5,
        text: 'Todd Wiseman of accutate is the wonder of the age. I have been a lawyer advertiser for over 30 years. I thought I knew everything. I did not. Todd does. He revitalized the marketing of my personal injury practice such that I am making more dollars than I ever have in my life.',
        reviewCreatedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
      },
      {
        authorName: 'Sawkhar Das',
        rating: 5,
        text: 'Actuate Media has significantly improved our online presence through their expert SEO services and digital marketing strategies. Highly recommended!',
        reviewCreatedAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      },
      {
        authorName: 'Jyothiprakash nagaraj',
        rating: 5,
        text: 'Thank you, i am delighted to work with you.',
        reviewCreatedAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      },
      {
        authorName: 'Joe Kaiser',
        rating: 5,
        text: 'Highly recommend the team at Actuate Media! We own several businesses and they have helped us grow our online presence significantly.',
        reviewCreatedAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      },
      {
        authorName: 'Christina Vertus',
        rating: 5,
        text: 'The team at Acutate Media is always so helpful with all of our company marketing needs. They truly care about their clients.',
        reviewCreatedAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      },
    ];

    for (const review of sampleReviews) {
      await widgetsDb.review.create({
        data: {
          widgetLocationId: widgetLocation.id,
          provider: 'google',
          providerReviewId: `sample-review-${review.authorName.replace(/\s+/g, '-').toLowerCase()}`,
          authorName: review.authorName,
          rating: review.rating,
          text: review.text,
          reviewCreatedAt: review.reviewCreatedAt,
        },
      });
    }
    console.log(`  └─ Created ${sampleReviews.length} sample reviews`);

    // Create widget summary
    await widgetsDb.widgetSummary.create({
      data: {
        widgetId: widget.id,
        avgRating: 5.0,
        totalReviews: 41,
        lastSyncedAt: new Date(),
      },
    });
    console.log(`  └─ Widget Summary created`);
  } else {
    console.log(`⏭️ Widget already exists, skipping...`);
  }

  console.log('\n✅ Widgets Database seeded!\n');
  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await coreDb.$disconnect();
    await widgetsDb.$disconnect();
  });
