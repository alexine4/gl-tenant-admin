# API Documentation

All routes below are Next.js Route Handlers. Unless noted as public, each is gated by `withAuth` from `lib/auth.ts` (valid session required; a `roles` array further restricts to specific membership roles).

## REST APIs

### NextAuth Handler
- **Method**: GET/POST
- **Path**: `/api/auth/[...nextauth]`
- **Purpose**: NextAuth-internal endpoints (sign-in, session, CSRF, callback)
- **Request**: NextAuth-internal
- **Response**: NextAuth-internal

### List Tenant Users
- **Method**: GET
- **Path**: `/tenant/users`
- **Purpose**: List managed users (memberships) within the caller's tenant
- **Auth**: TenantAdmin only
- **Request**: none
- **Response**: `TenantUser[]`

### Create Tenant User
- **Method**: POST
- **Path**: `/tenant/users`
- **Purpose**: Create a new TenantOperator/TenantMember in the caller's tenant
- **Auth**: TenantAdmin only
- **Request**: `{ email, display_name, role, password }` (Zod: valid email, password min length 8)
- **Response**: `TenantUser` (201), or 409 if email already in use

### Get Tenant User
- **Method**: GET
- **Path**: `/tenant/users/{user_id}`
- **Purpose**: Fetch one managed user, scoped to the caller's tenant
- **Auth**: TenantAdmin only
- **Request**: none
- **Response**: `TenantUser`, or 404 if not found / not in tenant

### Update Tenant User
- **Method**: PATCH
- **Path**: `/tenant/users/{user_id}`
- **Purpose**: Update email, display name, and/or role
- **Auth**: TenantAdmin only
- **Request**: `{ email?, display_name?, role? }`
- **Response**: `TenantUser`, or 404/409

### Change Tenant User Password
- **Method**: POST
- **Path**: `/tenant/users/{user_id}/change-password`
- **Purpose**: Set a new password for a managed user
- **Auth**: TenantAdmin only
- **Request**: `{ new_password }` (min length 8)
- **Response**: 204 No Content

### Deactivate Tenant User
- **Method**: POST
- **Path**: `/tenant/users/{user_id}/deactivate`
- **Purpose**: Set the user's membership status to Disabled
- **Auth**: TenantAdmin only
- **Request**: none
- **Response**: `TenantUser`

### Reactivate Tenant User
- **Method**: POST
- **Path**: `/tenant/users/{user_id}/reactivate`
- **Purpose**: Set the user's membership status to Active
- **Auth**: TenantAdmin only
- **Request**: none
- **Response**: `TenantUser`

### Get Tenant Branding
- **Method**: GET
- **Path**: `/tenant/branding`
- **Purpose**: Get (lazily creating if absent) the caller's tenant branding record
- **Auth**: any authenticated tenant user
- **Request**: none
- **Response**: `TenantBranding`

### Update Tenant Branding Colors
- **Method**: PATCH
- **Path**: `/tenant/branding`
- **Purpose**: Update primary/secondary/accent colors
- **Auth**: any authenticated tenant user
- **Request**: `{ primary_color?, secondary_color?, accent_color? }` (hex color regex)
- **Response**: `TenantBranding`

### Upload Tenant Logo
- **Method**: POST
- **Path**: `/tenant/branding/logo`
- **Purpose**: Upload/replace the tenant's logo
- **Auth**: any authenticated tenant user
- **Request**: `multipart/form-data`, field `logo` (SVG intentionally excluded from allowed MIME types)
- **Response**: `TenantBranding`

### List Tenant Documents
- **Method**: GET
- **Path**: `/tenant/documents`
- **Purpose**: List documents uploaded for the caller's tenant
- **Auth**: any authenticated tenant user
- **Request**: none
- **Response**: `TenantDocument[]`

