import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/risk-threats?assetId=xxx - Alle Risk-Threats für ein Asset
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const assetId = searchParams.get("assetId");

    if (!assetId) {
      return NextResponse.json({ error: "assetId required" }, { status: 400 });
    }

    const riskThreats = await prisma.riskThreat.findMany({
      where: { assetId },
      include: {
        threat: {
          select: {
            code: true,
            name: true,
            description: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Format für Frontend
    const formatted = riskThreats.map((rt) => ({
      id: rt.id,
      bruttoProbability: rt.bruttoProbability,
      bruttoImpact: rt.bruttoImpact,
      bruttoScore: rt.bruttoScore,
      nettoProbability: rt.nettoProbability,
      nettoImpact: rt.nettoImpact,
      nettoScore: rt.nettoScore,
      controlsMapped: rt.mappedControls || "[]",
      threatScenario: {
        code: rt.threat.code,
        name: rt.threat.name,
        description: rt.threat.description || "",
      },
    }));

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
    
    // Berechne Brutto Score
    const bruttoScore = data.bruttoProbability * data.bruttoImpact;
    
    const riskThreat = await prisma.riskThreat.create({
      data: {
        assetId: data.assetId,
        threatId: data.threatId,
        organizationId: data.organizationId || "default",
        bruttoProbability: data.bruttoProbability || 1,
        bruttoImpact: data.bruttoImpact || 1,
        bruttoScore,
        nettoProbability: data.nettoProbability || 1,
        nettoImpact: data.nettoImpact || 1,
        nettoScore: data.nettoProbability && data.nettoImpact 
          ? data.nettoProbability * data.nettoImpact 
          : 1,
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
