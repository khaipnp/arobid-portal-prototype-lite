-- CreateTable
CREATE TABLE "ModelAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "HallTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL,
    "isActive" BOOLEAN NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sourceBlendAssetId" TEXT,
    "renderGlbAssetId" TEXT NOT NULL,
    "thumbnailAssetId" TEXT NOT NULL,
    CONSTRAINT "HallTemplate_sourceBlendAssetId_fkey" FOREIGN KEY ("sourceBlendAssetId") REFERENCES "ModelAsset" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "HallTemplate_renderGlbAssetId_fkey" FOREIGN KEY ("renderGlbAssetId") REFERENCES "ModelAsset" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "HallTemplate_thumbnailAssetId_fkey" FOREIGN KEY ("thumbnailAssetId") REFERENCES "ModelAsset" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HallTemplateTranslation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hallTemplateId" TEXT NOT NULL,
    "languageCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "HallTemplateTranslation_hallTemplateId_fkey" FOREIGN KEY ("hallTemplateId") REFERENCES "HallTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HallTemplateSlot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hallTemplateId" TEXT NOT NULL,
    "slotCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "posX" DOUBLE PRECISION NOT NULL,
    "posY" DOUBLE PRECISION NOT NULL,
    "posZ" DOUBLE PRECISION NOT NULL,
    "rotX" DOUBLE PRECISION NOT NULL,
    "rotY" DOUBLE PRECISION NOT NULL,
    "rotZ" DOUBLE PRECISION NOT NULL,
    "scaleX" DOUBLE PRECISION NOT NULL,
    "scaleY" DOUBLE PRECISION NOT NULL,
    "scaleZ" DOUBLE PRECISION NOT NULL,
    "width" DOUBLE PRECISION NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,
    "depth" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB NOT NULL,
    CONSTRAINT "HallTemplateSlot_hallTemplateId_fkey" FOREIGN KEY ("hallTemplateId") REFERENCES "HallTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HallTemplateUsage" (
    "hallTemplateId" TEXT NOT NULL PRIMARY KEY,
    "upcomingExpoCount" INTEGER NOT NULL,
    "liveExpoCount" INTEGER NOT NULL,
    "archivedExpoCount" INTEGER NOT NULL,
    CONSTRAINT "HallTemplateUsage_hallTemplateId_fkey" FOREIGN KEY ("hallTemplateId") REFERENCES "HallTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HallSlotUsage" (
    "slotId" TEXT NOT NULL PRIMARY KEY,
    "upcomingExpoCount" INTEGER NOT NULL,
    "liveExpoCount" INTEGER NOT NULL,
    CONSTRAINT "HallSlotUsage_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "HallTemplateSlot" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BoothType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "BoothTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL,
    "isActive" BOOLEAN NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "boothTypeId" TEXT NOT NULL,
    "sourceBlendAssetId" TEXT,
    "renderGlbAssetId" TEXT NOT NULL,
    "thumbnailAssetId" TEXT NOT NULL,
    CONSTRAINT "BoothTemplate_boothTypeId_fkey" FOREIGN KEY ("boothTypeId") REFERENCES "BoothType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BoothTemplate_sourceBlendAssetId_fkey" FOREIGN KEY ("sourceBlendAssetId") REFERENCES "ModelAsset" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BoothTemplate_renderGlbAssetId_fkey" FOREIGN KEY ("renderGlbAssetId") REFERENCES "ModelAsset" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BoothTemplate_thumbnailAssetId_fkey" FOREIGN KEY ("thumbnailAssetId") REFERENCES "ModelAsset" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BoothTemplateTranslation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "boothTemplateId" TEXT NOT NULL,
    "languageCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "BoothTemplateTranslation_boothTemplateId_fkey" FOREIGN KEY ("boothTemplateId") REFERENCES "BoothTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BoothTemplateUsage" (
    "boothTemplateId" TEXT NOT NULL PRIMARY KEY,
    "upcomingExpoBoothCount" INTEGER NOT NULL,
    "liveExpoBoothCount" INTEGER NOT NULL,
    "archivedExpoBoothCount" INTEGER NOT NULL,
    CONSTRAINT "BoothTemplateUsage_boothTemplateId_fkey" FOREIGN KEY ("boothTemplateId") REFERENCES "BoothTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "HallTemplate_renderGlbAssetId_idx" ON "HallTemplate"("renderGlbAssetId");

-- CreateIndex
CREATE INDEX "HallTemplate_thumbnailAssetId_idx" ON "HallTemplate"("thumbnailAssetId");

-- CreateIndex
CREATE INDEX "HallTemplateTranslation_languageCode_idx" ON "HallTemplateTranslation"("languageCode");

-- CreateIndex
CREATE UNIQUE INDEX "HallTemplateTranslation_hallTemplateId_languageCode_key" ON "HallTemplateTranslation"("hallTemplateId", "languageCode");

-- CreateIndex
CREATE INDEX "HallTemplateSlot_hallTemplateId_idx" ON "HallTemplateSlot"("hallTemplateId");

-- CreateIndex
CREATE UNIQUE INDEX "HallTemplateSlot_hallTemplateId_slotCode_key" ON "HallTemplateSlot"("hallTemplateId", "slotCode");

-- CreateIndex
CREATE INDEX "BoothTemplate_boothTypeId_idx" ON "BoothTemplate"("boothTypeId");

-- CreateIndex
CREATE INDEX "BoothTemplateTranslation_languageCode_idx" ON "BoothTemplateTranslation"("languageCode");

-- CreateIndex
CREATE UNIQUE INDEX "BoothTemplateTranslation_boothTemplateId_languageCode_key" ON "BoothTemplateTranslation"("boothTemplateId", "languageCode");
