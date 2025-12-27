// Test database connections for both Core and Widgets DBs
import { PrismaClient as CoreClient } from '../node_modules/.prisma/client-core';
import { PrismaClient as WidgetsClient } from '../node_modules/.prisma/client-widgets';

async function testConnections() {
  const core = new CoreClient();
  const widgets = new WidgetsClient();

  try {
    // Test Core DB
    console.log('Testing Core DB connection...');
    const userCount = await core.user.count();
    const companyCount = await core.company.count();
    const locationCount = await core.location.count();
    console.log('✅ Core DB connected:');
    console.log(`   Users: ${userCount}`);
    console.log(`   Companies: ${companyCount}`);
    console.log(`   Locations: ${locationCount}`);
    console.log('');

    // Test Widgets DB
    console.log('Testing Widgets DB connection...');
    const widgetCount = await widgets.widget.count();
    const reviewCount = await widgets.review.count();
    console.log('✅ Widgets DB connected:');
    console.log(`   Widgets: ${widgetCount}`);
    console.log(`   Reviews: ${reviewCount}`);
    console.log('');

    console.log('🎉 Both databases are connected and ready!');
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    process.exit(1);
  } finally {
    await core.$disconnect();
    await widgets.$disconnect();
  }
}

testConnections();
