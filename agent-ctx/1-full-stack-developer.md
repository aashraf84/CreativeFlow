# Task 1: Migrate VortexERP from SQLite to Neon PostgreSQL + Multi-tenant setup

## Agent: full-stack-developer
## Date: 2026-06-27
## Status: COMPLETED

## Summary
Migrated the VortexERP database from SQLite to Neon PostgreSQL (serverless Postgres). Added a `Tenant` model at the top of the data hierarchy and linked `Organization` and `User` to it. Created tenant management APIs (GET/POST/PUT/DELETE) and a tenant context helper. Updated the seed route to create a default tenant first, then the organization under that tenant. Existing API routes continue to work unchanged because they all filter by `organizationId` (which is now scoped to a tenant).

## Files Modified

### 1. `.env`
- Replaced SQLite connection string with Neon PostgreSQL pooler URL (`DATABASE_URL`) and direct URL (`DIRECT_URL`)
- Values are quoted so the file can be sourced as a shell script (the URL contains `&` for query params)
- The sandbox environment had a system-level `DATABASE_URL=file:.../custom.db` env var that overrode the .env value, so the dev/db scripts now source `.env` with `set -a` before running to override the system env

### 2. `prisma/schema.prisma`
- Changed `datasource db` provider from `sqlite` to `postgresql`
- Added `directUrl = env("DIRECT_URL")` for migrations (Neon recommends the direct, non-pooled connection for DDL)
- Added new `Tenant` model with: id, name, slug (unique), plan (starter/professional/enterprise), status (active/suspended/cancelled), domain, settings (JSON string), timestamps, and relations to `Organization[]` and `User[]`
- Added `tenantId String` (required) and `tenant Tenant @relation(...)` to `Organization`
- Added `tenantId String?` (optional, for backward compat) and `tenant Tenant? @relation(...)` to `User`
- Added `@@index([tenantId])` to both `Organization` and `User` for efficient multi-tenant queries
- All other models unchanged — they continue to scope by `organizationId`

### 3. `package.json`
- Updated `dev`, `db:push`, `db:generate`, `db:migrate`, `db:reset`, and `seed` scripts to prefix with `set -a && . ./.env && set +a &&` so the Neon URLs from `.env` override the system env var (`DATABASE_URL=file:...`) that the sandbox injects

### 4. `src/lib/tenant.ts` (NEW)
- `getDefaultTenant()` — get-or-create the `default` tenant (single-tenant fallback)
- `getTenantById(id)` — fetch tenant by ID
- `getTenantBySlug(slug)` — fetch tenant by slug
- `getCurrentOrg()` — get-or-create the default tenant + an org under it (used for backward-compat with existing routes that call `db.organization.findFirst()`)

### 5. `src/app/api/seed/route.ts`
- Added `await db.tenant.deleteMany()` to the cleanup cascade (after `organization.deleteMany()` since Tenant is referenced by Organization)
- Inserts a `Tenant` row (`Default Tenant`, slug `default`, plan `professional`) BEFORE creating the `Organization`
- `Organization.create` now includes `tenantId: tenant.id`
- All 12 `User.create` calls now include `tenantId: tenant.id` so users are scoped to the tenant
- Added `tenant: 1` to the success response payload

### 6. `src/app/api/tenants/route.ts` (NEW)
- **GET**: Lists all tenants with `_count` of organizations and users, ordered by `createdAt desc`
- **POST**: Creates a new tenant with validation:
  - Required: name, slug
  - Validates slug uniqueness (409 on conflict)
  - Validates plan ∈ {starter, professional, enterprise}
  - Validates status ∈ {active, suspended, cancelled}
  - Accepts optional domain and settings (JSON string or object)
  - Returns created tenant with counts, status 201

