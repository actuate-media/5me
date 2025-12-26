import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

// Load production env if specified
const envFile = process.env.ENV_FILE || '.env';
config({ path: envFile, override: true });

console.log(`Using database: ${process.env.PRISMA_CORE?.substring(0, 50)}...`);

const prisma = new PrismaClient();

async function clearTestData() {
  console.log('Clearing test data...');
  
  // Delete in order respecting foreign key constraints
  const clicks = await prisma.reviewClick.deleteMany();
  console.log(`Deleted ${clicks.count} review clicks`);
  
  const feedback = await prisma.feedback.deleteMany();
  console.log(`Deleted ${feedback.count} feedback entries`);
  
  const sources = await prisma.reviewSource.deleteMany();
  console.log(`Deleted ${sources.count} review sources`);
  
  const locations = await prisma.location.deleteMany();
  console.log(`Deleted ${locations.count} locations`);
  
  const widgets = await prisma.widget.deleteMany();
  console.log(`Deleted ${widgets.count} widgets`);
  
  const companyUsers = await prisma.companyUser.deleteMany();
  console.log(`Deleted ${companyUsers.count} company-user relations`);
  
  const companies = await prisma.company.deleteMany();
  console.log(`Deleted ${companies.count} companies`);
  
  console.log('\n✅ All test data cleared!');
}

clearTestData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
