import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { ParticipantChoice, SceneNode } from "@/lib/simulations/types";

// Replace {{PLACEHOLDER}} values with customFields from session
function applyCustomFields(
  decisionTree: string,
  customFields: string | null
): string {
  if (!customFields) return decisionTree;
  let result = decisionTree;
  try {
    const fields: Record<string, string> = JSON.parse(customFields);
    for (const [key, value] of Object.entries(fields)) {
      // key can be with or without braces
      const placeholder = key.startsWith("{{") ? key : `{{${key}}}`;
      result = result.split(placeholder).join(value);
    }
  } catch {
    // ignore JSON parse errors
  }
  return result;
}

// GET /api/simulations/play/[token] - Load participant progress (token-based, no auth)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const participant = await prisma.simulationParticipant.findUnique({
      where: { token },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        session: {
          include: {
            scenario: {
              select: {
                id: true,
                code: true,
                title: true,
                description: true,
                category: true,
                difficulty: true,
                estimatedMinutes: true,
                decisionTree: true,
              },
            },
          },
        },
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "Ungültiger oder abgelaufener Teilnahme-Link" },
        { status: 404 }
      );
    }

    // Apply custom field replacements to decision tree
    const processedDecisionTree = applyCustomFields(
      participant.session.scenario.decisionTree,
      participant.session.customFields
    );

    let parsedTree: { meta: unknown; scenes: SceneNode[] } | null = null;
    try {
      parsedTree = JSON.parse(processedDecisionTree);
    } catch {
      return NextResponse.json(
        { error: "Szenario-Daten sind ungültig" },
        { status: 500 }
      );
    }

    const choices: ParticipantChoice[] = participant.choices
      ? JSON.parse(participant.choices)
      : [];

    return NextResponse.json({
      participant: {
        id: participant.id,
        token: participant.token,
        status: participant.status,
        currentScene: participant.currentScene,
        score: participant.score,
        maxScore: participant.maxScore,
        timeTakenSec: participant.timeTakenSec,
        startedAt: participant.startedAt,
        completedAt: participant.completedAt,
        choices,
      },
      employee: participant.employee,
      session: {
        id: participant.session.id,
        title: participant.session.title,
        description: participant.session.description,
        status: participant.session.status,
        deadline: participant.session.deadline,
        scenario: {
          ...participant.session.scenario,
          decisionTree: parsedTree,
        },
      },
    });
  } catch (error) {
    console.error("Failed to load play data:", error);
    return NextResponse.json(
      { error: "Simulationsdaten konnten nicht geladen werden" },
      { status: 500 }
    );
  }
}

// PUT /api/simulations/play/[token] - Save progress for a scene choice
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();
    const {
      sceneId,
      choiceId,
      freeText,
      timeSpentSec,
    }: {
      sceneId: number;
      choiceId: string;
      freeText?: string;
      timeSpentSec: number;
    } = body;

    if (sceneId === undefined || !choiceId) {
      return NextResponse.json(
        { error: "sceneId und choiceId sind Pflichtfelder" },
        { status: 400 }
      );
    }

    const participant = await prisma.simulationParticipant.findUnique({
      where: { token },
      include: {
        session: {
          include: {
            scenario: { select: { decisionTree: true } },
          },
        },
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "Ungültiger Teilnahme-Link" },
        { status: 404 }
      );
    }

    if (participant.status === "completed") {
      return NextResponse.json(
        { error: "Diese Simulation wurde bereits abgeschlossen" },
        { status: 409 }
      );
    }

    // Parse the decision tree to find the choice score and next scene
    let decisionTree: { scenes: SceneNode[] } | null = null;
    try {
      decisionTree = JSON.parse(participant.session.scenario.decisionTree);
    } catch {
      return NextResponse.json(
        { error: "Szenario-Daten sind ungültig" },
        { status: 500 }
      );
    }

    const scene = decisionTree?.scenes.find((s) => s.id === sceneId);
    if (!scene) {
      return NextResponse.json(
        { error: `Szene ${sceneId} nicht gefunden` },
        { status: 400 }
      );
    }

    const choice = scene.choices.find((c) => c.id === choiceId);
    if (!choice) {
      return NextResponse.json(
        { error: `Auswahl ${choiceId} nicht gefunden` },
        { status: 400 }
      );
    }

    // Load existing choices and append new one
    const existingChoices: ParticipantChoice[] = participant.choices
      ? JSON.parse(participant.choices)
      : [];

    // Prevent duplicate scene submissions
    const alreadyAnswered = existingChoices.some((c) => c.sceneId === sceneId);
    if (alreadyAnswered) {
      return NextResponse.json(
        { error: `Szene ${sceneId} wurde bereits beantwortet` },
        { status: 409 }
      );
    }

    const newChoice: ParticipantChoice = {
      sceneId,
      choiceId,
      ...(freeText !== undefined && { freeText }),
      timeSpentSec: timeSpentSec ?? 0,
    };

    const updatedChoices = [...existingChoices, newChoice];

    // Recalculate score and maxScore from all choices so far
    let score = 0;
    let maxScore = 0;
    for (const answered of updatedChoices) {
      const s = decisionTree?.scenes.find((sc) => sc.id === answered.sceneId);
      if (!s) continue;
      const c = s.choices.find((ch) => ch.id === answered.choiceId);
      if (c) score += c.score;
      // maxScore = sum of optimal scores per scene
      const maxForScene = Math.max(...s.choices.map((ch) => ch.score));
      maxScore += maxForScene;
    }

    // Determine next scene
    const nextScene = choice.nextScene;
    const nextSceneId =
      nextScene === "end"
        ? participant.currentScene
        : (nextScene as number);

    // If participant is starting for the first time, set startedAt
    const isFirstChoice = existingChoices.length === 0;

    const updated = await prisma.simulationParticipant.update({
      where: { token },
      data: {
        choices: JSON.stringify(updatedChoices),
        currentScene: nextScene === "end" ? participant.currentScene : nextSceneId,
        score,
        maxScore,
        timeTakenSec: participant.timeTakenSec + (timeSpentSec ?? 0),
        status:
          participant.status === "pending" || isFirstChoice
            ? "in_progress"
            : participant.status,
        ...(isFirstChoice && { startedAt: new Date() }),
      },
    });

    return NextResponse.json({
      success: true,
      currentScene: updated.currentScene,
      score: updated.score,
      maxScore: updated.maxScore,
      timeTakenSec: updated.timeTakenSec,
      nextScene,
      feedback: choice.feedback,
      isOptimal: choice.isOptimal,
    });
  } catch (error) {
    console.error("Failed to save play progress:", error);
    return NextResponse.json(
      { error: "Fortschritt konnte nicht gespeichert werden" },
      { status: 500 }
    );
  }
}