### Upload Tenant Documents
- **Method**: POST
- **Path**: `/tenant/documents`
- **Purpose**: Upload one or more documents for ingestion into the tenant's knowledge base
- **Auth**: any authenticated tenant user
- **Request**: `multipart/form-data`, field `files` (repeatable)
- **Response**: `{ results: UploadResult[] }` — 201 if any file accepted, 400 if all rejected

### Get Tenant Analytics
- **Method**: GET
- **Path**: `/tenant/analytics`
- **Purpose**: Get analytics data for a date range
- **Auth**: any authenticated tenant user
- **Request**: query params `from`, `to` (YYYY-MM-DD, span ≤ 366 days; defaults to trailing 30 days)
- **Response**: `AnalyticsResponse`

### Export Tenant Analytics
- **Method**: GET
- **Path**: `/tenant/analytics/export`
- **Purpose**: Download analytics data as a file
- **Auth**: any authenticated tenant user
- **Request**: query params `from`, `to`, `format` (`csv` | `json`)
- **Response**: file download (CSV or JSON)

### Serve Branding Logo
- **Method**: GET
- **Path**: `/uploads/branding/{tenantId}/{filename}`
- **Purpose**: Publicly serve an uploaded logo file (logos are intended to be publicly viewable)
- **Auth**: **public, no authentication** — includes path-traversal (`..`) rejection
- **Request**: none
- **Response**: binary file content with `Cache-Control: immutable`

## Internal APIs

### `withAuth` / `requireAuth` (`lib/auth.ts`)
- **Methods**: `withAuth(handler, { roles?: MembershipRole[] })`, `requireAuth(request, { roles? })`
- **Parameters**: `handler` — the route function to wrap; `roles` — optional allow-list of membership roles
- **Return Types**: Wrapped route handler that resolves the session, verifies role membership, and throws/returns an `AuthError` (401/403) before delegating to `handler`

### `computeMembershipFingerprint` (`lib/auth.ts`)
- **Methods**: `computeMembershipFingerprint(user)`
- **Parameters**: user/membership record (password hash + membership status)
- **Return Types**: string fingerprint embedded in the JWT `fp` claim, rechecked against the DB every 60 seconds in the `jwt` callback to invalidate sessions on password change or deactivation

## Data Models

(See `prisma/schema.prisma` for the authoritative definitions.)

### User
- **Fields**: `id`, `email` (unique), `passwordHash`, `displayName`, `createdAt`, `updatedAt`
- **Relationships**: has many `TenantMembership`
- **Validation**: email uniqueness enforced at the DB level; format/length validated via Zod at the API layer

### Tenant
- **Fields**: `id`, `name`, `slug` (unique), `createdAt`, `updatedAt`
- **Relationships**: has many `TenantMembership`, one `TenantBranding`, many `Document`

### TenantMembership
- **Fields**: `id`, `tenantId`, `userId`, `role` (`MembershipRole`), `status` (`MembershipStatus`, default `Active`), `createdAt`, `updatedAt`
- **Relationships**: unique on `(tenantId, userId)`; cascade delete from both `Tenant` and `User`

### TenantBranding
- **Fields**: `id`, `tenantId` (unique), `logoUrl?`, `logoMimeType?`, `logoSizeBytes?`, `primaryColor` (default `#4F46E5`), `secondaryColor` (default `#111827`), `accentColor` (default `#22C55E`), `updatedAt`
- **Relationships**: cascade delete from `Tenant`

### Document
- **Fields**: `id`, `tenantId`, `uploadedByUserId`, `fileName`, `mimeType`, `sizeBytes`, `storagePath`, `status` (`DocumentStatus`, default `Pending`), `failureReason?`, `createdAt`, `updatedAt`
- **Relationships**: indexed on `tenantId`; cascade delete from `Tenant`

### Enums
- `MembershipRole`: `TenantAdmin`, `TenantOperator`, `TenantMember`
- `MembershipStatus`: `Active`, `Disabled`
- `DocumentStatus`: `Pending`, `Ingested`, `Failed`
