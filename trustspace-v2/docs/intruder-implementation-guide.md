# Vulnerability Scanner Module - Developer Implementation Guide

> **Last updated:** 2026-03-31
> **Module:** Schwachstellen (Vulnerabilities)
> **External service:** [Intruder.io](https://intruder.io) API v1

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Authentication & Multi-Tenancy](#2-authentication--multi-tenancy)
3. [The Proxy - How Every Request Flows](#3-the-proxy---how-every-request-flows)
4. [License Management](#4-license-management)
5. [Dashboard Page](#5-dashboard-page)
6. [Targets Page](#6-targets-page)
7. [Target Detail Page](#7-target-detail-page)
8. [Issues Page](#8-issues-page)
9. [Scans Page](#9-scans-page)
10. [Treatment / Snooze System](#10-treatment--snooze-system)
11. [Findings Sync (Background)](#11-findings-sync-background)
12. [Intruder API Reference](#12-intruder-api-reference)
13. [Known Limitations & Security Gaps](#13-known-limitations--security-gaps)
14. [File Reference](#14-file-reference)

---

## 1. Architecture Overview

### How it works

The vulnerability scanner is a **proxy-based integration** with Intruder.io. We don't run our own scanner - we use Intruder's infrastructure and wrap their API with our own multi-tenant layer.

```
┌─────────────────────────────────────────────────────────┐
│  Frontend (React)                                       │
│                                                         │
│  Dashboard ─── Targets ─── Issues ─── Scans            │
│      │            │          │          │               │
│      └────────────┴──────────┴──────────┘               │
│                        │                                │
│              fetch("/api/intruder/v1/...")               │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────┐
│  Proxy Route (src/app/api/intruder/[...path]/route.ts)  │
│                                                         │
│  1. Read intruder_tag from cookie                       │
│  2. If POST target → check license limits               │
│  3. If POST target/scan → inject tenant tag             │
│  4. Forward to https://api.intruder.io/{path}/          │
│  5. If GET list → filter response by tenant             │
│  6. Return filtered JSON                                │
└────────────────────────┬────────────────────────────────┘
                         │
              Bearer ${INTRUDER_API_KEY}
                         │
┌────────────────────────┴────────────────────────────────┐
│  Intruder API (api.intruder.io)                         │
│                                                         │
│  /v1/targets/  /v1/issues/  /v1/scans/  /v1/licenses/  │
└─────────────────────────────────────────────────────────┘
```

### Core principle

**One Intruder account, many tenants.** Each tenant has a tag (e.g. `"TrustSpace"`, `"Eduneon"`). Targets in Intruder are tagged with the tenant name. The proxy filters all API responses so each tenant only sees their own data.

### Environment

```env
INTRUDER_API_KEY=your-api-key    # Single key, shared across tenants
```

---

## 2. Authentication & Multi-Tenancy

### File: `src/app/api/auth/login/route.ts`

Tenants are configured as a hardcoded map (to be moved to DB later):

```typescript
const CREDENTIALS = {
  trustspace: {
    orgId: 'trustspace-org',
    orgName: 'TrustSpace GmbH',
    intruderTag: 'TrustSpace',                    // This is the key - used for ALL filtering
    licenses: { infrastructure: 5, application: 3 },
  },
  eduneon: {
    orgId: 'eduneon-org',
    orgName: 'Eduneon GmbH',
    intruderTag: 'Eduneon',
    licenses: { infrastructure: 3, application: 1 },
  },
};
```

On login, these values are stored as **HTTP-only cookies** (7-day TTL):

| Cookie | Value | Used by |
|--------|-------|---------|
| `org_id` | `"trustspace-org"` | All API routes for DB queries |
| `org_name` | `"TrustSpace GmbH"` | UI display |
| `intruder_tag` | `"TrustSpace"` | Proxy for filtering + tag injection |
| `intruder_licenses` | `'{"infrastructure":5,"application":3}'` | Proxy for license enforcement |

### File: `src/lib/auth.ts`

Helper functions to read these cookies:

```typescript
getOrgId(): Promise<string | null>
getOrgName(): Promise<string | null>
getIntruderTag(): Promise<string | null>          // THE critical one for Intruder
getLicenseLimits(): Promise<{ infrastructure: number; application: number } | null>
requireOrgId(): Promise<string | NextResponse>    // Returns 401 if not authed
```

**Important:** All return `null` if the cookie is missing. No fallback values. If `getIntruderTag()` returns null, the proxy returns 401.

### Adding a new tenant

1. Add entry to `CREDENTIALS` in `login/route.ts`
2. In Intruder dashboard: tag all the tenant's targets with the tenant name
3. For cloud targets: name them exactly `"[TenantName] : Cloud Scan"` (e.g. `"Eduneon : Cloud Scan"`)
4. Set license limits based on the tenant's subscription

---

## 3. The Proxy - How Every Request Flows

### File: `src/app/api/intruder/[...path]/route.ts` (396 lines)

This is the heart of the integration. Every single Intruder API call goes through here.

### Step-by-step request flow

```
1. VALIDATE AUTH
   └─ Read intruder_tag cookie
   └─ If null → return 401 "Nicht authentifiziert"

2. BUILD URL
   └─ Join path segments: path.join("/")
   └─ Always add trailing slash (Intruder requires it!)
   └─ Result: https://api.intruder.io/v1/targets/

3. FOR POST/PATCH REQUESTS:
   │
   ├─ If multipart (file upload):
   │  └─ Forward raw FormData, let browser set Content-Type boundary
   │
   └─ If JSON:
      │
      ├─ LICENSE CHECK (only POST v1/targets):
      │  ├─ Read license limits from cookie
      │  ├─ Fetch ALL targets from Intruder (/v1/targets/?limit=200)
      │  ├─ Count tenant's targets by license_type
      │  ├─ Determine new target type from request body
      │  └─ If limit reached → return 403 with details
      │
      └─ TAG INJECTION (POST v1/targets and v1/scans):
         ├─ Parse JSON body
         ├─ For targets: ensure tags[] contains tenant tag
         ├─ For scans: ensure tag_names[] contains tenant tag
         └─ Re-serialize body

4. FORWARD REQUEST
   └─ fetch(targetUrl, { method, headers: { Authorization: Bearer }, body })

5. FOR GET RESPONSES WITH results[]:
   │
   ├─ v1/targets → filter by isOwnTarget()
   │
   ├─ v1/issues (no target_addresses param):
   │  ├─ Fetch all tenant targets
   │  ├─ For each target address: fetch issues
   │  ├─ Deduplicate by issue ID
   │  ├─ Build _targetMap { issueId: [targetDisplayNames] }
   │  └─ Return deduped issues + _targetMap
   │
   ├─ v1/scans → enrich with detail, filter by target addresses
   │
   └─ v1/occurrences/fixed → filter by allowed addresses

6. RETURN filtered JSON
```

### The isOwnTarget() helper

This is the central function that decides if a target belongs to the current tenant:

```typescript
const isOwnTarget = (t) => {
  // Check 1: Does the target have our tag?
  if (t.tags?.some(tg => tg.toLowerCase() === tagLower)) return true;

  // Check 2: Is it a cloud target with our name format?
  if (t.target_type === "cloud" &&
      t.display_address?.toLowerCase() === `${tag} : cloud scan`) return true;

  return false;
};
```

**Why cloud targets are special:** Cloud targets (AWS, Azure) are created automatically by Intruder when you connect a cloud provider. They don't always have tags, so we match them by their `display_address` which follows the format `"[OrgName] : Cloud Scan"`.

### Trailing slash - critical detail

Intruder's API returns **301 redirects** for URLs without trailing slashes. When `fetch()` follows a 301, it converts POST to GET. This caused 405 errors on the snooze endpoint. The proxy now always adds a trailing slash:

```typescript
const normalizedPath = pathStr.endsWith("/") ? pathStr : `${pathStr}/`;
```

### The _targetMap optimization

When fetching issues without a target filter, the proxy needs to know which target each issue belongs to. Instead of making the frontend do N+1 queries, the proxy builds a map:

```json
{
  "results": [...issues...],
  "count": 61,
  "_targetMap": {
    "12345": ["TrustSpace : Cloud Scan"],
    "12346": ["isms.trustspace.io", "trustspace.io"]
  }
}
```

The frontend uses this to group issues by target without additional API calls.

---

## 4. License Management

### File: `src/app/api/intruder/licenses/route.ts`

**Endpoint:** `GET /api/intruder/licenses`

### How it works

1. Reads license limits from cookie (set on login)
2. Fetches ALL targets from Intruder API
3. Filters to tenant's targets using `isOwnTarget()` logic
4. Counts by `license_type` field (`"infrastructure"` or `"application"`)
5. Returns usage vs. limits

### Response

```json
{
  "infrastructure": { "used": 2, "limit": 5, "available": 3 },
  "application":    { "used": 1, "limit": 3, "available": 2 }
}
```

### Enforcement in proxy

When a tenant tries to create a target (`POST v1/targets`), the proxy:

1. Reads `intruder_licenses` cookie
2. Counts existing targets per license type
3. Determines new target type from request body (`target_type === "url"` → application, else → infrastructure)
4. If limit reached → **403 response:**

```json
{
  "error": "Lizenzlimit erreicht: 3/3 Infrastructure-Lizenzen belegt",
  "license_type": "infrastructure",
  "used": 3,
  "limit": 3
}
```

### Frontend display

The targets page shows 5 KPI cards:

| Gesamt | Live | Unresponsive | Infrastructure | Application |
|--------|------|-------------|----------------|-------------|
| 3 | 2 | 1 | **2/5** | **1/3** |

- Cards turn **amber** when limit is reached (available = 0)
- "Target hinzufügen" button **disables** when ALL licenses are exhausted
- Warning badge: "Alle Lizenzen belegt"
- After adding/deleting targets: licenses auto-refresh via `refreshLicenses()`

---

## 5. Dashboard Page

### File: `src/app/(app)/vulnerabilities/page.tsx` (852 lines)

### What it shows

- **Threat level banner** - Critical/High/Medium/Low based on issue severity distribution
- **KPI cards** - Issue counts by severity, targets, active scans, exploit known count
- **Cyber Hygiene Score** - 0-100 score based on penalty formula
- **Severity distribution chart** - Flowing area chart with gradient
- **Top issues to fix** - 5 most critical unsnoozed issues
- **Trending CVEs** - From external cvemon.intruder.io API
- **Security news** - From Heise Security RSS feed
- **Next scheduled scan** - From Intruder schedules

### API calls on load (9 parallel requests)

```
GET /api/intruder/v1/targets/?limit=100
GET /api/intruder/v1/scans/?limit=10
GET /api/intruder/v1/scans/schedules/
GET /api/intruder/v1/issues/?severity=critical&limit=1
GET /api/intruder/v1/issues/?severity=high&limit=1
GET /api/intruder/v1/issues/?severity=medium&limit=1
GET /api/intruder/v1/issues/?severity=low&limit=1
GET /api/intruder/v1/scans/?status=in_progress
GET /api/intruder/v1/issues/?limit=100
```

Plus 2 external calls (independent, on mount only):
```
GET /api/cves/trending          → cvemon.intruder.io (1h cache)
GET /api/security-news          → heise.de RSS (30min cache)
```

### Tag filter

Dropdown in the header lets user filter by Intruder tag. When a tag is selected, issue queries append `&tag_names={tag}`. This re-fetches all data via `useEffect`.

### Hygiene score calculation

```typescript
const maxPenalty = filteredTargets.length * 100;
const penalty = criticalCount * 30 + highCount * 15 + mediumCount * 5 + lowCount * 1;
const score = Math.max(0, Math.min(100, 100 - Math.round((penalty / maxPenalty) * 100)));
```

### Actions

- **"Scan starten"** → `POST /api/intruder/v1/scans/` with optional `tag_names`
- **"Aktualisieren"** → re-fetches all data

---

## 6. Targets Page

### File: `src/app/(app)/vulnerabilities/targets/page.tsx` (1300 lines)

### What it shows

- **5 KPI cards** - Total, Live, Unresponsive, Infrastructure licenses, Application licenses
- **Filterable target list** - Search, type filter, status filter
- **Pagination** - 25 per page, offset-based
- **Per-target actions** - Add tag, remove tag, start scan, delete

### Target creation flow

```
Step 1: Choose type
  ├─ Infrastructure (IP, hostname, CIDR)
  └─ Web Application (URL + entry point)

Step 2: Enter details
  ├─ Single mode: one address input
  ├─ Bulk mode (infrastructure only): newline-separated addresses
  └─ Tags: comma-separated (auto-trimmed)

Submit:
  POST /api/intruder/v1/targets/
  Body: { address: "192.168.1.1", tags: ["TrustSpace", "custom-tag"] }

  Proxy auto-injects tenant tag if not present.
  Proxy checks license limits before forwarding.
```

**Bulk import:** Iterates addresses one by one, tracks success/failed count, shows toast with results.

### Tag colors

Tags are displayed with deterministic colors based on a hash function:

```typescript
const TAG_COLORS = [
  { bg: "bg-blue-100", text: "text-blue-700" },
  { bg: "bg-green-100", text: "text-green-700" },
  { bg: "bg-purple-100", text: "text-purple-700" },
  { bg: "bg-amber-100", text: "text-amber-700" },
  { bg: "bg-rose-100", text: "text-rose-700" },
  { bg: "bg-teal-100", text: "text-teal-700" },
];

// Hash function: sum of char codes mod length
const idx = tag.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % TAG_COLORS.length;
```

### Filters

| Filter | Values | API param |
|--------|--------|-----------|
| Search | free text | `address={query}` |
| Type | all, external, internal, cloud, container_image | `target_type={value}` |
| Status | all, live, unscanned, unresponsive | `target_status={value}` |

Search is debounced at 350ms. All filters reset pagination to offset 0.

---

## 7. Target Detail Page

### File: `src/app/(app)/vulnerabilities/targets/[id]/page.tsx` (1503 lines)

### What it shows

5 tabs: **Issues**, **Authentications**, **APIs**, **Services**, **Activity**

Plus header info cards: Location, License type, Last scan, Scheduled scans, Target type.

### How the target is loaded

The page doesn't call `GET /v1/targets/{id}` directly. Instead:
1. Fetches all targets: `GET /v1/targets/?limit=100`
2. Finds the target by ID in the filtered results
3. This ensures the tenant can only access their own targets

### Tab: Issues

```
GET /api/intruder/v1/issues/?target_addresses={addr}&limit=50
```

Click on an issue → navigates to `/vulnerabilities/issues?issue={id}` which auto-opens the detail sheet.

### Tab: Authentications

Lists auth methods for authenticated scanning. Supports 5 types:

| Type | Fields |
|------|--------|
| `form` | username, password, form URL, submit button, fields array, logout URL |
| `http` | username, password |
| `http_header` | header name, header value |
| `session_cookie` | cookie name, cookie value |
| `oauth_client_credentials` | token URL, client ID, client secret |

**Create:** Multi-step dialog (select type → fill form → submit)
**Delete:** `DELETE /v1/targets/{id}/authentications/{authId}/`

### Tab: APIs

Upload OpenAPI/Swagger specs for API scanning:

```
POST /v1/targets/{id}/api_schemas/   (multipart: file + name + base_url + auth_id)
DELETE /v1/targets/{id}/api_schemas/{schemaId}/
```

### Tab: Services

Discovers open ports/services from issue occurrences. For each issue, fetches occurrences and extracts `port` + `protocol`. Deduplicates by `{port}/{protocol}` key.

**Note:** This is an N+1 pattern - one fetch per issue. Can be slow with many issues.

### Tab: Activity

Fetches recent scans and enriches each with detail (target_addresses, timing). Filters to scans that include this target's address. Shows last 20.

### Location lookup

```
GET http://ip-api.com/json/{target.address}
```

**Known issue:** Uses HTTP, not HTTPS. Skipped for cloud targets.

### License error handling

When adding auth or API schemas, Intruder may return license errors. The page parses `non_field_errors` for "license" text and shows a dedicated license error dialog.

---

## 8. Issues Page

### File: `src/app/(app)/vulnerabilities/issues/page.tsx` (1934 lines)

This is the largest page. It contains multiple components.

### Components defined in this file

| Component | Purpose |
|-----------|---------|
| `RichText` | Renders markdown links, code blocks, bullet points |
| `renderInline` | Helper for inline markdown parsing |
| `SeverityBadge` | Colored severity label (Critical/High/Medium/Low) |
| `ExploitBadge` | Exploit likelihood label |
| `CvssIndicator` | CVSS score with color bar |
| `Pagination` | Offset-based "X-Y of Z" pagination |
| `ScannerOutputBlock` | Lazy-loaded terminal output dialog |
| `TreatmentDialog` | Treatment selection (snooze) dialog |
| `IssueDetailSheet` | Side sheet with full issue details |
| `FilterBar` | Tag, severity, target, date filters |
| `CurrentIssuesTab` | Main issues list with target grouping |
| `IssuesPage` | Page wrapper (default export) |

### How issues are loaded

```
GET /api/intruder/v1/issues/?limit=200&offset=0
```

The proxy returns ALL tenant issues (not paginated server-side). The frontend does client-side pagination with `PAGE_SIZE = 20`.

### Target grouping

Issues are grouped by target using `_targetMap` from the proxy response:

```typescript
const targetGroups = (() => {
  const map = new Map<string, Issue[]>();
  for (const issue of allIssues) {
    const targets = issueTargets[issue.id];  // from _targetMap
    for (const t of targets) {
      if (!map.has(t)) map.set(t, []);
      map.get(t).push(issue);
    }
  }
  return Array.from(map.entries())
    .sort((a, b) => b[1].length - a[1].length)  // most issues first
    .map(([target, issues]) => ({ target, issues }));
})();
```

This groups globally across all issues, so each target appears only once regardless of pagination.

### Deep linking

URL param `?issue=123` auto-opens the detail sheet for that issue:

```typescript
useEffect(() => {
  if (deepLinkHandled || allIssues.length === 0) return;
  const issueId = searchParams.get("issue");
  if (issueId) {
    const found = allIssues.find(i => String(i.id) === issueId);
    if (found) { setSelectedIssue(found); setSheetOpen(true); }
    setDeepLinkHandled(true);
    window.history.replaceState({}, "", "/vulnerabilities/issues");  // clean URL
  }
}, [allIssues, searchParams, deepLinkHandled]);
```

### Issue Detail Sheet

Opens as a right-side sheet. Shows:

1. **Header** - Title, severity badge, exploit badge, CVSS score, treatment status
2. **CVSS Gauge** - Circular gauge from occurrences data, age in days, exploit likelihood
3. **CVEs** - Listed from occurrence data, linked to NVD
4. **Description** - RichText rendered (links, code, bullets)
5. **Remediation** - RichText rendered with green background
6. **Occurrences** - Affected systems with port, protocol, first seen, age, scanner output button

### RichText component

Handles Intruder's markdown-like formatting:

```typescript
// Splits text by lines for bullet point detection
// Each line checked for "- " or "* " prefix → renders as bullet
// Empty lines → spacer divs
// Inline: [text](url) → <a> tag
// Inline: `code` → <code> with mono font
// Inline: https://... → auto-linked
```

### Treatment status badge

- **Untreated issues:** Blue "Behandeln" button → opens TreatmentDialog for selection
- **Treated issues:** Green badge showing reason + duration → **clickable** → opens TreatmentDialog in read-only mode showing details

---

## 9. Scans Page

### File: `src/app/(app)/vulnerabilities/scans/page.tsx` (1418 lines)

### What it shows

- **Running scans** - With animated terminal, elapsed time, estimated progress
- **Completed scans** - With duration, status, target count (paginated, 25 per page)
- **Schedules** - Next scan date, frequency, name

### Scan terminal animation

The terminal is **cosmetic** - it doesn't show real scan output. It displays 33 hardcoded phases:

```typescript
const SCAN_PHASES = [
  { msg: "Initializing scan engine...", color: "text-gray-500" },
  { msg: "Loading vulnerability database (45,377 checks)...", color: "text-gray-500" },
  { msg: "TCP SYN scan on common ports (1-1024)...", color: "text-cyan-400" },
  { msg: "SSL/TLS certificate analysis...", color: "text-cyan-400" },
  { msg: "SQL injection probe on form inputs...", color: "text-red-400" },
  // ... 28 more phases
];
```

Lines appear every 3 seconds based on elapsed time: `Math.floor(elapsedSec / 3) + 3`

### Start Scan dialog

Three modes:
- **All targets** - No body params (scans everything)
- **By targets** - `{ target_addresses: ["192.168.1.1", ...] }`
- **By tags** - `{ tag_names: ["TrustSpace", ...] }`

The proxy always injects the tenant tag into `tag_names` regardless.

### Create Schedule dialog

```typescript
POST /api/intruder/v1/scans/schedules/
{
  name: "Weekly Scan",
  first_scan_time: "2026-04-01T02:00:00.000Z",
  scan_frequency: "weekly",              // daily|weekly|monthly|quarterly
  targets?: ["192.168.1.1"],             // optional
  tags?: ["TrustSpace"]                  // optional
}
```

### Scan type labels (German)

| API value | Display |
|-----------|---------|
| `assessment_schedule` | Geplanter Scan |
| `new_service` | Neuer Service |
| `one_off` | Einmaliger Scan |
| `rapid_remediation` | Schnelle Prüfung |
| `cloud_security` | Cloud Security |
| `container_image` | Container Scan |

---

## 10. Treatment / Snooze System

### TreatmentDialog component

When a user clicks "Behandeln" on an open issue, or clicks the green badge on a treated issue:

### For untreated issues - selection mode

Three options displayed as clickable cards:

| Value | Label | Color | Description |
|-------|-------|-------|-------------|
| `ACCEPT_RISK` | Risiko akzeptieren | Blue | Das Risiko ist bekannt und wird bewusst in Kauf genommen |
| `FALSE_POSITIVE` | Fehlalarm | Amber | Das Issue ist kein echtes Sicherheitsproblem in diesem Kontext |
| `MITIGATING_CONTROLS` | Kompensierende Maßnahmen | Emerald | Bestehende Kontrollen reduzieren das Risiko ausreichend |

Duration options as pill buttons: **Dauerhaft** | 1 Monat | 1 Woche | 1 Tag

Optional note textarea.

### API call on submit

```
POST /api/intruder/v1/issues/{issueId}/snooze/
{
  "reason": "ACCEPT_RISK",
  "duration_type": "forever",
  "details": "Optional note from user"
}
```

Response from Intruder: `{ "message": "Issue was snoozed." }`

### For treated issues - read-only mode

Shows:
- Which method was chosen (icon + label + description)
- Duration (until date or "Dauerhaft gültig")
- "Schließen" button

### Important: No unsnooze API

Intruder does **not** have an unsnooze endpoint. Once snoozed, it can only be unsnoozed:
- Via the Intruder web dashboard
- By waiting for the duration to expire

This is why `duration_type: "forever"` should only be used for real risk acceptance.

---

## 11. Findings Sync (Background)

### Files:
- `src/app/api/intruder/sync-findings/route.ts`
- `src/app/api/intruder/treat-finding/route.ts`

These were built for syncing Intruder issues into the Maßnahmen (Findings) system. **Currently not actively used** - treatment happens directly in the Schwachstellen module via the Intruder API.

### sync-findings

`POST /api/intruder/sync-findings`

1. Fetches all tenant targets
2. For each target: creates a folder in FindingFolder
3. Fetches active + snoozed issues per target
4. Creates/updates Finding records with Intruder fields

### treat-finding

`POST /api/intruder/treat-finding`

1. Reads findingId, reason, durationType, details
2. Snoozes at Intruder via `/v1/issues/{id}/snooze/`
3. Updates local finding status
4. Creates system comment documenting the treatment

### Database fields on Finding model

```prisma
intruderIssueId      String?   // Links to Intruder issue
intruderSnoozed      Boolean   @default(false)
intruderSnoozeReason String?   // ACCEPT_RISK | FALSE_POSITIVE | MITIGATING_CONTROLS
intruderTargetAddress String?  // Target address for mapping
intruderSeverity     String?   // Original severity from Intruder
remediation          String?   // Remediation text from Intruder
```

---

## 12. Intruder API Reference

Complete reference for every Intruder.io API endpoint. Base URL: `https://api.intruder.io`

All requests require `Authorization: Bearer {API_KEY}` header.
All URLs **must** end with a trailing slash `/`.

---

### 12.1 Health

#### `GET /v1/health/`

Verify API status and authentication. Returns 200 if API key is valid.

---

### 12.2 Targets

#### `GET /v1/targets/` - List targets

| Query Param | Type | Values |
|-------------|------|--------|
| `address` | string | Filter by address or display_address |
| `limit` | int | Results per page (default: 25) |
| `offset` | int | Pagination offset |
| `target_status` | enum | `live`, `license_exceeded`, `unscanned`, `unresponsive`, `agent_uninstalled` |
| `target_type` | enum | `external`, `internal`, `cloud`, `container_image` |

**Response: Target object**

| Field | Type | Notes |
|-------|------|-------|
| `id` | int | read-only |
| `address` | string | IP, hostname, or URL |
| `display_address` | string | read-only, human-readable (e.g. cloud account name) |
| `target_type` | enum | `external`, `internal`, `cloud`, `container_image` |
| `target_status` | enum | `live`, `license_exceeded`, `unscanned`, `unresponsive`, `agent_uninstalled` |
| `license_type` | enum | `infrastructure` or `application` |
| `tags` | string[] | Tag names assigned to this target |
| `has_authentications` | bool | read-only |
| `has_api_schemas` | bool | read-only |

#### `POST /v1/targets/` - Create target

| Body Field | Type | Required | Notes |
|------------|------|----------|-------|
| `address` | string | YES | IP, hostname, URL |
| `tags` | string[] | no | Tag names (1-40 chars each) |
| `target_authentication` | object | no | Inline auth config (see Authentications) |

**Response:** 200 with Target object. Returns 400 if address invalid, 401 if bad auth.

#### `POST /v1/targets/bulk/` - Bulk create

| Body Field | Type | Required |
|------------|------|----------|
| `addresses` | string[] | YES |
| `tags` | string[] | no |

#### `DELETE /v1/targets/{id}/` - Delete target

Returns 200 on success, 404 if not found.

#### `POST /v1/targets/{target_id}/tags/` - Add tag

| Body Field | Type | Required |
|------------|------|----------|
| `name` | string | YES |

#### `DELETE /v1/targets/{target_id}/tags/{name}/` - Remove tag

Returns 200 on success.

---

### 12.3 Target Authentications

#### `GET /v1/targets/{target_id}/authentications/` - List

Returns paginated list of auth configurations.

#### `POST /v1/targets/{target_id}/authentications/` - Create

| Body Field | Type | Required | Notes |
|------------|------|----------|-------|
| `url` | string | YES | Target URL for auth |
| `type` | enum | YES | See types below |
| `name` | string | no | Display name |
| `username` | string | no | write-only |
| `password` | string | no | write-only |
| `login_url` | string | no | Form login URL |
| `login_form_url` | string | no | Page containing the form |
| `logout_url` | string | no | Logout URL |
| `username_field` | string | no | Form field name for username |
| `password_field` | string | no | Form field name for password |
| `csrf_token_field` | string | no | CSRF token field name |
| `realm` | string | no | HTTP auth realm |
| `logged_in_indicator` | string | no | String that appears when logged in |
| `enabled` | bool | no | default true |
| `is_ajax_spider_enabled` | bool | no | default false |
| `recorded_login_file` | binary | no | Recorded login file |
| `headers` | array | no | `[{ name, value }]` |
| `cookies` | array | no | `[{ name, value }]` |
| `additional_parameters` | array | no | `[{ name, value }]` |

**Auth types:**
- `http` - HTTP Basic/Digest auth
- `form` - Form-based login (username/password fields)
- `http_header` - Custom header injection
- `session_cookie` - Direct cookie injection
- `oauth_client_credentials` - OAuth 2.0 client credentials
- `recorded` - Recorded login sequence
- `unauthenticated` - No auth (baseline)

#### `PATCH /v1/targets/{target_id}/authentications/{id}/` - Update

Same fields as create, all optional.

#### `DELETE /v1/targets/{target_id}/authentications/{id}/` - Delete

Returns 200 with deleted object.

---

### 12.4 Target API Schemas

#### `GET /v1/targets/{target_id}/api_schemas/` - List

Returns paginated list with `name` field.

#### `POST /v1/targets/{target_id}/api_schemas/` - Upload

**Content-Type: multipart/form-data**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | YES | Display name (max 40 chars) |
| `base_url` | URI | YES | Base URL for the API |
| `file` | binary | YES | OpenAPI/Swagger spec file |
| `target_authentication_id` | int | no | Link to existing auth config |

**Response:** `{ id, base_url, name, target_authentication_id }`

#### `PATCH /v1/targets/{target_id}/api_schemas/{id}/` - Update

Same fields, all optional. Supports multipart or JSON.

#### `DELETE /v1/targets/{target_id}/api_schemas/{id}/` - Delete

Returns 200.

---

### 12.5 Issues

#### `GET /v1/issues/` - List issues

| Query Param | Type | Values |
|-------------|------|--------|
| `issue_ids` | int[] | Comma-separated issue IDs |
| `limit` | int | Default: 25 |
| `offset` | int | Pagination offset |
| `severity` | enum | `low`, `medium`, `high`, `critical` |
| `since` | datetime | ISO 8601, show issues with new occurrences after this time |
| `snoozed` | bool | `true` = snoozed only, `false` = active only |
| `tag_names` | string[] | Comma-separated tag names |
| `target_addresses` | string[] | Comma-separated target addresses |

**Response: Issue object**

| Field | Type | Notes |
|-------|------|-------|
| `id` | int | read-only |
| `title` | string | Issue name |
| `description` | string | read-only, detailed explanation |
| `remediation` | string | read-only, fix guidance |
| `severity` | enum | read-only: `low`, `medium`, `high`, `critical` |
| `snoozed` | bool | Current snooze status |
| `snooze_reason` | enum/null | `ACCEPT_RISK`, `FALSE_POSITIVE`, `MITIGATING_CONTROLS` |
| `snooze_until` | string/null | Snooze expiration date |
| `occurrences` | URI | read-only, link to occurrences endpoint |
| `exploit_likelihood` | enum/null | `rare`, `unlikely`, `likely`, `very_likely`, `known`, `unknown` |
| `cvss_score` | float | read-only, CVSS score |

#### `POST /v1/issues/{id}/snooze/` - Snooze issue

| Body Field | Type | Required | Values |
|------------|------|----------|--------|
| `reason` | enum | YES | `ACCEPT_RISK`, `FALSE_POSITIVE`, `MITIGATING_CONTROLS` |
| `duration_type` | enum/null | no | `forever`, `day`, `week`, `month` |
| `duration` | int/null | no | Custom duration |
| `details` | string/null | no | Min 1 char if provided |

**Response:** `{ "message": "Issue was snoozed." }`

**No unsnooze endpoint exists.** Issues can only be unsnoozed via the Intruder web dashboard.

---

### 12.6 Occurrences

#### `GET /v1/issues/{issue_id}/occurrences/` - List occurrences for issue

| Query Param | Type | Values |
|-------------|------|--------|
| `limit` | int | Default: 25 |
| `offset` | int | Pagination offset |
| `since` | datetime | Filter by first_seen_at |
| `snoozed` | bool | Filter by snooze status |
| `tag_names` | string[] | Comma-separated |
| `target_addresses` | string[] | Comma-separated |

**Response: Occurrence object**

| Field | Type | Notes |
|-------|------|-------|
| `id` | int | May change between scans |
| `occurrence_id` | int | **Stable ID** - persists across scans |
| `target` | string | Target address |
| `display_address` | string | read-only, human-readable |
| `port` | string | read-only |
| `protocol` | string | e.g. "tcp" |
| `extra_info` | object | Key-value metadata |
| `age` | string | read-only, e.g. "278 days" |
| `first_seen_at` | datetime | read-only |
| `cves` | string[] | read-only, associated CVE IDs |
| `snoozed` | bool | |
| `snooze_reason` | enum/null | Same as issue snooze_reason |
| `snooze_until` | date/null | |
| `cvss_score` | float | read-only |
| `exploit_likelihood` | enum/null | Same values as issue |

#### `POST /v1/issues/{issue_id}/occurrences/{id}/snooze/` - Snooze single occurrence

Same body as issue snooze. Response: `{ "message": "Occurrence was snoozed." }`

#### `GET /v1/issues/{issue_id}/occurrences/{occurrence_id}/scanner_output/` - Scanner output

Returns raw scanner output for a specific occurrence.

#### `GET /v1/occurrences/fixed/` - List fixed (resolved) occurrences

| Query Param | Type | Values |
|-------------|------|--------|
| `limit` | int | Default: 25 |
| `offset` | int | Pagination offset |
| `remediated_after` | datetime | ISO 8601 |
| `remediated_before` | datetime | ISO 8601 |
| `severity` | enum | `low`, `medium`, `high`, `critical` |
| `tag_names` | string[] | Comma-separated |
| `target_addresses` | string[] | Comma-separated |

**Response: FixedOccurrence object**

| Field | Type | Notes |
|-------|------|-------|
| `id` | int | read-only |
| `occurrence_id` | int | Stable ID |
| `title` | string | Vulnerability title |
| `description` | string | |
| `remediation` | string | Fix guidance |
| `severity` | enum | read-only |
| `display_address` | string | read-only |
| `affected_host` | string | Target host |
| `affected_port` | int | read-only |
| `cvss_score` | float | read-only |
| `exploit_likelihood` | enum | |
| `extra_info` | object | |
| `first_seen_at` | datetime | |
| `remediated_at` | datetime | When it was fixed |
| `tags` | string[] | read-only |

---

### 12.7 Scans

#### `GET /v1/scans/` - List scans

| Query Param | Type | Values |
|-------------|------|--------|
| `limit` | int | Default: 25 |
| `offset` | int | Pagination offset |
| `scan_type` | enum | `assessment_schedule`, `new_service`, `cloudbot_new_target`, `rapid_remediation`, `advisory`, `cloud_security`, `container_image` |
| `schedule_period` | enum | `monthly`, `daily`, `one_off`, `weekly`, `quarterly` |
| `status` | enum | `in_progress`, `completed`, `cancelled`, `cancelled_no_active_targets`, `cancelled_no_valid_targets`, `analysing_results` |

**Response: Scan object (list view)**

| Field | Type | Notes |
|-------|------|-------|
| `id` | int | read-only |
| `status` | enum | read-only |
| `created_at` | datetime | read-only |
| `scan_type` | enum | read-only |
| `schedule_period` | enum | read-only |

#### `GET /v1/scans/{id}/` - Scan detail

**Response: Scan object (detail view)** - same as list plus:

| Field | Type | Notes |
|-------|------|-------|
| `target_addresses` | string[] | Targets included in this scan |
| `start_time` | datetime/null | read-only |
| `completed_time` | datetime/null | read-only |
| `throttled` | bool | |
| `web_ports_only` | bool | |

#### `POST /v1/scans/` - Start scan

| Body Field | Type | Required | Notes |
|------------|------|----------|-------|
| `target_addresses` | string[] | no | Specific targets to scan |
| `tag_names` | string[] | no | Scan targets with these tags |
| `throttled` | bool | no | Default: false |
| `web_ports_only` | bool | no | Default: false |

If neither `target_addresses` nor `tag_names` provided, scans ALL targets.

**Response:** 202 with Scan object. Error 422 if >500 active scans.

#### `POST /v1/scans/{id}/cancel/` - Cancel scan

Returns 200 on success. Only works for `in_progress` scans.

---

### 12.8 Scan Schedules

#### `GET /v1/scans/schedules/` - List schedules

**Response: Schedule object**

| Field | Type | Notes |
|-------|------|-------|
| `id` | int | |
| `name` | string | |
| `schedule_period` | enum | `daily`, `weekly`, `monthly`, `quarterly` |
| `first_scan_time` | datetime | |
| `next_scan_date` | datetime | read-only |
| `status` | string | |
| `throttled` | bool | |
| `web_ports_only` | bool | |
| `latest_scan_id` | int | read-only |
| `latest_scan_status` | string | read-only |
| `last_scan_start_time` | datetime | read-only |
| `last_scan_end_time` | datetime | read-only |
| `targets` | int[] | read-only, target IDs |
| `target_tags` | string[] | read-only, tag names |
| `upload_to_drata` | bool | |
| `upload_to_vanta` | bool | |

#### `POST /v1/scans/schedules/` - Create schedule

| Body Field | Type | Required | Notes |
|------------|------|----------|-------|
| `name` | string | YES | Min 1 char |
| `first_scan_time` | datetime | YES | Must be future, on the hour |
| `scan_frequency` | enum | YES | `daily`, `weekly`, `monthly`, `quarterly` |
| `tags` | string[] | no | Tag names to include |
| `targets` | int[] | no | Target IDs to include |
| `throttled` | bool | no | Default: false |
| `web_ports_only` | bool | no | Default: false |

**Response:** 201 `{ id, notice: "Scan scheduled" }`

#### `PATCH /v1/scans/schedules/{id}/` - Update schedule

Same fields as create, all optional. Response: 200 `{ notice: "Scan was updated." }`

#### `DELETE /v1/scans/schedules/{id}/` - Delete schedule

Returns 204 (no content).

---

### 12.9 Licenses

#### `GET /v1/licenses/` - License usage (global)

**Response: License object**

| Field | Type |
|-------|------|
| `total_infrastructure_licenses` | int |
| `available_infrastructure_licenses` | int |
| `consumed_infrastructure_licenses` | int |
| `total_application_licenses` | int |
| `available_application_licenses` | int |
| `consumed_application_licenses` | int |

**Note:** This returns global license usage across ALL tenants, not per-tenant. Our `/api/intruder/licenses` endpoint calculates per-tenant usage by counting tagged targets.

---

## 13. Known Limitations & Security Gaps

### Security: Unfiltered endpoints (CRITICAL)

These endpoints pass through the proxy **without tenant ownership validation**:

| Endpoint | Method | Risk | Fix approach |
|----------|--------|------|-------------|
| `/v1/scans/schedules/` | GET | Shows ALL tenants' schedules | Filter by tenant tag in response |
| `/v1/scans/schedules/` | POST | Can create schedule for other tenant's targets | Validate targets/tags belong to tenant |
| `/v1/scans/schedules/{id}/` | DELETE | Can delete other tenant's schedule | Verify ownership before deleting |
| `/v1/issues/{id}/snooze/` | POST | Can snooze other tenant's issues | Verify issue belongs to tenant's targets |
| `/v1/scans/{id}/cancel/` | POST | Can cancel other tenant's scans | Verify scan belongs to tenant |
| `/v1/issues/{id}/occurrences/` | GET | Can read other tenant's data | Verify issue ownership |
| `/v1/targets/{id}/authentications/` | GET/POST/DELETE | Can read/modify other tenant's credentials | Verify target ownership |
| `/v1/targets/{id}/api_schemas/` | GET/POST/DELETE | Can read/modify other tenant's API specs | Verify target ownership |

**Recommended fix:** Add a `verifyOwnership(resourceType, resourceId)` helper that checks if a target/issue/scan ID belongs to the current tenant before allowing the request through.

### Functional gaps

| Issue | Impact | Fix |
|-------|--------|-----|
| Running scans don't auto-refresh | User must manually refresh | Add 10s polling with `setInterval` |
| Dashboard KPIs ignore tag filter for severity counts | Misleading numbers | Apply tag filter to severity count queries |
| Schedule creation doesn't inject tenant tag | Schedule may scan other tenant's targets | Add tag injection like scans |
| Issues N+1 API calls | Slow for many targets | Batch target addresses or use server-side caching |
| IP geolocation via HTTP | Mixed content, privacy | Switch to HTTPS or remove |
| Scan terminal is fake | User sees fake progress | Replace with real-time status or honest progress bar |

### Technical debt

| Item | Location |
|------|----------|
| Hardcoded credentials | `login/route.ts` - move to database |
| Empty catch blocks | Multiple files - add proper error logging |
| No request deduplication | All pages - prevent double-fetches |
| No error toasts for failed API calls | All pages - show user feedback |
| Mixed German/English UI text | Throughout - standardize |

---

## 14. File Reference

### Backend (API Routes)

| File | Lines | Endpoint | Purpose |
|------|-------|----------|---------|
| `src/app/api/intruder/[...path]/route.ts` | 396 | `*` | Main proxy - routing, filtering, injection |
| `src/app/api/intruder/licenses/route.ts` | 58 | `GET` | License usage per tenant |
| `src/app/api/intruder/sync-findings/route.ts` | 186 | `POST` | Sync issues → Findings |
| `src/app/api/intruder/treat-finding/route.ts` | 139 | `POST` | Treat finding + Intruder snooze |
| `src/app/api/auth/login/route.ts` | 82 | `POST` | Tenant config + login |
| `src/lib/auth.ts` | 41 | - | Cookie helpers |

### Frontend (Pages)

| File | Lines | Route | Purpose |
|------|-------|-------|---------|
| `src/app/(app)/vulnerabilities/page.tsx` | 852 | `/vulnerabilities` | Dashboard |
| `src/app/(app)/vulnerabilities/targets/page.tsx` | 1300 | `/vulnerabilities/targets` | Target list + CRUD |
| `src/app/(app)/vulnerabilities/targets/[id]/page.tsx` | 1503 | `/vulnerabilities/targets/{id}` | Target detail (5 tabs) |
| `src/app/(app)/vulnerabilities/issues/page.tsx` | 1934 | `/vulnerabilities/issues` | Issues list + detail sheet |
| `src/app/(app)/vulnerabilities/scans/page.tsx` | 1418 | `/vulnerabilities/scans` | Scans + schedules |

### External API Endpoints Used

| Method | Intruder Endpoint | Proxy filters? | Used by |
|--------|-------------------|----------------|---------|
| GET | `/v1/targets/` | YES - tag filter | Dashboard, Targets, Target Detail |
| POST | `/v1/targets/` | YES - tag injection + license check | Targets |
| DELETE | `/v1/targets/{id}/` | NO | Targets |
| POST | `/v1/targets/{id}/tags/` | NO | Targets, Target Detail |
| DELETE | `/v1/targets/{id}/tags/{name}/` | NO | Targets |
| GET | `/v1/targets/{id}/authentications/` | NO | Target Detail |
| POST | `/v1/targets/{id}/authentications/` | NO | Target Detail |
| DELETE | `/v1/targets/{id}/authentications/{id}/` | NO | Target Detail |
| GET | `/v1/targets/{id}/api_schemas/` | NO | Target Detail |
| POST | `/v1/targets/{id}/api_schemas/` | NO | Target Detail |
| DELETE | `/v1/targets/{id}/api_schemas/{id}/` | NO | Target Detail |
| GET | `/v1/issues/` | YES - target-based filter | Dashboard, Issues |
| POST | `/v1/issues/{id}/snooze/` | NO | Issues |
| GET | `/v1/issues/{id}/occurrences/` | NO | Target Detail, Issues |
| GET | `/v1/issues/{id}/occurrences/{id}/scanner_output/` | NO | Issues |
| GET | `/v1/scans/` | YES - target address filter | Dashboard, Scans, Target Detail |
| POST | `/v1/scans/` | YES - tag injection | Dashboard, Scans |
| GET | `/v1/scans/{id}/` | NO | Scans (enrichment) |
| POST | `/v1/scans/{id}/cancel/` | NO | Scans |
| GET | `/v1/scans/schedules/` | NO | Dashboard, Scans, Target Detail |
| POST | `/v1/scans/schedules/` | NO | Scans |
| DELETE | `/v1/scans/schedules/{id}/` | NO | Scans |
| GET | `/v1/occurrences/fixed/` | YES - address filter | (available, not actively used) |
| GET | `/v1/licenses/` | N/A | (global, not used directly) |

### External Data Sources

| Endpoint | Source | Cache | Purpose |
|----------|--------|-------|---------|
| `GET /api/cves/trending` | cvemon.intruder.io | 1h | Trending CVEs for dashboard |
| `GET /api/cves/cisa` | cisa.gov | 1h | Known exploited vulnerabilities |
| `GET /api/security-news` | heise.de RSS | 30min | German security news |
