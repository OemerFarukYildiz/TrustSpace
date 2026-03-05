import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/audits - List all audits
export async function GET() {
  try {
    console.log("Fetching audits from DB...");
    const audits = await prisma.audit.findMany({
      orderBy: { plannedDate: "desc" },
      include: {
        owners: {
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });
    return NextResponse.json(audits);
  } catch (error: any) {
    console.error("Failed to fetch audits:", error);
    return NextResponse.json({ error: "Failed to fetch audits", details: error.message }, { status: 500 });
  }
}

// POST /api/audits - Create new audit
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, type, plannedDate, description, status, ownerIds, documents } = body;

    // Get first organization (for demo)
    const org = await prisma.organization.findFirst();
    if (!org) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    const audit = await prisma.audit.create({
      data: {
        title,
        type,
        plannedDate: new Date(plannedDate),
        description,
        status: status || "open",
        documents: documents ? JSON.stringify(documents) : null,
        organizationId: org.id,
        owners: {
          create: ownerIds?.map((id: string) => ({
            employee: { connect: { id } },
          })) || [],
        },
      },
      include: {
        owners: {
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(audit, { status: 201 });
  } catch (error) {
    console.error("Failed to create audit:", error);
    return NextResponse.json({ error: "Failed to create audit" }, { status: 500 });
  }
}
