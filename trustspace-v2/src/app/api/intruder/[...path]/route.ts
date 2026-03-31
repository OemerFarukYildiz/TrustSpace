import { NextRequest, NextResponse } from "next/server";
import { getIntruderTag, getLicenseLimits } from "@/lib/auth";

const INTRUDER_BASE = "https://api.intruder.io";

// No auto-inject of tag_names - we filter server-side for all endpoints

async function proxyRequest(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const apiKey = process.env.INTRUDER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "INTRUDER_API_KEY not configured" },
      { status: 500 }
    );
  }

  const tag = await getIntruderTag();
  if (!tag) {
    return NextResponse.json(
      { error: "Nicht authentifiziert - kein Tenant zugeordnet" },
      { status: 401 }
    );
  }

  const { path } = await params;

  // Reconstruct the path segments into a URL path string
  const pathStr = path.join("/");

  // Build query params - auto-inject tag filter for tenant isolation on GET requests
  const url = new URL(req.url);
  const searchParams = new URLSearchParams(url.searchParams);

  // No query-param injection - filtering happens server-side after response

  const queryString = searchParams.toString() ? `?${searchParams.toString()}` : "";
  // Always add trailing slash - Intruder API redirects without it (301 → GET = 405)
  const normalizedPath = pathStr.endsWith("/") ? pathStr : `${pathStr}/`;
  const targetUrl = `${INTRUDER_BASE}/${normalizedPath}${queryString}`;

  // Detect if the request is multipart (file upload)
  const contentType = req.headers.get("content-type") || "";
  const isMultipart = contentType.includes("multipart/form-data");

  // Build the outgoing request headers
  const headers: HeadersInit = {
    Authorization: `Bearer ${apiKey}`,
  };

  // Only set Content-Type for JSON requests; for multipart, let fetch set boundary
  if (!isMultipart) {
    headers["Content-Type"] = "application/json";
  }

  // Build the outgoing fetch options
  const fetchOptions: RequestInit = {
    method: req.method,
    headers,
  };

  // Forward the request body for methods that carry a payload
  if (req.method === "POST" || req.method === "PATCH") {
    if (isMultipart) {
      // Forward the raw body with its original content-type so the boundary is preserved
      const formData = await req.formData();
      fetchOptions.body = formData;
    } else {
      let bodyText = await req.text();
      const cleanPath = pathStr.replace(/\/+$/, ""); // strip trailing slashes

      // License check: block target creation if tenant has reached their limit
      if (cleanPath === "v1/targets" && req.method === "POST") {
        const limits = await getLicenseLimits();
        if (limits) {
          // Count existing targets for this tenant
          const tagLower = tag.toLowerCase();
          const expectedCloudName = `${tag} : Cloud Scan`.toLowerCase();
          const targetsRes = await fetch(`${INTRUDER_BASE}/v1/targets/?limit=200`, {
            headers: { Authorization: `Bearer ${apiKey}` },
          });
          if (targetsRes.ok) {
            const targetsData = await targetsRes.json();
            let infraCount = 0;
            let appCount = 0;
            for (const t of targetsData.results ?? []) {
              const isOwn = t.tags?.some((tg: string) => tg.toLowerCase() === tagLower) ||
                (t.target_type === "cloud" && t.display_address?.toLowerCase() === expectedCloudName);
              if (!isOwn) continue;
              if (t.license_type === "application") appCount++;
              else infraCount++; // infrastructure, cloud, etc.
            }

            // Determine which license type the new target needs
            let newType = "infrastructure";
            try {
              const parsed = JSON.parse(bodyText);
              if (parsed.target_type === "url" || parsed.target_type === "application") {
                newType = "application";
              }
            } catch { /* keep default */ }

            if (newType === "application" && appCount >= limits.application) {
              return NextResponse.json({
                error: `Lizenzlimit erreicht: ${appCount}/${limits.application} Application-Lizenzen belegt`,
                license_type: "application",
                used: appCount,
                limit: limits.application,
              }, { status: 403 });
            }
            if (newType === "infrastructure" && infraCount >= limits.infrastructure) {
              return NextResponse.json({
                error: `Lizenzlimit erreicht: ${infraCount}/${limits.infrastructure} Infrastructure-Lizenzen belegt`,
                license_type: "infrastructure",
                used: infraCount,
                limit: limits.infrastructure,
              }, { status: 403 });
            }
          }
        }
      }

      // Auto-inject tenant tag for scan starts and target creation
      if (bodyText && (cleanPath === "v1/scans" || cleanPath === "v1/targets") && req.method === "POST") {
        try {
          const body = JSON.parse(bodyText);
          // For scans: always add tag_names
          if (cleanPath === "v1/scans") {
            if (!body.tag_names?.length) {
              body.tag_names = [tag];
            } else if (!body.tag_names.includes(tag)) {
              body.tag_names = [...body.tag_names, tag];
            }
          }
          // For targets: always add tag
          if (cleanPath === "v1/targets") {
            if (!body.tags) {
              body.tags = [tag];
            } else if (!body.tags.includes(tag)) {
              body.tags = [...body.tags, tag];
            }
          }
          bodyText = JSON.stringify(body);
        } catch (error) {
          console.error("[Intruder Proxy] Body parse error:", error);
        }
      }
      if (bodyText) {
        fetchOptions.body = bodyText;
      }
    }
  }

  const upstreamResponse = await fetch(targetUrl, fetchOptions);

  // Read the response body as text so we can return it verbatim
  const responseBody = await upstreamResponse.text();

  // Attempt to return a parsed JSON response; fall back to plain text
  try {
    const json = JSON.parse(responseBody);

    // Server-side tenant filtering for all Intruder endpoints
    if (req.method === "GET" && json.results) {
      const tagLower = tag.toLowerCase();
      // Expected cloud target display_address format: "[OrgName] : Cloud Scan"
      const expectedCloudName = `${tag} : Cloud Scan`.toLowerCase();

      // Helper: check if a target belongs to this tenant
      const isOwnTarget = (t: { tags?: string[]; target_type?: string; display_address?: string }): boolean => {
        if (t.tags?.some((tg: string) => tg.toLowerCase() === tagLower)) return true;
        if (t.target_type === "cloud" && t.display_address?.toLowerCase() === expectedCloudName) return true;
        return false;
      };

      // Helper: get allowed target info for this tenant
      const getAllowedTargetInfo = async (): Promise<{ ids: Set<string>; addresses: Set<string> }> => {
        const targetsRes = await fetch(`${INTRUDER_BASE}/v1/targets/?limit=200`, {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        const ids = new Set<string>();
        const addresses = new Set<string>();
        if (targetsRes.ok) {
          const targetsData = await targetsRes.json();
          for (const t of targetsData.results ?? []) {
            if (isOwnTarget(t)) {
              if (t.id) ids.add(String(t.id));
              if (t.address) addresses.add(t.address);
              if (t.display_address) addresses.add(t.display_address);
            }
          }
        } else {
          console.error("[Intruder Proxy] Failed to fetch targets for filtering:", targetsRes.status);
        }
        return { ids, addresses };
      };

      const getAllowedAddresses = async (): Promise<Set<string>> => {
        const info = await getAllowedTargetInfo();
        return new Set([...info.ids, ...info.addresses]);
      };

      const cleanedPath = pathStr.replace(/\/+$/, "");
      const isTargetsEndpoint = cleanedPath === "v1/targets";
      const isIssuesEndpoint = cleanedPath === "v1/issues";
      const isScansEndpoint = cleanedPath === "v1/scans";
      const isFixedEndpoint = cleanedPath.startsWith("v1/occurrences/fixed");

      // Filter targets
      if (isTargetsEndpoint) {
        const filtered = json.results.filter(isOwnTarget);
        json.results = filtered;
        json.count = filtered.length;
      }

      // Filter issues
      if (isIssuesEndpoint) {
        const requestHasTargetFilter = searchParams.has("target_addresses");

        if (!requestHasTargetFilter) {
          const targetsRes2 = await fetch(`${INTRUDER_BASE}/v1/targets/?limit=200`, {
            headers: { Authorization: `Bearer ${apiKey}` },
          });
          const targetAddresses: string[] = [];
          const addrToDisplay: Record<string, string> = {};
          if (targetsRes2.ok) {
            const targetsData2 = await targetsRes2.json();
            for (const t of targetsData2.results ?? []) {
              addrToDisplay[t.address] = t.display_address || t.address;
              if (isOwnTarget(t)) {
                targetAddresses.push(t.address);
              }
            }
          } else {
            console.error("[Intruder Proxy] Failed to fetch targets for issue filtering:", targetsRes2.status);
          }

          if (targetAddresses.length > 0) {
            const allIssues: Array<Record<string, unknown>> = [];
            const issueTargetMap: Record<string, string[]> = {};

            for (const addr of targetAddresses) {
              try {
                const filteredUrl = new URL(`${INTRUDER_BASE}/v1/issues/`);
                for (const [key, val] of searchParams.entries()) {
                  filteredUrl.searchParams.set(key, val);
                }
                filteredUrl.searchParams.set("target_addresses", addr);
                filteredUrl.searchParams.set("limit", "100");

                const filteredRes = await fetch(filteredUrl.toString(), {
                  headers: { Authorization: `Bearer ${apiKey}` },
                });
                if (filteredRes.ok) {
                  const filteredData = await filteredRes.json();
                  for (const issue of filteredData.results ?? []) {
                    allIssues.push(issue);
                    const displayName = addrToDisplay[addr] || addr;
                    const id = String(issue.id);
                    if (!issueTargetMap[id]) issueTargetMap[id] = [];
                    if (!issueTargetMap[id].includes(displayName)) {
                      issueTargetMap[id].push(displayName);
                    }
                  }
                } else {
                  console.error(`[Intruder Proxy] Failed to fetch issues for ${addr}:`, filteredRes.status);
                }
              } catch (error) {
                console.error(`[Intruder Proxy] Error fetching issues for ${addr}:`, error);
              }
            }

            const seen = new Set<string>();
            const deduped = allIssues.filter((issue) => {
              const id = String(issue.id);
              if (seen.has(id)) return false;
              seen.add(id);
              return true;
            });

            // Return all issues (no proxy-level pagination) so frontend
            // can group by target consistently across all pages
            json.results = deduped;
            json.count = deduped.length;
            json._targetMap = issueTargetMap;
          }
        }
      }

      // Filter fixed occurrences
      if (isFixedEndpoint) {
        const allowedAddresses = await getAllowedAddresses();
        json.results = json.results.filter((occ: { affected_host?: string; display_address?: string }) => {
          return allowedAddresses.has(occ.affected_host ?? "") || allowedAddresses.has(occ.display_address ?? "");
        });
        json.count = json.results.length;
      }

      // Filter scans
      if (isScansEndpoint) {
        const allowedAddresses = await getAllowedAddresses();
        const detailPromises = json.results.map(async (scan: { id: string; target_addresses?: string[] }) => {
          try {
            const detailRes = await fetch(`${INTRUDER_BASE}/v1/scans/${scan.id}/`, {
              headers: { Authorization: `Bearer ${apiKey}` },
            });
            if (detailRes.ok) {
              const detail = await detailRes.json();
              return { ...scan, target_addresses: detail.target_addresses ?? [], start_time: detail.start_time, completed_time: detail.completed_time };
            }
          } catch (error) {
            console.error(`[Intruder Proxy] Error fetching scan detail ${scan.id}:`, error);
          }
          return scan;
        });
        const enriched = await Promise.all(detailPromises);
        const filtered = enriched.filter((scan: { target_addresses?: string[] }) => {
          const addrs: string[] = scan.target_addresses ?? [];
          if (addrs.length === 0) return true;
          return addrs.some((a: string) => allowedAddresses.has(a));
        });
        json.results = filtered;
        json.count = filtered.length;
      }
    }

    return NextResponse.json(json, { status: upstreamResponse.status });
  } catch {
    return new NextResponse(responseBody, {
      status: upstreamResponse.status,
      headers: { "Content-Type": "text/plain" },
    });
  }
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    return await proxyRequest(req, context);
  } catch (error) {
    console.error("[Intruder Proxy] GET error:", error);
    return NextResponse.json(
      { error: "Fehler beim Weiterleiten der Anfrage an die Intruder API" },
      { status: 502 }
    );
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    return await proxyRequest(req, context);
  } catch (error) {
    console.error("[Intruder Proxy] POST error:", error);
    return NextResponse.json(
      { error: "Fehler beim Weiterleiten der Anfrage an die Intruder API" },
      { status: 502 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    return await proxyRequest(req, context);
  } catch (error) {
    console.error("[Intruder Proxy] PATCH error:", error);
    return NextResponse.json(
      { error: "Fehler beim Weiterleiten der Anfrage an die Intruder API" },
      { status: 502 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    return await proxyRequest(req, context);
  } catch (error) {
    console.error("[Intruder Proxy] DELETE error:", error);
    return NextResponse.json(
      { error: "Fehler beim Weiterleiten der Anfrage an die Intruder API" },
      { status: 502 }
    );
  }
}
