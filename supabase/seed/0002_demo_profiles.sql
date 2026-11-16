-- SAARTHII Supabase seed 0002
-- Demo profile roles and facility assignments.
--
-- Prerequisite: create the demo users in Supabase Dashboard -> Authentication
-- -> Users, or with the Auth Admin API. This script does not create auth
-- users and never stores passwords.
--
-- Run only in a development/demo project. Roles are assigned here by an
-- administrator on purpose; new sign-ups default to phc_staff.
--
-- Demo accounts:
--   priya.sharma@saarthii.in   phc_staff       Primary Health Centre Rampur
--   ravi.kumar@saarthii.in     hospital_staff  District Hospital Bareilly
--   anjali.reddy@saarthii.in   supervisor      District Hospital Bareilly
--   admin@saarthii.in          admin           District Hospital Bareilly

insert into public.profiles (id, email, full_name, phone, role, is_active)
select
    u.id,
    u.email,
    coalesce(
        nullif(u.raw_user_meta_data ->> 'full_name', ''),
        split_part(u.email, '@', 1)
    ),
    nullif(u.raw_user_meta_data ->> 'phone', ''),
    case u.email
        when 'priya.sharma@saarthii.in' then 'phc_staff'::public.user_role
        when 'ravi.kumar@saarthii.in' then 'hospital_staff'::public.user_role
        when 'anjali.reddy@saarthii.in' then 'supervisor'::public.user_role
        when 'admin@saarthii.in' then 'admin'::public.user_role
    end,
    true
from auth.users u
where u.email in (
    'priya.sharma@saarthii.in',
    'ravi.kumar@saarthii.in',
    'anjali.reddy@saarthii.in',
    'admin@saarthii.in'
)
on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    phone = excluded.phone,
    role = excluded.role,
    is_active = true;

insert into public.user_facility_assignments (user_id, facility_id, is_primary)
select
    p.id,
    f.id,
    true
from (
    values
        ('priya.sharma@saarthii.in', 'PHC-RMP-01'),
        ('ravi.kumar@saarthii.in', 'DH-BLY-02'),
        ('anjali.reddy@saarthii.in', 'DH-BLY-02'),
        ('admin@saarthii.in', 'DH-BLY-02')
) as mapping (email, facility_code)
join public.profiles p on p.email = mapping.email
join public.facilities f on f.code = mapping.facility_code
on conflict (user_id, facility_id) do update set
    is_primary = excluded.is_primary;

-- Show which demo auth users are still missing. Create them in the dashboard
-- and re-run this file; no rows are inserted for missing users.
select
    mapping.email,
    (u.id is not null) as auth_user_exists,
    (p.id is not null) as profile_exists
from (
    values
        ('priya.sharma@saarthii.in'),
        ('ravi.kumar@saarthii.in'),
        ('anjali.reddy@saarthii.in'),
        ('admin@saarthii.in')
) as mapping (email)
left join auth.users u on u.email = mapping.email
left join public.profiles p on p.email = mapping.email
order by mapping.email;
