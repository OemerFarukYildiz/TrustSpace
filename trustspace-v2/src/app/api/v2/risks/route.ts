import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const ORG_ID = "default-org";

// GET /api/v2/risks - Alle V2 Risiken auflisten
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const assetId = searchParams.get("assetId");
    const status = searchParams.get("status");
    const riskCategory = searchParams.get("riskCategory");

    const where: Record<string, unknown> = {
      organizationId: ORG_ID,
    };

    if (assetId) {
      where.assetId = assetId;
    }
    if (status) {
      where.status = status;
    }
    if (riskCategory) {
      where.riskCategory = riskCategory;
    }

    const risks = await prisma.riskV2.findMany({
      where,
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            category: true,
            ciaScore: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(risks);
  } catch (error) {
    console.error("Failed to fetch V2 risks:", error);
    return NextResponse.json(
      { error: "Failed to fetch V2 risks" },
      { status: 500 }
    );
  }
}

// POST /api/v2/risks - Neues V2 Risiko erstellen
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Fetch asset CIA (capped 1-3)
    let ciaScore = 1;
    if (data.assetId) {
      const assetData = await prisma.assetV2.findUnique({
        where: { id: data.assetId },
        select: { ciaScore: true },
      });
      ciaScore = Math.max(1, Math.min(3, Math.round(assetData?.ciaScore ?? 1)));
    }

    // New formula: CIA × SLE × ARO
    const singleLossExpectancy = data.singleLossExpectancy ?? null;
    const annualRateOccurrence = data.annualRateOccurrence ?? null;
    const bruttoScore =
      singleLossExpectancy != null && annualRateOccurrence != null
        ? parseFloat((ciaScore * singleLossExpectancy * annualRateOccurrence).toFixed(2))
        : 0;
    const annualLossExpectancy = bruttoScore > 0 ? bruttoScore : null;

    const nettoSLE = data.nettoSLE ?? null;
    const nettoARO = data.nettoARO ?? null;
    const nettoScore =
      nettoSLE != null && nettoARO != null
        ? parseFloat((ciaScore * nettoSLE * nettoARO).toFixed(2))
        : 0;
    const nettoALE = nettoScore > 0 ? nettoScore : null;

    // Passthrough probability/impact (keep for schema compatibility)
    const bruttoProbability = data.bruttoProbability || 1;
    const bruttoImpact = data.bruttoImpact || 1;
    const nettoProbability = data.nettoProbability || 1;
    const nettoImpact = data.nettoImpact || 1;

    const risk = await prisma.riskV2.create({
      data: {
        organizationId: ORG_ID,
        assetId: data.assetId || null,
        title: data.title,
        description: data.description || null,
        riskCategory: data.riskCategory || "operational",
        threatSource: data.threatSource || null,
        vulnerability: data.vulnerability || null,
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
        riskTreatment: data.riskTreatment || "mitigate",
        riskOwner: data.riskOwner || null,
        treatmentPlan: data.treatmentPlan || null,
        treatmentDeadline: data.treatmentDeadline
          ? new Date(data.treatmentDeadline)
          : null,
        status: data.status || "identified",
        mappedControls: data.mappedControls
          ? JSON.stringify(data.mappedControls)
          : null,
      },
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            category: true,
            ciaScore: true,
          },
        },
      },
    });

    return NextResponse.json(risk, { status: 201 });
  } catch (error) {
    console.error("Failed to create V2 risk:", error);
    return NextResponse.json(
      { error: "Failed to create V2 risk" },
      { status: 500 }
    );
  }
}
