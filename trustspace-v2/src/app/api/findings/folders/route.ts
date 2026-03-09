import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/findings/folders?type=vulnerability
export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type");
  const where = { organizationId: "default-org", ...(type ? { type } : {}) };
  const folders = await prisma.findingFolder.findMany({ where, orderBy: { name: "asc" } });
  return NextResponse.json(folders);
}

// POST /api/findings/folders  { name, type }
export async function POST(request: NextRequest) {
  const { name, type } = await request.json();
  if (!name || !type) return NextResponse.json({ error: "name and type required" }, { status: 400 });

  try {
    const folder = await prisma.findingFolder.create({
      data: { organizationId: "default-org", name, type },
    });
    return NextResponse.json(folder);
  } catch (error: any) {
    // Unique constraint violation = duplicate name
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Folder already exists" }, { status: 409 });
    }
    console.error("Create folder error:", error);
    return NextResponse.json({ error: error.message ?? "Failed to create folder" }, { status: 500 });
  }
}
