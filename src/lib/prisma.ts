import { PrismaClient as CorePrismaClient } from '../../node_modules/.prisma/client-core';
import { PrismaClient as WidgetsPrismaClient } from '../../node_modules/.prisma/client-widgets';

// Global types for HMR protection
const globalForPrisma = globalThis as unknown as {
  coreDb: CorePrismaClient | undefined;
  widgetsDb: WidgetsPrismaClient | undefined;
};

// Core Database Client (User, Company, Location, ReviewSource, Feedback, ReviewClick)
export const coreDb =
  globalForPrisma.coreDb ??
  new CorePrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

// Widgets Database Client (Widget, WidgetLocation, Review, ReviewOverride, WidgetSummary)
export const widgetsDb =
  globalForPrisma.widgetsDb ??
  new WidgetsPrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

// Protect against multiple instances in development (HMR)
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.coreDb = coreDb;
  globalForPrisma.widgetsDb = widgetsDb;
}

// Legacy export for backwards compatibility during migration
// TODO: Remove after all imports are updated
export const prisma = coreDb;
export default coreDb;
