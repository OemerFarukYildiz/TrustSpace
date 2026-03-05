import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/threats - Alle verfügbaren Threat Scenarios
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const assetId = searchParams.get("assetId");

    // Hole alle Threat Scenarios
    const allThreats = await prisma.threatScenario.findMany({
      orderBy: { code: "asc" },
    });

    // Wenn assetId angegeben, markiere bereits zugewiesene
    if (assetId) {
      const assignedThreatIds = await prisma.riskThreat.findMany({
        where: { assetId },
        select: { threatId: true },
      });
      const assignedIds = new Set(assignedThreatIds.map(at => at.threatId));

      const threatsWithStatus = allThreats.map(t => ({
        ...t,
        alreadyAssigned: assignedIds.has(t.id),
      }));

      return NextResponse.json(threatsWithStatus);
    }

    return NextResponse.json(allThreats);
  } catch (error) {
    console.error("Failed to fetch threats:", error);
    return NextResponse.json({ error: "Failed to fetch threats" }, { status: 500 });
  }
}

// POST /api/threats/seed - Standard Threat Scenarios seeden (einmalig)
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Prüfe ob Threat schon existiert
    const existing = await prisma.threatScenario.findFirst({
      where: { code: data.code },
    });

    if (existing) {
      return NextResponse.json({ error: "Threat with this code already exists" }, { status: 400 });
    }

    const threat = await prisma.threatScenario.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
        category: data.category,
        organizationId: data.organizationId || "default",
      },
    });

    return NextResponse.json(threat);
  } catch (error) {
    console.error("Failed to create threat:", error);
    return NextResponse.json({ error: "Failed to create threat" }, { status: 500 });
  }
}
