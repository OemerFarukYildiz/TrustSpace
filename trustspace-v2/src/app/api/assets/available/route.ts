import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/assets/available?excludeId=xxx - Alle verfügbaren Assets zum Verknüpfen
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const excludeId = searchParams.get("excludeId");

    if (!excludeId) {
      return NextResponse.json(
        { error: "excludeId is required" },
        { status: 400 }
      );
    }

    // Hole bereits verknüpfte Asset IDs
    const existingLinks = await prisma.linkedAsset.findMany({
      where: { primaryId: excludeId },
      select: { secondaryId: true },
    });
    const linkedIds = existingLinks.map((l) => l.secondaryId);

    // Alle Assets außer dem aktuellen und bereits verknüpften
    const availableAssets = await prisma.asset.findMany({
      where: {
        id: { not: excludeId },
        NOT: {
          id: { in: linkedIds },
        },
      },
      select: {
        id: true,
        name: true,
        category: true,
        type: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(availableAssets);
  } catch (error) {
    console.error("Failed to fetch available assets:", error);
    return NextResponse.json(
      { error: "Failed to fetch available assets" },
      { status: 500 }
    );
  }
}
