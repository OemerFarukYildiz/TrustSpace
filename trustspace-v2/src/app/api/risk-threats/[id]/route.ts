import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// PUT /api/risk-threats/[id] - Risk Threat aktualisieren (Vollständige Berechnung mit CIA)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();

    // Hole das Asset um CIA-Werte zu bekommen
    const riskThreat = await prisma.riskThreat.findUnique({
      where: { id },
      include: { asset: true },
    });

    if (!riskThreat) {
      return NextResponse.json({ error: "Risk threat not found" }, { status: 404 });
    }

    const ciaFactor = riskThreat.asset.ciaAverage || 1;

    // Berechne Scores mit CIA-Werten (Wahrscheinlichkeit × Schadenshöhe × CIA-Durchschnitt)
    const bruttoScore = data.bruttoScore || Math.round((data.bruttoProbability || 1) * (data.bruttoImpact || 1) * ciaFactor);
    const nettoScore = data.nettoScore || Math.round((data.nettoProbability || 1) * (data.nettoImpact || 1) * ciaFactor);

    const updatedRiskThreat = await prisma.riskThreat.update({
      where: { id },
      data: {
        bruttoProbability: data.bruttoProbability,
        bruttoImpact: data.bruttoImpact,
        bruttoScore,
        nettoProbability: data.nettoProbability,
        nettoImpact: data.nettoImpact,
        nettoScore,
        mappedControls: data.mappedControls || riskThreat.mappedControls,
      },
    });

    // Wenn beide Scores berechnet wurden, markiere Schritt 4 als abgeschlossen
    if (bruttoScore > 0 && nettoScore > 0) {
      await prisma.asset.update({
        where: { id: riskThreat.assetId },
        data: { step4Completed: true },
      });
    }

    return NextResponse.json(updatedRiskThreat);
  } catch (error) {
    console.error("Failed to update risk threat:", error);
    return NextResponse.json({ error: "Failed to update risk threat" }, { status: 500 });
  }
}

// DELETE /api/risk-threats/[id] - Risk Threat löschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.riskThreat.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete risk threat:", error);
    return NextResponse.json({ error: "Failed to delete risk threat" }, { status: 500 });
  }
}
