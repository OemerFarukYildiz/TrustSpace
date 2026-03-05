import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/hardware - Liste aller Hardware-Assets
export async function GET() {
  try {
    const hardware = await prisma.asset.findMany({
      where: {
        category: "hardware",
        type: "primary",
      },
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
    const formatted = hardware.map((asset) => ({
      id: asset.id,
      name: asset.name,
      type: extractHardwareType(asset.name),
      manufacturer: extractManufacturer(asset.description),
      model: extractModel(asset.description),
      serialNumber: extractSerialNumber(asset.description) || "N/A",
      location: asset.department || "Unknown",
      status: "active", // Default, später aus DB
      purchaseDate: asset.createdAt,
      warrantyEnd: null,
      assignedTo: asset.owner
        ? `${asset.owner.firstName} ${asset.owner.lastName}`
        : null,
      ipAddress: null,
      macAddress: null,
      ciaAverage: asset.ciaAverage,
      riskCount: asset._count.riskThreats,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Failed to fetch hardware:", error);
    return NextResponse.json(
      { error: "Failed to fetch hardware" },
      { status: 500 }
    );
  }
}

// POST /api/hardware - Neues Hardware-Asset erstellen
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Validierung
    if (!data.name || data.name.trim() === "") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Beschreibung mit Hardware-Details aufbauen
    const description = JSON.stringify({
      type: data.type,
      manufacturer: data.manufacturer,
      model: data.model,
      serialNumber: data.serialNumber,
      location: data.location,
      ipAddress: data.ipAddress,
      macAddress: data.macAddress,
      purchaseDate: data.purchaseDate,
      warrantyEnd: data.warrantyEnd,
      customDescription: data.description,
    });

    const asset = await prisma.asset.create({
      data: {
        name: data.name.trim(),
        description,
        type: "primary",
        category: "hardware",
        ownerId: data.ownerId || null,
        department: data.location || null,
        organizationId: "default",
        confidentiality: 0,
        integrity: 0,
        availability: 0,
        ciaAverage: 0,
      },
    });

    return NextResponse.json(asset);
  } catch (error: any) {
    console.error("Failed to create hardware:", error);
    return NextResponse.json(
      { error: "Failed to create hardware", details: error.message },
      { status: 500 }
    );
  }
}

// Hilfsfunktionen zum Parsen der Beschreibung
function extractHardwareType(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("server")) return "server";
  if (lower.includes("laptop")) return "laptop";
  if (lower.includes("desktop") || lower.includes("pc")) return "desktop";
  if (lower.includes("printer")) return "printer";
  if (lower.includes("storage") || lower.includes("nas")) return "storage";
  if (lower.includes("router") || lower.includes("switch")) return "network";
  if (lower.includes("phone") || lower.includes("tablet")) return "mobile";
  return "server";
}

function extractManufacturer(description: string | null): string {
  if (!description) return "Unknown";
  try {
    const data = JSON.parse(description);
    return data.manufacturer || "Unknown";
  } catch {
    return "Unknown";
  }
}

function extractModel(description: string | null): string {
  if (!description) return "";
  try {
    const data = JSON.parse(description);
    return data.model || "";
  } catch {
    return "";
  }
}

function extractSerialNumber(description: string | null): string | null {
  if (!description) return null;
  try {
    const data = JSON.parse(description);
    return data.serialNumber || null;
  } catch {
    return null;
  }
}
