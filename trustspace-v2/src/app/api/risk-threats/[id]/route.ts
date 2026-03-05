import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// PUT /api/risk-threats/[id] - Risk Threat aktualisieren (Netto Berechnung)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();

    // Berechne Netto Score
    const nettoScore = (data.nettoProbability || 1) * (data.nettoImpact || 1);

    const riskThreat = await prisma.riskThreat.update({
      where: { id: params.id },
      data: {
        nettoProbability: data.nettoProbability,
        nettoImpact: data.nettoImpact,
        nettoScore,
        mappedControls: data.mappedControls,
      },
    });

    // Wenn Netto Score berechnet wurde, markiere Schritt 4 als abgeschlossen
    if (nettoScore > 0) {
      await prisma.asset.update({
        where: { id: riskThreat.assetId },
        data: { step4Completed: true },
      });
    }

    return NextResponse.json(riskThreat);
  } catch (error) {
    console.error("Failed to update risk threat:", error);
    return NextResponse.json({ error: "Failed to update risk threat" }, { status: 500 });
  }
}

// DELETE /api/risk-threats/[id] - Risk Threat löschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.riskThreat.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete risk threat:", error);
    return NextResponse.json({ error: "Failed to delete risk threat" }, { status: 500 });
  }
}
