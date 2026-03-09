import { NextRequest, NextResponse } from "next/server";

export interface OSVDetail {
  id: string;
  aliases: string[];
  summary: string;
  details: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  cvssScore?: number;
  cvssVector?: string;
  published: string;
  modified: string;
  affected: Array<{
    name: string;
    ecosystem: string;
    ranges: Array<{
      type: string;
      introduced?: string;
      fixed?: string;
    }>;
  }>;
  references: Array<{ type: string; url: string }>;
}

/** Extract numeric base score from a CVSS vector string.
 *  Uses the GitHub Advisory API for GHSA IDs (authoritative source with numeric score).
 *  Falls back to database_specific.severity → numeric mapping for others.
 */
async function getGitHubCvss(ghsaId: string): Promise<{ score: number; severity: string } | null> {
  try {
    const res = await fetch(`https://api.github.com/advisories/${ghsaId}`, {
      headers: { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const score = data.cvss?.score ?? data.cvss_severities?.cvss_v3?.score ?? data.cvss_severities?.cvss_v4?.score;
    const vector = data.cvss?.vector_string ?? data.cvss_severities?.cvss_v3?.vector_string;
    if (score != null) return { score: parseFloat(score), severity: data.severity?.toUpperCase() ?? null, vector };
    return null;
  } catch {
    return null;
  }
}

function mapSeverity(raw?: string): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
  if (!raw) return "LOW";
  const s = raw.toUpperCase();
  if (s === "MODERATE") return "MEDIUM";
  if (["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(s)) return s as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  return "LOW";
}

function scoreToSeverity(score: number): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
  if (score >= 9.0) return "CRITICAL";
  if (score >= 7.0) return "HIGH";
  if (score >= 4.0) return "MEDIUM";
  return "LOW";
}

// GET /api/osv/[id] – fetch full vulnerability details from OSV + GitHub
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const osvRes = await fetch(`https://api.osv.dev/v1/vulns/${id}`, {
      next: { revalidate: 3600 },
    });
    if (!osvRes.ok) {
      return NextResponse.json({ error: "Vulnerability not found" }, { status: 404 });
    }
    const raw = await osvRes.json();

    // --- Severity & CVSS score ---
    let cvssScore: number | undefined;
    let cvssVector: string | undefined;
    let severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = mapSeverity(raw.database_specific?.severity);

    // Try GitHub API for GHSA IDs to get authoritative numeric score
    if (id.startsWith("GHSA-")) {
      const gh = await getGitHubCvss(id);
      if (gh) {
        cvssScore = gh.score;
        severity = scoreToSeverity(gh.score);
        if ((gh as any).vector) cvssVector = (gh as any).vector;
      }
    }

    // Extract CVSS vector from OSV severity array (if no GitHub score)
    if (!cvssScore && raw.severity?.length) {
      for (const s of raw.severity) {
        if (["CVSS_V3", "CVSS_V4", "CVSS_V2"].includes(s.type)) {
          cvssVector = s.score;
          break;
        }
      }
    }

    // --- Affected packages & version ranges ---
    const affected: OSVDetail["affected"] = [];
    for (const pkg of raw.affected ?? []) {
      const name = pkg.package?.name ?? "unknown";
      const ecosystem = pkg.package?.ecosystem ?? "";
      const ranges: OSVDetail["affected"][0]["ranges"] = [];

      for (const range of pkg.ranges ?? []) {
        if (range.type === "SEMVER" || range.type === "ECOSYSTEM") {
          let introduced: string | undefined;
          let fixed: string | undefined;
          for (const event of range.events ?? []) {
            if (event.introduced != null) introduced = event.introduced === "0" ? "0 (alle Versionen)" : event.introduced;
            if (event.fixed != null) fixed = event.fixed;
          }
          ranges.push({ type: range.type, introduced, fixed });
        }
      }
      affected.push({ name, ecosystem, ranges });
    }

    const detail: OSVDetail = {
      id: raw.id,
      aliases: raw.aliases ?? [],
      summary: raw.summary ?? "",
      details: raw.details ?? "",
      severity,
      cvssScore,
      cvssVector,
      published: raw.published,
      modified: raw.modified,
      affected,
      references: (raw.references ?? []).slice(0, 10),
    };

    return NextResponse.json(detail);
  } catch (err) {
    console.error("OSV fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch vulnerability details" }, { status: 500 });
  }
}
