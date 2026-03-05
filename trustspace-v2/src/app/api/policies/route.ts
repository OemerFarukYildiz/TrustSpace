import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/policies - List all policies
export async function GET() {
  try {
    const policies = await prisma.policy.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        control: {
          select: {
            id: true,
            code: true,
            title: true,
          },
        },
      },
    });
    return NextResponse.json(policies);
  } catch (error) {
    console.error("Failed to fetch policies:", error);
    return NextResponse.json({ error: "Failed to fetch policies" }, { status: 500 });
  }
}

// POST /api/policies - Create new policy
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, content, status, controlId } = body;

    // Get first organization (for demo)
    const org = await prisma.organization.findFirst();
    if (!org) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    const policy = await prisma.policy.create({
      data: {
        title,
        content,
        status: status || "draft",
        organizationId: org.id,
        controlId: controlId || null,
      },
    });

    return NextResponse.json(policy, { status: 201 });
  } catch (error) {
    console.error("Failed to create policy:", error);
    return NextResponse.json({ error: "Failed to create policy" }, { status: 500 });
  }
}
