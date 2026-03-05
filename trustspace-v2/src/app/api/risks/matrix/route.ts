import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/risks/matrix - Alle Risiken für die Matrix
export async function GET() {
  try {
    const riskThreats = await prisma.riskThreat.findMany({
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
        threat: {
          select: {
            code: true,
            name: true,
          },
        },
      },
      orderBy: { bruttoScore: "desc" },
    });

    // Format für Frontend
    const formatted = riskThreats.map((rt) => ({
      id: rt.id,
      assetId: rt.assetId,
      assetName: rt.asset.name,
      assetCategory: rt.asset.category,
      threatCode: rt.threat.code,
      threatName: rt.threat.name,
      bruttoProbability: rt.bruttoProbability,
      bruttoImpact: rt.bruttoImpact,
      bruttoScore: rt.bruttoScore,
      nettoScore: rt.nettoScore,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Failed to fetch risk matrix data:", error);
    return NextResponse.json(
      { error: "Failed to fetch risk matrix data" },
      { status: 500 }
    );
  }
}
