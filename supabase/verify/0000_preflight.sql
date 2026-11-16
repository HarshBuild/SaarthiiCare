-- SAARTHII preflight checks (read-only)
-- Run this before any migration and keep the output. It does not modify data.

-- 1. Existing tables in public and storage.
select table_schema, table_name
from information_schema.tables
where table_schema in ('public', 'storage')
order by 1, 2;

-- 2. Existing public routines.
select routine_schema, routine_name
from information_schema.routines
where routine_schema = 'public'
order by 2;

-- 3. Existing policies.
select schemaname, tablename, policyname, cmd
from pg_policies
where schemaname in ('public', 'storage')
order by 1, 2, 3;

-- 4. Existing extensions.
select extname, extnamespace::regnamespace as schema
from pg_extension
order by 1;

-- 5. Existing storage buckets.
select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
order by id;

-- 6. Existing Realtime publication tables.
select pubname, schemaname, tablename
from pg_publication_tables
where pubname = 'supabase_realtime'
order by schemaname, tablename;

-- 7. Whether the legacy local-schema users table exists. If it does, do not
--    drop it without a backup and an approved reconciliation plan.
select exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'users'
) as legacy_public_users_exists;

-- 8. Counts only; never dump patient rows from a shared project.
select
    (select count(*) from auth.users) as auth_users_count;
