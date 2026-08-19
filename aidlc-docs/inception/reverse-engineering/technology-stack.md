# Technology Stack

## Programming Languages
- TypeScript — ^5 — application language, strict mode enabled, target ES2017, bundler module resolution

## Frameworks
- Next.js — 16.3.0 — App Router web framework (server + client rendering, route handlers). Note: pre-release/unfamiliar version per `AGENTS.md` — introduces breaking file-convention changes vs. older training data (e.g. `proxy.ts` replaces `middleware.ts`)
- React — 19.2.8 — UI library
- React DOM — 19.2.8 — DOM renderer for React
- NextAuth (next-auth) — 5.0.0-beta.32 — authentication (Credentials provider, JWT session strategy)
- Prisma — 7.9.1 (`@prisma/client`, `@prisma/adapter-pg`) — ORM, driver-adapter model
- Tailwind CSS — 4 (`@tailwindcss/postcss`) — utility-first styling
- Redux Toolkit — 2.12.0 (`@reduxjs/toolkit`, `react-redux` 9.3.0) — client UI state
- TanStack React Query — 5.101.4 — server-state fetching/caching/mutations
- Zod — 4.4.3 — schema validation

## Infrastructure
- PostgreSQL — accessed via `pg` 8.23.0 and Prisma's `@prisma/adapter-pg`
- Local filesystem storage — `storage/branding/{tenantId}/`, `storage/documents/{tenantId}/` (outside `public/`); no cloud storage integration present

## Build Tools
- npm — package management/scripts (`dev`, `build`, `start`, `lint`). Note: `pnpm-lock.yaml` is also committed alongside `package-lock.json` — see Code Quality Assessment
- tsx — 4.23.12 — used to run `prisma/seed.ts`
- Next.js build pipeline (Turbopack, per Next 16 defaults) — application bundling

## Testing Tools
- **None configured** — no test runner is present in `package.json` devDependencies, and no test files (`*.test.ts(x)`, `*.spec.ts(x)`, `__tests__`) exist anywhere in the repository

## Other Tooling
- ESLint — 9, with `eslint-config-next` 16.3.0 (flat config, core-web-vitals + TypeScript rules) — linting
- bcryptjs — 3.0.3 — password hashing
- jose — 6.2.8 — JWT handling (NextAuth dependency)
