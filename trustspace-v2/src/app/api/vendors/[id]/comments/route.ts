import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/vendors/[id]/comments - Kommentare eines Vendors auflisten
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

    const comments = await prisma.vendorComment.findMany({
      where: { vendorId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("Failed to fetch vendor comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch vendor comments" },
      { status: 500 }
    );
  }
}

// POST /api/vendors/[id]/comments - Kommentar erstellen
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

    if (!data.content) {
      return NextResponse.json(
        { error: "content is required" },
        { status: 400 }
      );
    }

    const comment = await prisma.vendorComment.create({
      data: {
        vendorId: id,
        content: data.content,
        authorId: data.authorId || null,
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Failed to create vendor comment:", error);
    return NextResponse.json(
      { error: "Failed to create vendor comment" },
      { status: 500 }
    );
  }
}
