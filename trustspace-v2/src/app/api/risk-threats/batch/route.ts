import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface BatchUpdate {
  id: string;
  bruttoProbability: number;
  bruttoImpact: number;
  nettoProbability?: number;
  nettoImpact?: number;
}

// PUT /api/risk-threats/batch - Batch-Update mehrerer Risk-Threats
export async function PUT(request: NextRequest) {
  try {
    const { updates } = (await request.json()) as { updates: BatchUpdate[] };

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: "updates array is required and must not be empty" },
        { status: 400 }
      );
    }

    const results = [];
    const assetIdsToMark: Set<string> = new Set();

    for (const update of updates) {
      // Hole den RiskThreat mit Asset fuer CIA-Berechnung
      const riskThreat = await prisma.riskThreat.findUnique({
        where: { id: update.id },
        include: { asset: true },
      });

      if (!riskThreat) {
        console.warn(`RiskThreat ${update.id} not found, skipping`);
        continue;
      }

      const ciaFactor = riskThreat.asset.ciaAverage || 1;

      const bruttoProbability = update.bruttoProbability;
      const bruttoImpact = update.bruttoImpact;
      const bruttoScore = Math.round(bruttoProbability * bruttoImpact * ciaFactor);

      const nettoProbability = update.nettoProbability ?? riskThreat.nettoProbability;
      const nettoImpact = update.nettoImpact ?? riskThreat.nettoImpact;
      const nettoScore = Math.round(nettoProbability * nettoImpact * ciaFactor);

      const updated = await prisma.riskThreat.update({
        where: { id: update.id },
        data: {
          bruttoProbability,
          bruttoImpact,
          bruttoScore,
          nettoProbability,
          nettoImpact,
          nettoScore,
        },
      });

      results.push(updated);

      // Markiere Asset als step4Completed wenn Scores > 0
      if (bruttoScore > 0 || nettoScore > 0) {
        assetIdsToMark.add(riskThreat.assetId);
      }
    }

    // Markiere step4Completed fuer alle betroffenen Assets
    for (const assetId of assetIdsToMark) {
      await prisma.asset.update({
        where: { id: assetId },
        data: { step4Completed: true },
      });
    }

    return NextResponse.json({ updated: results, count: results.length });
  } catch (error) {
    console.error("Failed to batch update risk threats:", error);
    return NextResponse.json(
      { error: "Failed to batch update risk threats" },
      { status: 500 }
    );
  }
}
