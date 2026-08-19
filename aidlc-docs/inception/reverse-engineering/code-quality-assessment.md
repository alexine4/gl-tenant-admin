# Code Quality Assessment

## Test Coverage
- **Overall**: None
- **Unit Tests**: Not present — no `*.test.ts(x)` or `*.spec.ts(x)` files found anywhere in the repository
- **Integration Tests**: Not present — no `__tests__` directories or integration test setup found

## Code Quality Indicators
- **Linting**: Configured — `eslint.config.mjs` (flat config) using `eslint-config-next` core-web-vitals + TypeScript rule sets. One deliberate inline `eslint-disable` was found (`app/console/branding/page.tsx`, disabling `@next/next/no-img-element` for the tenant-uploaded logo preview, with an explanatory comment).
- **Code Style**: Consistent — uniform use of the `withAuth` wrapper, Zod validation, and server/client type-mirroring pattern across all domains.
- **Documentation**: Fair — no README/API docs beyond `README.md` (generic Next.js starter content), `AGENTS.md` (notes on Next 16 breaking changes), and `task.md` (original requirements spec, now partially out of date — see Architecture Deviation below). Inline comments explain non-obvious security and performance decisions well, but there is no `.env.example` for onboarding.

## Technical Debt
- **Dual lockfiles**: Both `package-lock.json` and `pnpm-lock.yaml` are committed, indicating two different package managers have been used against this repo at different times. This risks dependency drift between environments and should be resolved by standardizing on one package manager and removing the other lockfile.
- **`lib/queries/*.ts` naming ambiguity**: These files are TanStack React Query client hooks (data-fetching layer), not database queries. The name may confuse newcomers expecting Prisma query logic here (that logic actually lives in `lib/*.ts` and directly in the route handlers).
- **Duplicated storage path constant**: `LOGO_STORAGE_ROOT` is defined separately in both `lib/branding.ts` and `app/tenant/branding/logo/route.ts` (per an in-code comment, due to Turbopack file-tracing requirements). This is a deliberate workaround but remains a maintenance hazard if the two literals ever drift apart.
- **No `.env.example`**: `prisma.config.ts` and `.env` reference `DATABASE_URL`, but no example/template env file is committed, making onboarding harder.
- **Simulated backends**: `lib/analytics.ts` (seeded pseudo-random data generator) and `lib/documents.ts`'s `queueIngestion` (a `setTimeout` stand-in) are explicitly commented as placeholders for real analytics and ingestion pipelines that do not yet exist. These are intentional gaps for this stage of the product, not accidental omissions, but should be tracked as known follow-up work before production use.

## Architecture Deviation (flagged for stakeholder awareness)
`task.md` (the original requirements/spec document) describes a custom REST token API (`POST /tenant/auth/login|refresh|logout`, `GET /tenant/auth/me`) with explicit short-lived access tokens (1 minute) and longer-lived refresh tokens (30 minutes / 7 days) with manual rotation. The actual implementation instead uses NextAuth's built-in cookie-based JWT session flow (single 7-day session, no separate access/refresh token pair, and no `/tenant/auth/*` routes at all), substituting a periodic DB fingerprint recheck (`computeMembershipFingerprint`, rechecked every 60 seconds) for a server-side revocation list. This is a materially simpler and cookie-based (rather than bearer-token-based) auth model than originally specified, which would affect any future CORS or non-browser (mobile/API) client integration plans. This should be confirmed with stakeholders as an intentional and accepted deviation before further auth-related work proceeds.

## Patterns and Anti-patterns

### Good Patterns
- Consistent `withAuth` gating across every `/tenant/**` route handler
- Consistent Zod validation on all mutating endpoints
- Tenant scoping enforced at the query level — the server never trusts a client-supplied tenant id, it is always derived from the authenticated session
- Thoughtful, documented security decisions: SVG excluded from allowed logo MIME types (stored-XSS prevention), path-traversal guard on the public logo-serving route, timing-safe dummy-hash comparison in the credentials `authorize()` function for unknown emails, storage kept outside `public/` and served through an explicit route
- Consistent snake_case wire format via explicit serialize functions, decoupling internal camelCase Prisma models from the public API contract
- Render-time form state sync (avoiding an unnecessary extra render vs. a `useEffect`-based sync), used consistently and commented where applied

### Anti-patterns
- No automated test coverage of any kind (unit, integration, or otherwise) — the entire codebase currently relies on manual verification
- Dual committed lockfiles (`package-lock.json` + `pnpm-lock.yaml`) as noted under Technical Debt
- Ambiguous module naming (`lib/queries/*.ts`) that does not match its actual responsibility
