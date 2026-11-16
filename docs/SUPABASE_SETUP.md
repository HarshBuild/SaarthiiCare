# SAARTHII Supabase Setup

This document covers the Supabase integration:

- **Phase 2** — secure configuration, browser and server clients, and connection
  diagnostics.
- **Phase 3** — schema migrations, RLS policies, private storage, Realtime
  publication, seeds and verification scripts.

Phase 3 SQL has been written and parser-validated, but it has **not** been
executed against a live Supabase project. Run the preflight script first.

## 1. Security first

The service-role JWT and `sb_secret_...` value pasted into chat are exposed.
Rotate them before using this project with real Supabase credentials.

1. Open the Supabase dashboard for the project.
2. Go to **Project Settings -> API**.
3. Revoke or rotate the exposed legacy service-role key and secret key.
4. Create a new server-only secret key.
5. Put it only in `backend/.env` or the deployment secret manager.
6. Never paste it into chat, a screenshot, a commit, or a `VITE_*` variable.

The publishable key is browser-safe only after RLS and policies are enabled.
Phase 3 adds the tables and policies, but the browser is still read-only for
domain data and the FastAPI backend remains authoritative. Do not treat the
publishable key as authorization by itself.

## 2. Files added in Phase 2

| File | Purpose |
|---|---|
| `frontend/src/lib/supabaseClient.js` | Shared browser client, configuration validation, Auth endpoint health check. |
| `frontend/src/lib/supabaseClient.test.js` | Node test-runner coverage for configuration and connection diagnostics. |
| `backend/app/core/supabase.py` | Server-side configuration status and safe connection check. |
| `backend/tests/test_supabase_config.py` | Pytest coverage for configuration and health checks. |
| `backend/tests/test_config.py` | Pytest coverage for `.env` loading, environment precedence and CORS parsing. |
| `backend/app/api/health.py` | Adds `GET /api/health/supabase`. |
| `backend/app/core/config.py` | Adds server-only Supabase settings, robust `backend/.env` loading, and CORS parsing. |
| `frontend/.env.example` | Browser environment example. |
| `backend/.env.example` | Server environment example. |
| `.env.example` | Combined reference; not read directly by either app. |
| `backend/requirements-dev.txt` | Test dependencies. |

No SQL migrations were created or executed in Phase 2. Phase 3 adds them; see
section 8.

## 2a. Files added in Phase 3

| File | Purpose |
|---|---|
| `supabase/migrations/0001_extensions_enums.sql` | Extensions and enum types, including legacy enum reconciliation. |
| `supabase/migrations/0002_core_tables.sql` | Facilities, profiles, assignments, patients, referrals, events, outcomes, back-referrals, follow-up tasks and audit logs. |
| `supabase/migrations/0003_notifications_escalations.sql` | Notifications and escalations. |
| `supabase/migrations/0004_functions_triggers.sql` | RLS helper functions, `updated_at` triggers and the auth-user profile trigger. |
| `supabase/migrations/0005_rls_policies.sql` | Least-privilege grants, RLS enablement and scoped policies. |
| `supabase/migrations/0006_storage_realtime.sql` | Private `referral-documents` bucket, storage policies and Realtime publication. |
| `supabase/seed/0001_facilities_patients.sql` | Synthetic facilities and patients. |
| `supabase/seed/0002_demo_profiles.sql` | Demo profile roles and facility assignments by auth email. |
| `supabase/verify/0000_preflight.sql` | Read-only preflight inventory. |
| `supabase/verify/0001_phase3_checks.sql` | Read-only post-migration verification. |
| `supabase/README.md` | Exact SQL Editor run order and verification steps. |
| `backend/tests/test_supabase_migrations.py` | Structural and PostgreSQL-parser tests for the Phase 3 SQL. |

## 3. Configure the frontend

```powershell
cd B:\SaarthiCare\frontend
Copy-Item .env.example .env.local
notepad .env.local
```

Set:

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

