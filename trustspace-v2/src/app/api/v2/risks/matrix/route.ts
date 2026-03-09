import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const ORG_ID = "default-org";

// GET /api/v2/risks/matrix - Risikomatrix-Daten (10x10)
export async function GET() {
  try {
    const risks = await prisma.riskV2.findMany({
      where: { organizationId: ORG_ID },
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
      },
      orderBy: { bruttoScore: "desc" },
    });

    const matrixData = risks.map((risk) => ({
      id: risk.id,
      title: risk.title,
      riskCategory: risk.riskCategory,
      status: risk.status,
      assetName: risk.asset?.name || null,
      assetCategory: risk.asset?.category || null,
      brutto: {
        probability: risk.bruttoProbability,
        impact: risk.bruttoImpact,
        score: risk.bruttoScore,
      },
      netto: {
        probability: risk.nettoProbability,
        impact: risk.nettoImpact,
        score: risk.nettoScore,
      },
    }));

    return NextResponse.json(matrixData);
  } catch (error) {
    console.error("Failed to fetch risk matrix data:", error);
    return NextResponse.json(
      { error: "Failed to fetch risk matrix data" },
      { status: 500 }
    );
  }
}
