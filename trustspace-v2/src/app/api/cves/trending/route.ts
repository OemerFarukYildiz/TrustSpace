import { NextResponse } from "next/server";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Resolves Nuxt payload references.
 * The payload is a flat array where integers reference other indices.
 */
function resolve(raw: any[], val: any, depth = 0): any {
  if (depth > 30) return val;
  if (val === null || val === undefined) return val;
  if (typeof val === "string" || typeof val === "boolean") return val;
  if (typeof val === "number") {
    // Numbers can be actual values or indices. We use context to decide.
    return val;
  }
  if (Array.isArray(val)) {
    return val.map((v) => resolve(raw, v, depth + 1));
  }
  if (typeof val === "object") {
    const result: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      result[k] = resolve(raw, v, depth + 1);
    }
    return result;
  }
  return val;
}

/** Dereference a value that might be an index into raw */
function deref(raw: any[], val: any): any {
  if (typeof val === "number" && val >= 0 && val < raw.length) {
    const resolved = raw[val];
    // Avoid infinite loops - if resolved is also a small int that could be an index,
    // only deref if it points to a non-number
    if (typeof resolved === "number") return resolved;
    return resolved;
  }
  return val;
}

function getSeverity(score: number): string {
  if (score >= 9.0) return "Critical";
  if (score >= 7.0) return "High";
  if (score >= 4.0) return "Medium";
  return "Low";
}

export async function GET() {
  try {
    const res = await fetch("https://cvemon.intruder.io/_payload.json", {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch CVE data" }, { status: 502 });
    }

    const raw: any[] = await res.json();

    // Navigate the Nuxt payload structure:
    // raw[2] = component map with index references
    // raw[14] = { trends, insights, kevs }
    // raw[14].trends -> index -> { data, meta }
    // data -> { maxScore, trends: [index, index, ...] }
    const mainData = raw[14];
    if (!mainData || typeof mainData !== "object") {
      return NextResponse.json({ trends: [] });
    }

    const trendsContainer = deref(raw, mainData.trends);
    if (!trendsContainer || typeof trendsContainer !== "object") {
      return NextResponse.json({ trends: [] });
    }

    const trendsData = deref(raw, trendsContainer.data);
    if (!trendsData || typeof trendsData !== "object") {
      return NextResponse.json({ trends: [] });
    }

    const trendsIndices = deref(raw, trendsData.trends);
    if (!Array.isArray(trendsIndices)) {
      return NextResponse.json({ trends: [] });
    }

    const trends = trendsIndices.map((trendIdx: any) => {
      const trend = deref(raw, trendIdx);
      if (!trend || typeof trend !== "object") return null;

      const cve = deref(raw, trend.cve);
      if (!cve || typeof cve !== "object") return null;

      // Get CVSS - it's stored as a reference
      const cvssRaw = cve.cvssBaseScore;
      const cvss = typeof cvssRaw === "number" && cvssRaw > 10
        ? (typeof raw[cvssRaw] === "number" ? raw[cvssRaw] : cvssRaw)
        : cvssRaw;

      // Get CVE ID
      const cveId = typeof cve.cveId === "number" ? raw[cve.cveId] : cve.cveId;

      // Get descriptions
      const descsRef = deref(raw, cve.descriptions);
      let description = "";
      if (Array.isArray(descsRef) && descsRef.length > 0) {
        const desc0 = deref(raw, descsRef[0]);
        if (desc0 && typeof desc0 === "object") {
          description = typeof desc0.value === "number" ? raw[desc0.value] : (desc0.value || "");
        }
      }

      // Get product from CPEs
      const cpesRef = deref(raw, cve.cpes);
      let product = "";
      if (Array.isArray(cpesRef) && cpesRef.length > 0) {
        const cpe0 = deref(raw, cpesRef[0]);
        if (cpe0 && typeof cpe0 === "object") {
          const p = typeof cpe0.product === "number" ? raw[cpe0.product] : cpe0.product;
          const v = typeof cpe0.vendor === "number" ? raw[cpe0.vendor] : cpe0.vendor;
          product = `${(v || "").replace(/_/g, " ")} ${(p || "").replace(/_/g, " ")}`.trim();
        }
      }

      // Get tags
      const tagsRef = deref(raw, cve.tags);
      const tags: string[] = [];
      if (Array.isArray(tagsRef)) {
        for (const tagIdx of tagsRef) {
          const tag = deref(raw, tagIdx);
          if (tag && typeof tag === "object" && tag.title) {
            const title = typeof tag.title === "number" ? raw[tag.title] : tag.title;
            if (title) tags.push(title);
          }
        }
      }

      // Get AI summary
      const aiData = deref(raw, cve.aiCveData);
      let aiSummary = "";
      if (aiData && typeof aiData === "object" && aiData.text) {
        aiSummary = typeof aiData.text === "number" ? raw[aiData.text] : aiData.text;
      }

      return {
        id: cveId || "",
        cvss: typeof cvss === "number" ? cvss : 0,
        severity: getSeverity(typeof cvss === "number" ? cvss : 0),
        description: typeof description === "string" ? description.slice(0, 300) : "",
        aiSummary: typeof aiSummary === "string" ? aiSummary.slice(0, 500) : "",
        product,
        score: trend.currentScore ?? 0,
        scorePc: trend.currentScorePc ?? 0,
        tags,
      };
    }).filter(Boolean);

    return NextResponse.json({ trends });
  } catch (err) {
    console.error("CVE trending fetch error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