`frontend/.env.local` is gitignored. Vite ignores `NEXT_PUBLIC_*` names; use
`VITE_*`.

## 4. Configure the backend

```powershell
cd B:\SaarthiCare\backend
Copy-Item .env.example .env
notepad .env
```

Fill in the Supabase values. Keep `SUPABASE_SERVICE_ROLE_KEY` and
`SUPABASE_DB_URL` server-side only.

Create a virtual environment and install dependencies:

```powershell
cd B:\SaarthiCare\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -m pip install -r requirements-dev.txt
```

If PowerShell blocks activation, run:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

### How backend environment loading works

`app/core/config.py` loads `backend/.env` explicitly using the file's own
location, so it works no matter which directory Uvicorn is started from.
Behaviour:

- Real process environment variables always win over values in `backend/.env`.
- Surrounding single or double quotes are stripped from values.
- `CORS_ORIGINS` accepts either a comma-separated list or a JSON array, e.g.
  `http://localhost:5173,http://127.0.0.1:5173`.
- `backend/.env` is server-only. Never commit it and never copy
  `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_DB_URL` into `frontend/.env.local`.

## 5. Run the applications

Backend:

```powershell
cd B:\SaarthiCare\backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
```

Frontend:

```powershell
cd B:\SaarthiCare\frontend
npm install
npm run dev
```

## 6. Verify configuration and connectivity

Application health:

```powershell
Invoke-RestMethod http://localhost:8000/api/health
```

Supabase diagnostics:

```powershell
Invoke-RestMethod http://localhost:8000/api/health/supabase | ConvertTo-Json -Depth 5
```

Expected results:

- Missing configuration: `status = not_configured`, with `missing` listing the
  required variable names. No network call is made.
- Reachable project: `status = reachable`, `http_status = 200`.
- Responding but unhealthy: `status = unhealthy`, with the HTTP status.
- Network failure: `status = unreachable`, with a sanitised message. The
  service-role key is never returned.

A reachable Auth endpoint does **not** prove that tables, RLS or migrations are
correct. Those are verified in later phases.

## 7. Run the test suites

Backend:

```powershell
cd B:\SaarthiCare\backend
.\.venv\Scripts\Activate.ps1
python -m pytest -q
```

Frontend:

```powershell
cd B:\SaarthiCare\frontend
npm test
```

Frontend build:

```powershell
cd B:\SaarthiCare\frontend
npm run build
```

Last verified results:

- Backend: `28 passed`, one Starlette/httpx deprecation warning. This includes
  13 Phase 3 SQL tests in `backend/tests/test_supabase_migrations.py`.
- Frontend: `10 passed` using the Node test runner.
- Frontend build: succeeded, `1635 modules transformed`.
- Live `GET /api/health/supabase` with no Supabase variables returned
  `status = not_configured` and no network call.
- `npm audit`: 4 reported vulnerabilities (3 moderate, 1 high) from the
  pre-existing Vite/esbuild/react-router stack; 0 critical.

The Phase 3 tests do not connect to Supabase. They check the SQL structurally
and parse every file with `pglast`, the PostgreSQL parser used by `pg_query`.
A parse pass proves syntax, not that the migrations ran successfully.

## 8. Run the Phase 3 migrations

Supabase CLI and `psql` are not available in this environment. Run the files
manually in the **Supabase SQL Editor**, in this order:

1. `supabase/verify/0000_preflight.sql` — read-only, keep the output.
2. `supabase/migrations/0001_extensions_enums.sql`
3. `supabase/migrations/0002_core_tables.sql`
4. `supabase/migrations/0003_notifications_escalations.sql`
5. `supabase/migrations/0004_functions_triggers.sql`
6. `supabase/migrations/0005_rls_policies.sql`
7. `supabase/migrations/0006_storage_realtime.sql`
8. Create the demo auth users in **Authentication -> Users** (see below).
9. `supabase/seed/0001_facilities_patients.sql`
10. `supabase/seed/0002_demo_profiles.sql`
11. `supabase/verify/0001_phase3_checks.sql` — every check should show
    `passed = true`.

