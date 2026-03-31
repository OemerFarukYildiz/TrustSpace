import { NextResponse } from "next/server";

interface CISAVuln {
  cveID: string;
  vendorProject: string;
  product: string;
  vulnerabilityName: string;
  dateAdded: string;
  shortDescription: string;
  requiredAction: string;
  dueDate: string;
  knownRansomwareCampaignUse: string;
}

export async function GET() {
  try {
    const res = await fetch(
      "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json",
      { next: { revalidate: 3600 } }
    );

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch CISA data" }, { status: 502 });
    }

    const data = await res.json();
    const vulns: CISAVuln[] = data.vulnerabilities ?? [];

    // Sort by dateAdded descending, take latest 10
    const latest = vulns
      .sort((a, b) => b.dateAdded.localeCompare(a.dateAdded))
      .slice(0, 10)
      .map((v) => ({
        cveId: v.cveID,
        vendor: v.vendorProject,
        product: v.product,
        name: v.vulnerabilityName,
        dateAdded: v.dateAdded,
        description: v.shortDescription,
        action: v.requiredAction,
        dueDate: v.dueDate,
        ransomware: v.knownRansomwareCampaignUse === "Known",
      }));

    return NextResponse.json({
      alerts: latest,
      totalCount: vulns.length,
      catalogDate: data.catalogVersion,
    });
  } catch (err) {
    console.error("CISA fetch error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
