import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrgId } from "@/lib/auth";
import type { ParticipantChoice } from "@/lib/simulations/types";

// GET /api/simulations/sessions/[id]/results - Aggregated results for a session
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orgId = await getOrgId();

    const session = await prisma.simulationSession.findFirst({
      where: { id, organizationId: orgId },
      include: {
        scenario: {
          select: {
            id: true,
            code: true,
            title: true,
            category: true,
            difficulty: true,
            decisionTree: true,
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
                department: true,
              },
            },
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Simulationssitzung nicht gefunden" },
        { status: 404 }
      );
    }

    const completedParticipants = session.participants.filter(
      (p) => p.status === "completed"
    );

    // Per-employee scores
    const participantResults = session.participants.map((p) => {
      const choices: ParticipantChoice[] = p.choices
        ? JSON.parse(p.choices)
        : [];
      return {
        participantId: p.id,
        employeeId: p.employeeId,
        employee: p.employee,
        status: p.status,
        score: p.score,
        maxScore: p.maxScore,
        scorePct: p.maxScore > 0 ? Math.round((p.score / p.maxScore) * 100) : 0,
        timeTakenSec: p.timeTakenSec,
        currentScene: p.currentScene,
        startedAt: p.startedAt,
        completedAt: p.completedAt,
        choiceCount: choices.length,
      };
    });

    // Per-scene analysis: which choices were most common
    const sceneChoiceMap: Record<
      number,
      { choiceId: string; count: number; isOptimal: boolean }[]
    > = {};

    let decisionTree: { scenes?: { id: number; title?: string; choices: { id: string; isOptimal: boolean }[] }[] } | null = null;
    try {
      decisionTree = JSON.parse(session.scenario.decisionTree);
    } catch {
      // ignore parse errors
    }

    for (const p of session.participants) {
      if (!p.choices) continue;
      const choices: ParticipantChoice[] = JSON.parse(p.choices);
      for (const choice of choices) {
        if (!sceneChoiceMap[choice.sceneId]) {
          sceneChoiceMap[choice.sceneId] = [];
        }
        const existing = sceneChoiceMap[choice.sceneId].find(
          (c) => c.choiceId === choice.choiceId
        );
        const isOptimal =
          decisionTree?.scenes
            ?.find((s) => s.id === choice.sceneId)
            ?.choices.find((c) => c.id === choice.choiceId)?.isOptimal ?? false;

        if (existing) {
          existing.count++;
        } else {
          sceneChoiceMap[choice.sceneId].push({
            choiceId: choice.choiceId,
            count: 1,
            isOptimal,
          });
        }
      }
    }

    // Identify weakest scenes: scenes where most participants chose suboptimal answers
    const sceneAnalysis = Object.entries(sceneChoiceMap).map(
      ([sceneIdStr, choiceStats]) => {
        const sceneId = parseInt(sceneIdStr);
        const totalAnswers = choiceStats.reduce((s, c) => s + c.count, 0);
        const optimalAnswers = choiceStats
          .filter((c) => c.isOptimal)
          .reduce((s, c) => s + c.count, 0);
        const optimalPct =
          totalAnswers > 0
            ? Math.round((optimalAnswers / totalAnswers) * 100)
            : 0;

        const sceneTitle =
          decisionTree?.scenes?.find((s) => s.id === sceneId)?.title ??
          `Szene ${sceneId}`;

        return {
          sceneId,
          sceneTitle,
          totalAnswers,
          optimalAnswers,
          optimalPct,
          choiceBreakdown: choiceStats.sort((a, b) => b.count - a.count),
        };
      }
    );

    // Sort by optimalPct ascending to surface weakest scenes first
    const weakestScenes = [...sceneAnalysis]
      .sort((a, b) => a.optimalPct - b.optimalPct)
      .slice(0, 3);

    // Summary stats
    const avgScore =
      completedParticipants.length > 0
        ? Math.round(
            completedParticipants.reduce(
              (sum, p) =>
                sum +
                (p.maxScore > 0 ? Math.round((p.score / p.maxScore) * 100) : 0),
              0
            ) / completedParticipants.length
          )
        : null;

    const avgTimeSec =
      completedParticipants.length > 0
        ? Math.round(
            completedParticipants.reduce((sum, p) => sum + p.timeTakenSec, 0) /
              completedParticipants.length
          )
        : null;

    return NextResponse.json({
      session: {
        id: session.id,
        title: session.title,
        status: session.status,
        deadline: session.deadline,
        scenario: session.scenario,
      },
      summary: {
        totalParticipants: session.participants.length,
        completedParticipants: completedParticipants.length,
        pendingParticipants: session.participants.filter(
          (p) => p.status === "pending"
        ).length,
        inProgressParticipants: session.participants.filter(
          (p) => p.status === "in_progress"
        ).length,
        avgScorePct: avgScore,
        avgTimeSec,
      },
      participantResults,
      sceneAnalysis,
      weakestScenes,
    });
  } catch (error) {
    console.error("Failed to fetch simulation results:", error);
    return NextResponse.json(
      { error: "Ergebnisse konnten nicht geladen werden" },
      { status: 500 }
    );
  }
}
