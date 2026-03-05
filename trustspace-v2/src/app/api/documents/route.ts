import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/documents - List all documents
export async function GET() {
  try {
    const documents = await prisma.documentFile.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        children: true,
      },
    });
    return NextResponse.json(documents);
  } catch (error) {
    console.error("Failed to fetch documents:", error);
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

// POST /api/documents - Create new document or folder
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, type, parentId, content, sheetData, fileData, mimeType, size } = body;

    // Get first organization (for demo)
    const org = await prisma.organization.findFirst();
    if (!org) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    const document = await prisma.documentFile.create({
      data: {
        name,
        type,
        parentId: parentId || null,
        content,
        sheetData: sheetData ? JSON.stringify(sheetData) : null,
        fileData,
        mimeType,
        size: size || 0,
        organizationId: org.id,
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("Failed to create document:", error);
    return NextResponse.json({ error: "Failed to create document" }, { status: 500 });
  }
}
