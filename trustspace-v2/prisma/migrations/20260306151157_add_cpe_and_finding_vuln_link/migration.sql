-- AlterTable
ALTER TABLE "sbom_components" ADD COLUMN "cpe" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_findings" (
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
    "vulnerabilityId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "findings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "findings_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "employees" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "findings_riskId_fkey" FOREIGN KEY ("riskId") REFERENCES "risks" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "findings_controlId_fkey" FOREIGN KEY ("controlId") REFERENCES "controls" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "findings_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "audits" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "findings_vulnerabilityId_fkey" FOREIGN KEY ("vulnerabilityId") REFERENCES "vex_vulnerabilities" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_findings" ("assigneeId", "auditId", "controlId", "createdAt", "description", "dueDate", "id", "organizationId", "priority", "riskId", "status", "title", "type", "updatedAt") SELECT "assigneeId", "auditId", "controlId", "createdAt", "description", "dueDate", "id", "organizationId", "priority", "riskId", "status", "title", "type", "updatedAt" FROM "findings";
DROP TABLE "findings";
ALTER TABLE "new_findings" RENAME TO "findings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
