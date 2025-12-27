// Quick test script for split database setup
import { coreDb, widgetsDb } from '../src/lib/prisma';

async function test() {
  console.log('Testing split database setup...\n');

  // Test Core DB
  const companies = await coreDb.company.findMany({ take: 5 });
  const users = await coreDb.user.findMany({ take: 5 });
  const locations = await coreDb.location.findMany({ take: 5 });

  console.log('Core DB:');
  console.log(`  Companies: ${companies.length}`);
  console.log(`  Users: ${users.length}`);
  console.log(`  Locations: ${locations.length}`);

  // Test Widgets DB
  const widgets = await widgetsDb.widget.findMany({ take: 5 });
  const reviews = await widgetsDb.review.findMany({ take: 5 });

  console.log('\nWidgets DB:');
  console.log(`  Widgets: ${widgets.length}`);
  console.log(`  Reviews: ${reviews.length}`);

  // Show some data
  if (companies.length > 0) {
    console.log(`\nFirst company: ${companies[0].name} (${companies[0].slug})`);
  }
  if (widgets.length > 0) {
    console.log(`First widget: ${widgets[0].name} (companyId: ${widgets[0].companyId})`);
  }

  console.log('\n✅ Split database setup is working!');

  await coreDb.$disconnect();
  await widgetsDb.$disconnect();
}

test().catch(console.error);
