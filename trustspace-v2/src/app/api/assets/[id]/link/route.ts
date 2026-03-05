import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST /api/assets/[id]/link - Asset verknüpfen
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { secondaryId } = await request.json();
    
    const link = await prisma.linkedAsset.create({
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

    return NextResponse.json(link);
  } catch (error) {
    console.error("Failed to link asset:", error);
    return NextResponse.json({ error: "Failed to link asset" }, { status: 500 });
  }
}

// DELETE /api/assets/[id]/link - Verknüpfung entfernen
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { secondaryId } = await request.json();
    
    await prisma.linkedAsset.deleteMany({
      where: {
        primaryId: params.id,
        secondaryId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to unlink asset:", error);
    return NextResponse.json({ error: "Failed to unlink asset" }, { status: 500 });
  }
}
