// Migration script to copy data from old PRISMA_CORE to new split databases
// Run with: npx tsx scripts/migrate-to-split-dbs.ts

import { PrismaClient as OldClient } from '@prisma/client';
import { PrismaClient as CoreClient } from '../node_modules/.prisma/client-core';
import { PrismaClient as WidgetsClient } from '../node_modules/.prisma/client-widgets';

// Old database (PRISMA_CORE)
const oldDb = new OldClient({
  datasources: {
    db: {
      url: process.env.PRISMA_CORE,
    },
  },
});

// New databases
const coreDb = new CoreClient();
const widgetsDb = new WidgetsClient();

async function migrateData() {
  console.log('🚀 Starting database migration...\n');

  try {
    // ============ CORE DATABASE MIGRATION ============
    console.log('📦 Migrating Core Database...\n');

    // 1. Migrate Users
    console.log('  → Migrating users...');
    const users = await oldDb.user.findMany();
    for (const user of users) {
      await coreDb.user.upsert({
        where: { id: user.id },
        create: user,
        update: user,
      });
    }
    console.log(`    ✅ ${users.length} users migrated`);

    // 2. Migrate Companies
    console.log('  → Migrating companies...');
    const companies = await oldDb.company.findMany();
    for (const company of companies) {
      await coreDb.company.upsert({
        where: { id: company.id },
        create: company,
        update: company,
      });
    }
    console.log(`    ✅ ${companies.length} companies migrated`);

    // 3. Migrate CompanyUsers
    console.log('  → Migrating company-user relationships...');
    const companyUsers = await oldDb.companyUser.findMany();
    for (const cu of companyUsers) {
      await coreDb.companyUser.upsert({
        where: { id: cu.id },
        create: cu,
        update: cu,
      });
    }
    console.log(`    ✅ ${companyUsers.length} company-user relationships migrated`);

    // 4. Migrate Locations
    console.log('  → Migrating locations...');
    const locations = await oldDb.location.findMany();
    for (const location of locations) {
      await coreDb.location.upsert({
        where: { id: location.id },
        create: location,
        update: location,
      });
    }
    console.log(`    ✅ ${locations.length} locations migrated`);

    // 5. Migrate ReviewSources
    console.log('  → Migrating review sources...');
    const reviewSources = await oldDb.reviewSource.findMany();
    for (const rs of reviewSources) {
      await coreDb.reviewSource.upsert({
        where: { id: rs.id },
        create: rs,
        update: rs,
      });
    }
    console.log(`    ✅ ${reviewSources.length} review sources migrated`);

    // 6. Migrate ReviewClicks
    console.log('  → Migrating review clicks...');
    const reviewClicks = await oldDb.reviewClick.findMany();
    for (const rc of reviewClicks) {
      await coreDb.reviewClick.upsert({
        where: { id: rc.id },
        create: rc,
        update: rc,
      });
    }
    console.log(`    ✅ ${reviewClicks.length} review clicks migrated`);

    // 7. Migrate Feedback
    console.log('  → Migrating feedback...');
    const feedback = await oldDb.feedback.findMany();
    for (const fb of feedback) {
      await coreDb.feedback.upsert({
        where: { id: fb.id },
        create: fb,
        update: fb,
      });
    }
    console.log(`    ✅ ${feedback.length} feedback records migrated`);

    console.log('\n✅ Core Database migration complete!\n');

    // ============ WIDGETS DATABASE MIGRATION ============
    console.log('📦 Migrating Widgets Database...\n');

    // 1. Migrate Widgets
    console.log('  → Migrating widgets...');
    const widgets = await oldDb.widget.findMany();
    for (const widget of widgets) {
      await widgetsDb.widget.upsert({
        where: { id: widget.id },
        create: widget,
        update: widget,
      });
    }
    console.log(`    ✅ ${widgets.length} widgets migrated`);

    // 2. Migrate WidgetLocations
    console.log('  → Migrating widget locations...');
    const widgetLocations = await oldDb.widgetLocation.findMany();
    for (const wl of widgetLocations) {
      await widgetsDb.widgetLocation.upsert({
        where: { id: wl.id },
        create: wl,
        update: wl,
      });
    }
    console.log(`    ✅ ${widgetLocations.length} widget locations migrated`);

    // 3. Migrate Reviews
    console.log('  → Migrating reviews...');
    const reviews = await oldDb.review.findMany();
    for (const review of reviews) {
      await widgetsDb.review.upsert({
        where: { id: review.id },
        create: review,
        update: review,
      });
    }
    console.log(`    ✅ ${reviews.length} reviews migrated`);

    // 4. Migrate ReviewOverrides
    console.log('  → Migrating review overrides...');
    const reviewOverrides = await oldDb.reviewOverride.findMany();
    for (const ro of reviewOverrides) {
      await widgetsDb.reviewOverride.upsert({
        where: { id: ro.id },
        create: ro,
        update: ro,
      });
    }
    console.log(`    ✅ ${reviewOverrides.length} review overrides migrated`);

    // 5. Migrate WidgetSummaries
    console.log('  → Migrating widget summaries...');
    const widgetSummaries = await oldDb.widgetSummary.findMany();
    for (const ws of widgetSummaries) {
      await widgetsDb.widgetSummary.upsert({
        where: { id: ws.id },
        create: ws,
        update: ws,
      });
    }
    console.log(`    ✅ ${widgetSummaries.length} widget summaries migrated`);

    console.log('\n✅ Widgets Database migration complete!\n');

    // ============ SUMMARY ============
    console.log('═'.repeat(50));
    console.log('🎉 MIGRATION COMPLETE!');
    console.log('═'.repeat(50));
    console.log('\nCore Database:');
    console.log(`  - Users: ${users.length}`);
    console.log(`  - Companies: ${companies.length}`);
    console.log(`  - Locations: ${locations.length}`);
    console.log(`  - Review Sources: ${reviewSources.length}`);
    console.log(`  - Feedback: ${feedback.length}`);
    console.log('\nWidgets Database:');
    console.log(`  - Widgets: ${widgets.length}`);
    console.log(`  - Widget Locations: ${widgetLocations.length}`);
    console.log(`  - Reviews: ${reviews.length}`);
    console.log(`  - Review Overrides: ${reviewOverrides.length}`);
    console.log(`  - Widget Summaries: ${widgetSummaries.length}`);
    console.log('');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await oldDb.$disconnect();
    await coreDb.$disconnect();
    await widgetsDb.$disconnect();
  }
}

migrateData();
