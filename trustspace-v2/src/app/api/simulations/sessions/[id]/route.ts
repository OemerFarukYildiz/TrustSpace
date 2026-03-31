import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrgId } from "@/lib/auth";

// GET /api/simulations/sessions/[id] - Session detail with participants and scenario
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orgId = await getOrgId();

    const session = await prisma.simulationSession.findFirst({
      where: { id, organizationId: orgId },
      include: {
        scenario: true,
        audit: {
          select: { id: true, title: true, type: true },
        },
        participants: {
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                department: true,
              },
            },
          },
          orderBy: { employee: { lastName: "asc" } },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Simulationssitzung nicht gefunden" },
        { status: 404 }
      );
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error("Failed to fetch simulation session:", error);
    return NextResponse.json(
      { error: "Simulationssitzung konnte nicht geladen werden" },
      { status: 500 }
    );
  }
}

// PUT /api/simulations/sessions/[id] - Update session status, deadline, customFields
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orgId = await getOrgId();
    const body = await request.json();

    const existing = await prisma.simulationSession.findFirst({
      where: { id, organizationId: orgId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Simulationssitzung nicht gefunden" },
        { status: 404 }
      );
    }

    const {
      status,
      deadline,
      customFields,
      title,
      description,
    }: {
      status?: string;
      deadline?: string | null;
      customFields?: Record<string, string> | null;
      title?: string;
      description?: string;
    } = body;

    const updated = await prisma.simulationSession.update({
      where: { id },
      data: {
        ...(status !== undefined && { status }),
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(deadline !== undefined && {
          deadline: deadline ? new Date(deadline) : null,
        }),
        ...(customFields !== undefined && {
          customFields: customFields ? JSON.stringify(customFields) : null,
        }),
      },
      include: {
        scenario: {
          select: {
            id: true,
            code: true,
            title: true,
            category: true,
            difficulty: true,
          },
        },
        participants: {
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update simulation session:", error);
    return NextResponse.json(
      { error: "Simulationssitzung konnte nicht aktualisiert werden" },
      { status: 500 }
    );
  }
}

// DELETE /api/simulations/sessions/[id] - Delete session (cascades to participants)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orgId = await getOrgId();

    const existing = await prisma.simulationSession.findFirst({
      where: { id, organizationId: orgId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Simulationssitzung nicht gefunden" },
        { status: 404 }
      );
    }

    await prisma.simulationSession.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete simulation session:", error);
    return NextResponse.json(
      { error: "Simulationssitzung konnte nicht gelöscht werden" },
      { status: 500 }
    );
  }
}
