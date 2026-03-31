import { getOrgId } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const INTRUDER_BASE = "https://api.intruder.io";

type SnoozeReason = "ACCEPT_RISK" | "FALSE_POSITIVE" | "MITIGATING_CONTROLS";
type DurationType = "forever" | "day" | "week" | "month";

const VALID_REASONS: SnoozeReason[] = ["ACCEPT_RISK", "FALSE_POSITIVE", "MITIGATING_CONTROLS"];
const VALID_DURATIONS: DurationType[] = ["forever", "day", "week", "month"];

/**
 * POST /api/intruder/treat-finding
 *
 * Behandelt ein Finding und snoozed es gleichzeitig bei Intruder.
 *
 * Body:
 *   findingId: string          - Finding ID in TrustSpace
 *   reason: SnoozeReason       - ACCEPT_RISK | FALSE_POSITIVE | MITIGATING_CONTROLS
 *   durationType: DurationType - forever | day | week | month
 *   details?: string           - Optionaler Kommentar
 */
export async function POST(req: NextRequest) {
  try {
    const orgId = await getOrgId();
    const apiKey = process.env.INTRUDER_API_KEY;

    if (!orgId) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }
    if (!apiKey) {
      return NextResponse.json({ error: "INTRUDER_API_KEY not configured" }, { status: 500 });
    }

    const body = await req.json();
    const { findingId, reason, durationType, details } = body;

    if (!findingId || !reason || !durationType) {
      return NextResponse.json(
        { error: "findingId, reason und durationType sind erforderlich" },
        { status: 400 }
      );
    }

    if (!VALID_REASONS.includes(reason)) {
      return NextResponse.json({ error: `Ungültiger reason: ${reason}` }, { status: 400 });
    }
    if (!VALID_DURATIONS.includes(durationType)) {
      return NextResponse.json({ error: `Ungültiger durationType: ${durationType}` }, { status: 400 });
    }

    // Fetch finding and verify ownership
    const finding = await prisma.finding.findFirst({
      where: { id: findingId, organizationId: orgId },
    });

    if (!finding) {
      return NextResponse.json({ error: "Finding nicht gefunden" }, { status: 404 });
    }

    if (!finding.intruderIssueId) {
      return NextResponse.json(
        { error: "Dieses Finding ist nicht mit einem Intruder Issue verknüpft" },
        { status: 400 }
      );
    }

    // Snooze at Intruder
    const snoozeRes = await fetch(
      `${INTRUDER_BASE}/v1/issues/${finding.intruderIssueId}/snooze/`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason,
          duration_type: durationType,
          details: details || undefined,
        }),
      }
    );

    if (!snoozeRes.ok) {
      const errorText = await snoozeRes.text();
      console.error("[Intruder Treat] Snooze failed:", snoozeRes.status, errorText);
      return NextResponse.json(
        { error: "Intruder Snooze fehlgeschlagen", details: errorText },
        { status: 502 }
      );
    }

    // Map reason to finding status
    const newStatus = reason === "MITIGATING_CONTROLS" ? "in_progress" : "closed";

    // Update finding locally
    const updatedFinding = await prisma.finding.update({
      where: { id: findingId },
      data: {
        status: newStatus,
        intruderSnoozed: true,
        intruderSnoozeReason: reason,
      },
    });

    // Add system comment documenting the treatment
    const reasonLabels: Record<string, string> = {
      ACCEPT_RISK: "Risiko akzeptiert",
      FALSE_POSITIVE: "Als Fehlalarm markiert",
      MITIGATING_CONTROLS: "Kompensierende Maßnahmen vorhanden",
    };

    const durationLabels: Record<string, string> = {
      forever: "dauerhaft",
      day: "1 Tag",
      week: "1 Woche",
      month: "1 Monat",
    };

    await prisma.findingComment.create({
      data: {
        findingId,
        authorName: "System",
        content: `Behandlung: ${reasonLabels[reason]} (${durationLabels[durationType]}).${details ? ` Begründung: ${details}` : ""} — Automatisch bei Intruder gesnoozed.`,
      },
    });

    return NextResponse.json({
      success: true,
      finding: updatedFinding,
      intruderSnoozed: true,
    });
  } catch (error) {
    console.error("[Intruder Treat] Error:", error);
    return NextResponse.json({ error: "Behandlung fehlgeschlagen" }, { status: 500 });
  }
}
