/*
  Warnings:

  - You are about to drop the column `settings` on the `widgets` table. All the data in the column will be lost.
  - Added the required column `configJson` to the `widgets` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "WidgetStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- AlterTable
ALTER TABLE "widgets" DROP COLUMN "settings",
ADD COLUMN     "configJson" JSONB NOT NULL,
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "status" "WidgetStatus" NOT NULL DEFAULT 'DRAFT',
ALTER COLUMN "type" SET DEFAULT 'CAROUSEL';

-- CreateTable
CREATE TABLE "widget_locations" (
    "id" TEXT NOT NULL,
    "widgetId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'google',
    "placeId" TEXT NOT NULL,
    "label" TEXT,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "widget_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "widgetLocationId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'google',
    "providerReviewId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "authorAvatarUrl" TEXT,
    "rating" INTEGER NOT NULL,
    "text" TEXT,
    "language" TEXT,
    "reviewUrl" TEXT,
    "reviewCreatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_overrides" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "customExcerpt" TEXT,
    "tags" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "review_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "widget_summaries" (
    "id" TEXT NOT NULL,
    "widgetId" TEXT NOT NULL,
    "avgRating" DOUBLE PRECISION NOT NULL,
    "totalReviews" INTEGER NOT NULL,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "widget_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "widget_locations_widgetId_placeId_key" ON "widget_locations"("widgetId", "placeId");

-- CreateIndex
CREATE INDEX "reviews_widgetLocationId_idx" ON "reviews"("widgetLocationId");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_provider_providerReviewId_key" ON "reviews"("provider", "providerReviewId");

-- CreateIndex
CREATE UNIQUE INDEX "review_overrides_reviewId_key" ON "review_overrides"("reviewId");

-- CreateIndex
CREATE UNIQUE INDEX "widget_summaries_widgetId_key" ON "widget_summaries"("widgetId");

-- AddForeignKey
ALTER TABLE "widget_locations" ADD CONSTRAINT "widget_locations_widgetId_fkey" FOREIGN KEY ("widgetId") REFERENCES "widgets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_widgetLocationId_fkey" FOREIGN KEY ("widgetLocationId") REFERENCES "widget_locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_overrides" ADD CONSTRAINT "review_overrides_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "widget_summaries" ADD CONSTRAINT "widget_summaries_widgetId_fkey" FOREIGN KEY ("widgetId") REFERENCES "widgets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
