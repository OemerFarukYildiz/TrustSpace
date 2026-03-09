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

    const bruttoProbability = data.bruttoProbability || 1;
    const bruttoImpact = data.bruttoImpact || 1;
    const bruttoScore = bruttoProbability * bruttoImpact;

    const singleLossExpectancy = data.singleLossExpectancy ?? null;
    const annualRateOccurrence = data.annualRateOccurrence ?? null;
    const annualLossExpectancy =
      singleLossExpectancy != null && annualRateOccurrence != null
        ? singleLossExpectancy * annualRateOccurrence
        : null;

    const nettoProbability = data.nettoProbability || 1;
    const nettoImpact = data.nettoImpact || 1;
    const nettoScore = nettoProbability * nettoImpact;

    const nettoSLE = data.nettoSLE ?? null;
    const nettoARO = data.nettoARO ?? null;
    const nettoALE =
      nettoSLE != null && nettoARO != null ? nettoSLE * nettoARO : null;

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
