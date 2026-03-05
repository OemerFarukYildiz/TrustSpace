import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/sbom/overview - Get all SBOMs with summary info
export async function GET(request: NextRequest) {
  try {
    const sboms = await prisma.sbomDocument.findMany({
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
        components: {
          include: {
            vulnerabilities: {
              select: {
                severity: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    // Calculate summary for each SBOM
    const sbomsWithSummary = sboms.map((sbom) => {
      const vulnerabilitySummary = {
        total: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      };

      sbom.components.forEach((component) => {
        component.vulnerabilities.forEach((vuln) => {
          vulnerabilitySummary.total++;
          switch (vuln.severity) {
            case "CRITICAL":
              vulnerabilitySummary.critical++;
              break;
            case "HIGH":
              vulnerabilitySummary.high++;
              break;
            case "MEDIUM":
              vulnerabilitySummary.medium++;
              break;
            case "LOW":
              vulnerabilitySummary.low++;
              break;
          }
        });
      });

      return {
        id: sbom.id,
        format: sbom.format,
        versionLabel: sbom.versionLabel,
        isLatest: sbom.isLatest,
        componentsCount: sbom.components.length,
        vulnerabilitySummary,
        createdAt: sbom.createdAt,
        updatedAt: sbom.updatedAt,
        asset: sbom.asset,
      };
    });

    return NextResponse.json(sbomsWithSummary);

  } catch (error) {
    console.error("Failed to get SBOM overview:", error);
    return NextResponse.json(
      { error: "Failed to get SBOM overview" },
      { status: 500 }
    );
  }
}