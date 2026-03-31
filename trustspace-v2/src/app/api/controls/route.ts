import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrgId } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const orgId = await getOrgId();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const hasJustification = searchParams.get("hasJustification");
    const search = searchParams.get("search");

    const where: any = { organizationId: orgId };
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
    });

    controls.sort((a, b) => {
      const partsA = a.code.replace("A.", "").split(".").map(Number);
      const partsB = b.code.replace("A.", "").split(".").map(Number);
      return partsA[0] - partsB[0] || partsA[1] - partsB[1];
    });

    return NextResponse.json(controls);
  } catch (error) {
    console.error("Failed to fetch controls:", error);
    return NextResponse.json({ error: "Failed to fetch controls" }, { status: 500 });
  }
}
