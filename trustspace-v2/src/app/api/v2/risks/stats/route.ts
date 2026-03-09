import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const ORG_ID = "default-org";

function getRiskLevel(score: number): string {
  if (score >= 80) return "critical";
  if (score >= 50) return "high";
  if (score >= 25) return "medium";
  if (score >= 10) return "low";
  return "minimal";
}

// GET /api/v2/risks/stats - Dashboard-Statistiken fuer V2 Risiken
export async function GET() {
  try {
    const risks = await prisma.riskV2.findMany({
      where: { organizationId: ORG_ID },
    });

    const totalRisks = risks.length;

    // Risiken nach Kategorie
    const byCategory = {
      operational: 0,
      strategic: 0,
      compliance: 0,
      financial: 0,
      technical: 0,
    };
    for (const risk of risks) {
      const cat = risk.riskCategory as keyof typeof byCategory;
      if (cat in byCategory) {
        byCategory[cat]++;
      }
    }

    // Risiken nach Status
    const byStatus = {
      identified: 0,
      assessed: 0,
      treated: 0,
      monitored: 0,
      closed: 0,
    };
    for (const risk of risks) {
      const st = risk.status as keyof typeof byStatus;
      if (st in byStatus) {
        byStatus[st]++;
      }
    }

    // ALE-Gesamtwerte
    let totalALE = 0;
    let totalNettoALE = 0;
    for (const risk of risks) {
      if (risk.annualLossExpectancy != null) {
        totalALE += risk.annualLossExpectancy;
      }
      if (risk.nettoALE != null) {
        totalNettoALE += risk.nettoALE;
      }
    }

    // Durchschnittlicher Risiko-Score
    const averageScore =
      totalRisks > 0
        ? Math.round(
            risks.reduce((sum, r) => sum + r.bruttoScore, 0) / totalRisks
          )
        : 0;

    // Risikoverteilung (Brutto-Score basiert)
    const distribution = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      minimal: 0,
    };
    for (const risk of risks) {
      const level = getRiskLevel(risk.bruttoScore) as keyof typeof distribution;
      distribution[level]++;
    }

    return NextResponse.json({
      totalRisks,
      byCategory,
      byStatus,
      totalALE: Math.round(totalALE * 100) / 100,
      totalNettoALE: Math.round(totalNettoALE * 100) / 100,
      averageScore,
      distribution,
    });
  } catch (error) {
    console.error("Failed to fetch risk stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch risk stats" },
      { status: 500 }
    );
  }
}
