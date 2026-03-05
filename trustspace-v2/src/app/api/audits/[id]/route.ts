import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/audits/[id] - Get single audit
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const audit = await prisma.audit.findUnique({
      where: { id },
      include: {
        owners: {
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

    if (!audit) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }

    return NextResponse.json(audit);
  } catch (error) {
    console.error("Failed to fetch audit:", error);
    return NextResponse.json({ error: "Failed to fetch audit" }, { status: 500 });
  }
}

// PUT /api/audits/[id] - Update audit
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, type, plannedDate, actualDate, description, status, ownerIds, documents } = body;

    // Delete existing owners and recreate
    await prisma.auditOwner.deleteMany({
      where: { auditId: id },
    });

    const audit = await prisma.audit.update({
      where: { id },
      data: {
        title,
        type,
        plannedDate: plannedDate ? new Date(plannedDate) : undefined,
        actualDate: actualDate ? new Date(actualDate) : null,
        description,
        status,
        documents: documents ? JSON.stringify(documents) : null,
        owners: {
          create: ownerIds?.map((employeeId: string) => ({
            employee: { connect: { id: employeeId } },
          })) || [],
        },
      },
      include: {
        owners: {
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

    return NextResponse.json(audit);
  } catch (error) {
    console.error("Failed to update audit:", error);
    return NextResponse.json({ error: "Failed to update audit" }, { status: 500 });
  }
}

// DELETE /api/audits/[id] - Delete audit
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.audit.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete audit:", error);
    return NextResponse.json({ error: "Failed to delete audit" }, { status: 500 });
  }
}
