import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// PUT /api/policies/[id] - Update policy
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, content, status, version } = body;

    const policy = await prisma.policy.update({
      where: { id },
      data: {
        title,
        content,
        status,
        version: version ? { increment: 1 } : undefined,
      },
    });

    return NextResponse.json(policy);
  } catch (error) {
    console.error("Failed to update policy:", error);
    return NextResponse.json({ error: "Failed to update policy" }, { status: 500 });
  }
}

// DELETE /api/policies/[id] - Delete policy
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.policy.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete policy:", error);
    return NextResponse.json({ error: "Failed to delete policy" }, { status: 500 });
  }
}
