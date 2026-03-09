import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { randomUUID } from "crypto";

function generateRecurringDates(baseDate: Date, recurring: string, yearsAhead = 3): Date[] {
  const dates: Date[] = [];
  if (recurring === "annual") {
    for (let y = 1; y <= yearsAhead; y++) {
      const d = new Date(baseDate);
      d.setFullYear(d.getFullYear() + y);
      dates.push(d);
    }
  } else if (recurring === "semi-annual") {
    for (let i = 1; i <= yearsAhead * 2; i++) {
      const d = new Date(baseDate);
      d.setMonth(d.getMonth() + i * 6);
      dates.push(d);
    }
  } else if (recurring === "quarterly") {
    for (let i = 1; i <= yearsAhead * 4; i++) {
      const d = new Date(baseDate);
      d.setMonth(d.getMonth() + i * 3);
      dates.push(d);
    }
  }
  return dates;
}

// GET /api/audits/[id] - Get single audit
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const audit = await prisma.audit.findUnique({
      where: { id },
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

    if (!audit) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }

    return NextResponse.json(audit);
  } catch (error) {
    console.error("Failed to fetch audit:", error);
    return NextResponse.json({ error: "Failed to fetch audit" }, { status: 500 });
  }
}

// PUT /api/audits/[id] - Update audit
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, type, plannedDate, actualDate, description, status, ownerIds, documents, recurring } = body;

    // Delete existing owners and recreate
    await prisma.auditOwner.deleteMany({
      where: { auditId: id },
    });

    // Fetch existing audit info
    const existing = await prisma.audit.findUnique({
      where: { id },
      select: { seriesId: true, plannedDate: true, organizationId: true, recurring: true },
    });

    const isNowEinmalig = (!recurring || recurring === "none") && existing?.seriesId;
    const isNewRecurring = recurring && recurring !== "none" && !existing?.seriesId;
    const isRecurringChanged = recurring && recurring !== "none" && existing?.seriesId && recurring !== existing?.recurring;
    const seriesId = isNewRecurring ? randomUUID() : existing?.seriesId || null;

    // If switching to "einmalig" or recurring type changed, delete all child instances
    if ((isNowEinmalig || isRecurringChanged) && existing?.seriesId) {
      await prisma.audit.deleteMany({
        where: { seriesId: existing.seriesId, id: { not: id } },
      });
    }

    const audit = await prisma.audit.update({
      where: { id },
      data: {
        title,
        type,
        plannedDate: plannedDate ? new Date(plannedDate) : undefined,
        actualDate: actualDate ? new Date(actualDate) : null,
        description,
        status,
        documents: documents ? JSON.stringify(documents) : null,
        recurring: recurring !== undefined ? (recurring || null) : undefined,
        seriesId: isNowEinmalig ? null : isNewRecurring ? seriesId : undefined,
        owners: {
          create: ownerIds?.map((employeeId: string) => ({
            employee: { connect: { id: employeeId } },
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

    // Create future audit instances if recurring was just activated OR recurring type changed
    const shouldRegenerateInstances = (isNewRecurring || isRecurringChanged) && existing?.plannedDate;
    if (shouldRegenerateInstances) {
      const activeSeriesId = isNewRecurring ? seriesId : existing!.seriesId!;
      const baseDate = plannedDate ? new Date(plannedDate) : new Date(existing!.plannedDate);
      const futureDates = generateRecurringDates(baseDate, recurring, 3);
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
              seriesId: activeSeriesId,
              organizationId: existing!.organizationId,
              owners: {
                create: ownerIds?.map((employeeId: string) => ({
                  employee: { connect: { id: employeeId } },
                })) || [],
              },
            },
          });
          await prisma.auditCalendar.create({
            data: {
              organizationId: existing!.organizationId,
              auditId: futureAudit.id,
              title,
              date: futureDate,
              type: "audit",
              description: description || null,
            },
          }).catch(() => {});
        } catch (err: any) {
          console.error("Recurring instance creation failed:", err?.message);
        }
      }
    }

    return NextResponse.json(audit);
  } catch (error: any) {
    console.error("Failed to update audit:", error);
    return NextResponse.json({ error: "Failed to update audit", details: error?.message || String(error) }, { status: 500 });
  }
}

// DELETE /api/audits/[id] - Delete audit (optionally entire series)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleteSeries = request.nextUrl.searchParams.get("deleteSeries") === "true";

    if (deleteSeries) {
      // Find the seriesId of this audit
      const audit = await prisma.audit.findUnique({ where: { id }, select: { seriesId: true } });
      if (audit?.seriesId) {
        await prisma.audit.deleteMany({ where: { seriesId: audit.seriesId } });
        return NextResponse.json({ success: true, deleted: "series" });
      }
    }

    await prisma.audit.delete({ where: { id } });
    return NextResponse.json({ success: true, deleted: "single" });
  } catch (error) {
    console.error("Failed to delete audit:", error);
    return NextResponse.json({ error: "Failed to delete audit" }, { status: 500 });
  }
}
