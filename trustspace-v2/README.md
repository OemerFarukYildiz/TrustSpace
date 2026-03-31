# TrustSpace ISMS v2

Information Security Management System for ISO 27001 compliance. Multi-tenant SaaS platform with vulnerability scanning, risk management, document management, and AI-powered compliance automation.

## Quick Start

```bash
npm install
npx prisma migrate dev --name init
npx prisma generate
npm run db:seed
npm run dev
```

Open http://localhost:3000 and login as `trustspace` / `Admin` or `eduneon` / `Admin`.

## Environment Variables

```env
# Database
DATABASE_URL="file:./dev.db"

# Auth
AUTH_SECRET="your-secret"

# LLM Provider: ollama | claude | openai
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2

# Optional: Claude API / OpenAI
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

# Intruder.io Vulnerability Scanner
INTRUDER_API_KEY=your-intruder-api-key
```

## Modules

| Module | Route | Description |
|--------|-------|-------------|
| **Dashboard** | `/dashboard` | KPIs, calendar, quick actions |
| **Risks & Assets** | `/risks` | Asset inventory, CIA ratings, risk assessment |
| **Risks & Assets V2** | `/risk-management-v2` | FAIR methodology, risk treatment, scenario-based |
| **SOA** | `/soa` | ISO 27001:2022 Statement of Applicability, AI-generated justifications |
| **Documents** | `/documents` | File manager (Finder-style) + Confluence-style page editor (Tiptap) |
| **Policies** | `/policies` | Policy document management |
| **Vendors** | `/vendors` | Supplier management, GDPR tracking, risk scoring |
| **Findings** | `/findings` | Audit findings, improvements, incidents, tasks |
| **Audits** | `/audits` | Audit planning, execution, checklists |
| **Employees** | `/employees` | Staff, roles, training tracking |
| **Schwachstellen** | `/vulnerabilities` | Intruder.io vulnerability scanner integration |
| **Simulations** | `/simulations` | Phishing simulation campaigns |

## Vulnerability Scanner (Intruder.io)

Full integration with Intruder.io for vulnerability scanning. See [docs/intruder-implementation-guide.md](docs/intruder-implementation-guide.md) for the complete developer guide.

**Features:**
- Multi-tenant proxy with tag-based isolation
- Dashboard with threat level, hygiene score, trending CVEs
- Target management (infrastructure + web application) with license limits
- Issue tracking with treatment/snooze workflow (Accept Risk, False Positive, Mitigating Controls)
- Scan management with schedules
- Authenticated scanning (Form, HTTP, OAuth, Headers, Cookies)
- API schema upload for API scanning

**Pages:** Dashboard, Targets, Target Detail (5 tabs), Issues, Scans

## Document Editor

Confluence-style rich text editor built with Tiptap. Create pages directly in the document tree alongside uploaded files.

**Features:**
- Headings (H1-H3), bold, italic, underline, strikethrough
- Bullet lists, numbered lists, task lists
- Code blocks, tables, horizontal rules
- Links, images, text alignment, highlighting
- Slash commands (`/` for quick insert)
- Auto-save (1.5s debounce)

## Project Structure

```
src/
  app/
    (app)/                    # App layout with sidebar
      dashboard/              # Main dashboard
      risks/                  # Risk management V1
      risk-management-v2/     # Risk management V2 (FAIR)
      soa/                    # Statement of Applicability
      documents/              # Document manager + page editor
      findings/               # Audit findings & tasks
      vendors/                # Vendor management
      audits/                 # Audit management
      employees/              # Employee management
      vulnerabilities/        # Vulnerability scanner
        page.tsx              # Scanner dashboard
        targets/              # Target management
        issues/               # Issue tracking + treatment
        scans/                # Scan management + schedules
      simulations/            # Phishing simulations
    api/
      intruder/               # Intruder API proxy
        [...path]/route.ts    # Main proxy (filtering, injection)
        licenses/route.ts     # License usage per tenant
        sync-findings/route.ts
        treat-finding/route.ts
      auth/login/route.ts     # Authentication + tenant config
      documents/              # Document CRUD
      findings/               # Findings CRUD
      llm/                    # AI/LLM endpoints
      cves/                   # CVE data (trending, CISA)
      security-news/          # Heise Security RSS
      ...
  components/
    ui/                       # shadcn/ui base components
    page-editor.tsx           # Tiptap rich text editor
    findings-category-page.tsx
    app-sidebar.tsx
    ...
  lib/
    auth.ts                   # Cookie helpers (getOrgId, getIntruderTag, etc.)
    db/                       # Prisma client
    llm/                      # LLM abstraction (Ollama/Claude/OpenAI)
    utils.ts
prisma/
  schema.prisma               # Database schema
  seed.ts                     # Demo data
docs/
  intruder-implementation-guide.md  # Full scanner implementation guide
data/
  trustspace-sbom.json        # Sample SBOM for testing
```

## Tech Stack

- **Framework:** Next.js 15, React 19, TypeScript
- **UI:** shadcn/ui, Radix UI, Tailwind CSS, Lucide Icons
- **Database:** SQLite + Prisma ORM
- **Editor:** Tiptap (ProseMirror-based)
- **AI/LLM:** Ollama (local) / Claude API / OpenAI
- **Charts:** Recharts
- **Files:** pdf-parse, mammoth, xlsx
- **Vulnerability Scanning:** Intruder.io API v1

## Multi-Tenancy

Each tenant has:
- Unique `org_id` for database isolation
- `intruder_tag` for vulnerability scanner isolation
- Configurable license limits (infrastructure + application)
- All data scoped by organization

Tenant config is currently hardcoded in `src/app/api/auth/login/route.ts` (to be moved to database).

## Development

```bash
npm run dev          # Dev server (http://localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npm run db:studio    # Prisma Studio (database GUI)
npm run db:seed      # Seed demo data
npm run db:generate  # Regenerate Prisma client
npm run db:migrate   # Run migrations
```
