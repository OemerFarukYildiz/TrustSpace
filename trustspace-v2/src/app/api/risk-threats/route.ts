import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/risk-threats?assetId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const assetId = searchParams.get("assetId");

    if (!assetId) {
      return NextResponse.json({ error: "assetId required" }, { status: 400 });
    }

    // Fetch asset to get ciaAverage for score display
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      select: { ciaAverage: true },
    });

    const riskThreats = await prisma.riskThreat.findMany({
      where: { assetId },
      include: {
        threat: {
          select: { code: true, name: true, description: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const ciaAverage = asset?.ciaAverage ?? 0;

    const formatted = riskThreats.map((rt) => {
      // V1 score: ciaAverage × schadenStufe × wahrscheinlichkeitStufe
      const v1BruttoScore = ciaAverage > 0
        ? parseFloat((ciaAverage * rt.schadenStufe * rt.wahrscheinlichkeitStufe).toFixed(2))
        : rt.bruttoScore;
      const v1NettoScore = ciaAverage > 0
        ? parseFloat((ciaAverage * rt.nettoSchadenStufe * rt.nettoWahrscheinlichkeitStufe).toFixed(2))
        : rt.nettoScore;

      // V2 score: schadenklasse × wahrscheinlichkeitV2
      const v2BruttoScore = rt.schadenklasse != null && rt.wahrscheinlichkeitV2 != null
        ? parseFloat((rt.schadenklasse * rt.wahrscheinlichkeitV2).toFixed(2))
        : null;
      const v2NettoScore = rt.nettoSchadenklasse != null && rt.nettoWahrscheinlichkeitV2 != null
        ? parseFloat((rt.nettoSchadenklasse * rt.nettoWahrscheinlichkeitV2).toFixed(2))
        : null;

      return {
        id: rt.id,
        // Legacy fields
        bruttoProbability: rt.bruttoProbability,
        bruttoImpact: rt.bruttoImpact,
        bruttoScore: rt.bruttoScore,
        nettoProbability: rt.nettoProbability,
        nettoImpact: rt.nettoImpact,
        nettoScore: rt.nettoScore,
        controlsMapped: rt.mappedControls || "[]",
        // V1 fields
        schadenStufe: rt.schadenStufe,
        wahrscheinlichkeitStufe: rt.wahrscheinlichkeitStufe,
        nettoSchadenStufe: rt.nettoSchadenStufe,
        nettoWahrscheinlichkeitStufe: rt.nettoWahrscheinlichkeitStufe,
        schadenInEuro: rt.schadenInEuro,
        v1BruttoScore,
        v1NettoScore,
        // V2 fields
        schadenklasse: rt.schadenklasse,
        wahrscheinlichkeitV2: rt.wahrscheinlichkeitV2,
        nettoSchadenklasse: rt.nettoSchadenklasse,
        nettoWahrscheinlichkeitV2: rt.nettoWahrscheinlichkeitV2,
        v2BruttoScore,
        v2NettoScore,
        threatScenario: {
          code: rt.threat.code,
          name: rt.threat.name,
          description: rt.threat.description || "",
        },
        createdAt: rt.createdAt,
        updatedAt: rt.updatedAt,
      };
    });

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Failed to fetch risk threats:", error);
    return NextResponse.json({ error: "Failed to fetch risk threats" }, { status: 500 });
  }
}

// POST /api/risk-threats - Bedrohung zu Asset hinzufügen
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Fetch asset ciaAverage for v1 score calculation
    const asset = await prisma.asset.findUnique({
      where: { id: data.assetId },
      select: { ciaAverage: true },
    });
    const ciaAverage = asset?.ciaAverage ?? 0;

    const schadenStufe = data.schadenStufe ?? 1;
    const wahrscheinlichkeitStufe = data.wahrscheinlichkeitStufe ?? 1;

    // V1 bruttoScore = ciaAverage × schadenStufe × wahrscheinlichkeitStufe
    const bruttoScore = ciaAverage > 0
      ? Math.round(ciaAverage * schadenStufe * wahrscheinlichkeitStufe)
      : schadenStufe * wahrscheinlichkeitStufe;

    const riskThreat = await prisma.riskThreat.create({
      data: {
        assetId: data.assetId,
        threatId: data.threatId,
        organizationId: data.organizationId || "default",
        // Legacy fields (kept for compatibility)
        bruttoProbability: data.bruttoProbability || 1,
        bruttoImpact: data.bruttoImpact || 1,
        bruttoScore,
        nettoProbability: data.nettoProbability || 1,
        nettoImpact: data.nettoImpact || 1,
        nettoScore: data.nettoProbability && data.nettoImpact
          ? data.nettoProbability * data.nettoImpact
          : 1,
        // V1 fields
        schadenStufe,
        wahrscheinlichkeitStufe,
        nettoSchadenStufe: data.nettoSchadenStufe ?? 1,
        nettoWahrscheinlichkeitStufe: data.nettoWahrscheinlichkeitStufe ?? 1,
        schadenInEuro: data.schadenInEuro ?? null,
        // V2 fields
        schadenklasse: data.schadenklasse ?? null,
        wahrscheinlichkeitV2: data.wahrscheinlichkeitV2 ?? null,
        nettoSchadenklasse: data.nettoSchadenklasse ?? null,
        nettoWahrscheinlichkeitV2: data.nettoWahrscheinlichkeitV2 ?? null,
        mappedControls: data.mappedControls || "[]",
      },
    });

    // Markiere Schritt 3 als abgeschlossen
    await prisma.asset.update({
      where: { id: data.assetId },
      data: { step3Completed: true },
    });

    return NextResponse.json(riskThreat);
  } catch (error) {
    console.error("Failed to create risk threat:", error);
    return NextResponse.json({ error: "Failed to create risk threat" }, { status: 500 });
  }
}
