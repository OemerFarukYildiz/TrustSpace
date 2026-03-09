import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const findings = await prisma.finding.findMany({
      where: { organizationId: "default-org" },
      include: { assignee: true, vulnerability: { include: { component: { include: { sbomDocument: { include: { asset: true } } } } } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(findings);
  } catch (error) {
    console.error("Failed to fetch findings:", error);
    return NextResponse.json({ error: "Failed to fetch findings" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title, description, type, priority, dueDate, folder,
      vulnerabilityId, vexStatus,
      controlRef, deviation, rootCause,
    } = body;

    if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 });
    if (!type)  return NextResponse.json({ error: "type is required" }, { status: 400 });

    const finding = await prisma.finding.create({
      data: {
        organizationId: "default-org",
        title,
        description: description || undefined,
        type,
        priority: priority || "medium",
        status: "open",
        dueDate: dueDate ? new Date(dueDate) : undefined,
        folder: folder || undefined,
        vulnerabilityId: vulnerabilityId || undefined,
        controlRef: controlRef || undefined,
        deviation: deviation || undefined,
        rootCause: rootCause || undefined,
      },
    });

    if (vulnerabilityId && vexStatus) {
      await prisma.vexVulnerability.update({
        where: { id: vulnerabilityId },
        data: { vexStatus },
      });
    }

    return NextResponse.json({ success: true, finding });
  } catch (error: any) {
    console.error("Failed to create finding:", error);
    return NextResponse.json({ error: "Failed to create finding", details: error.message }, { status: 500 });
  }
}

// PUT /api/findings — migrate existing CVEs that have no Finding yet
export async function PUT() {
  try {
    const vulnsWithoutFinding = await prisma.vexVulnerability.findMany({
      where: { findings: { none: {} } },
    });

    const priorityMap: Record<string, string> = {
      CRITICAL: "critical",
      HIGH: "high",
      MEDIUM: "medium",
      LOW: "low",
    };

    let created = 0;
    for (const vuln of vulnsWithoutFinding) {
      await prisma.finding.create({
        data: {
          organizationId: "default-org",
          title: vuln.cveId,
          description: vuln.remediation || undefined,
          type: "vulnerability",
          priority: priorityMap[vuln.severity?.toUpperCase() ?? ""] ?? "medium",
          status: "open",
          vulnerabilityId: vuln.id,
        },
      });
      created++;
    }

    return NextResponse.json({ success: true, created });
  } catch (error: any) {
    console.error("Failed to migrate findings:", error);
    return NextResponse.json({ error: "Migration failed", details: error.message }, { status: 500 });
  }
}