`supabase/README.md` repeats this run order in short form.

### What the migrations create

- **Tables** — 12 application tables in `public`: `facilities`, `profiles`,
  `user_facility_assignments`, `patients`, `referrals`, `referral_events`,
  `referral_outcomes`, `back_referrals`, `follow_up_tasks`, `audit_logs`,
  `notifications`, `escalations`.
- **Auth link** — `public.profiles.id` references `auth.users(id)` with
  `on delete cascade`. An `after insert` trigger on `auth.users` creates a
  profile for every new auth user, always with `role = 'phc_staff'`.
- **Domain writes** — browsers are granted read-only access to domain tables.
  They may update only their own profile `full_name`/`phone`, their own
  notification `status`/`read_at`, and escalation `status`/`resolution_notes`.
  Referral workflow writes stay with the FastAPI backend.
- **RLS** — enabled on all 12 tables. Helper functions
  (`current_user_role`, `is_admin`, `is_supervisor_or_admin`,
  `user_facility_ids`, `has_facility_access`, `shares_facility_with`,
  `can_access_referral`) are `security definer` with a fixed `search_path` so
  policies do not accidentally grant broad access.
- **Storage** — private `referral-documents` bucket, 10 MiB limit, MIME types
  `application/pdf`, `image/jpeg`, `image/png`, `image/webp`. Object names must
  start with a facility UUID: `<facility_id>/<referral_id>/<filename>`.
- **Realtime** — `referrals`, `referral_events`, `referral_outcomes`,
  `back_referrals`, `follow_up_tasks`, `notifications` and `escalations` are
  added to the `supabase_realtime` publication. Order data is protected by RLS,
  but postgres-changes payloads can still reveal row changes to clients allowed
  to read those rows.

### Legacy-schema warning

`backend/app/database/schema.sql` is the old local schema. It created a
`public.users` table that stores password hashes. `supabase/migrations` is now
canonical for Supabase and uses `public.profiles` instead.

If the Supabase project already contains `public.users`,
`public.user_facility_assignments` or the older enums from a previous attempt:

- Do **not** run `backend/app/database/schema.sql` against Supabase again.
- Do **not** drop `public.users` until the data has been backed up and mapped to
  `auth.users` + `public.profiles`.
- Migration `0001` reconciles missing enum values with `add value if not
  exists`, but it does not migrate table data.
- Run `supabase/verify/0000_preflight.sql` first and share the output before
  proceeding.

### Demo users

Public sign-up should stay disabled. Create these users in
**Authentication -> Users** (or invite them), then run seed `0002`:

| Email | Role | Facility |
|---|---|---|
| `priya.sharma@saarthii.in` | `phc_staff` | PHC Rampur |
| `ravi.kumar@saarthii.in` | `hospital_staff` | District Hospital Bareilly |
| `anjali.reddy@saarthii.in` | `supervisor` | District Hospital Bareilly |
| `admin@saarthii.in` | `admin` | District Hospital Bareilly |

Seed `0002` assigns roles explicitly, which is the only place a privileged role
is granted. The password is set in the dashboard and is never stored in SQL.

### Manual Supabase dashboard actions

These actions cannot be performed from the repository:

1. Rotate the exposed service-role/secret credentials.
2. Confirm the project URL and publishable key.
3. **Disable public sign-up** so only invited/created users can access the app.
4. Configure the Auth site URL and redirect URLs for local development and the
   deployment domain.
5. Create or invite the four demo users listed above.
6. Set an appropriate JWT expiry and refresh-token rotation policy.
7. Enable backups or point-in-time recovery if the plan supports it.
8. Optionally enable leaked-password protection and MFA for admin accounts.
9. Confirm the project region and any network restrictions.
10. Run `supabase/verify/0000_preflight.sql` before any migration.

### Preflight queries

`supabase/verify/0000_preflight.sql` contains the full read-only preflight. The
core checks are:

