import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/risks/activity - Aktivitäten für Dashboard Feed
export async function GET() {
  try {
    // Letzte 10 Assets die erstellt oder aktualisiert wurden
    const recentAssets = await prisma.asset.findMany({
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        ciaAverage: true,
        step1Completed: true,
        step2Completed: true,
        step3Completed: true,
        step4Completed: true,
        step5Completed: true,
        owner: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Letzte RiskThreats
    const recentRiskThreats = await prisma.riskThreat.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        asset: {
          select: {
            id: true,
            name: true,
          },
        },
        threat: {
          select: {
            code: true,
            name: true,
          },
        },
      },
    });

    // Kombiniere und formatiere Aktivitäten
    const activities = [];

    for (const asset of recentAssets) {
      // Asset erstellt
      activities.push({
        id: `asset-created-${asset.id}`,
        type: "asset_created",
        message: `Asset "${asset.name}" was created`,
        timestamp: asset.createdAt,
        assetId: asset.id,
        icon: "plus",
      });

      // CIA berechnet
      if (asset.step1Completed && asset.ciaAverage > 0) {
        activities.push({
          id: `cia-calculated-${asset.id}`,
          type: "cia_calculated",
          message: `CIA calculated for "${asset.name}"`,
          details: `Average: ${asset.ciaAverage.toFixed(2)}`,
          timestamp: asset.updatedAt,
          assetId: asset.id,
          icon: "calculator",
        });
      }
    }

    for (const rt of recentRiskThreats) {
      activities.push({
        id: `threat-added-${rt.id}`,
        type: "threat_added",
        message: `Threat "${rt.threat.code}" added to "${rt.asset.name}"`,
        details: `Brutto: ${rt.bruttoScore}, Netto: ${rt.nettoScore}`,
        timestamp: rt.createdAt,
        assetId: rt.assetId,
        riskThreatId: rt.id,
        icon: "shield",
      });
    }

    // Sortiere nach Zeit (neueste zuerst) und nimm die ersten 10
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const topActivities = activities.slice(0, 10);

    // Kritische Risiken finden (Brutto Score >= 15)
    const criticalRisks = await prisma.riskThreat.findMany({
      where: {
        bruttoScore: { gte: 15 },
      },
      include: {
        asset: {
          select: {
            id: true,
            name: true,
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
      take: 5,
    });

    return NextResponse.json({
      activities: topActivities,
      criticalRisks,
      criticalCount: criticalRisks.length,
    });
  } catch (error) {
    console.error("Failed to fetch activity:", error);
    return NextResponse.json({ error: "Failed to fetch activity" }, { status: 500 });
  }
}
