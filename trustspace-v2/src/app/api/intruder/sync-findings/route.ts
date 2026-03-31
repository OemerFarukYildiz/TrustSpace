import { getIntruderTag, getOrgId } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const INTRUDER_BASE = "https://api.intruder.io";

interface IntruderIssue {
  id: number;
  title: string;
  description: string;
  remediation: string;
  severity: string;
  snoozed: boolean;
  snooze_reason: string | null;
  snooze_until: string | null;
  cvss_score: number | null;
  exploit_likelihood: string | null;
}

interface IntruderTarget {
  id: string;
  address: string;
  display_address: string;
  tags: string[];
  target_type: string;
}

/**
 * POST /api/intruder/sync-findings
 *
 * Syncs Intruder issues into the Maßnahmen (Findings) system:
 * 1. Fetches all targets for this tenant
 * 2. For each target, fetches all issues
 * 3. Creates a folder per target (display_address)
 * 4. Creates/updates a Finding per issue
 */
export async function POST() {
  try {
    const orgId = await getOrgId();
    const tag = await getIntruderTag();
    const apiKey = process.env.INTRUDER_API_KEY;

    if (!orgId || !tag) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }
    if (!apiKey) {
      return NextResponse.json({ error: "INTRUDER_API_KEY not configured" }, { status: 500 });
    }

    const tagLower = tag.toLowerCase();
    const expectedCloudName = `${tag} : Cloud Scan`.toLowerCase();

    // 1. Fetch all targets from Intruder
    const targetsRes = await fetch(`${INTRUDER_BASE}/v1/targets/?limit=200`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!targetsRes.ok) {
      console.error("[Intruder Sync] Failed to fetch targets:", targetsRes.status);
      return NextResponse.json({ error: "Intruder API Fehler beim Targets-Abruf" }, { status: 502 });
    }

    const targetsData = await targetsRes.json();
    const allTargets: IntruderTarget[] = targetsData.results ?? [];

    // Filter to tenant's targets
    const tenantTargets = allTargets.filter((t) => {
      if (t.tags?.some((tg: string) => tg.toLowerCase() === tagLower)) return true;
      if (t.target_type === "cloud" && t.display_address?.toLowerCase() === expectedCloudName) return true;
      return false;
    });

    if (tenantTargets.length === 0) {
      return NextResponse.json({ success: true, created: 0, updated: 0, folders: 0, message: "Keine Targets gefunden" });
    }

    let created = 0;
    let updated = 0;
    let folderCount = 0;

    // Severity → Priority mapping
    const priorityMap: Record<string, string> = {
      critical: "critical",
      high: "high",
      medium: "medium",
      low: "low",
    };

    // 2. For each target: create folder + fetch & sync issues
    for (const target of tenantTargets) {
      const folderName = target.display_address || target.address;

      // Ensure folder exists
      await prisma.findingFolder.upsert({
        where: {
          organizationId_type_name: {
            organizationId: orgId,
            type: "vulnerability",
            name: folderName,
          },
        },
        create: {
          organizationId: orgId,
          type: "vulnerability",
          name: folderName,
        },
        update: {}, // no-op if exists
      });
      folderCount++;

      // Fetch issues for this target (both active and snoozed)
      const [activeRes, snoozedRes] = await Promise.all([
        fetch(`${INTRUDER_BASE}/v1/issues/?target_addresses=${encodeURIComponent(target.address)}&snoozed=false&limit=100`, {
          headers: { Authorization: `Bearer ${apiKey}` },
        }),
        fetch(`${INTRUDER_BASE}/v1/issues/?target_addresses=${encodeURIComponent(target.address)}&snoozed=true&limit=100`, {
          headers: { Authorization: `Bearer ${apiKey}` },
        }),
      ]);

      const activeIssues: IntruderIssue[] = activeRes.ok ? (await activeRes.json()).results ?? [] : [];
      const snoozedIssues: IntruderIssue[] = snoozedRes.ok ? (await snoozedRes.json()).results ?? [] : [];
      const allIssues = [...activeIssues, ...snoozedIssues];

      for (const issue of allIssues) {
        const intruderIssueId = String(issue.id);

        // Check if finding already exists for this issue + org
        const existing = await prisma.finding.findFirst({
          where: {
            organizationId: orgId,
            intruderIssueId,
          },
        });

        if (existing) {
          // Update: sync severity, snooze status, description
          await prisma.finding.update({
            where: { id: existing.id },
            data: {
              intruderSnoozed: issue.snoozed,
              intruderSnoozeReason: issue.snooze_reason,
              intruderSeverity: issue.severity,
              description: issue.description || existing.description,
              remediation: issue.remediation || existing.remediation,
              // If snoozed in Intruder but open here → close it
              ...(issue.snoozed && existing.status === "open" ? { status: "closed" } : {}),
            },
          });
          updated++;
        } else {
          // Create new finding
          await prisma.finding.create({
            data: {
              organizationId: orgId,
              title: issue.title,
              description: issue.description || undefined,
              remediation: issue.remediation || undefined,
              type: "vulnerability",
              priority: priorityMap[issue.severity?.toLowerCase()] ?? "medium",
              status: issue.snoozed ? "closed" : "open",
              folder: folderName,
              intruderIssueId,
              intruderSnoozed: issue.snoozed,
              intruderSnoozeReason: issue.snooze_reason,
              intruderTargetAddress: target.address,
              intruderSeverity: issue.severity,
            },
          });
          created++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      created,
      updated,
      folders: folderCount,
      targets: tenantTargets.length,
    });
  } catch (error) {
    console.error("[Intruder Sync] Error:", error);
    return NextResponse.json({ error: "Sync fehlgeschlagen" }, { status: 500 });
  }
}
