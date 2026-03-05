import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/sbom/[id] - Get SBOM with components and vulnerabilities
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sbomDocument = await prisma.sbomDocument.findUnique({
      where: { id },
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
              orderBy: {
                severity: "desc",
              },
            },
          },
          orderBy: {
            name: "asc",
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

    // Calculate vulnerability summary
    const vulnerabilitySummary = {
      total: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    sbomDocument.components.forEach(component => {
      component.vulnerabilities.forEach(vuln => {
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

    return NextResponse.json({
      ...sbomDocument,
      vulnerabilitySummary,
    });

  } catch (error) {
    console.error("Failed to get SBOM:", error);
    return NextResponse.json(
      { error: "Failed to get SBOM" },
      { status: 500 }
    );
  }
}

// DELETE /api/sbom/[id] - Delete SBOM
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.sbomDocument.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Failed to delete SBOM:", error);
    return NextResponse.json(
      { error: "Failed to delete SBOM" },
      { status: 500 }
    );
  }
}
