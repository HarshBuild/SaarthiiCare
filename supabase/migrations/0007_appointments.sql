-- SAARTHII Supabase migration 0007
-- Appointment scheduling for the referral workflow.
--
-- Appointments describe when and where the patient will be seen at the
-- receiving facility. They sit between "accepted" and "consultation" in the
-- seven-stage journey, so a referral can be awaiting an appointment without
-- losing its clinical status.
--
-- Writes are server-side only (FastAPI uses the service role). Browsers receive
-- read access scoped by the same facility rules as referrals.

do $$
begin
    create type public.appointment_status as enum (
        'scheduled',
        'completed',
        'cancelled',
        'no_show'
    );
exception
    when duplicate_object then null;
end $$;

create table if not exists public.appointments (
    id uuid primary key default gen_random_uuid(),
    referral_id uuid not null references public.referrals (id) on delete cascade,
    scheduled_for timestamptz not null,
    duration_minutes integer not null default 30
        check (duration_minutes between 5 and 480),
    location text not null default 'Specialist OPD',
    notes text,
    status public.appointment_status not null default 'scheduled',
    created_by_user_id uuid references public.profiles (id),
    completed_at timestamptz,
    completion_notes text,
    cancellation_reason text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_appointments_scheduled_for
    on public.appointments (scheduled_for);

create index if not exists idx_appointments_referral
    on public.appointments (referral_id);

-- One live booking per referral. Historic completed/cancelled rows are kept.
create unique index if not exists uq_appointments_one_active_per_referral
    on public.appointments (referral_id)
    where status = 'scheduled';

drop trigger if exists set_appointments_updated_at on public.appointments;
create trigger set_appointments_updated_at
    before update on public.appointments
    for each row execute function public.set_updated_at();

-- Least privilege: the browser may read appointments it is entitled to see.
revoke all on public.appointments from anon;
revoke all on public.appointments from authenticated;
grant select on public.appointments to authenticated;

alter table public.appointments enable row level security;

drop policy if exists appointments_select_scoped on public.appointments;
create policy appointments_select_scoped
    on public.appointments
    for select
    to authenticated
    using (
        public.is_supervisor_or_admin()
        or public.can_access_referral(referral_id)
    );
