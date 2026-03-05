-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "industry" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "assets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "ownerId" TEXT,
    "department" TEXT,
    "confidentiality" INTEGER NOT NULL DEFAULT 0,
    "integrity" INTEGER NOT NULL DEFAULT 0,
    "availability" INTEGER NOT NULL DEFAULT 0,
    "ciaAverage" REAL NOT NULL DEFAULT 0,
    "step1Completed" BOOLEAN NOT NULL DEFAULT false,
    "step2Completed" BOOLEAN NOT NULL DEFAULT false,
    "step3Completed" BOOLEAN NOT NULL DEFAULT false,
    "step4Completed" BOOLEAN NOT NULL DEFAULT false,
    "step5Completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "assets_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "assets_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "employees" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "linked_assets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "primaryId" TEXT NOT NULL,
    "secondaryId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "linked_assets_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "linked_assets_primaryId_fkey" FOREIGN KEY ("primaryId") REFERENCES "assets" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "linked_assets_secondaryId_fkey" FOREIGN KEY ("secondaryId") REFERENCES "assets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "threat_scenarios" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "threat_scenarios_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "risk_threats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "threatId" TEXT NOT NULL,
    "bruttoProbability" INTEGER NOT NULL DEFAULT 1,
    "bruttoImpact" INTEGER NOT NULL DEFAULT 1,
    "bruttoScore" INTEGER NOT NULL DEFAULT 1,
    "nettoProbability" INTEGER NOT NULL DEFAULT 1,
    "nettoImpact" INTEGER NOT NULL DEFAULT 1,
    "nettoScore" INTEGER NOT NULL DEFAULT 1,
    "mappedControls" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "risk_threats_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "risk_threats_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "risk_threats_threatId_fkey" FOREIGN KEY ("threatId") REFERENCES "threat_scenarios" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "risks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "assetId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "bruttoProbability" INTEGER NOT NULL DEFAULT 1,
    "bruttoImpact" INTEGER NOT NULL DEFAULT 1,
    "bruttoScore" INTEGER NOT NULL DEFAULT 1,
    "nettoProbability" INTEGER NOT NULL DEFAULT 1,
    "nettoImpact" INTEGER NOT NULL DEFAULT 1,
    "nettoScore" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "risks_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "risks_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "controls" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "justification" TEXT,
    "isApplicable" BOOLEAN NOT NULL DEFAULT true,
    "implementation" TEXT,
    "responsibleId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "controls_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "controls_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "employees" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "policies" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "version" INTEGER NOT NULL DEFAULT 1,
    "fileUrl" TEXT,
    "fileType" TEXT,
    "controlId" TEXT,
    "category" TEXT NOT NULL DEFAULT 'policies',
    "approverId" TEXT,
    "reviewDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "policies_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "policies_controlId_fkey" FOREIGN KEY ("controlId") REFERENCES "controls" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "document_files" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "parentId" TEXT,
    "size" INTEGER NOT NULL DEFAULT 0,
    "content" TEXT,
    "sheetData" TEXT,
    "fileData" TEXT,
    "mimeType" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "document_files_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "document_files_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "document_files" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "vendors" (
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "vendors_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "vendor_assessments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vendorId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "comment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "vendor_assessments_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "department" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "employees_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "findings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'open',
    "dueDate" DATETIME,
    "assigneeId" TEXT,
    "riskId" TEXT,
    "controlId" TEXT,
    "auditId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "findings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "findings_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "employees" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "findings_riskId_fkey" FOREIGN KEY ("riskId") REFERENCES "risks" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "findings_controlId_fkey" FOREIGN KEY ("controlId") REFERENCES "controls" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "findings_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "audits" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "scope" TEXT,
    "plannedDate" DATETIME NOT NULL,
    "actualDate" DATETIME,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "documents" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "audits_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_owners" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "auditId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_owners_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "audits" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "audit_owners_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_calendar" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "auditId" TEXT,
    "title" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_calendar_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "audit_calendar_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "audits" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sbom_documents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "versionLabel" TEXT NOT NULL,
    "isLatest" BOOLEAN NOT NULL DEFAULT true,
    "serialNumber" TEXT,
    "rawJson" TEXT NOT NULL,
    "uploadedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "sbom_documents_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sbom_documents_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sbom_components" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sbomDocumentId" TEXT NOT NULL,
    "purl" TEXT,
    "name" TEXT NOT NULL,
    "version" TEXT,
    "supplier" TEXT,
    "licenseSpdx" TEXT,
    "hashSha256" TEXT,
    "dependencyType" TEXT NOT NULL DEFAULT 'unknown',
    "completeness" TEXT NOT NULL DEFAULT 'incomplete',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sbom_components_sbomDocumentId_fkey" FOREIGN KEY ("sbomDocumentId") REFERENCES "sbom_documents" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "vex_vulnerabilities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "componentId" TEXT NOT NULL,
    "cveId" TEXT NOT NULL,
    "cvssScore" REAL,
    "severity" TEXT NOT NULL,
    "vexStatus" TEXT NOT NULL DEFAULT 'under_investigation',
    "remediation" TEXT,
    "lastCheckedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "vex_vulnerabilities_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "sbom_components" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ControlToRisk" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ControlToRisk_A_fkey" FOREIGN KEY ("A") REFERENCES "controls" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ControlToRisk_B_fkey" FOREIGN KEY ("B") REFERENCES "risks" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "linked_assets_primaryId_secondaryId_key" ON "linked_assets"("primaryId", "secondaryId");

-- CreateIndex
CREATE UNIQUE INDEX "threat_scenarios_organizationId_code_key" ON "threat_scenarios"("organizationId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "risk_threats_assetId_threatId_key" ON "risk_threats"("assetId", "threatId");

-- CreateIndex
CREATE UNIQUE INDEX "employees_organizationId_email_key" ON "employees"("organizationId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "audit_owners_auditId_employeeId_key" ON "audit_owners"("auditId", "employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "vex_vulnerabilities_componentId_cveId_key" ON "vex_vulnerabilities"("componentId", "cveId");

-- CreateIndex
CREATE UNIQUE INDEX "_ControlToRisk_AB_unique" ON "_ControlToRisk"("A", "B");

-- CreateIndex
CREATE INDEX "_ControlToRisk_B_index" ON "_ControlToRisk"("B");
