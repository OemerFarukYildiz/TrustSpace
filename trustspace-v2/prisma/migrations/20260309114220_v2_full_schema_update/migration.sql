-- CreateTable
CREATE TABLE "control_evidences" (
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
    CONSTRAINT "control_evidences_controlId_fkey" FOREIGN KEY ("controlId") REFERENCES "controls" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "vendor_documents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vendorId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileData" TEXT NOT NULL,
    "mimeType" TEXT,
    "fileSize" INTEGER NOT NULL DEFAULT 0,
    "category" TEXT NOT NULL DEFAULT 'other',
    "description" TEXT,
    "uploadedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "vendor_documents_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "vendor_comments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vendorId" TEXT NOT NULL,
    "authorId" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "vendor_comments_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "assets_v2" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "subCategory" TEXT,
    "ownerId" TEXT,
    "department" TEXT,
    "confidentiality" INTEGER NOT NULL DEFAULT 0,
    "integrity" INTEGER NOT NULL DEFAULT 0,
    "availability" INTEGER NOT NULL DEFAULT 0,
    "ciaScore" REAL NOT NULL DEFAULT 0,
    "replacementCost" REAL,
    "revenueImpact" REAL,
    "dataClassification" TEXT NOT NULL DEFAULT 'internal',
    "status" TEXT NOT NULL DEFAULT 'active',
    "location" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "assets_v2_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "risks_v2" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "assetId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "riskCategory" TEXT NOT NULL DEFAULT 'operational',
    "threatSource" TEXT,
    "vulnerability" TEXT,
    "bruttoProbability" INTEGER NOT NULL DEFAULT 1,
    "bruttoImpact" INTEGER NOT NULL DEFAULT 1,
    "bruttoScore" INTEGER NOT NULL DEFAULT 1,
    "singleLossExpectancy" REAL,
    "annualRateOccurrence" REAL,
    "annualLossExpectancy" REAL,
    "nettoProbability" INTEGER NOT NULL DEFAULT 1,
    "nettoImpact" INTEGER NOT NULL DEFAULT 1,
    "nettoScore" INTEGER NOT NULL DEFAULT 1,
    "nettoSLE" REAL,
    "nettoARO" REAL,
    "nettoALE" REAL,
    "riskTreatment" TEXT NOT NULL DEFAULT 'mitigate',
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

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_controls" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "justification" TEXT,
    "isApplicable" BOOLEAN NOT NULL DEFAULT true,
    "implementation" TEXT,
    "responsibleId" TEXT,
    "notes" TEXT,
    "implementationDate" DATETIME,
    "reviewDate" DATETIME,
    "implementationPct" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "controls_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "controls_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "employees" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_controls" ("code", "createdAt", "description", "id", "implementation", "isApplicable", "justification", "organizationId", "responsibleId", "title", "updatedAt") SELECT "code", "createdAt", "description", "id", "implementation", "isApplicable", "justification", "organizationId", "responsibleId", "title", "updatedAt" FROM "controls";
DROP TABLE "controls";
ALTER TABLE "new_controls" RENAME TO "controls";
CREATE TABLE "new_vendors" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "services" TEXT,
    "trustCenterUrl" TEXT,
    "certifications" TEXT,
    "dpoContact" TEXT,
    "gdprCompliant" BOOLEAN,
    "assessmentStatus" TEXT NOT NULL DEFAULT 'none',
    "assessmentData" TEXT,
    "logoUrl" TEXT,
    "website" TEXT,
    "address" TEXT,
    "country" TEXT,
    "employeeCount" TEXT,
    "foundedYear" INTEGER,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "dataProcessingAgreement" BOOLEAN NOT NULL DEFAULT false,
    "subProcessors" TEXT,
    "riskLevel" TEXT,
    "lastReviewDate" DATETIME,
    "nextReviewDate" DATETIME,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "vendors_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_vendors" ("assessmentData", "assessmentStatus", "category", "certifications", "createdAt", "dpoContact", "gdprCompliant", "id", "name", "organizationId", "services", "trustCenterUrl", "updatedAt") SELECT "assessmentData", "assessmentStatus", "category", "certifications", "createdAt", "dpoContact", "gdprCompliant", "id", "name", "organizationId", "services", "trustCenterUrl", "updatedAt" FROM "vendors";
DROP TABLE "vendors";
ALTER TABLE "new_vendors" RENAME TO "vendors";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
