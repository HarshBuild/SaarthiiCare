# SAARTHII Supabase SQL

Canonical database schema, security policies, storage and Realtime setup for
Supabase. Supabase CLI and `psql` are not required; run these files in the
**Supabase SQL Editor**.

> Phase 3 SQL is written and parser-validated but has **not** been executed
> against a live project. Rotate the exposed credentials and run the preflight
> first.

## Run order

Run each file as its own SQL Editor query, in this order.

| # | File | Writes data? |
|---|---|---|
| 1 | `verify/0000_preflight.sql` | No |
| 2 | `migrations/0001_extensions_enums.sql` | Yes (schema only) |
| 3 | `migrations/0002_core_tables.sql` | Yes (schema only) |
| 4 | `migrations/0003_notifications_escalations.sql` | Yes (schema only) |
| 5 | `migrations/0004_functions_triggers.sql` | Yes (schema only) |
| 6 | `migrations/0005_rls_policies.sql` | Yes (schema only) |
| 7 | `migrations/0006_storage_realtime.sql` | Yes (bucket/publication) |
| 8 | `seed/0001_facilities_patients.sql` | Yes (synthetic rows) |
| 9 | `seed/0002_demo_profiles.sql` | Yes (demo roles) |
| 10 | `verify/0001_phase3_checks.sql` | No |

Before step 9, create the demo auth users in **Authentication -> Users**:

| Email | Role |
|---|---|
| `priya.sharma@saarthii.in` | `phc_staff` |
| `ravi.kumar@saarthii.in` | `hospital_staff` |
| `anjali.reddy@saarthii.in` | `supervisor` |
| `admin@saarthii.in` | `admin` |

Set their passwords in the dashboard. Passwords are never stored in SQL.

## Verification

After step 10, every row from `verify/0001_phase3_checks.sql` should show
`passed = true`. What it checks:

- all 12 application tables exist;
- RLS is enabled on all 12;
- at least one policy exists on each;
- the `referral-documents` bucket is private with size and MIME limits;
- the core tables are in the `supabase_realtime` publication;
- every auth user has a profile;
- new profiles default to `phc_staff`;
- the legacy `public.users` table is absent (or flagged for reconciliation).

## Safety rules

- Never run `backend/app/database/schema.sql` against Supabase; it is the legacy
  local schema and creates a password-bearing `public.users` table.
- Do not drop legacy tables until their data is backed up and mapped.
- Public sign-up stays disabled. Only seed `0002` grants privileged roles.
- Do not commit `.env` files, service-role keys or database URLs.
- Use synthetic patient data only.

See `docs/SUPABASE_SETUP.md` for the full setup, security and manual dashboard
steps.

## Local validation

The SQL is checked without a database connection:

```powershell
cd B:\SaarthiCare\backend
.\.venv\Scripts\Activate.ps1
python -m pytest tests/test_supabase_migrations.py -q
```

This runs structural assertions plus `pglast` (the PostgreSQL parser) over every
file in this directory. It proves syntax and required controls, not that the
migrations ran.

## Phase 4: Auth integration (code only, no SQL)

Phase 4 moves the frontend and backend to Supabase Auth without schema changes:

- Backend verifies Supabase RS256 JWTs via JWKS (`backend/app/core/supabase_auth.py`).
- `get_current_user` dispatches to Supabase when `SUPABASE_AUTH_ENABLED=true`
  (default) and falls back to the legacy mock when false.
- `role_required` and `facility_access_required` read role/facilities from the
  profile resolved from the JWT email; they never trust client claims.
- Frontend uses `supabase.auth.signInWithPassword` via `AuthContext`.
- Legacy `/auth/login` and localStorage tokens remain as a fallback behind the
  `SUPABASE_AUTH_ENABLED` flag.
- No SQL changes in Phase 4; all tables and RLS from Phase 3 are used.
