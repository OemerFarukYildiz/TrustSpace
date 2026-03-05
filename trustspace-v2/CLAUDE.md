# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TrustSpace ISMS v2 is an Information Security Management System for ISO 27001 compliance. It's a multi-tenant web application with comprehensive ISMS functionality including risk management, Statement of Applicability (SOA) generation, audit tracking, and AI-powered assistance.

## Key Commands

```bash
# Development
npm run dev              # Start Next.js development server on http://localhost:3000
npm run build           # Build production bundle
npm run lint            # Run ESLint

# Database
npm run db:generate     # Generate Prisma client
npm run db:migrate      # Run database migrations
npm run db:studio       # Open Prisma Studio GUI for database management
npm run db:seed         # Seed database with demo data

# Initial Setup
npm install
npx prisma migrate dev --name init
npx prisma generate
npm run db:seed
```

## Architecture

### Technology Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Database**: SQLite with Prisma ORM
- **UI**: shadcn/ui components (Radix UI + Tailwind CSS)
- **AI/LLM**: Multi-provider abstraction supporting Ollama (local), Claude API, and OpenAI

### Project Structure

The application uses Next.js App Router with a grouped layout structure:

- `src/app/(app)/` - Main application routes with sidebar layout
  - Each module (dashboard, risks, soa, vendors, etc.) has its own directory
  - Dynamic routes use `[id]` convention
- `src/app/api/` - API routes for backend functionality
  - `/api/llm/*` - AI/LLM endpoints with provider abstraction
  - Module-specific API routes for data operations
- `src/components/` - Reusable React components
  - `/ui/` - Base shadcn/ui components
  - Module-specific components at root level
- `src/lib/` - Core utilities and abstractions
  - `/db/` - Database client and Prisma instance
  - `/llm/` - LLM provider abstraction and prompt templates
  - `/utils.ts` - Shared utility functions

### Database Schema

The application uses Prisma with SQLite. Key models include:

- **Organization**: Multi-tenant root entity
- **Asset**: Central to risk management with CIA triad ratings
- **Risk**: Linked to assets with probability/impact scoring
- **Control**: ISO 27001 controls linked to risks
- **Employee**, **Vendor**, **Audit**, **Finding**: Supporting entities

Assets have a step-based workflow tracking system for guided data entry.

### AI/LLM Integration

The LLM integration (`src/lib/llm/client.ts`) provides:
- Provider-agnostic interface switching between Ollama, Claude, and OpenAI
- Module-specific prompt templates in `/lib/llm/prompts/`
- API routes expose LLM functionality to frontend components
- Environment variable `LLM_PROVIDER` controls the active provider

### Key Patterns

1. **Risk Scoring**: Calculated as Probability × Impact with automatic categorization
2. **Multi-tenancy**: All data scoped by Organization ID
3. **German Localization**: Built-in support for German date formats and labels
4. **File Processing**: Supports PDF, DOCX, and XLSX file parsing
5. **Component Library**: Consistent UI using shadcn/ui components with Tailwind

## Environment Configuration

Required `.env.local` variables:

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="your-secret-here"
LLM_PROVIDER=ollama  # or 'claude' or 'openai'

# For Ollama (local)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2

# For Claude API (optional)
ANTHROPIC_API_KEY=your-key

# For OpenAI (optional)
OPENAI_API_KEY=your-key
```

## Module Overview

All modules follow similar patterns with list views, detail pages, and forms:

- **Dashboard** (`/dashboard`): KPIs, calendar, quick actions
- **Risks & Assets** (`/risks`): Asset inventory with CIA ratings, risk assessment
- **SOA** (`/soa`): ISO 27001:2022 controls with AI-generated justifications
- **Vendors** (`/vendors`): Supplier management with GDPR tracking
- **Audits** (`/audits`): Audit planning and execution tracking
- **Findings** (`/findings`): Task management for audit findings
- **Documents** (`/documents`): File upload and viewing
- **Policies** (`/policies`): Policy document management
- **Employees** (`/employees`): Staff and role management

## Development Notes

- No testing framework is currently configured
- TypeScript strict mode is enabled for type safety
- All database operations go through Prisma ORM
- File uploads are stored in the `uploads/` directory
- The application uses SQLite for simplicity but can be migrated to PostgreSQL