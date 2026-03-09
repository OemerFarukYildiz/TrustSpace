import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { randomUUID } from "crypto";

// GET /api/audits - List all audits
export async function GET() {
  try {
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

// Helper: generate future audit dates based on recurring interval
function generateRecurringDates(baseDate: Date, recurring: string, yearsAhead = 3): Date[] {
  const dates: Date[] = [];

  if (recurring === "annual") {
    for (let y = 1; y <= yearsAhead; y++) {
      const d = new Date(baseDate);
      d.setFullYear(d.getFullYear() + y);
      dates.push(d);
    }
  } else if (recurring === "semi-annual") {
    // Every 6 months, for yearsAhead * 2 occurrences
    for (let i = 1; i <= yearsAhead * 2; i++) {
      const d = new Date(baseDate);
      d.setMonth(d.getMonth() + i * 6);
      dates.push(d);
    }
  } else if (recurring === "quarterly") {
    // Every 3 months, for yearsAhead * 4 occurrences
    for (let i = 1; i <= yearsAhead * 4; i++) {
      const d = new Date(baseDate);
      d.setMonth(d.getMonth() + i * 3);
      dates.push(d);
    }
  }

  return dates;
}

// POST /api/audits - Create new audit
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, type, plannedDate, description, status, ownerIds, documents, recurring } = body;

    // Get first organization (for demo)
    const org = await prisma.organization.findFirst();
    if (!org) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    const parsedDate = new Date(plannedDate);
    // Generate a series ID for all instances of this recurring audit
    const seriesId = (recurring && recurring !== "none") ? randomUUID() : null;

    const audit = await prisma.audit.create({
      data: {
        title,
        type,
        plannedDate: parsedDate,
        description,
        status: status || "open",
        documents: documents ? JSON.stringify(documents) : null,
        recurring: recurring || null,
        seriesId,
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

    // Create AuditCalendar entry for the base audit (non-fatal)
    try {
      await prisma.auditCalendar.create({
        data: {
          organizationId: org.id,
          auditId: audit.id,
          title,
          date: parsedDate,
          type: "audit",
          description: description || null,
        },
      });
    } catch (calErr) {
      console.error("Calendar entry creation failed (non-fatal):", calErr);
    }

    // Create future Audit records + calendar entries for recurring audits
    let recurringCreated = 0;
    let recurringError: string | null = null;
    if (recurring && recurring !== "none") {
      const futureDates = generateRecurringDates(parsedDate, recurring, 3);
      for (const futureDate of futureDates) {
        try {
          const futureAudit = await prisma.audit.create({
            data: {
              title,
              type,
              plannedDate: futureDate,
              description,
              status: "open",
              documents: documents ? JSON.stringify(documents) : null,
              recurring: null,
              seriesId,
              organizationId: org.id,
              owners: {
                create: ownerIds?.map((id: string) => ({
                  employee: { connect: { id } },
                })) || [],
              },
            },
          });
          recurringCreated++;

          await prisma.auditCalendar.create({
            data: {
              organizationId: org.id,
              auditId: futureAudit.id,
              title,
              date: futureDate,
              type: "audit",
              description: description || null,
            },
          }).catch(() => {});
        } catch (recurErr: any) {
          console.error("Recurring audit creation failed:", recurErr?.message);
          recurringError = recurErr?.message || String(recurErr);
          break; // stop on first error so we can report it
        }
      }
    }

    return NextResponse.json({ ...audit, recurringCreated, recurringError }, { status: 201 });
  } catch (error) {
    console.error("Failed to create audit:", error);
    return NextResponse.json({ error: "Failed to create audit" }, { status: 500 });
  }
}

// DELETE /api/audits?year=2027 - Delete all audits in a given year
export async function DELETE(request: NextRequest) {
  try {
    const year = parseInt(request.nextUrl.searchParams.get("year") || "");
    if (!year) return NextResponse.json({ error: "year required" }, { status: 400 });

    const start = new Date(`${year}-01-01T00:00:00.000Z`);
    const end = new Date(`${year + 1}-01-01T00:00:00.000Z`);

    const result = await prisma.audit.deleteMany({
      where: { plannedDate: { gte: start, lt: end } },
    });

    return NextResponse.json({ success: true, deleted: result.count });
  } catch (error) {
    console.error("Failed to delete audits by year:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
