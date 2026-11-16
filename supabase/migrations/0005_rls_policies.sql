-- SAARTHII Supabase migration 0005
-- Row Level Security and least-privilege API grants.
--
-- Design:
--   * Browsers use the publishable key with the authenticated role.
--   * Domain writes go through FastAPI using server-side credentials.
--   * Authenticated users may update only their own profile fields, their own
--     notification read state, and escalation status/notes.
--   * Anonymous users receive no table privileges and no policies.
--
-- Backend authorization remains authoritative for workflow, closure and
-- facility rules; RLS is defense-in-depth.

grant usage on schema public to authenticated;

revoke all on public.facilities from anon;
revoke all on public.facilities from authenticated;
grant select on public.facilities to authenticated;

revoke all on public.profiles from anon;
revoke all on public.profiles from authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

revoke all on public.user_facility_assignments from anon;
revoke all on public.user_facility_assignments from authenticated;
grant select on public.user_facility_assignments to authenticated;

revoke all on public.patients from anon;
revoke all on public.patients from authenticated;
grant select on public.patients to authenticated;

revoke all on public.referrals from anon;
revoke all on public.referrals from authenticated;
grant select on public.referrals to authenticated;

revoke all on public.referral_events from anon;
revoke all on public.referral_events from authenticated;
grant select on public.referral_events to authenticated;

revoke all on public.referral_outcomes from anon;
revoke all on public.referral_outcomes from authenticated;
grant select on public.referral_outcomes to authenticated;

revoke all on public.back_referrals from anon;
revoke all on public.back_referrals from authenticated;
grant select on public.back_referrals to authenticated;

revoke all on public.follow_up_tasks from anon;
revoke all on public.follow_up_tasks from authenticated;
grant select on public.follow_up_tasks to authenticated;

revoke all on public.audit_logs from anon;
revoke all on public.audit_logs from authenticated;
grant select on public.audit_logs to authenticated;

revoke all on public.notifications from anon;
revoke all on public.notifications from authenticated;
grant select on public.notifications to authenticated;
grant update (status, read_at) on public.notifications to authenticated;

revoke all on public.escalations from anon;
revoke all on public.escalations from authenticated;
grant select on public.escalations to authenticated;
grant update (status, resolution_notes, resolved_at) on public.escalations to authenticated;

alter table public.facilities enable row level security;
alter table public.profiles enable row level security;
alter table public.user_facility_assignments enable row level security;
alter table public.patients enable row level security;
alter table public.referrals enable row level security;
alter table public.referral_events enable row level security;
alter table public.referral_outcomes enable row level security;
alter table public.back_referrals enable row level security;
alter table public.follow_up_tasks enable row level security;
alter table public.audit_logs enable row level security;
alter table public.notifications enable row level security;
alter table public.escalations enable row level security;

drop policy if exists facilities_select_authenticated on public.facilities;
create policy facilities_select_authenticated
    on public.facilities
    for select
    to authenticated
    using (true);

drop policy if exists profiles_select_scoped on public.profiles;
create policy profiles_select_scoped
    on public.profiles
    for select
    to authenticated
    using (
        id = auth.uid()
        or public.is_supervisor_or_admin()
        or public.shares_facility_with(id)
    );

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self
    on public.profiles
    for update
    to authenticated
    using (id = auth.uid())
    with check (id = auth.uid());

drop policy if exists user_facility_assignments_select_scoped
    on public.user_facility_assignments;
create policy user_facility_assignments_select_scoped
    on public.user_facility_assignments
    for select
    to authenticated
    using (
        user_id = auth.uid()
        or public.is_supervisor_or_admin()
    );

drop policy if exists patients_select_scoped on public.patients;
create policy patients_select_scoped
    on public.patients
    for select
    to authenticated
    using (
        public.is_supervisor_or_admin()
        or public.has_facility_access(registering_facility_id)
        or exists (
            select 1
            from public.referrals r
            where r.patient_id = patients.id
              and public.can_access_referral(r.id)
        )
    );

drop policy if exists referrals_select_scoped on public.referrals;
create policy referrals_select_scoped
    on public.referrals
    for select
    to authenticated
    using (
        public.is_supervisor_or_admin()
        or public.has_facility_access(referring_facility_id)
        or public.has_facility_access(receiving_facility_id)
    );

drop policy if exists referral_events_select_scoped on public.referral_events;
create policy referral_events_select_scoped
    on public.referral_events
    for select
    to authenticated
    using (public.can_access_referral(referral_id));

drop policy if exists referral_outcomes_select_scoped on public.referral_outcomes;
create policy referral_outcomes_select_scoped
    on public.referral_outcomes
    for select
    to authenticated
    using (public.can_access_referral(referral_id));

drop policy if exists back_referrals_select_scoped on public.back_referrals;
create policy back_referrals_select_scoped
    on public.back_referrals
    for select
    to authenticated
    using (public.can_access_referral(referral_id));

drop policy if exists follow_up_tasks_select_scoped on public.follow_up_tasks;
create policy follow_up_tasks_select_scoped
    on public.follow_up_tasks
    for select
    to authenticated
    using (
        assigned_to_user_id = auth.uid()
        or assigned_by_user_id = auth.uid()
        or public.can_access_referral(referral_id)
    );

drop policy if exists audit_logs_select_supervisor_admin on public.audit_logs;
create policy audit_logs_select_supervisor_admin
    on public.audit_logs
    for select
    to authenticated
    using (public.is_supervisor_or_admin());

drop policy if exists notifications_select_scoped on public.notifications;
create policy notifications_select_scoped
    on public.notifications
    for select
    to authenticated
    using (
        user_id = auth.uid()
        or public.is_admin()
    );

drop policy if exists notifications_update_self on public.notifications;
create policy notifications_update_self
    on public.notifications
    for update
    to authenticated
    using (user_id = auth.uid())
    with check (user_id = auth.uid());

drop policy if exists escalations_select_scoped on public.escalations;
create policy escalations_select_scoped
    on public.escalations
    for select
    to authenticated
    using (
        public.is_supervisor_or_admin()
        or raised_by_user_id = auth.uid()
        or assigned_to_user_id = auth.uid()
        or (
            assigned_to_facility_id is not null
            and public.has_facility_access(assigned_to_facility_id)
        )
        or public.can_access_referral(referral_id)
    );

drop policy if exists escalations_update_supervisor_or_assignee on public.escalations;
create policy escalations_update_supervisor_or_assignee
    on public.escalations
    for update
    to authenticated
    using (
        public.is_supervisor_or_admin()
        or assigned_to_user_id = auth.uid()
    )
    with check (
        public.is_supervisor_or_admin()
        or assigned_to_user_id = auth.uid()
    );