```sql
select table_schema, table_name
from information_schema.tables
where table_schema in ('public', 'storage')
order by 1, 2;

select routine_schema, routine_name
from information_schema.routines
where routine_schema = 'public';

select schemaname, tablename, policyname, cmd
from pg_policies
where schemaname in ('public', 'storage');
```

Do not run destructive migrations until the remote schema is known and the
plan is approved.

## 2b. Files added in Phase 4 (Supabase Auth Integration)

| File | Purpose |
|---|---|
| `backend/app/core/supabase_auth.py` | RS256 JWKS verification with caching, SupabaseAuthError hierarchy. |
| `backend/app/api/middleware.py` | Rewritten: Supabase JWT dispatch with legacy fallback, `role_required`, `facility_access_required` guards. |
| `backend/app/api/auth.py` | `/auth/me` uses verified user; `/auth/login` deprecated behind `SUPABASE_AUTH_ENABLED`; `/auth/change-password` legacy-only. |
| `backend/tests/test_supabase_auth.py` | 28 tests covering JWKS, token verification, dispatch, legacy fallback, role/facility guards, flag behaviour. |
| `backend/app/core/config.py` | Added `SUPABASE_AUTH_ENABLED` flag (default `true`). |
| `frontend/src/contexts/AuthContext.jsx` | React provider: `onAuthStateChange`, `signInWithPassword`, profile join (`profiles` + `user_facility_assignments`). |
| `frontend/src/App.jsx` | Wraps routes with `AuthProvider`; `ProtectedRoute` reads from context. |
| `frontend/src/pages/Login.jsx` | Uses `supabase.auth.signInWithPassword`; legacy `AuthClient` fallback when Supabase unavailable. |
| `frontend/src/layouts/Layout.jsx` | Consumes `useAuth()`; `signOut` clears session. |
| `frontend/src/pages/Settings/Settings.jsx` | Reads profile from context; change password via legacy endpoint, sign-out via context. |
| `frontend/src/services/authService.js` | Thin wrapper kept for `/auth/change-password` and legacy `/auth/login`. |
| `frontend/src/services/api.js` | Axios interceptor keeps legacy token attachment only for fallback path. |

## 4a. New backend environment variables (Phase 4)

Add to `backend/.env`:

```env
# Supabase Auth
SUPABASE_AUTH_ENABLED=true
SUPABASE_JWKS_URL=                       # optional override; defaults to <SUPABASE_URL>/auth/v1/.well-known/jwks.json
SUPABASE_JWT_AUD=authenticated           # default Supabase audience
```

`SUPABASE_AUTH_ENABLED=false` keeps the app running with the legacy mock
user database while Supabase is unreachable. Default is `true` for production
safety.

## 9. Current limitations

- Phase 3 SQL has **not** been executed against Supabase. Only structural and
  PostgreSQL-parser tests have run, because the exposed credentials must not be
  used. Run the preflight and share its output before executing the migrations.
- Phase 4 wires Supabase Auth into the UI and API, but the backend still uses
  in-memory referral data until Phase 6.
- The existing supervisor analytics remain hardcoded until Phase 8.
- `backend/.env` still contains the development placeholder `SECRET_KEY`. Replace
  it with a long random value before any deployment; it signs the legacy custom
  tokens when `SUPABASE_AUTH_ENABLED=false`.
- Real Supabase connectivity has not been tested. The health-check code is
  tested with mocked transports, and the missing-configuration path is tested
  without a network.

## 10. Last verified results (Phase 4)

- Backend: `56 passed` (includes 28 new Phase 4 auth tests).
- Frontend: `10 passed` using the Node test runner.
- Frontend build: succeeded, `1680 modules transformed`.
- Live `GET /api/health/supabase` with no Supabase variables returned
  `status = not_configured` and no network call.
- `npm audit`: 4 reported vulnerabilities (3 moderate, 1 high) from the
  pre-existing Vite/esbuild/react-router stack; 0 critical.
