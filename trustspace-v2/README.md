# TrustSpace ISMS v2

Information Security Management System für ISO 27001 Compliance.

## Projekt-Setup

### Voraussetzungen

- **Node.js 18+** ([nodejs.org](https://nodejs.org))
- Optional: **Ollama** für lokale LLM-Funktionen ([ollama.com](https://ollama.com))

### Installation

1. **Node.js installieren** (falls nicht vorhanden):
   ```bash
   # macOS mit Homebrew
   brew install node

   # Oder Download von https://nodejs.org
   ```

2. **Abhängigkeiten installieren**:
   ```bash
   npm install
   ```

3. **Datenbank initialisieren**:
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   npm run db:seed
   ```

4. **Entwicklungsserver starten**:
   ```bash
   npm run dev
   ```

5. **Browser öffnen**: http://localhost:3000

### Ollama (LLM) Setup

Für KI-Funktionen (SOA-Textgenerierung, Asset-Vorschläge, etc.):

```bash
# Ollama installieren (macOS)
brew install ollama

# Ollama starten
ollama serve

# Model herunterladen (im neuen Terminal)
ollama pull llama3.2
```

## Projektstruktur

```
trustspace-v2/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/             # API Routes (LLM, etc.)
│   │   ├── (app)/           # App-Layout mit Sidebar
│   │   │   ├── dashboard/
│   │   │   ├── risks/
│   │   │   ├── soa/
│   │   │   └── ...
│   │   └── page.tsx         # Root redirect
│   ├── components/          # React Komponenten
│   │   ├── ui/              # shadcn/ui Komponenten
│   │   ├── app-sidebar.tsx  # Navigation
│   │   └── shell-layout.tsx # App Layout
│   ├── lib/
│   │   ├── db/              # Prisma / Database
│   │   ├── llm/             # LLM Abstraktion
│   │   │   ├── client.ts    # Ollama/Claude/OpenAI
│   │   │   └── prompts/     # Prompts für verschiedene Module
│   │   └── utils.ts         # Hilfsfunktionen
│   └── app/globals.css      # Tailwind Styles
├── prisma/
│   ├── schema.prisma        # Datenbank-Schema
│   └── seed.ts              # Demo-Daten
├── uploads/                 # Datei-Uploads
└── .env.local               # Umgebungsvariablen
```

## Module

| Modul | Status | Beschreibung |
|-------|--------|--------------|
| Dashboard | 🚧 | KPIs, Kalender, Schnellzugriff |
| Risiken & Assets | 🚧 | Brutto/Netto-Risiko, AI-Vorschläge |
| SOA | 🚧 | ISO 27001 Controls, AI-Textgenerierung |
| Dokumente | 🚧 | Upload, Viewer (PDF/DOCX/XLSX) |
| Vendoren | 🚧 | Bewertung, AI-Lookup |
| Maßnahmen | 🚧 | Kanban-Board |
| Audits | 🚧 | Kalender, Checklisten |
| AI-Chatbot | 🚧 | ISMS-Assistent |

Legende: 🚧 In Entwicklung | ✅ Fertig

## Umgebungsvariablen

```env
# Database (SQLite)
DATABASE_URL="file:./dev.db"

# Auth
AUTH_SECRET="your-secret"

# LLM Provider: ollama | claude | openai
LLM_PROVIDER=ollama

# Ollama (lokal)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2

# Claude (optional)
ANTHROPIC_API_KEY=
```

## Entwicklung

```bash
# Dev-Server
npm run dev

# Datenbank Studio
npm run db:studio

# Build
npm run build

# Lint
npm run lint
```

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **UI**: shadcn/ui, Radix UI, Lucide Icons
- **Database**: SQLite + Prisma ORM
- **LLM**: Ollama (lokal) / Claude API (prod)
- **Charts**: Recharts
- **Files**: pdf-parse, mammoth, xlsx
