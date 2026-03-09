import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// PATCH /api/findings/folders/[id]  { name }  — rename folder + update all findings
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { name } = await request.json();
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

  const existing = await prisma.findingFolder.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Rename folder record
  const folder = await prisma.findingFolder.update({ where: { id }, data: { name } });

  // Update all findings that referenced the old folder name
  await prisma.finding.updateMany({
    where: { organizationId: "default-org", folder: existing.name, type: existing.type },
    data: { folder: name },
  });

  return NextResponse.json(folder);
}

// DELETE /api/findings/folders/[id]  — remove folder, keep findings (move to ungrouped)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = await prisma.findingFolder.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Move findings to ungrouped
  await prisma.finding.updateMany({
    where: { organizationId: "default-org", folder: existing.name, type: existing.type },
    data: { folder: null },
  });

  await prisma.findingFolder.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
