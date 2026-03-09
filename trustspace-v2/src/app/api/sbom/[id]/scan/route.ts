import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { OSVClient } from "@/lib/osv";
import { scanAndSyncFindings } from "@/lib/cve-findings-sync";

// POST /api/sbom/[id]/scan - Manual CVE scan for specific SBOM
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Get SBOM document
    const sbomDocument = await prisma.sbomDocument.findUnique({
      where: { id },
      include: {
        components: true,
        asset: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!sbomDocument) {
      return NextResponse.json(
        { error: "SBOM not found" },
        { status: 404 }
      );
    }

    // Get components with valid PURLs
    const componentsWithPurls = sbomDocument.components.filter(
      c => c.purl && OSVClient.validatePurl(c.purl)
    );

    if (componentsWithPurls.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No components with valid PURLs found",
        vulnerabilitiesFound: 0,
      });
    }

    const purls = componentsWithPurls.map(c => c.purl!);

    // Build unique scan folder name (asset + SBOM version + timestamp)
    const assetName  = sbomDocument.asset?.name ?? "SBOM";
    const version    = sbomDocument.versionLabel ? ` ${sbomDocument.versionLabel}` : "";
    const now        = new Date();
    const scanDate   = now.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
    const scanTime   = now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
    const scanFolder = `${assetName}${version} – Scan ${scanDate} ${scanTime}`;

    // Register in FindingFolder table so it shows in folder management UI
    await prisma.findingFolder.upsert({
      where: { organizationId_type_name: { organizationId: "default-org", type: "vulnerability", name: scanFolder } },
      create: { organizationId: "default-org", type: "vulnerability", name: scanFolder },
      update: {},
    });

    console.log(`Starting manual scan of ${purls.length} PURLs for SBOM ${id}`);
    console.log(`PURLs to scan:`, purls);

    // Scan for vulnerabilities
    const vulnerabilityResults = await OSVClient.batchScanPurls(purls);

    console.log(`Scan completed. Results:`, vulnerabilityResults);

    let totalVulnerabilitiesFound = 0;
    const scanResults = {
      newVulnerabilities: 0,
      updatedVulnerabilities: 0,
      totalVulnerabilities: 0,
    };

    // Store/update vulnerability results
    for (const [purl, vulnerabilities] of vulnerabilityResults) {
      const component = componentsWithPurls.find(c => c.purl === purl);
      if (!component) continue;

      for (const vuln of vulnerabilities) {
        totalVulnerabilitiesFound++;

        const existingVuln = await prisma.vexVulnerability.findUnique({
          where: {
            componentId_cveId: {
              componentId: component.id,
              cveId: vuln.cveId,
            },
          },
        });

        // Fetch authoritative details from OSV (incl. GitHub CVSS score for GHSA IDs)
        let resolvedSeverity = vuln.severity;
        let resolvedScore = vuln.cvssScore;
        let remediation = vuln.details || vuln.summary || "";
        try {
          const osvRes = await fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/osv/${vuln.cveId}`);
          if (osvRes.ok) {
            const osvDetail = await osvRes.json();
            resolvedSeverity = osvDetail.severity || resolvedSeverity;
            if (osvDetail.cvssScore != null) resolvedScore = osvDetail.cvssScore;
            if (osvDetail.details) remediation = osvDetail.details;
            else if (osvDetail.summary) remediation = osvDetail.summary;
          }
        } catch {
          // fall back to OSV client data
        }

        if (existingVuln) {
          await prisma.vexVulnerability.update({
            where: { id: existingVuln.id },
            data: {
              cvssScore: resolvedScore,
              severity: resolvedSeverity,
              remediation: remediation || existingVuln.remediation,
              lastCheckedAt: new Date(),
            },
          });
          scanResults.updatedVulnerabilities++;

          // Ensure a Finding exists for this vuln
          const hasFinding = await prisma.finding.findFirst({
            where: { vulnerabilityId: existingVuln.id },
          });
          if (!hasFinding) {
            await prisma.finding.create({
              data: {
                organizationId: "default-org",
                title: vuln.cveId,
                description: remediation || undefined,
                type: "vulnerability",
                priority: severityToPriority(resolvedSeverity),
                status: "open",
                vulnerabilityId: existingVuln.id,
                folder: scanFolder,
              },
            });
          }
        } else {
          const newVuln = await prisma.vexVulnerability.create({
            data: {
              componentId: component.id,
              cveId: vuln.cveId,
              cvssScore: resolvedScore,
              severity: resolvedSeverity,
              vexStatus: "under_investigation",
              remediation,
              lastCheckedAt: new Date(),
            },
          });
          scanResults.newVulnerabilities++;

          // Auto-create a Finding (Maßnahme) for each new CVE
          await prisma.finding.create({
            data: {
              organizationId: "default-org",
              title: vuln.cveId,
              description: remediation || undefined,
              type: "vulnerability",
              priority: severityToPriority(resolvedSeverity),
              status: "open",
              vulnerabilityId: newVuln.id,
              folder: scanFolder,
            },
          });
        }
      }
    }

    scanResults.totalVulnerabilities = totalVulnerabilitiesFound;

    console.log(`Manual scan completed for SBOM ${id}:`, scanResults);

    // Update asset risk score based on critical/high vulnerabilities
    try {
      await updateAssetRiskScore(sbomDocument.asset.id);
    } catch (error) {
      console.error("Failed to update asset risk score:", error);
      // Don't fail the scan if risk update fails
    }

    return NextResponse.json({
      success: true,
      scanResults,
      scannedComponents: componentsWithPurls.length,
      vulnerabilitiesFound: totalVulnerabilitiesFound,
    });

  } catch (error) {
    console.error("CVE scan failed:", error);
    return NextResponse.json(
      { error: "CVE scan failed" },
      { status: 500 }
    );
  }
}

function severityToPriority(severity: string): string {
  switch (severity?.toUpperCase()) {
    case "CRITICAL": return "critical";
    case "HIGH":     return "high";
    case "MEDIUM":   return "medium";
    default:         return "low";
  }
}

async function updateAssetRiskScore(assetId: string) {
  // Get all vulnerabilities for this asset's SBOMs
  const vulnerabilities = await prisma.vexVulnerability.findMany({
    where: {
      component: {
        sbomDocument: {
          assetId: assetId,
          isLatest: true,
        },
      },
    },
    select: {
      severity: true,
    },
  });

  // Count critical and high vulnerabilities
  const criticalCount = vulnerabilities.filter(v => v.severity === "CRITICAL").length;
  const highCount = vulnerabilities.filter(v => v.severity === "HIGH").length;

  // Simple risk scoring based on vulnerability count
  // This could be more sophisticated based on business requirements
  let riskIncrease = 0;
  if (criticalCount > 0) {
    riskIncrease += criticalCount * 3; // Critical = +3 points each
  }
  if (highCount > 0) {
    riskIncrease += highCount * 2; // High = +2 points each
  }

  // Update asset's risk threats if there are critical/high vulnerabilities
  if (riskIncrease > 0) {
    // Find existing cyber security threats for this asset
    const cyberThreats = await prisma.riskThreat.findMany({
      where: {
        assetId: assetId,
        threat: {
          category: {
            in: ["Technical", "Cyber"], // Adjust based on your threat categories
          },
        },
      },
    });

    // Increase brutto scores for cyber threats
    for (const threat of cyberThreats) {
      const newBruttoScore = Math.min(25, threat.bruttoScore + Math.ceil(riskIncrease / 2));
      await prisma.riskThreat.update({
        where: { id: threat.id },
        data: {
          bruttoScore: newBruttoScore,
        },
      });
    }

    console.log(`Updated risk scores for asset ${assetId} based on ${criticalCount} critical and ${highCount} high vulnerabilities`);
  }
}