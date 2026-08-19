# Test Suite Summary — tech-debt-cleanup

Run the full suite with:

```
pnpm run test
```

This runs Vitest (`vitest run`) against all `*.test.ts` files. Result at time of generation: **5 test files, 33 tests, all passing** (see `pnpm run test` output; `lib/documents.test.ts`'s size-boundary property test is the slowest at ~0.7s due to allocating large `Uint8Array` buffers for the oversized-file cases, well within acceptable range).

## `lib/auth.test.ts`
- `computeMembershipFingerprint`: determinism and sensitivity property tests (fast-check)
- `requireAuth`: example-based tests for unauthenticated (401), wrong role (403), and authorized cases, with `@/auth`'s `auth()` mocked via `vi.mock`
- `withAuth`: example-based tests confirming the wrapped handler is invoked with resolved claims when authorized, and that an auth error response is returned (handler never invoked) when not
- `authErrorResponse` / `AuthError`: example-based tests for the JSON error mapping and non-`AuthError` rethrow behavior

## `lib/branding.test.ts`
- `validateLogoFile`: property tests for acceptance (allowed MIME type + valid size range), SVG rejection (security invariant), and size-boundary rejection
- `serializeBranding`: example-based test of the snake_case field mapping

## `lib/documents.test.ts`
- `validateDocumentFile`: property tests for acceptance by MIME type, acceptance by extension fallback, size-boundary rejection, and rejection when neither MIME type nor extension is recognized
- `serializeDocument`: example-based test of the snake_case field mapping
- `queueIngestion`: fake-timer tests (`vi.useFakeTimers` + `vi.runAllTimersAsync`) verifying the `Ingested` vs `Failed` outcome based on the `FORCE_FAIL` content marker, with `@/lib/prisma` mocked

## `lib/tenant-users.test.ts`
- `isManagedRole`: oracle property test comparing against a reference `MANAGED_ROLES.includes` check across all `MembershipRole` enum values
- `serializeTenantUser`: example-based test of the snake_case field mapping
- `findManagedMembership` is intentionally not tested here (DB-dependent, out of scope — see `testable-properties.md`)

## `lib/analytics.test.ts`
- `parseDateRange`: property tests for the valid-range echo-back, `from>to` rejection, span>366-days rejection, and malformed-date rejection
- `buildAnalyticsResponse`: property tests for determinism, non-increasing funnel counts, exact voice+text=conversations split, and non-negative counts (ranges capped at 30 days in generators for test speed — see in-file comment)
- `toCsv`: example-based/property test verifying header + one row per data entry with matching field values
