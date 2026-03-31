import { getIntruderTag, getLicenseLimits } from "@/lib/auth";
import { NextResponse } from "next/server";

const INTRUDER_BASE = "https://api.intruder.io";

/**
 * GET /api/intruder/licenses
 *
 * Returns the tenant's license limits and current usage.
 */
export async function GET() {
  const tag = await getIntruderTag();
  const limits = await getLicenseLimits();
  const apiKey = process.env.INTRUDER_API_KEY;

  if (!tag || !limits) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }
  if (!apiKey) {
    return NextResponse.json({ error: "INTRUDER_API_KEY not configured" }, { status: 500 });
  }

  const tagLower = tag.toLowerCase();
  const expectedCloudName = `${tag} : Cloud Scan`.toLowerCase();

  // Count this tenant's targets by license type
  const targetsRes = await fetch(`${INTRUDER_BASE}/v1/targets/?limit=200`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  let infraUsed = 0;
  let appUsed = 0;

  if (targetsRes.ok) {
    const data = await targetsRes.json();
    for (const t of data.results ?? []) {
      const isOwn =
        t.tags?.some((tg: string) => tg.toLowerCase() === tagLower) ||
        (t.target_type === "cloud" && t.display_address?.toLowerCase() === expectedCloudName);
      if (!isOwn) continue;
      if (t.license_type === "application") appUsed++;
      else infraUsed++;
    }
  }

  return NextResponse.json({
    infrastructure: {
      used: infraUsed,
      limit: limits.infrastructure,
      available: Math.max(0, limits.infrastructure - infraUsed),
    },
    application: {
      used: appUsed,
      limit: limits.application,
      available: Math.max(0, limits.application - appUsed),
    },
  });
}
