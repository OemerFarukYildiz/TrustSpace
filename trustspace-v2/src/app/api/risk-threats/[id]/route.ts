import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/risk-threats/[id] - Einzelnes Risk Threat laden
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rt = await prisma.riskThreat.findUnique({
      where: { id },
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            category: true,
            ciaAverage: true,
            confidentiality: true,
            integrity: true,
            availability: true,
          },
        },
        threat: {
          select: { code: true, name: true, description: true, category: true },
        },
      },
    });
    if (!rt) {
      return NextResponse.json({ error: "Risk threat not found" }, { status: 404 });
    }

    const ciaAverage = rt.asset.ciaAverage ?? 0;
    const v1BruttoScore = ciaAverage > 0
      ? parseFloat((ciaAverage * rt.schadenStufe * rt.wahrscheinlichkeitStufe).toFixed(2))
      : rt.bruttoScore;
    const v1NettoScore = ciaAverage > 0
      ? parseFloat((ciaAverage * rt.nettoSchadenStufe * rt.nettoWahrscheinlichkeitStufe).toFixed(2))
      : rt.nettoScore;

    return NextResponse.json({
      id: rt.id,
      schadenStufe: rt.schadenStufe,
      wahrscheinlichkeitStufe: rt.wahrscheinlichkeitStufe,
      nettoSchadenStufe: rt.nettoSchadenStufe,
      nettoWahrscheinlichkeitStufe: rt.nettoWahrscheinlichkeitStufe,
      schadenInEuro: rt.schadenInEuro,
      v1BruttoScore,
      v1NettoScore,
      controlsMapped: rt.mappedControls || "[]",
      // Risikobehandlung
      riskTreatment: rt.riskTreatment || null,
      status: rt.status || null,
      treatmentPlan: rt.treatmentPlan || null,
      treatmentDeadline: rt.treatmentDeadline || null,
      riskOwner: rt.riskOwner || null,
      threatScenario: {
        code: rt.threat.code,
        name: rt.threat.name,
        description: rt.threat.description || "",
        category: rt.threat.category || "",
      },
      asset: rt.asset,
      createdAt: rt.createdAt,
      updatedAt: rt.updatedAt,
    });
  } catch (error) {
    console.error("Failed to fetch risk threat:", error);
    return NextResponse.json({ error: "Failed to fetch risk threat" }, { status: 500 });
  }
}

// PUT /api/risk-threats/[id] - Risk Threat aktualisieren
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();

    const riskThreat = await prisma.riskThreat.findUnique({
      where: { id },
      include: { asset: true },
    });

    if (!riskThreat) {
      return NextResponse.json({ error: "Risk threat not found" }, { status: 404 });
    }

    const ciaAverage = riskThreat.asset.ciaAverage || 1;

    // V1 score calculation: ciaAverage × schadenStufe × wahrscheinlichkeitStufe
    const schadenStufe = data.schadenStufe ?? riskThreat.schadenStufe;
    const wahrscheinlichkeitStufe = data.wahrscheinlichkeitStufe ?? riskThreat.wahrscheinlichkeitStufe;
    const nettoSchadenStufe = data.nettoSchadenStufe ?? riskThreat.nettoSchadenStufe;
    const nettoWahrscheinlichkeitStufe = data.nettoWahrscheinlichkeitStufe ?? riskThreat.nettoWahrscheinlichkeitStufe;

    const bruttoScore = Math.round(ciaAverage * schadenStufe * wahrscheinlichkeitStufe);
    const nettoScore = Math.round(ciaAverage * nettoSchadenStufe * nettoWahrscheinlichkeitStufe);

    const updatedRiskThreat = await prisma.riskThreat.update({
      where: { id },
      data: {
        // Legacy
        bruttoProbability: data.bruttoProbability ?? riskThreat.bruttoProbability,
        bruttoImpact: data.bruttoImpact ?? riskThreat.bruttoImpact,
        bruttoScore,
        nettoProbability: data.nettoProbability ?? riskThreat.nettoProbability,
        nettoImpact: data.nettoImpact ?? riskThreat.nettoImpact,
        nettoScore,
        // V1
        schadenStufe,
        wahrscheinlichkeitStufe,
        nettoSchadenStufe,
        nettoWahrscheinlichkeitStufe,
        schadenInEuro: data.schadenInEuro !== undefined ? data.schadenInEuro : riskThreat.schadenInEuro,
        // V2
        schadenklasse: data.schadenklasse !== undefined ? data.schadenklasse : riskThreat.schadenklasse,
        wahrscheinlichkeitV2: data.wahrscheinlichkeitV2 !== undefined ? data.wahrscheinlichkeitV2 : riskThreat.wahrscheinlichkeitV2,
        nettoSchadenklasse: data.nettoSchadenklasse !== undefined ? data.nettoSchadenklasse : riskThreat.nettoSchadenklasse,
        nettoWahrscheinlichkeitV2: data.nettoWahrscheinlichkeitV2 !== undefined ? data.nettoWahrscheinlichkeitV2 : riskThreat.nettoWahrscheinlichkeitV2,
        // Controls
        mappedControls: data.mappedControls !== undefined ? data.mappedControls : riskThreat.mappedControls,
        // Risikobehandlung
        riskTreatment: data.riskTreatment !== undefined ? data.riskTreatment : riskThreat.riskTreatment,
        status: data.status !== undefined ? data.status : riskThreat.status,
        treatmentPlan: data.treatmentPlan !== undefined ? data.treatmentPlan : riskThreat.treatmentPlan,
        treatmentDeadline: data.treatmentDeadline !== undefined
          ? (data.treatmentDeadline ? new Date(data.treatmentDeadline) : null)
          : riskThreat.treatmentDeadline,
        riskOwner: data.riskOwner !== undefined ? data.riskOwner : riskThreat.riskOwner,
      },
    });

    // Markiere Schritt 4 als abgeschlossen wenn Netto berechnet
    if (nettoScore > 0 && nettoSchadenStufe > 1) {
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
    await prisma.riskThreat.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete risk threat:", error);
    return NextResponse.json({ error: "Failed to delete risk threat" }, { status: 500 });
  }
}
