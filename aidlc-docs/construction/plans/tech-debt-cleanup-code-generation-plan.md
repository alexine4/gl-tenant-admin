# Code Generation Plan — Unit: tech-debt-cleanup

**Source documents**: `aidlc-docs/inception/requirements/requirements.md`, `aidlc-docs/inception/plans/execution-plan.md`
**Workspace root**: `E:/work/gl-tenant-admin` (application code goes here; docs go under `aidlc-docs/construction/tech-debt-cleanup/code/`)
**Unit scope**: Package manager cleanup, `lib/queries/` → `lib/hooks/` rename, unit + property-based test coverage for `lib/auth.ts`, `lib/branding.ts`, `lib/documents.ts`, `lib/tenant-users.ts`, `lib/analytics.ts`
**Extensions in effect**: security-baseline (full), property-based-testing (full) — compliance assessed in Step 12

This plan is the single source of truth for Code Generation Part 2. Steps execute in order; each is marked `[x]` immediately on completion.

---

## Step 1: Package Manager Cleanup (FR-1, SECURITY-10)
- [x] Delete `package-lock.json` from the workspace root
- [x] Verify `pnpm-lock.yaml` remains as the sole lock file
- [x] Verify `pnpm install` regenerates a consistent `pnpm-lock.yaml` with no changes (confirms no drift existed)

## Step 2: Test Framework Setup (NFR-1, PBT-09)
- [x] Add `vitest` and `fast-check` as devDependencies in `package.json`
- [x] Add a `"test": "vitest run"` script to `package.json`
- [x] Create `vitest.config.ts` at the workspace root: Node test environment, resolve the `@/*` path alias to match `tsconfig.json`
- [x] Run `pnpm install` to lock the new devDependencies into `pnpm-lock.yaml`

