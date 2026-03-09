import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/controls/[id] - Einzelnes Control mit Details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const control = await prisma.control.findUnique({
      where: { id },
      include: {
        evidenceFiles: true,
        responsible: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!control) {
      return NextResponse.json({ error: "Control not found" }, { status: 404 });
    }

    return NextResponse.json(control);
  } catch (error) {
    console.error("Failed to fetch control:", error);
    return NextResponse.json(
      { error: "Failed to fetch control" },
      { status: 500 }
    );
  }
}

// PUT /api/controls/[id] - Control aktualisieren
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();

    const existing = await prisma.control.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Control not found" }, { status: 404 });
    }

    const updated = await prisma.control.update({
      where: { id },
      data: {
        justification: data.justification ?? existing.justification,
        notes: data.notes ?? existing.notes,
        isApplicable: data.isApplicable ?? existing.isApplicable,
        implementation: data.implementation ?? existing.implementation,
        implementationPct: data.implementationPct ?? existing.implementationPct,
        responsibleId: data.responsibleId ?? existing.responsibleId,
        reviewDate: data.reviewDate ? new Date(data.reviewDate) : existing.reviewDate,
        implementationDate: data.implementationDate
          ? new Date(data.implementationDate)
          : existing.implementationDate,
      },
      include: {
        evidenceFiles: true,
        responsible: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update control:", error);
    return NextResponse.json(
      { error: "Failed to update control" },
      { status: 500 }
    );
  }
}