### 7. `src/app/api/tenants/[id]/route.ts` (NEW)
- **GET**: Returns a single tenant with its organizations (with content/client/campaign counts) and users (id/name/email/role/avatar)
- **PUT**: Updates tenant fields (name, slug, plan, status, domain, settings) with the same validations as POST. Slug change is checked for uniqueness excluding the current tenant.
- **DELETE**: Cascade-deletes the tenant AND all of its data using a Prisma `$transaction`:
  1. Collects all organization IDs for the tenant
  2. Deletes all org-scoped data in correct FK order: journalEntryLine, journalEntry, invoiceItem, communicationMessage, conversation, communicationTemplate, communicationContact, brandKit, influencer, inboxMessage, notification, asset, timeEntry, invoice, approval, activityLog, comment, disseminationTask, disseminator, post, automationRule, socialAccount, content, campaign, client, teamMember, team, payrollItem, payrollRun, leaveRequest, employee, jobPosting, department, expense, taxRate, purchaseOrderItem, purchaseOrder, vendor, stockMovement, stockLevel, warehouse, product, assetIssuance, iTAsset, account
  3. Deletes all users linked to those orgs
  4. Deletes the organizations themselves
  5. Finally deletes the tenant
  - All in a transaction so partial failures roll back

## Verification

### Database push
```
$ bun run db:push
Datasource "db": PostgreSQL database "neondb", schema "public" at "ep-raspy-voice-atuicub2.c-9.us-east-1.aws.neon.tech"
🚀 Your database is now in sync with your Prisma schema. Done in 69.50s
✔ Generated Prisma Client (v6.19.2)
```

### API tests (all passed via curl)
1. `GET /api/tenants` → `[]` (empty initially)
2. `POST /api/tenants` with `{name, slug, plan, status, domain}` → 201 with full tenant object including `_count`
3. `GET /api/tenants` → returns the newly created tenant
4. `GET /api/seed` → `{"success":true,"message":"Database seeded successfully","data":{"tenant":1,"organization":1,"users":12,"teams":6,"clients":5,"campaigns":4,"content":22,...}}`
5. `GET /api/tenants` → returns the Default Tenant with `_count: {organizations: 1, users: 12}`
6. `GET /` → HTTP 200 (root page renders against Neon data)
7. `GET /api/tenants/[id]` → returns tenant with full organizations and users arrays
8. `PUT /api/tenants/[id]` with `{name, plan}` → 200 with updated tenant
9. `GET /api/dashboard` → returns real dashboard data (contentByStage, postsPublishedThisWeek, teamStats, etc.) computed from Neon

### Lint
```
$ bun run lint
$ eslint .
```
No errors. ✅

## Key Decisions / Notes

1. **Multi-tenant pattern preserved**: Existing API routes continue to filter by `organizationId` (not `tenantId`). The new `tenantId` columns add a layer above Organization, enabling future cross-org tenant queries without breaking existing per-org queries. No existing route logic was modified.

2. **System env var override**: The sandbox injects `DATABASE_URL=file:/home/z/my-project/db/custom.db` as a system env var. Next.js does NOT override system env vars with `.env` values, so the runtime Prisma client was reading the stale SQLite URL. Fixed by sourcing `.env` with `set -a && . ./.env && set +a &&` in the npm scripts (Prisma CLI also benefits). The `.env` values are quoted so the `&` in the Neon query string doesn't break shell parsing.

3. **directUrl**: Neon recommends a direct (non-pooler) connection for migrations and the pooler connection for runtime queries. The schema now declares both; `prisma db push` uses `directUrl`, runtime Prisma Client uses `url`.

4. **SSL**: Both connection strings include `sslmode=require&channel_binding=require` as Neon requires.

5. **Optional `User.tenantId`**: Made `User.tenantId` optional (`String?`) so existing user-creation code that doesn't supply `tenantId` continues to work. The seed route sets it explicitly. This matches the task spec.

6. **Cascade delete**: Implemented tenant deletion as a manual cascade inside a `$transaction` because none of the relations declare `onDelete: Cascade`. The order matches the seed route's cleanup order to avoid FK violations.

## Dev Server
Running detached on port 3000 (parent PID = 1, survives shell exit). The previous dev server pattern (background + nohup) was being killed when the bash tool session ended; the working pattern is `setsid bash -c '... exec next dev ...' > dev.log 2>&1 < /dev/null & disown` which fully detaches into its own session.
