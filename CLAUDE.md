# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sistema RJD — internal control system for a computer repair service business. Full-stack Next.js 16 app (App Router) with TypeScript, Prisma ORM, PostgreSQL (Supabase), and NextAuth authentication.

## Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npm run seed         # Seed database (creates admin@rjd.com / admin123)
npm run db:reset     # Reset database

npx prisma generate      # Regenerate Prisma client after schema changes
npx prisma migrate dev   # Create and apply migrations
npx prisma db push       # Push schema without migration
npx prisma studio        # Database GUI
```

## Architecture

- **Next.js App Router** with React Server Components by default; client components for interactive UI
- **API routes** at `src/app/api/` — RESTful CRUD for clients, technicians, equipment, payments, expenses, transactions, reports, user config
- **Authentication**: NextAuth credentials provider with JWT strategy. Middleware (`middleware.ts`) enforces role-based access (ADMINISTRADOR → full access, TECNICO → equipment only)
- **Database**: Prisma ORM → PostgreSQL. Schema at `prisma/schema.prisma`
- **State management**: TanStack Query for server state, React Hook Form for forms
- **Validation**: Zod schemas in `src/lib/validations/`
- **Styling**: Tailwind CSS 4 with Radix UI primitives. UI components in `src/components/ui/`

## Key Path Alias

`@/*` maps to `./src/*` (configured in tsconfig.json)

## Domain Model

Core entities: **User** (admin/technician roles), **Customer**, **Equipment** (with status workflow: RECEIVED → REPAIR → REPAIRED → DELIVERED), **Payment**, **Expense**, **PayrollRecord**, **Advance**

Equipment codes are auto-generated as `RJD-YYYYMMDD-NNNN`.

## Module Structure

| Module | Pages (`src/app/dashboard/`) | API (`src/app/api/`) | Components (`src/components/`) | Hooks (`src/hooks/`) |
|--------|------------------------------|----------------------|-------------------------------|----------------------|
| Clients | `clientes/` | `clients/` | `clients/` | `useClients` |
| Technicians | `tecnicos/` | `tecnicos/` | `technicians/` | `useTechnicians` |
| Equipment | `equipos/` | `equipments/` | `equipment/` | `useEquipments`, `useEquipmentDetail` |
| Finance | `finanzas/` | `payments/`, `expenses/`, `transactions/` | `finance/` | `useTransactions` |
| Reports | `reportes/` | `reports/` | `reports/` | `useReports` |

## Conventions

- Spanish-language UI (Peruvian locale: 9-digit phone, 11-digit RUC validation)
- Timezone: `America/Lima` (set via TZ env var)
- Optimistic UI updates via TanStack Query mutations
- PDF generation with jsPDF + html2canvas (`src/lib/pdf-generator.ts`, `src/lib/report-pdf-generator.ts`)
- Excel export with ExcelJS
- Toast notifications via Sonner
