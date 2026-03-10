import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const ORG_ID = "default-org";

// GET /api/v2/risks/[id] - Einzelnes V2 Risiko
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const risk = await prisma.riskV2.findFirst({
      where: { id, organizationId: ORG_ID },
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            category: true,
            ciaScore: true,
            confidentiality: true,
            integrity: true,
            availability: true,
          },
        },
      },
    });

    if (!risk) {
      return NextResponse.json({ error: "Risk not found" }, { status: 404 });
    }

    return NextResponse.json(risk);
  } catch (error) {
    console.error("Failed to fetch V2 risk:", error);
    return NextResponse.json(
      { error: "Failed to fetch V2 risk" },
      { status: 500 }
    );
  }
}

// PUT /api/v2/risks/[id] - V2 Risiko aktualisieren
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();

    const existing = await prisma.riskV2.findFirst({
      where: { id, organizationId: ORG_ID },
    });

    if (!existing) {
      return NextResponse.json({ error: "Risk not found" }, { status: 404 });
    }

    // Fetch asset CIA (capped 1-3)
    const assetId = data.assetId ?? existing.assetId;
    let ciaScore = 1;
    if (assetId) {
      const assetData = await prisma.assetV2.findUnique({
        where: { id: assetId },
        select: { ciaScore: true },
      });
      ciaScore = Math.max(1, Math.min(3, Math.round(assetData?.ciaScore ?? 1)));
    }

    // New formula: CIA × SLE × ARO
    const singleLossExpectancy = data.singleLossExpectancy ?? existing.singleLossExpectancy;
    const annualRateOccurrence = data.annualRateOccurrence ?? existing.annualRateOccurrence;
    const bruttoScore =
      singleLossExpectancy != null && annualRateOccurrence != null
        ? parseFloat((ciaScore * singleLossExpectancy * annualRateOccurrence).toFixed(2))
        : existing.bruttoScore;
    const annualLossExpectancy = bruttoScore;

    // Netto: CIA × NettoSLE × NettoARO
    const nettoSLE = data.nettoSLE ?? existing.nettoSLE;
    const nettoARO = data.nettoARO ?? existing.nettoARO;
    const nettoScore =
      nettoSLE != null && nettoARO != null
        ? parseFloat((ciaScore * nettoSLE * nettoARO).toFixed(2))
        : existing.nettoScore;
    const nettoALE = nettoScore;

    // Passthrough probability/impact (keep for schema compatibility)
    const bruttoProbability = data.bruttoProbability ?? existing.bruttoProbability;
    const bruttoImpact = data.bruttoImpact ?? existing.bruttoImpact;
    const nettoProbability = data.nettoProbability ?? existing.nettoProbability;
    const nettoImpact = data.nettoImpact ?? existing.nettoImpact;

    const updated = await prisma.riskV2.update({
      where: { id },
      data: {
        title: data.title ?? existing.title,
        description: data.description ?? existing.description,
        assetId,
        riskCategory: data.riskCategory ?? existing.riskCategory,
        threatSource: data.threatSource ?? existing.threatSource,
        vulnerability: data.vulnerability ?? existing.vulnerability,
        bruttoProbability,
        bruttoImpact,
        bruttoScore,
        singleLossExpectancy,
        annualRateOccurrence,
        annualLossExpectancy,
        nettoProbability,
        nettoImpact,
        nettoScore,
        nettoSLE,
        nettoARO,
        nettoALE,
        riskTreatment: data.riskTreatment ?? existing.riskTreatment,
        riskOwner: data.riskOwner ?? existing.riskOwner,
        treatmentPlan: data.treatmentPlan ?? existing.treatmentPlan,
        treatmentDeadline: data.treatmentDeadline
          ? new Date(data.treatmentDeadline)
          : existing.treatmentDeadline,
        status: data.status ?? existing.status,
        mappedControls:
          data.mappedControls !== undefined
            ? JSON.stringify(data.mappedControls)
            : existing.mappedControls,
      },
      include: {
        asset: {
          select: { id: true, name: true, category: true, ciaScore: true },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update V2 risk:", error);
    return NextResponse.json(
      { error: "Failed to update V2 risk" },
      { status: 500 }
    );
  }
}

// DELETE /api/v2/risks/[id] - V2 Risiko loeschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.riskV2.findFirst({
      where: { id, organizationId: ORG_ID },
    });

    if (!existing) {
      return NextResponse.json({ error: "Risk not found" }, { status: 404 });
    }

    await prisma.riskV2.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete V2 risk:", error);
    return NextResponse.json(
      { error: "Failed to delete V2 risk" },
      { status: 500 }
    );
  }
}
