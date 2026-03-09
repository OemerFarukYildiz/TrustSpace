import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/controls/[id]/evidence/[evidenceId] - Evidence-Datei herunterladen
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; evidenceId: string }> }
) {
  try {
    const { id, evidenceId } = await params;

    const evidence = await prisma.controlEvidence.findFirst({
      where: {
        id: evidenceId,
        controlId: id,
      },
    });

    if (!evidence) {
      return NextResponse.json(
        { error: "Evidence file not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(evidence);
  } catch (error) {
    console.error("Failed to fetch evidence file:", error);
    return NextResponse.json(
      { error: "Failed to fetch evidence file" },
      { status: 500 }
    );
  }
}

// DELETE /api/controls/[id]/evidence/[evidenceId] - Evidence-Datei loeschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; evidenceId: string }> }
) {
  try {
    const { id, evidenceId } = await params;

    const evidence = await prisma.controlEvidence.findFirst({
      where: {
        id: evidenceId,
        controlId: id,
      },
    });

    if (!evidence) {
      return NextResponse.json(
        { error: "Evidence file not found" },
        { status: 404 }
      );
    }

    await prisma.controlEvidence.delete({
      where: { id: evidenceId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete evidence file:", error);
    return NextResponse.json(
      { error: "Failed to delete evidence file" },
      { status: 500 }
    );
  }
}
