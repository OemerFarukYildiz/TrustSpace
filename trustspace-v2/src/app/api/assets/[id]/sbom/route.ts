import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/assets/[id]/sbom - Get all SBOMs for an asset
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sboms = await prisma.sbomDocument.findMany({
      where: {
        assetId: id,
      },
      include: {
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
        createdAt: "desc",
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
      };
    });

    return NextResponse.json(sbomsWithSummary);

  } catch (error) {
    console.error("Failed to get asset SBOMs:", error);
    return NextResponse.json(
      { error: "Failed to get asset SBOMs" },
      { status: 500 }
    );
  }
}