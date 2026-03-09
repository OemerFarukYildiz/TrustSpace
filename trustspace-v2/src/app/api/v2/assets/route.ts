import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const ORG_ID = "default-org";

// GET /api/v2/assets - Alle V2 Assets auflisten
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    const where: Record<string, unknown> = {
      organizationId: ORG_ID,
    };

    if (category) {
      where.category = category;
    }

    const assets = await prisma.assetV2.findMany({
      where,
      include: {
        _count: {
          select: { risksV2: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(assets);
  } catch (error) {
    console.error("Failed to fetch V2 assets:", error);
    return NextResponse.json(
      { error: "Failed to fetch V2 assets" },
      { status: 500 }
    );
  }
}

// POST /api/v2/assets - Neues V2 Asset erstellen
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const confidentiality = data.confidentiality || 0;
    const integrity = data.integrity || 0;
    const availability = data.availability || 0;
    const ciaScore =
      confidentiality > 0 && integrity > 0 && availability > 0
        ? (confidentiality + integrity + availability) / 3
        : 0;

    const asset = await prisma.assetV2.create({
      data: {
        organizationId: ORG_ID,
        name: data.name,
        description: data.description || null,
        category: data.category,
        subCategory: data.subCategory || null,
        ownerId: data.ownerId || null,
        department: data.department || null,
        confidentiality,
        integrity,
        availability,
        ciaScore,
        replacementCost: data.replacementCost ?? null,
        revenueImpact: data.revenueImpact ?? null,
        dataClassification: data.dataClassification || "internal",
        status: data.status || "active",
        location: data.location || null,
      },
    });

    return NextResponse.json(asset, { status: 201 });
  } catch (error) {
    console.error("Failed to create V2 asset:", error);
    return NextResponse.json(
      { error: "Failed to create V2 asset" },
      { status: 500 }
    );
  }
}
