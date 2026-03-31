import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrgId } from "@/lib/auth";

// GET /api/simulations/sessions - List all sessions for current org
export async function GET() {
  try {
    const orgId = await getOrgId();

    const sessions = await prisma.simulationSession.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      include: {
        scenario: {
          select: {
            id: true,
            code: true,
            title: true,
            category: true,
            difficulty: true,
            estimatedMinutes: true,
          },
        },
        audit: {
          select: { id: true, title: true },
        },
        participants: {
          select: {
            id: true,
            status: true,
            score: true,
            maxScore: true,
            completedAt: true,
          },
        },
      },
    });

    // Attach aggregated stats to each session
    const sessionsWithStats = sessions.map((session) => {
      const total = session.participants.length;
      const completed = session.participants.filter(
        (p) => p.status === "completed"
      ).length;
      const avgScore =
        completed > 0
          ? Math.round(
              session.participants
                .filter((p) => p.status === "completed")
                .reduce(
                  (sum, p) =>
                    sum +
                    (p.maxScore > 0
                      ? Math.round((p.score / p.maxScore) * 100)
                      : 0),
                  0
                ) / completed
            )
          : null;

      return {
        ...session,
        stats: {
          totalParticipants: total,
          completedParticipants: completed,
          pendingParticipants: total - completed,
          avgScorePct: avgScore,
        },
      };
    });

    return NextResponse.json(sessionsWithStats);
  } catch (error) {
    console.error("Failed to fetch simulation sessions:", error);
    return NextResponse.json(
      { error: "Simulationssitzungen konnten nicht geladen werden" },
      { status: 500 }
    );
  }
}

// POST /api/simulations/sessions - Create a new session with participants
export async function POST(request: Request) {
  try {
    const orgId = await getOrgId();
    const body = await request.json();
    const {
      scenarioId,
      title,
      description,
      employeeIds,
      deadline,
      customFields,
      auditId,
    }: {
      scenarioId: string;
      title: string;
      description?: string;
      employeeIds: string[];
      deadline?: string;
      customFields?: Record<string, string>;
      auditId?: string;
    } = body;

    if (!scenarioId || !title || !employeeIds || employeeIds.length === 0) {
      return NextResponse.json(
        {
          error:
            "Pflichtfelder fehlen: scenarioId, title und mindestens ein Mitarbeiter werden benötigt",
        },
        { status: 400 }
      );
    }

    // Verify scenario exists
    const scenario = await prisma.simulationScenario.findUnique({
      where: { id: scenarioId },
    });
    if (!scenario) {
      return NextResponse.json(
        { error: "Szenario nicht gefunden" },
        { status: 404 }
      );
    }

    // Verify all employees belong to this org
    const employees = await prisma.employee.findMany({
      where: { id: { in: employeeIds }, organizationId: orgId },
      select: { id: true },
    });
    if (employees.length !== employeeIds.length) {
      return NextResponse.json(
        { error: "Einige Mitarbeiter wurden nicht gefunden oder gehören nicht zu dieser Organisation" },
        { status: 400 }
      );
    }

    const session = await prisma.simulationSession.create({
      data: {
        organizationId: orgId,
        scenarioId,
        title,
        description: description ?? null,
        status: "draft",
        deadline: deadline ? new Date(deadline) : null,
        customFields: customFields ? JSON.stringify(customFields) : null,
        auditId: auditId ?? null,
        participants: {
          create: employeeIds.map((employeeId: string) => ({
            employeeId,
            status: "pending",
          })),
        },
      },
      include: {
        scenario: {
          select: {
            id: true,
            code: true,
            title: true,
            category: true,
            difficulty: true,
            estimatedMinutes: true,
          },
        },
        participants: {
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

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error("Failed to create simulation session:", error);
    return NextResponse.json(
      { error: "Simulationssitzung konnte nicht erstellt werden" },
      { status: 500 }
    );
  }
}
