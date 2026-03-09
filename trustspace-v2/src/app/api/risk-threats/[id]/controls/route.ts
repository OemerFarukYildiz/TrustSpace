import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// PUT /api/risk-threats/[id]/controls - Gemappte Controls aktualisieren
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { controlIds } = (await request.json()) as { controlIds: string[] };

    if (!controlIds || !Array.isArray(controlIds)) {
      return NextResponse.json(
        { error: "controlIds array is required" },
        { status: 400 }
      );
    }

    const riskThreat = await prisma.riskThreat.findUnique({
      where: { id },
    });

    if (!riskThreat) {
      return NextResponse.json(
        { error: "Risk threat not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.riskThreat.update({
      where: { id },
      data: {
        mappedControls: JSON.stringify(controlIds),
      },
    });

    // Wenn Controls gemappt sind, markiere step5Completed am Asset
    if (controlIds.length > 0) {
      await prisma.asset.update({
        where: { id: riskThreat.assetId },
        data: { step5Completed: true },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update mapped controls:", error);
    return NextResponse.json(
      { error: "Failed to update mapped controls" },
      { status: 500 }
    );
  }
}
