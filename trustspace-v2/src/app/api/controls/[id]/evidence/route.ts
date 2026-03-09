import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/controls/[id]/evidence - Alle Evidence-Dateien eines Controls
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const control = await prisma.control.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!control) {
      return NextResponse.json({ error: "Control not found" }, { status: 404 });
    }

    const evidenceFiles = await prisma.controlEvidence.findMany({
      where: { controlId: id },
      select: {
        id: true,
        controlId: true,
        fileName: true,
        fileType: true,
        mimeType: true,
        fileSize: true,
        description: true,
        uploadedBy: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(evidenceFiles);
  } catch (error) {
    console.error("Failed to fetch evidence files:", error);
    return NextResponse.json(
      { error: "Failed to fetch evidence files" },
      { status: 500 }
    );
  }
}

// POST /api/controls/[id]/evidence - Evidence-Datei hochladen
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();

    const control = await prisma.control.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!control) {
      return NextResponse.json({ error: "Control not found" }, { status: 404 });
    }

    if (!data.fileName || !data.fileData) {
      return NextResponse.json(
        { error: "fileName and fileData are required" },
        { status: 400 }
      );
    }

    const evidence = await prisma.controlEvidence.create({
      data: {
        controlId: id,
        fileName: data.fileName,
        fileType: data.fileType || "unknown",
        fileData: data.fileData,
        mimeType: data.mimeType || null,
        fileSize: data.fileSize || 0,
        description: data.description || null,
        uploadedBy: data.uploadedBy || null,
      },
    });

    return NextResponse.json(evidence, { status: 201 });
  } catch (error) {
    console.error("Failed to upload evidence file:", error);
    return NextResponse.json(
      { error: "Failed to upload evidence file" },
      { status: 500 }
    );
  }
}
