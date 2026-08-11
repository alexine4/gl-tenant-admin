Backend API letting a tenant configure its own branding: logo and colour scheme, used throughout that tenant's experience.

Scope:

Store and retrieve a tenant's logo and colour scheme.

Validate uploaded logo files (format, size) before accepting them.

Done when: a tenant's logo and colour scheme can be set, retrieved, and updated through this API, with upload validation in place.

Frontend panel in the tenant's self-service console for setting the tenant's own branding (logo and colour scheme), calling the branding configuration API.

Scope:

Upload/replace the tenant's logo and preview it.

Choose the tenant's colour scheme.

Done when: a tenant can upload a logo and choose a colour scheme from the self-service console, with changes reflected through the branding configuration API.

Backend API letting a tenant upload its own documents into its knowledge base (the internal-data knowledge layer).

Scope:

Accept document uploads for a tenant and queue them for ingestion into that tenant's knowledge base.

Track the status of each uploaded document (pending, ingested, failed) so the tenant can see the outcome of an upload.

Done when: a tenant can upload documents through this API and see each document's ingestion status, with uploaded documents flowing into that tenant's knowledge base.

Frontend panel in the tenant's self-service console for uploading documents into the tenant's knowledge base, calling the document upload API.

Scope:

Upload one or more documents.

List previously uploaded documents with their ingestion status.

Done when: a tenant can upload documents and see their ingestion status from the self-service console.

Backend API providing the data behind a tenant's own analytics dashboard, filterable by date range.

Scope:

Expose, per tenant and date range: visitors engaged; conversations and questions by period; top questions by topic; unanswered questions and fallback rate; drop-off; topic engagement; a conversion funnel; the voice and text split; the returning and new visitor split; which layer answered; time of day and day of week; and the per-answer rate and total answers for the current billing period.

Support exporting the dashboard's data.

Done when: all of the figures above can be retrieved for a tenant over a given date range through this API, and the result set can be exported.

Frontend dashboard in the tenant's self-service console displaying that tenant's analytics, with a date-range filter, calling the analytics dashboard API.

Scope:

Display, with a date-range filter: visitors engaged; conversations and questions by period; top questions by topic; unanswered questions and fallback rate; drop-off; topic engagement; a conversion funnel; the voice and text split; the returning and new visitor split; which layer answered; time of day and day of week; and the per-answer rate and total answers for the current billing period.

Offer an export action for the displayed data.

Done when: a tenant can view its own live analytics dashboard with a date-range filter and export the data, from the self-service console.

Backend authentication for the tenant console: login and session-token refresh for a tenant's own users, resolving into that user's tenant membership and role.

Endpoints:

POST /tenant/auth/login with {email, password, remember_me?} -> {access_token, refresh_token, user: {user_id, email, display_name, tenant_id, role}}

POST /tenant/auth/refresh with {refresh_token} -> {access_token, refresh_token} (a freshly rotated pair)

POST /tenant/auth/logout -> 204 (no server-side effect; see rules below)

GET /tenant/auth/me -> {user_id, email, display_name, tenant_id, role} or 401

Rules:

Login authenticates the global user identity and then resolves the caller's tenant membership and role (TenantAdmin, TenantOperator, or TenantMember) for the tenant the account belongs to; a user is assumed to hold membership in exactly one tenant for now.

On any login failure (unknown email, wrong password, or a disabled membership) the API returns one single generic "invalid credentials" outcome, never revealing which case applied.

The access token is a signed token with a 1-minute lifetime, validated by signature and expiry only elsewhere in the tenant console, with no database lookup per request. The refresh token is a signed token with a 30-minute lifetime by default, or 7 days if "remember me" was selected, carrying a hash of the account's current password-hash and membership status; refreshing recomputes and compares that hash, and any mismatch (password changed, or membership deactivated) blocks the refresh and requires a fresh login.

Refreshing always issues a brand-new rotated pair; no refresh token is stored server-side, so logout has no server-side effect - the client discards both tokens.

Every other tenant-console endpoint is gated by this same signature/expiry-only access-token check, scoped to the token's tenant_id.

Done when: all four endpoints are implemented with the described token lifetimes, rotation, and mismatch-based revocation, and every other tenant-console endpoint is gated by the resulting tenant-scoped access token.

Frontend login experience for the tenant console and the app-wide handling of its token-based session, calling the tenant authentication API.

Scope:

A login form (email, password, "remember me") that calls the login endpoint and stores the returned tokens.

Silently refreshes the access token shortly before its 1-minute expiry.

Redirects to the login form whenever a refresh attempt fails (expired refresh token, or the account's password/membership status changed since it was issued).

A logout action that discards both tokens locally.

Renders the console according to the signed-in user's role (TenantAdmin, TenantOperator, or TenantMember).

Done when: the login form, silent-refresh cycle, redirect-on-refresh-failure, and logout are implemented against the tenant authentication API, with the console adapting to the signed-in user's role.

Backend API letting a TenantAdmin manage the other users within their own tenant: a directory listing plus create, view, edit, change-password, and deactivate/reactivate.

Endpoints:

GET /tenant/users -> [{user_id, email, display_name, role, status, created_at}] (scoped to the caller's tenant)

POST /tenant/users with {email, display_name, role, password} -> created user record; role must be TenantOperator or TenantMember

GET /tenant/users/{user_id} -> full record (must belong to the caller's tenant)

PATCH /tenant/users/{user_id} with {email?, display_name?, role?} -> updated record; role can only be changed to/from TenantOperator or TenantMember, never to/from TenantAdmin

POST /tenant/users/{user_id}/change-password with {new_password} -> 204

POST /tenant/users/{user_id}/deactivate -> updated record, membership status "Disabled"

POST /tenant/users/{user_id}/reactivate -> updated record, membership status "Active"

Rules: every endpoint requires the caller to hold the TenantAdmin role within the same tenant as the target user; a user's email must be unique within the tenant; there is no delete operation, only deactivate, so historical activity tied to a user stays intact; TenantAdmin accounts themselves cannot be created, promoted to, or removed through this API (that stays a platform-side operation).

Done when: all seven endpoints are implemented enforcing the tenant-scoping, role-restriction, and deactivate-not-delete rules above.

Frontend for a TenantAdmin's user directory: listing, creating, viewing, editing, changing the password of, and deactivating/reactivating the other users in their tenant, calling the tenant user API.

Scope:

Directory page: list of the tenant's users (email, display name, role, status).

Create form: email, display name, role (TenantOperator or TenantMember only), password.

Detail panel: view/edit email, display name, and role; a separate change-password action; deactivate/reactivate toggle. No delete action.

Done when: the directory page, create form, and detail panel are implemented against the tenant user API, restricted to TenantAdmin users and to TenantOperator/TenantMember roles.
