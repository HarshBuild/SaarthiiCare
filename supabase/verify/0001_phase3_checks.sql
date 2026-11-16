-- SAARTHII Phase 3 post-migration checks
-- Read-only. Run after migrations 0001-0006 and the seed files.
-- A check passes when passed = true.

with expected(tablename) as (
    values
        ('facilities'),
        ('profiles'),
        ('user_facility_assignments'),
        ('patients'),
        ('referrals'),
        ('referral_events'),
        ('referral_outcomes'),
        ('back_referrals'),
        ('follow_up_tasks'),
        ('audit_logs'),
        ('notifications'),
        ('escalations')
),
checks as (
    select
        'expected_tables_present' as check_name,
        (
            select count(*) = 12
            from information_schema.tables t
            join expected e on e.tablename = t.table_name
            where t.table_schema = 'public'
        ) as passed,
        (
            select count(*)::text
            from information_schema.tables t
            join expected e on e.tablename = t.table_name
            where t.table_schema = 'public'
        ) as detail

    union all

    select
        'rls_enabled_on_all_tables',
        (
            select count(*) = 12
            from pg_class c
            join pg_namespace n on n.oid = c.relnamespace
            join expected e on e.tablename = c.relname
            where n.nspname = 'public'
              and c.relkind = 'r'
              and c.relrowsecurity
        ),
        (
            select count(*)::text
            from pg_class c
            join pg_namespace n on n.oid = c.relnamespace
            join expected e on e.tablename = c.relname
            where n.nspname = 'public'
              and c.relkind = 'r'
              and c.relrowsecurity
        )

    union all

    select
        'policies_present_on_all_tables',
        (
            select count(distinct p.tablename) = 12
            from pg_policies p
            join expected e on e.tablename = p.tablename
            where p.schemaname = 'public'
        ),
        (
            select count(distinct p.tablename)::text
            from pg_policies p
            join expected e on e.tablename = p.tablename
            where p.schemaname = 'public'
        )

    union all

    select
        'storage_bucket_private_with_limits',
        exists (
            select 1
            from storage.buckets
            where id = 'referral-documents'
              and public = false
              and file_size_limit is not null
              and allowed_mime_types is not null
        ),
        coalesce(
            (
                select format(
                    'public=%s size=%s mime_types=%s',
                    public,
                    file_size_limit,
                    array_length(allowed_mime_types, 1)
                )
                from storage.buckets
                where id = 'referral-documents'
            ),
            'missing'
        )

    union all

    select
        'realtime_core_tables',
        (
            select count(*) >= 5
            from pg_publication_tables
            where pubname = 'supabase_realtime'
              and schemaname = 'public'
              and tablename in (
                  'referrals',
                  'referral_events',
                  'follow_up_tasks',
                  'notifications',
                  'escalations'
              )
        ),
        (
            select count(*)::text
            from pg_publication_tables
            where pubname = 'supabase_realtime'
              and schemaname = 'public'
              and tablename in (
                  'referrals',
                  'referral_events',
                  'follow_up_tasks',
                  'notifications',
                  'escalations'
              )
        )

    union all

    select
        'every_auth_user_has_profile',
        (
            select count(*) = 0
            from auth.users u
            left join public.profiles p on p.id = u.id
            where p.id is null
        ),
        (
            select count(*)::text
            from auth.users u
            left join public.profiles p on p.id = u.id
            where p.id is null
        )

    union all

    select
        'new_user_default_role_is_phc_staff',
        coalesce(
            (
                select column_default like '''phc_staff''%'
                from information_schema.columns
                where table_schema = 'public'
                  and table_name = 'profiles'
                  and column_name = 'role'
            ),
            false
        ),
        coalesce(
            (
                select column_default
                from information_schema.columns
                where table_schema = 'public'
                  and table_name = 'profiles'
                  and column_name = 'role'
            ),
            'missing'
        )

    union all

    select
        'legacy_public_users_absent',
        not exists (
            select 1
            from information_schema.tables
            where table_schema = 'public'
              and table_name = 'users'
        ),
        case
            when exists (
                select 1
                from information_schema.tables
                where table_schema = 'public'
                  and table_name = 'users'
            ) then 'legacy users table present; reconcile, do not drop blindly'
            else 'absent'
        end
)
select check_name, passed, detail
from checks
order by check_name;

-- Detailed policy inventory.
select schemaname, tablename, policyname, cmd, roles
from pg_policies
where schemaname in ('public', 'storage')
order by schemaname, tablename, policyname;

-- Demo facility assignments.
select p.email, f.code as facility_code, ufa.is_primary
from public.user_facility_assignments ufa
join public.profiles p on p.id = ufa.user_id
join public.facilities f on f.id = ufa.facility_id
order by p.email, f.code;
