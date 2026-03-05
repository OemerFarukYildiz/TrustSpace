import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/assets - Liste aller Assets mit Filter nach Kategorie
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    // Kategorie-Mapping
    const categoryMapping: Record<string, string> = {
      processes: "process",
      software: "software",
      hardware: "hardware",
      locations: "location",
      suppliers: "supplier",
    };

    const where = category ? {
      category: categoryMapping[category] || category,
    } : {};

    const assets = await prisma.asset.findMany({
      where,
      include: {
        owner: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            riskThreats: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Format für Frontend
    const formatted = assets.map((asset) => ({
      id: asset.id,
      name: asset.name,
      createdAt: asset.createdAt,
      ciaAverage: asset.ciaAverage,
      owner: asset.owner,
      riskCount: asset._count.riskThreats,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Failed to fetch assets:", error);
    return NextResponse.json({ error: "Failed to fetch assets" }, { status: 500 });
  }
}

// POST /api/assets - Neues Asset erstellen
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    console.log("Creating asset with data:", data);

    // Validierung
    if (!data.name || data.name.trim() === "") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Prüfe ob Organization existiert, falls nicht erstelle default
    const org = await prisma.organization.findUnique({
      where: { id: "default" },
    });

    if (!org) {
      console.log("Creating default organization...");
      await prisma.organization.create({
        data: {
          id: "default",
          name: "Default Organization",
        },
      });
    }

    const asset = await prisma.asset.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || "",
        type: data.type || "primary",
        category: data.category || "process",
        ownerId: data.ownerId || null,
        department: data.department || null,
        organizationId: "default",
        confidentiality: 0,
        integrity: 0,
        availability: 0,
        ciaAverage: 0,
      },
    });

    console.log("Asset created:", asset);
    return NextResponse.json(asset);
  } catch (error: any) {
    console.error("Failed to create asset:", error);
    return NextResponse.json({ 
      error: "Failed to create asset", 
      details: error.message 
    }, { status: 500 });
  }
}
