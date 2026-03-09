import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const UPLOAD_DIR = join(process.cwd(), "uploads", "findings");

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const attachments = await prisma.findingAttachment.findMany({
    where: { findingId: id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(attachments);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const formData = await request.formData();
  const file = formData.get("file") as File;
  if (!file) return NextResponse.json({ error: "file required" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  mkdirSync(join(UPLOAD_DIR, id), { recursive: true });
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = join(UPLOAD_DIR, id, `${Date.now()}_${safeName}`);
  writeFileSync(filePath, buffer);

  const fileUrl = `/uploads/findings/${id}/${Date.now()}_${safeName}`;

  const attachment = await prisma.findingAttachment.create({
    data: {
      findingId: id,
      fileName: file.name,
      fileUrl,
      fileSize: buffer.length,
      mimeType: file.type,
    },
  });
  return NextResponse.json(attachment);
}
