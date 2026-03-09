import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const finding = await prisma.finding.findUnique({
    where: { id },
    include: {
      assignee: true,
      vulnerability: {
        include: {
          component: {
            include: {
              sbomDocument: {
                include: { asset: { select: { id: true, name: true } } },
              },
            },
          },
        },
      },
    },
  });
  if (!finding) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(finding);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { title, description, status, priority, dueDate, assigneeId, folder, vexStatus, controlRef, deviation, rootCause } = body;

  const finding = await prisma.finding.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(status !== undefined && { status }),
      ...(priority !== undefined && { priority }),
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      ...(assigneeId !== undefined && { assigneeId: assigneeId || null }),
      ...(folder !== undefined && { folder: folder || null }),
      ...(controlRef !== undefined && { controlRef: controlRef || null }),
      ...(deviation !== undefined && { deviation: deviation || null }),
      ...(rootCause !== undefined && { rootCause: rootCause || null }),
    },
  });

  // Sync VEX status if provided
  if (vexStatus && finding.vulnerabilityId) {
    await prisma.vexVulnerability.update({
      where: { id: finding.vulnerabilityId },
      data: { vexStatus },
    });
  }

  return NextResponse.json({ success: true, finding });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.finding.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
