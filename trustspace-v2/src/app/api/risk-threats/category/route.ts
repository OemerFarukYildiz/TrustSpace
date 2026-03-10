import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const categoryMapping: Record<string, string> = {
  processes: "process",
  software: "software",
  hardware: "hardware",
  locations: "location",
  suppliers: "supplier",
};

// GET /api/risk-threats/category?category=processes
// Returns all risk threats for all assets in a given category
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    if (!category) {
      return NextResponse.json({ error: "category required" }, { status: 400 });
    }

    const dbCategory = categoryMapping[category] || category;

    const assets = await prisma.asset.findMany({
      where: { category: dbCategory },
      select: {
        id: true,
        name: true,
        ciaAverage: true,
        confidentiality: true,
        integrity: true,
        availability: true,
        riskThreats: {
          include: {
            threat: {
              select: { code: true, name: true, description: true },
            },
          },
        },
      },
    });

    const allRiskThreats = assets.flatMap((asset) =>
      asset.riskThreats.map((rt) => {
        const v1BruttoScore = asset.ciaAverage > 0
          ? parseFloat((asset.ciaAverage * rt.schadenStufe * rt.wahrscheinlichkeitStufe).toFixed(2))
          : rt.bruttoScore;
        const v1NettoScore = asset.ciaAverage > 0
          ? parseFloat((asset.ciaAverage * rt.nettoSchadenStufe * rt.nettoWahrscheinlichkeitStufe).toFixed(2))
          : rt.nettoScore;

        return {
          id: rt.id,
          assetId: asset.id,
          assetName: asset.name,
          ciaAverage: asset.ciaAverage,
          // V1
          schadenStufe: rt.schadenStufe,
          wahrscheinlichkeitStufe: rt.wahrscheinlichkeitStufe,
          nettoSchadenStufe: rt.nettoSchadenStufe,
          nettoWahrscheinlichkeitStufe: rt.nettoWahrscheinlichkeitStufe,
          schadenInEuro: rt.schadenInEuro,
          v1BruttoScore,
          v1NettoScore,
          // V2
          schadenklasse: rt.schadenklasse,
          wahrscheinlichkeitV2: rt.wahrscheinlichkeitV2,
          v2BruttoScore: rt.schadenklasse != null && rt.wahrscheinlichkeitV2 != null
            ? parseFloat((rt.schadenklasse * rt.wahrscheinlichkeitV2).toFixed(2))
            : null,
          // Controls
          controlsMapped: rt.mappedControls || "[]",
          threatScenario: {
            code: rt.threat.code,
            name: rt.threat.name,
            description: rt.threat.description || "",
          },
          createdAt: rt.createdAt,
          updatedAt: rt.updatedAt,
        };
      })
    );

    return NextResponse.json(allRiskThreats);
  } catch (error) {
    console.error("Failed to fetch category risk threats:", error);
    return NextResponse.json({ error: "Failed to fetch risk threats" }, { status: 500 });
  }
}
