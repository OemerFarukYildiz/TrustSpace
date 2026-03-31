import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST /api/simulations/play/[token]/complete - Mark simulation as completed
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const participant = await prisma.simulationParticipant.findUnique({
      where: { token },
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

    const now = new Date();

    // Calculate total time taken in seconds from startedAt to now
    const timeTakenSec = participant.startedAt
      ? Math.round((now.getTime() - participant.startedAt.getTime()) / 1000)
      : participant.timeTakenSec;

    const updated = await prisma.simulationParticipant.update({
      where: { token },
      data: {
        status: "completed",
        completedAt: now,
        timeTakenSec,
      },
    });

    const scorePct =
      updated.maxScore > 0
        ? Math.round((updated.score / updated.maxScore) * 100)
        : 0;

    return NextResponse.json({
      success: true,
      status: updated.status,
      completedAt: updated.completedAt,
      score: updated.score,
      maxScore: updated.maxScore,
      scorePct,
      timeTakenSec: updated.timeTakenSec,
    });
  } catch (error) {
    console.error("Failed to complete simulation:", error);
    return NextResponse.json(
      { error: "Simulation konnte nicht abgeschlossen werden" },
      { status: 500 }
    );
  }
}
