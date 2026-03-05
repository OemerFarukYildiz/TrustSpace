import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
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
