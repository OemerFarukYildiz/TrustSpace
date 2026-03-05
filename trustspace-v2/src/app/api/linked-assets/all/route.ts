import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/linked-assets/all - Alle Linked Assets mit Details
export async function GET() {
  try {
    const linkedAssets = await prisma.linkedAsset.findMany({
      include: {
        primaryAsset: {
          select: {
            id: true,
            name: true,
            category: true,
            ciaAverage: true,
          },
        },
        secondaryAsset: {
          select: {
            id: true,
            name: true,
            category: true,
            ciaAverage: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(linkedAssets);
  } catch (error) {
    console.error("Failed to fetch linked assets:", error);
    return NextResponse.json({ error: "Failed to fetch linked assets" }, { status: 500 });
  }
}