## Step 3: Property Identification (PBT-01)
- [x] Create `aidlc-docs/construction/tech-debt-cleanup/code/testable-properties.md` identifying, for every function to be tested in Steps 6–10, which PBT category (per property-based-testing.md) applies, or an explicit "No PBT properties identified" with rationale. Cover at minimum:
  - `computeMembershipFingerprint` (`lib/auth.ts`) — Invariant (determinism: same `passwordHash`+`status` → same fingerprint; sensitivity: changing either input → different fingerprint)
  - `requireAuth`/`withAuth` (`lib/auth.ts`) — No PBT properties identified (depends on external session state via `auth()`, not a pure function); covered by example-based tests only (PBT-10)
  - `validateLogoFile` (`lib/branding.ts`) — Invariant (accept iff type ∈ allowed set and `0 < size <= MAX_LOGO_SIZE_BYTES`; SVG always rejected)
  - `serializeBranding` (`lib/branding.ts`) — Invariant (structural field mapping, ISO date formatting)
  - `validateDocumentFile` (`lib/documents.ts`) — Invariant (accept iff `0 < size <= MAX_DOCUMENT_SIZE_BYTES` and (mime type or extension) is allowed)
  - `serializeDocument` (`lib/documents.ts`) — Invariant (structural field mapping)
  - `queueIngestion` (`lib/documents.ts`) — Business rule invariant (content containing the `FORCE_FAIL` marker → status `Failed`; otherwise → status `Ingested`), tested with fake timers
  - `isManagedRole` (`lib/tenant-users.ts`) — Oracle (must agree with a reference `MANAGED_ROLES.includes(role)` check for every `MembershipRole` value)
  - `serializeTenantUser` (`lib/tenant-users.ts`) — Invariant (structural field mapping)
  - `findManagedMembership` (`lib/tenant-users.ts`) — No PBT properties identified (Prisma/DB-dependent; integration testing is out of scope per requirements.md)
  - `parseDateRange` (`lib/analytics.ts`) — Invariant (valid `from<=to` within 366 days → echoed back unchanged; malformed dates, `from>to`, or span>366 → error)
  - `buildAnalyticsResponse` (`lib/analytics.ts`) — Invariant (determinism: same `tenantId`+range → identical output; funnel stage counts non-increasing; `voice + text === totalConversations`; all counts ≥ 0)
  - `toCsv` (`lib/analytics.ts`) — Invariant (row count = data rows + 1 header; each row's fields match the source record)

## Step 4: Rename `lib/queries/` → `lib/hooks/` (FR-2)
- [x] Create `lib/hooks/branding.ts`, `lib/hooks/documents.ts`, `lib/hooks/analytics.ts`, `lib/hooks/users.ts` with the exact contents of the corresponding `lib/queries/*.ts` files (no logic changes) — done via `git mv` to preserve history
- [x] Delete the `lib/queries/` directory
- [x] Verify no file exists at both the old and new path (no duplicates)

## Step 5: Update Import Sites (FR-2)
- [x] Update `@/lib/queries/branding` → `@/lib/hooks/branding` in `app/console/branding/page.tsx`
- [x] Update `@/lib/queries/documents` → `@/lib/hooks/documents` in `app/console/documents/page.tsx`
- [x] Update `@/lib/queries/analytics` → `@/lib/hooks/analytics` in `app/console/analytics/page.tsx`
- [x] Update `@/lib/queries/users` → `@/lib/hooks/users` in `app/console/users/page.tsx`, `app/console/users/new/page.tsx`, `app/console/users/[user_id]/page.tsx`
- [x] Grep the workspace for any remaining `lib/queries` reference outside `aidlc-docs/` and fix it — none found

## Step 6: Unit Tests — `lib/auth.ts` (FR-3, SECURITY-12)
- [x] Create `lib/auth.test.ts`
- [x] Property-based test (fast-check): `computeMembershipFingerprint` determinism — for generated `(passwordHash, status)` string pairs, calling it twice with the same inputs yields the same output
- [x] Property-based test: `computeMembershipFingerprint` sensitivity — for generated distinct `passwordHash` values (same `status`), fingerprints differ; same for distinct `status` values (same `passwordHash`)
- [x] Example-based tests for `requireAuth`/`withAuth` (mock `@/auth`'s `auth()` export via `vi.mock`): no session → 401 `AuthError`; session with disallowed role → 403; session with allowed role → handler invoked with correct claims
- [x] Test data uses only synthetic, clearly-fake hash strings — no real credentials (SECURITY-12)

## Step 7: Unit Tests — `lib/branding.ts` (FR-3)
- [x] Create `lib/branding.test.ts`
- [x] Property-based test: `validateLogoFile` — for generated files with allowed MIME type and size in `(0, MAX_LOGO_SIZE_BYTES]`, returns `null`
- [x] Property-based test: `validateLogoFile` — for generated files with `image/svg+xml` type, always returns an error (security invariant)
- [x] Property-based test: `validateLogoFile` — for generated files with size `<= 0` or `> MAX_LOGO_SIZE_BYTES`, always returns an error
- [x] Example-based test: `serializeBranding` maps a sample `TenantBranding` record to the expected snake_case shape with ISO date string

## Step 8: Unit Tests — `lib/documents.ts` (FR-3)
- [x] Create `lib/documents.test.ts`
- [x] Property-based test: `validateDocumentFile` — for generated valid size + allowed mime/extension combinations, returns `null`
- [x] Property-based test: `validateDocumentFile` — for generated invalid size or disallowed mime+extension combinations, returns a non-null string
- [x] Example-based test: `serializeDocument` maps a sample `Document` record to the expected snake_case shape with ISO date strings
- [x] Test (fake timers via `vi.useFakeTimers`): `queueIngestion` sets status to `Ingested` after the delay when content has no `FORCE_FAIL` marker, and to `Failed` with a `failureReason` when it does (mock `@/lib/prisma`'s `prisma.document.update`)

## Step 9: Unit Tests — `lib/tenant-users.ts` (FR-3)
- [x] Create `lib/tenant-users.test.ts`
- [x] Property-based (oracle) test: for every `MembershipRole` value, `isManagedRole(role)` agrees with a reference `["TenantOperator", "TenantMember"].includes(role)` check
- [x] Example-based test: `serializeTenantUser` maps sample `User`+`TenantMembership` records to the expected snake_case shape

## Step 10: Unit Tests — `lib/analytics.ts` (FR-3)
- [x] Create `lib/analytics.test.ts`
- [x] Property-based test: `parseDateRange` — for generated valid `from<=to` pairs within 366 days in `YYYY-MM-DD` format, returns `{ from, to }` unchanged
- [x] Property-based test: `parseDateRange` — for generated `from>to` pairs, or spans >366 days, or malformed date strings, returns `{ error }`
- [x] Property-based test: `buildAnalyticsResponse` determinism — for generated `(tenantId, dateRange)` pairs, calling it twice yields deep-equal output
- [x] Property-based test: `buildAnalyticsResponse` invariants — `voice + text === visitors_engaged`-derived conversation total; `conversion_funnel` stage counts are non-increasing; all numeric counts are ≥ 0
- [x] Example-based test: `toCsv` produces a header row plus one row per entry in `conversations_and_questions_by_period`, with matching field values

## Step 11: Test Suite Summary
- [x] Create `aidlc-docs/construction/tech-debt-cleanup/code/test-summary.md` listing every test file created, what it covers, and how to run it (`pnpm run test`)

## Step 12: Security Baseline & PBT Compliance Summary
- [x] Create `aidlc-docs/construction/tech-debt-cleanup/code/compliance-summary.md` with:
  - A "Security Compliance" section listing each of the 15 SECURITY rules as Compliant / Non-Compliant / N/A with a one-line rationale (per requirements.md NFR-2: SECURITY-10 and SECURITY-12 applicable, SECURITY-03 assessed, rest N/A)
  - A "PBT Compliance" section listing each of the 10 PBT rules as Compliant / Non-Compliant / N/A with a one-line rationale (per requirements.md NFR-3)
  - Any blocking findings called out explicitly per the blocking-finding behavior in each extension's rules file

---

## Completion Criteria
- All 12 steps above marked `[x]`
- `package-lock.json` removed, `pnpm-lock.yaml` is the sole lock file
- `lib/hooks/` exists with the four hook files, `lib/queries/` no longer exists, all 6 import sites updated
- 5 new test files exist (`lib/auth.test.ts`, `lib/branding.test.ts`, `lib/documents.test.ts`, `lib/tenant-users.test.ts`, `lib/analytics.test.ts`) and pass under `pnpm run test`
- `testable-properties.md`, `test-summary.md`, and `compliance-summary.md` exist under `aidlc-docs/construction/tech-debt-cleanup/code/`
- Verification of `pnpm run build` and `pnpm run lint` happens in the Build and Test stage, not this plan
