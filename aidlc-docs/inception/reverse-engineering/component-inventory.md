# Component Inventory

**Note**: This is a single Next.js application, not a multi-package repository. "Packages" below map to logical modules within the one deployable, not separate deployable units.

## Application Packages (routes/pages)
- `app/console/**` — admin UI pages (overview, users, branding, documents, analytics) — 8 files
- `app/tenant/**` — JSON API route handlers backing the console UI — 9 files
- `app/login`, `app/page.tsx`, `app/layout.tsx` — entry/auth pages — 3 files
- `app/api/auth/**` — NextAuth handler — 1 file
- `app/uploads/**` — public logo-serving route — 1 file

## Infrastructure Packages
- `prisma/schema.prisma`, `prisma/seed.ts`, `prisma/migrations/**` — data model and migrations — Prisma/PostgreSQL
- `prisma.config.ts` — Prisma CLI configuration
- `auth.ts`, `auth.config.ts` — NextAuth configuration
- `proxy.ts` — Next.js 16 edge gate (renamed `middleware.ts`)

## Shared Packages
- `components/ui/**` — generic form/display primitives (Models/Utilities) — 11 files
- `components/charts/**` — analytics visualization primitives (Utilities) — 6 files
- `components/ToastHost.tsx` — toast rendering (Utilities) — 1 file
- `lib/**` (excluding `lib/queries/`) — server domain logic, auth gate, Prisma client, fetch wrapper — 14 files
- `lib/queries/**` — client-side React Query hooks (Clients) — 4 files
- `store/**` — Redux UI state (Models/Utilities) — 3 files
- `types/next-auth.d.ts` — shared type augmentation (Models) — 1 file
- `app/hooks/input-value.ts` — shared UI hook (Utilities) — 1 file

## Test Packages
- None found — no test files or test directories exist in the repository.

## Total Count
- **Total Packages** (logical modules): 4
- **Application**: 21 files (8 console pages/layouts + 9 tenant API routes + 3 entry pages + 1 NextAuth route + 1 uploads route — layout files counted individually)
- **Infrastructure**: 7 files (schema, seed, migrations directory, prisma.config.ts, auth.ts, auth.config.ts, proxy.ts)
- **Shared**: 36 files (11 UI components + 6 chart components + 1 ToastHost + 14 lib files + 3 store files + 1 type augmentation, minus the 4 `lib/queries` files counted separately below, plus `input-value.ts`)
- **Client (React Query hooks)**: 4 files (`lib/queries/users.ts`, `branding.ts`, `documents.ts`, `analytics.ts`)
- **Test**: 0

**Approximate total source files**: ~64 (excluding root-level config/tooling files such as `package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `postcss.config.mjs`, which are covered in Technology Stack).
