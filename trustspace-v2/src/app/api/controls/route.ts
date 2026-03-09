import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const hasJustification = searchParams.get("hasJustification");
    const search = searchParams.get("search");

    const where: any = { organizationId: "default-org" };
    if (category) where.code = { startsWith: category };
    if (hasJustification === "true") where.justification = { not: null };
    if (hasJustification === "false") where.justification = null;
    if (search) {
      where.OR = [
        { code: { contains: search } },
        { title: { contains: search } },
      ];
    }

    const controls = await prisma.control.findMany({
      where,
      include: {
        responsible: true,
        _count: { select: { evidenceFiles: true } },
      },
      orderBy: { code: "asc" },
    });

    return NextResponse.json(controls);
  } catch (error) {
    console.error("Failed to fetch controls:", error);
    return NextResponse.json({ error: "Failed to fetch controls" }, { status: 500 });
  }
}
