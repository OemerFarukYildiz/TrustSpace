import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/simulations/scenarios - List all available simulation scenarios
export async function GET() {
  try {
    const scenarios = await prisma.simulationScenario.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        code: true,
        title: true,
        description: true,
        category: true,
        difficulty: true,
        estimatedMinutes: true,
        decisionTree: true,
        createdAt: true,
        _count: {
          select: { sessions: true },
        },
      },
    });

    return NextResponse.json(scenarios);
  } catch (error) {
    console.error("Failed to fetch simulation scenarios:", error);
    return NextResponse.json(
      { error: "Szenarien konnten nicht geladen werden" },
      { status: 500 }
    );
  }
}
