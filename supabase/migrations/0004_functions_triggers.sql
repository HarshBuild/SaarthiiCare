-- SAARTHII Supabase migration 0004
-- Helper functions and triggers.
--
-- SECURITY DEFINER helpers are owned by the migration role and avoid
-- recursive RLS evaluation. They only read the caller's own profile,
-- facility assignments and referral scope.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
    select role
    from public.profiles
    where id = auth.uid()
      and is_active
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select coalesce(
        (
            select role = 'admin'
            from public.profiles
            where id = auth.uid()
              and is_active
        ),
        false
    )
$$;

create or replace function public.is_supervisor_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select coalesce(
        (
            select role in ('supervisor', 'admin')
            from public.profiles
            where id = auth.uid()
              and is_active
        ),
        false
    )
$$;

create or replace function public.user_facility_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
    select facility_id
    from public.user_facility_assignments
    where user_id = auth.uid()
$$;

create or replace function public.has_facility_access(target_facility_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select
        target_facility_id is not null
        and (
            public.is_admin()
            or exists (
                select 1
                from public.user_facility_assignments
                where user_id = auth.uid()
                  and facility_id = target_facility_id
            )
        )
$$;

create or replace function public.shares_facility_with(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.user_facility_assignments mine
        join public.user_facility_assignments theirs
          on theirs.facility_id = mine.facility_id
        where mine.user_id = auth.uid()
          and theirs.user_id = target_user_id
    )
$$;

create or replace function public.can_access_referral(target_referral_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select
        public.is_supervisor_or_admin()
        or exists (
            select 1
            from public.referrals r
            where r.id = target_referral_id
              and (
                  public.has_facility_access(r.referring_facility_id)
                  or public.has_facility_access(r.receiving_facility_id)
              )
        )
$$;

-- Create a profile for every Supabase Auth user. New users always start as
-- phc_staff. Privileged roles are assigned only by an administrator, never
-- from client-supplied user metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.profiles (id, email, full_name, phone, role)
    values (
        new.id,
        coalesce(nullif(new.email, ''), new.id::text || '@local.invalid'),
        coalesce(
            nullif(new.raw_user_meta_data ->> 'full_name', ''),
            split_part(coalesce(nullif(new.email, ''), new.id::text), '@', 1)
        ),
        nullif(new.raw_user_meta_data ->> 'phone', ''),
        'phc_staff'
    )
    on conflict (id) do nothing;

    return new;
end;
$$;

drop trigger if exists set_facilities_updated_at on public.facilities;
create trigger set_facilities_updated_at
    before update on public.facilities
    for each row execute function public.set_updated_at();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
    before update on public.profiles
    for each row execute function public.set_updated_at();

drop trigger if exists set_patients_updated_at on public.patients;
create trigger set_patients_updated_at
    before update on public.patients
    for each row execute function public.set_updated_at();

drop trigger if exists set_referrals_updated_at on public.referrals;
create trigger set_referrals_updated_at
    before update on public.referrals
    for each row execute function public.set_updated_at();

drop trigger if exists set_referral_outcomes_updated_at on public.referral_outcomes;
create trigger set_referral_outcomes_updated_at
    before update on public.referral_outcomes
    for each row execute function public.set_updated_at();

drop trigger if exists set_back_referrals_updated_at on public.back_referrals;
create trigger set_back_referrals_updated_at
    before update on public.back_referrals
    for each row execute function public.set_updated_at();

drop trigger if exists set_follow_up_tasks_updated_at on public.follow_up_tasks;
create trigger set_follow_up_tasks_updated_at
    before update on public.follow_up_tasks
    for each row execute function public.set_updated_at();

drop trigger if exists set_escalations_updated_at on public.escalations;
create trigger set_escalations_updated_at
    before update on public.escalations
    for each row execute function public.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();
