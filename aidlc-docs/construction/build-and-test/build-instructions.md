# Build Instructions

## Prerequisites
- **Build Tool**: pnpm 11.x + Next.js 16.3.0 (Turbopack)
- **Dependencies**: See `package.json` — notably `next`, `react`, `@prisma/client`, `next-auth`, and (new in this unit) `vitest`, `fast-check`
- **Environment Variables**: `DATABASE_URL` (PostgreSQL connection string, read by `lib/prisma.ts` / `prisma.config.ts`), plus any NextAuth secret configured in `.env`
- **System Requirements**: Node.js runtime compatible with Next.js 16 / React 19; no specific memory/disk requirements beyond a standard Next.js project

## Build Steps

### 1. Install Dependencies
```bash
pnpm install
```
`pnpm-lock.yaml` is the single source of truth for dependency versions (this unit removed the previously duplicate `package-lock.json`).

### 2. Configure Environment
```bash
# Ensure .env defines DATABASE_URL and NextAuth's secret before building/running
```

### 3. Build All Units
```bash
pnpm run build
```
This is a single Next.js application — there is only one unit to build.

### 4. Verify Build Success
- **Expected Output**: `✓ Compiled successfully`, TypeScript check passes, all 17 routes listed under `Route (app)` with no errors
- **Build Artifacts**: `.next/` directory (Turbopack build output)
- **Common Warnings**: None expected from this unit's changes; pre-existing `pnpm run lint` warnings/errors under `.design-sync/` and `ds-bundle/` (vendor/preview bundles) are unrelated to application code and out of scope

## Troubleshooting

### Build Fails with Dependency Errors
- **Cause**: Stale or mismatched lock file, or `node_modules` from a different package manager
- **Solution**: Delete `node_modules`, run `pnpm install` again, and confirm only `pnpm-lock.yaml` is present at the workspace root (no `package-lock.json`)

### Build Fails with Compilation Errors
- **Cause**: A remaining reference to the old `lib/queries/*` path, or a TypeScript path-alias issue
- **Solution**: Grep the workspace for `lib/queries` (should return nothing outside `aidlc-docs/`); confirm `tsconfig.json`'s `@/*` path alias resolves to the workspace root
