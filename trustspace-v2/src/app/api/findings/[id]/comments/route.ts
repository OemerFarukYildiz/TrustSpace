import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const comments = await prisma.findingComment.findMany({
    where: { findingId: id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(comments);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { content, authorName } = await request.json();
  if (!content?.trim()) {
    return NextResponse.json({ error: "content required" }, { status: 400 });
  }
  const comment = await prisma.findingComment.create({
    data: { findingId: id, content: content.trim(), authorName: authorName || "Benutzer" },
  });
  return NextResponse.json(comment);
}
