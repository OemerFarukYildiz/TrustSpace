import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/documents/[id] - Get single document
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const document = await prisma.documentFile.findUnique({
      where: { id },
      include: {
        children: true,
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    return NextResponse.json(document);
  } catch (error) {
    console.error("Failed to fetch document:", error);
    return NextResponse.json({ error: "Failed to fetch document" }, { status: 500 });
  }
}

// PUT /api/documents/[id] - Update document
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, content, sheetData, fileData, mimeType, size } = body;

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (content !== undefined) updateData.content = content;
    if (sheetData !== undefined) updateData.sheetData = JSON.stringify(sheetData);
    if (fileData !== undefined) updateData.fileData = fileData;
    if (mimeType !== undefined) updateData.mimeType = mimeType;
    if (size !== undefined) updateData.size = size;

    const document = await prisma.documentFile.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(document);
  } catch (error) {
    console.error("Failed to update document:", error);
    return NextResponse.json({ error: "Failed to update document" }, { status: 500 });
  }
}

// DELETE /api/documents/[id] - Delete document
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Recursive delete function
    async function deleteRecursive(docId: string) {
      const children = await prisma.documentFile.findMany({
        where: { parentId: docId },
      });
      
      for (const child of children) {
        await deleteRecursive(child.id);
      }
      
      await prisma.documentFile.delete({
        where: { id: docId },
      });
    }
    
    await deleteRecursive(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete document:", error);
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}
