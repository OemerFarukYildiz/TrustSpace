import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { OSVClient } from "@/lib/osv";

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

        if (existingVuln) {
          // Update existing vulnerability
          await prisma.vexVulnerability.update({
            where: {
              id: existingVuln.id,
            },
            data: {
              cvssScore: vuln.cvssScore,
              severity: vuln.severity,
              remediation: vuln.details || vuln.summary || existingVuln.remediation,
              lastCheckedAt: new Date(),
            },
          });
          scanResults.updatedVulnerabilities++;
        } else {
          // Create new vulnerability
          await prisma.vexVulnerability.create({
            data: {
              componentId: component.id,
              cveId: vuln.cveId,
              cvssScore: vuln.cvssScore,
              severity: vuln.severity,
              vexStatus: "under_investigation",
              remediation: vuln.details || vuln.summary,
              lastCheckedAt: new Date(),
            },
          });
          scanResults.newVulnerabilities++;
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