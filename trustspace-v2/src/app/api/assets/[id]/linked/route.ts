import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/assets/[id]/linked - Alle verknüpften Assets für ein Asset
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const linkedAssets = await prisma.linkedAsset.findMany({
      where: { primaryId: params.id },
      include: {
        secondaryAsset: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Format für Frontend
    const formatted = linkedAssets.map((la) => ({
      id: la.id,
      asset: {
        id: la.secondaryAsset.id,
        name: la.secondaryAsset.name,
      },
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Failed to fetch linked assets:", error);
    return NextResponse.json({ error: "Failed to fetch linked assets" }, { status: 500 });
  }
}

// POST /api/assets/[id]/linked - Asset verknüpfen
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { secondaryId } = await request.json();

    const linkedAsset = await prisma.linkedAsset.create({
      data: {
        primaryId: params.id,
        secondaryId,
        organizationId: "default",
      },
    });

    // Markiere Schritt 2 als abgeschlossen
    await prisma.asset.update({
      where: { id: params.id },
      data: { step2Completed: true },
    });

    return NextResponse.json(linkedAsset);
  } catch (error) {
    console.error("Failed to link asset:", error);
    return NextResponse.json({ error: "Failed to link asset" }, { status: 500 });
  }
}

// DELETE /api/assets/[id]/linked - Verknüpfung entfernen
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const linkedAssetId = searchParams.get("linkedAssetId");

    if (!linkedAssetId) {
      return NextResponse.json({ error: "linkedAssetId required" }, { status: 400 });
    }

    await prisma.linkedAsset.delete({
      where: { id: linkedAssetId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to unlink asset:", error);
    return NextResponse.json({ error: "Failed to unlink asset" }, { status: 500 });
  }
}
