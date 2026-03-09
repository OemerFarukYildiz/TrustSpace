import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const ORG_ID = "default-org";

// GET /api/v2/assets/stats - Statistiken fuer V2 Assets
export async function GET() {
  try {
    const assets = await prisma.assetV2.findMany({
      where: { organizationId: ORG_ID },
      select: {
        id: true,
        category: true,
        ciaScore: true,
        confidentiality: true,
        integrity: true,
        availability: true,
        replacementCost: true,
        dataClassification: true,
      },
    });

    // Total Assets
    const totalAssets = assets.length;

    // By Category counts
    const byCategory: Record<string, number> = {};
    for (const asset of assets) {
      byCategory[asset.category] = (byCategory[asset.category] || 0) + 1;
    }

    // Average CIA Score (nur Assets mit Bewertung > 0)
    const assetsWithCia = assets.filter((a) => a.ciaScore > 0);
    const avgCiaScore =
      assetsWithCia.length > 0
        ? Math.round(
            (assetsWithCia.reduce((sum, a) => sum + a.ciaScore, 0) /
              assetsWithCia.length) *
              100
          ) / 100
        : 0;

    // Total Replacement Cost
    const totalReplacementCost = assets.reduce(
      (sum, a) => sum + (a.replacementCost || 0),
      0
    );

    // By Classification counts
    const byClassification: Record<string, number> = {};
    for (const asset of assets) {
      const classification = asset.dataClassification || "internal";
      byClassification[classification] =
        (byClassification[classification] || 0) + 1;
    }

    return NextResponse.json({
      totalAssets,
      byCategory,
      avgCiaScore,
      totalReplacementCost,
      byClassification,
    });
  } catch (error) {
    console.error("Failed to fetch V2 asset stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch V2 asset stats" },
      { status: 500 }
    );
  }
}
