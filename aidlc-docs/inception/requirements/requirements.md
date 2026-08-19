# Requirements Document

## Intent Analysis Summary

- **User Request**: Original request was to integrate AI-DLC rules into the project and analyze it so further development can proceed. Following Workspace Detection and Reverse Engineering, the user clarified (via dialogue) that the concrete next task is to fix three specific issues flagged during Reverse Engineering: (1) dual committed lockfiles, (2) missing test coverage for critical code, (3) confusing `lib/queries` naming. The auth-architecture deviation from `task.md` (custom token API vs. NextAuth cookie sessions) is explicitly **out of scope** for this pass — flagged for future stakeholder confirmation only.
- **Request Type**: Refactoring + Enhancement (technical debt cleanup: build tooling hygiene, test coverage, module renaming)
- **Scope Estimate**: Multiple Components — touches root tooling config (lockfiles), `lib/queries/**` (rename + all import sites across `app/console/**`), and adds new test files for `lib/auth.ts` and select `lib/*.ts` modules
- **Complexity Estimate**: Moderate — no new business logic or data model changes; mechanical rename + new test infrastructure + repo hygiene fix, but touches many import sites and requires careful test design given the security/PBT extensions now enforced

## Functional Requirements

### FR-1: Standardize on a Single Package Manager
- Remove `package-lock.json` from the repository.
- Keep `pnpm-lock.yaml` as the single source of truth for dependency resolution.
- Verify `pnpm install` and `pnpm run build` succeed after removal.

### FR-2: Rename `lib/queries/` to `lib/hooks/`
- Rename the directory `lib/queries/` to `lib/hooks/`.
- Update every import site that references `lib/queries/*` (across `app/console/**` pages and any other consumer) to the new path.
- No behavioral change — this is a pure rename/move; the React Query hook implementations themselves are unchanged.

### FR-3: Add Unit Test Coverage for Critical Code
- Add unit tests for `lib/auth.ts`:
  - `requireAuth` / `withAuth` — authorized vs. unauthorized vs. wrong-role scenarios
  - `computeMembershipFingerprint` — fingerprint changes when password hash or membership status changes, stays the same otherwise
- Add unit tests for key business logic in the domain libraries (validation/serialization), specifically:
  - `lib/branding.ts` — color validation (hex regex), logo MIME-type allowlist (confirm SVG is rejected), serialization
  - `lib/documents.ts` — file validation, serialization of document status
  - `lib/tenant-users.ts` — serialization/lookup helpers
  - `lib/analytics.ts` — deterministic seeded generator (same tenant_id+date → same output; different inputs → different output)
- Integration tests and end-to-end tests are explicitly **out of scope** for this pass (per user decision).

## Non-Functional Requirements

### NFR-1: Test Framework
- Use **Vitest** as the test runner (chosen by the user; no existing test tooling in the project). Configure it to work with the project's TypeScript/ESM/Next.js setup.

### NFR-2: Security Baseline Extension (ENABLED — full enforcement)
The `security-baseline` extension is enabled for this project going forward. For the scope of this unit of work, the following rules are assessed as applicable; all others are **N/A** for this pass (no new endpoints, infrastructure, or data stores are introduced):
- **SECURITY-10 (Software Supply Chain Security)** — directly applicable: this work fixes the dual-lockfile violation of "dependency pinning via lock files." Must result in exactly one committed lock file.
- **SECURITY-12 (Authentication and Credential Management)** — applicable to the new `lib/auth.ts` unit tests: tests must not introduce hardcoded credentials/secrets, and must validate (not weaken) the existing adaptive-hashing and session-invalidation behavior.
- **SECURITY-03 (Application-Level Logging)** — applicable if tests reveal logging gaps in `lib/auth.ts`; otherwise N/A (assess during Code Generation).
- All other SECURITY rules (01, 02, 04–09, 11, 13, 14, 15) are **N/A** for this unit of work: no new data stores, network intermediaries, API endpoints, HTTP headers, IAM policies, network configs, or deserialization of untrusted data are introduced by a rename + lockfile cleanup + unit tests.

### NFR-3: Property-Based Testing Extension (ENABLED — full enforcement)
The `property-based-testing` extension is enabled for this project going forward, in **full** mode (all PBT rules blocking, not partial). For this unit of work:
- **PBT-01 (Property Identification)** — applicable: the Functional Design / Code Generation stages must identify testable properties for the functions under test.
- **PBT-02 (Round-Trip Properties)** — applicable to `lib/branding.ts`/`lib/documents.ts`/`lib/tenant-users.ts` serialize functions if a matching deserialize/parse counterpart exists.
- **PBT-03 (Invariant Properties)** — applicable: e.g., `computeMembershipFingerprint` invariant ("same password+status → same fingerprint"), color validation invariant ("valid hex in → valid hex out, unchanged"), analytics generator invariant ("same seed inputs → identical output").
- **PBT-04 (Idempotency)** — assess per function; likely N/A for most of these (no operation here is documented as idempotent), to be confirmed during Functional Design.
- **PBT-05 (Oracle-Based)**, **PBT-06 (Stateful)** — likely N/A (no brute-force reference implementation or mutable stateful component in this scope); confirm and mark N/A with rationale during Functional Design if so.
- **PBT-07 (Generator Quality)**, **PBT-08 (Shrinking/Reproducibility)**, **PBT-09 (Framework Selection)** — applicable: framework selection is **fast-check** (the standard PBT framework for TypeScript, integrates with Vitest per PBT-09's recommendation table).
- **PBT-10 (Complementary Testing)** — applicable: critical scenarios (e.g., "unauthenticated request to a TenantAdmin-only route is rejected") must have an explicit example-based test in addition to any property-based coverage.

### NFR-4: No Regression
- All existing application functionality must continue to work identically after the rename and lockfile change — this is refactoring, not a behavior change, aside from the new test suite being added.

## Key Requirements Summary
- Fix 3 flagged technical-debt items: dual lockfiles (keep pnpm), `lib/queries` → `lib/hooks` rename, and unit test coverage for `lib/auth.ts` + validation/serialization logic in `lib/branding.ts`, `lib/documents.ts`, `lib/tenant-users.ts`, `lib/analytics.ts`.
- Test stack: Vitest + fast-check (property-based testing), unit-level only (no integration/e2e in this pass).
- Security Baseline and Property-Based Testing extensions are both enabled project-wide; for this specific unit of work, most Security Baseline rules are N/A (no new endpoints/infra), while most PBT rules are applicable given the amount of validation/serialization/deterministic-generation logic being tested.
- The auth-architecture deviation from `task.md` is out of scope here and remains an open item for future stakeholder discussion.
