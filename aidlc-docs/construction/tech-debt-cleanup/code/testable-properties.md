# Testable Properties (PBT-01)

Per the `property-based-testing` extension (full enforcement), this identifies the testable property category for every function covered by this unit's test suite, or documents why none applies. Category names reference `property-based-testing.md`'s taxonomy.

## `lib/auth.ts`

### `computeMembershipFingerprint(passwordHash, status)`
- **Category**: Invariant
- **Properties**:
  1. Determinism — for any `(passwordHash, status)` pair, calling the function twice with the same inputs always returns the same fingerprint.
  2. Sensitivity — for any two distinct `passwordHash` values (same `status`), the fingerprints differ; for any two distinct `status` values (same `passwordHash`), the fingerprints differ. This is the security-relevant invariant the session-invalidation mechanism (auth.ts's `jwt` callback) depends on.

### `requireAuth` / `withAuth`
- **Category**: No PBT properties identified
- **Rationale**: Behavior is driven entirely by external session state resolved through `auth()` (NextAuth), not by a pure function of generatable input. Covered by example-based tests only (no session → 401, wrong role → 403, allowed role → handler invoked), per PBT-10.

## `lib/branding.ts`

### `validateLogoFile(file)`
- **Category**: Invariant
- **Properties**:
  1. Accepts iff `file.type` is one of the allowed raster MIME types AND `0 < file.size <= MAX_LOGO_SIZE_BYTES`.
  2. `image/svg+xml` is always rejected regardless of size (security invariant — stored-XSS prevention, per the in-code comment).

### `serializeBranding(branding)`
- **Category**: Invariant
- **Properties**: Output object's fields are a deterministic structural mapping of the input record's fields; `updated_at` always equals `branding.updatedAt.toISOString()`.

## `lib/documents.ts`

### `validateDocumentFile(file)`
- **Category**: Invariant
- **Properties**: Accepts (`null`) iff `0 < file.size <= MAX_DOCUMENT_SIZE_BYTES` AND (`file.type` is an allowed MIME type OR the file's extension is an allowed extension). Otherwise returns a non-null error string.

### `serializeDocument(doc)`
- **Category**: Invariant
- **Properties**: Deterministic structural mapping; `created_at`/`updated_at` always equal the source `Date` fields' `.toISOString()`.

### `queueIngestion(documentId, content)`
- **Category**: Business rule invariant (tested via generated `Buffer` content, with fake timers to avoid a real 2.5s wait)
- **Properties**: After the simulated delay, the document's status is `Failed` (with a `failureReason`) iff `content` includes the `FORCE_FAIL` marker; otherwise it is `Ingested`.

## `lib/tenant-users.ts`

### `isManagedRole(role)`
- **Category**: Oracle
- **Properties**: For every value of the `MembershipRole` enum, `isManagedRole(role)` agrees with the reference check `["TenantOperator", "TenantMember"].includes(role)`.

### `serializeTenantUser(user, membership)`
- **Category**: Invariant
- **Properties**: Deterministic structural mapping; `created_at` always equals `user.createdAt.toISOString()`.

### `findManagedMembership(tenantId, userId)`
- **Category**: No PBT properties identified
- **Rationale**: Prisma/database-dependent function; integration-level testing is explicitly out of scope for this unit per `requirements.md`. Not property-tested in this pass.

## `lib/analytics.ts`

### `parseDateRange(searchParams)`
- **Category**: Invariant
- **Properties**:
  1. For any valid `YYYY-MM-DD` pair with `from <= to` and a span of at most 366 days, the function returns `{ from, to }` unchanged.
  2. For any pair where `from > to`, the span exceeds 366 days, or either string is not a well-formed `YYYY-MM-DD` date, the function returns `{ error }`.

### `buildAnalyticsResponse(tenantId, range)`
- **Category**: Invariant
- **Properties**:
  1. Determinism — for any `(tenantId, range)` pair, calling the function twice yields deep-equal output (no reliance on wall-clock randomness within a single day range comparison, aside from the `current_billing_period` block which is anchored to the current month rather than the requested range).
  2. `conversion_funnel` stage counts are non-increasing (each stage's count is ≤ the previous stage's count), reflecting the funnel's session-narrowing semantics.
  3. `voice_text_split.voice + voice_text_split.text` equals the sum of daily conversations across the range.
  4. All numeric counts in the response are ≥ 0.

### `toCsv(response)`
- **Category**: Invariant
- **Properties**: Output has exactly one header row plus one row per entry in `response.conversations_and_questions_by_period`; each data row's fields match the corresponding entry's `date`, `conversations`, and `questions` values.
