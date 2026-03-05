import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// PUT /api/assets/[id]/calculate-cia - CIA Werte aktualisieren
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    
    // Validierung
    const confidentiality = Math.min(3, Math.max(1, data.confidentiality || 1));
    const integrity = Math.min(3, Math.max(1, data.integrity || 1));
    const availability = Math.min(3, Math.max(1, data.availability || 1));
    
    // Berechne Durchschnitt
    const ciaAverage = (confidentiality + integrity + availability) / 3;

    // Asset aktualisieren
    const updatedAsset = await prisma.asset.update({
      where: { id: params.id },
      data: {
        confidentiality,
        integrity,
        availability,
        ciaAverage,
        step1Completed: true,
      },
    });

    return NextResponse.json(updatedAsset);
  } catch (error) {
    console.error("Failed to update CIA:", error);
    return NextResponse.json({ error: "Failed to update CIA" }, { status: 500 });
  }
}

// GET /api/assets/[id]/calculate-cia - Aktuelle CIA Werte holen
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const asset = await prisma.asset.findUnique({
      where: { id: params.id },
      select: {
        confidentiality: true,
        integrity: true,
        availability: true,
        ciaAverage: true,
      },
    });

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    return NextResponse.json(asset);
  } catch (error) {
    console.error("Failed to fetch CIA:", error);
    return NextResponse.json({ error: "Failed to fetch CIA" }, { status: 500 });
  }
}
