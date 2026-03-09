import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/vendors/[id]/documents - Dokumente eines Vendors auflisten
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const vendor = await prisma.vendor.findUnique({ where: { id } });
    if (!vendor) {
      return NextResponse.json(
        { error: "Vendor not found" },
        { status: 404 }
      );
    }

    const documents = await prisma.vendorDocument.findMany({
      where: { vendorId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error("Failed to fetch vendor documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch vendor documents" },
      { status: 500 }
    );
  }
}

// POST /api/vendors/[id]/documents - Dokument hochladen
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();

    const vendor = await prisma.vendor.findUnique({ where: { id } });
    if (!vendor) {
      return NextResponse.json(
        { error: "Vendor not found" },
        { status: 404 }
      );
    }

    if (!data.fileName || !data.fileType || !data.fileData) {
      return NextResponse.json(
        { error: "fileName, fileType, and fileData are required" },
        { status: 400 }
      );
    }

    const document = await prisma.vendorDocument.create({
      data: {
        vendorId: id,
        fileName: data.fileName,
        fileType: data.fileType,
        fileData: data.fileData,
        mimeType: data.mimeType || null,
        fileSize: data.fileSize || 0,
        category: data.category || "other",
        description: data.description || null,
        uploadedBy: data.uploadedBy || null,
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("Failed to create vendor document:", error);
    return NextResponse.json(
      { error: "Failed to create vendor document" },
      { status: 500 }
    );
  }
}
