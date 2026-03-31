import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrgId } from "@/lib/auth";

export async function GET() {
  try {
    const orgId = await getOrgId();
    const employees = await prisma.employee.findMany({
      where: { organizationId: orgId },
      orderBy: { firstName: "asc" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
    });
    return NextResponse.json(employees);
  } catch (error) {
    console.error("Failed to fetch employees:", error);
    return NextResponse.json([], { status: 500 });
  }
}
