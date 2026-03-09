/*
  Warnings:

  - You are about to drop the `control_evidences` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "findings" ADD COLUMN "controlRef" TEXT;
ALTER TABLE "findings" ADD COLUMN "deviation" TEXT;
ALTER TABLE "findings" ADD COLUMN "folder" TEXT;
ALTER TABLE "findings" ADD COLUMN "rootCause" TEXT;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "control_evidences";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "control_evidence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "controlId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileData" TEXT NOT NULL,
    "mimeType" TEXT,
    "fileSize" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "uploadedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "control_evidence_controlId_fkey" FOREIGN KEY ("controlId") REFERENCES "controls" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "finding_comments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "findingId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL DEFAULT 'System',
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "finding_comments_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "findings" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "finding_attachments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "findingId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "finding_attachments_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "findings" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "finding_folders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_risks_v2" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "assetId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "riskCategory" TEXT,
    "threatSource" TEXT,
    "vulnerability" TEXT,
    "bruttoProbability" INTEGER NOT NULL DEFAULT 1,
    "bruttoImpact" INTEGER NOT NULL DEFAULT 1,
    "bruttoScore" INTEGER NOT NULL DEFAULT 1,
    "nettoProbability" INTEGER NOT NULL DEFAULT 1,
    "nettoImpact" INTEGER NOT NULL DEFAULT 1,
    "nettoScore" INTEGER NOT NULL DEFAULT 1,
    "singleLossExpectancy" REAL,
    "annualRateOccurrence" REAL,
    "annualLossExpectancy" REAL,
    "nettoSLE" REAL,
    "nettoARO" REAL,
    "nettoALE" REAL,
    "riskTreatment" TEXT,
    "riskOwner" TEXT,
    "treatmentPlan" TEXT,
    "treatmentDeadline" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'identified',
    "mappedControls" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "risks_v2_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "risks_v2_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets_v2" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_risks_v2" ("annualLossExpectancy", "annualRateOccurrence", "assetId", "bruttoImpact", "bruttoProbability", "bruttoScore", "createdAt", "description", "id", "mappedControls", "nettoALE", "nettoARO", "nettoImpact", "nettoProbability", "nettoSLE", "nettoScore", "organizationId", "riskCategory", "riskOwner", "riskTreatment", "singleLossExpectancy", "status", "threatSource", "title", "treatmentDeadline", "treatmentPlan", "updatedAt", "vulnerability") SELECT "annualLossExpectancy", "annualRateOccurrence", "assetId", "bruttoImpact", "bruttoProbability", "bruttoScore", "createdAt", "description", "id", "mappedControls", "nettoALE", "nettoARO", "nettoImpact", "nettoProbability", "nettoSLE", "nettoScore", "organizationId", "riskCategory", "riskOwner", "riskTreatment", "singleLossExpectancy", "status", "threatSource", "title", "treatmentDeadline", "treatmentPlan", "updatedAt", "vulnerability" FROM "risks_v2";
DROP TABLE "risks_v2";
ALTER TABLE "new_risks_v2" RENAME TO "risks_v2";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "finding_folders_organizationId_type_name_key" ON "finding_folders"("organizationId", "type", "name");
