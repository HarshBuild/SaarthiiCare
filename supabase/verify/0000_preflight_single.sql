-- SAARTHII preflight checks (single combined result)
-- Returns all checks in one result set with a 'check_type' column identifying each section.

with checks as (
  -- 1. Tables
  select 'tables' as check_type, table_schema, table_name, null::text as extra1, null::text as extra2, null::text as extra3
  from information_schema.tables
  where table_schema in ('public', 'storage')

  union all

  -- 2. Routines
  select 'routines', routine_schema, routine_name, null, null, null
  from information_schema.routines
  where routine_schema = 'public'

  union all

  -- 3. Policies
  select 'policies', schemaname, tablename, policyname, cmd, null
  from pg_policies
  where schemaname in ('public', 'storage')

  union all

  -- 4. Extensions
  select 'extensions', extname, extnamespace::regnamespace::text, null, null, null
  from pg_extension

  union all

  -- 5. Storage buckets
  select 'buckets', id, name, public::text, file_size_limit::text, array_to_string(allowed_mime_types, ',')
  from storage.buckets

  union all

  -- 6. Realtime publications
  select 'realtime', pubname, schemaname, tablename, null, null
  from pg_publication_tables
  where pubname = 'supabase_realtime'

  union all

  -- 7. Legacy users table
  select 'legacy_users', null, null,
         case when exists (
           select 1 from information_schema.tables
           where table_schema = 'public' and table_name = 'users'
         ) then 'true' else 'false' end, null, null

  union all

  -- 8. Auth users count
  select 'auth_users', null, null, count(*)::text, null, null
  from auth.users
)
select check_type, table_schema, table_name, extra1, extra2, extra3
from checks
order by
  case check_type
    when 'tables' then 1
    when 'routines' then 2
    when 'policies' then 3
    when 'extensions' then 4
    when 'buckets' then 5
    when 'realtime' then 6
    when 'legacy_users' then 7
    when 'auth_users' then 8
  end,
  table_schema, table_name;