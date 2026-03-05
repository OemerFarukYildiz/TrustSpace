import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/assets/[id] - Einzelnes Asset mit allen Details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const asset = await prisma.asset.findUnique({
      where: { id: params.id },
      include: {
        owner: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    // Verfügbare Assets für Verknüpfung (andere Assets außer diesem)
    const availableAssets = await prisma.asset.findMany({
      where: {
        id: { not: params.id },
        NOT: {
          linkedTo: {
            some: {
              primaryId: params.id,
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        category: true,
      },
    });

    return NextResponse.json({
      ...asset,
      availableAssets,
    });
  } catch (error) {
    console.error("Failed to fetch asset:", error);
    return NextResponse.json({ error: "Failed to fetch asset" }, { status: 500 });
  }
}

// PUT /api/assets/[id] - Asset aktualisieren
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    
    // Berechne CIA Average
    let ciaAverage = 0;
    if (data.confidentiality && data.integrity && data.availability) {
      ciaAverage = (data.confidentiality + data.integrity + data.availability) / 3;
    }

    const asset = await prisma.asset.update({
      where: { id: params.id },
      data: {
        name: data.name,
        description: data.description,
        category: data.category,
        ownerId: data.ownerId,
        department: data.department,
        confidentiality: data.confidentiality,
        integrity: data.integrity,
        availability: data.availability,
        ciaAverage,
        step1Completed: data.step1Completed,
        step2Completed: data.step2Completed,
        step3Completed: data.step3Completed,
        step4Completed: data.step4Completed,
        step5Completed: data.step5Completed,
      },
    });

    return NextResponse.json(asset);
  } catch (error) {
    console.error("Failed to update asset:", error);
    return NextResponse.json({ error: "Failed to update asset" }, { status: 500 });
  }
}

// DELETE /api/assets/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.asset.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete asset:", error);
    return NextResponse.json({ error: "Failed to delete asset" }, { status: 500 });
  }
}
