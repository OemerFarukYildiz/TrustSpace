import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/sbom/[id]/export - Export original SBOM JSON for CRA compliance
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sbomDocument = await prisma.sbomDocument.findUnique({
      where: { id: params.id },
      select: {
        rawJson: true,
        format: true,
        versionLabel: true,
        asset: {
          select: {
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

    // Generate filename for download
    const sanitizedAssetName = sbomDocument.asset.name
      .replace(/[^a-zA-Z0-9\-_]/g, "-")
      .toLowerCase();

    const filename = `sbom-${sanitizedAssetName}-${sbomDocument.versionLabel}-${sbomDocument.format}.json`;

    // Return original SBOM JSON with appropriate headers for download
    return new NextResponse(sbomDocument.rawJson, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache",
      },
    });

  } catch (error) {
    console.error("Failed to export SBOM:", error);
    return NextResponse.json(
      { error: "Failed to export SBOM" },
      { status: 500 }
    );
  }
}