import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const ORG_ID = "default-org";

// GET /api/v2/assets/[id] - Einzelnes V2 Asset mit Risiken
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const asset = await prisma.assetV2.findFirst({
      where: { id, organizationId: ORG_ID },
      include: {
        risksV2: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    return NextResponse.json(asset);
  } catch (error) {
    console.error("Failed to fetch V2 asset:", error);
    return NextResponse.json(
      { error: "Failed to fetch V2 asset" },
      { status: 500 }
    );
  }
}

// PUT /api/v2/assets/[id] - V2 Asset aktualisieren
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();

    const existing = await prisma.assetV2.findFirst({
      where: { id, organizationId: ORG_ID },
    });

    if (!existing) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    // CIA-Score neu berechnen wenn sich CIA-Werte aendern
    const confidentiality = data.confidentiality ?? existing.confidentiality;
    const integrity = data.integrity ?? existing.integrity;
    const availability = data.availability ?? existing.availability;

    let ciaScore = existing.ciaScore;
    if (
      data.confidentiality !== undefined ||
      data.integrity !== undefined ||
      data.availability !== undefined
    ) {
      ciaScore =
        confidentiality > 0 && integrity > 0 && availability > 0
          ? (confidentiality + integrity + availability) / 3
          : 0;
    }

    const updated = await prisma.assetV2.update({
      where: { id },
      data: {
        name: data.name ?? existing.name,
        description: data.description ?? existing.description,
        category: data.category ?? existing.category,
        subCategory: data.subCategory ?? existing.subCategory,
        ownerId: data.ownerId ?? existing.ownerId,
        department: data.department ?? existing.department,
        confidentiality,
        integrity,
        availability,
        ciaScore,
        replacementCost: data.replacementCost ?? existing.replacementCost,
        revenueImpact: data.revenueImpact ?? existing.revenueImpact,
        dataClassification: data.dataClassification ?? existing.dataClassification,
        status: data.status ?? existing.status,
        location: data.location ?? existing.location,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update V2 asset:", error);
    return NextResponse.json(
      { error: "Failed to update V2 asset" },
      { status: 500 }
    );
  }
}

// DELETE /api/v2/assets/[id] - V2 Asset loeschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.assetV2.findFirst({
      where: { id, organizationId: ORG_ID },
    });

    if (!existing) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    await prisma.assetV2.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete V2 asset:", error);
    return NextResponse.json(
      { error: "Failed to delete V2 asset" },
      { status: 500 }
    );
  }
}
