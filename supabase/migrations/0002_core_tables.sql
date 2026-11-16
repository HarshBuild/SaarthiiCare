-- SAARTHII Supabase migration 0002
-- Core domain tables.
--
-- public.profiles replaces the legacy public.users table for Supabase. The
-- primary key is auth.users.id, so passwords, email confirmation, MFA and
-- session handling stay inside Supabase Auth.
--
-- This migration never drops data. Existing legacy tables are left in place;
-- see docs/SUPABASE_SETUP.md for reconciliation guidance.

create table if not exists public.facilities (
    id uuid primary key default gen_random_uuid(),
    code text unique not null,
    name text not null,
    type public.facility_type not null,
    address text not null,
    district text not null,
    state text not null,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    email text unique not null,
    full_name text not null,
    phone text,
    role public.user_role not null default 'phc_staff',
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.user_facility_assignments (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles (id) on delete cascade,
    facility_id uuid not null references public.facilities (id) on delete cascade,
    is_primary boolean not null default false,
    created_at timestamptz not null default now(),
    constraint unique_user_facility unique (user_id, facility_id)
);

create table if not exists public.patients (
    id uuid primary key default gen_random_uuid(),
    patient_identifier text unique not null,
    abha_id text unique,
    registering_facility_id uuid not null references public.facilities (id),
    full_name text not null,
    dob date,
    age_years smallint check (age_years is null or age_years between 0 and 130),
    gender public.gender_type not null,
    phone text,
    address text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.referrals (
    id uuid primary key default gen_random_uuid(),
    referral_number text unique not null,
    patient_id uuid not null references public.patients (id),
    referring_facility_id uuid not null references public.facilities (id),
    receiving_facility_id uuid not null references public.facilities (id),
    created_by_user_id uuid not null references public.profiles (id),
    status public.referral_status not null default 'draft',
    specialty_required text not null,
    referral_reason text not null,
    clinical_summary text not null,
    back_referral_required boolean not null default true,
    follow_up_required boolean not null default false,
    follow_up_due_date date,
    qr_token text unique,
    issued_at timestamptz,
    closed_at timestamptz,
    closed_by_user_id uuid references public.profiles (id),
    rejection_reason text,
    cancellation_reason text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.referral_events (
    id uuid primary key default gen_random_uuid(),
    referral_id uuid not null references public.referrals (id) on delete cascade,
    performed_by_user_id uuid references public.profiles (id),
    event_type text not null,
    from_status public.referral_status,
    to_status public.referral_status,
    notes text,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create table if not exists public.referral_outcomes (
    id uuid primary key default gen_random_uuid(),
    referral_id uuid unique not null references public.referrals (id) on delete cascade,
    recorded_by_user_id uuid references public.profiles (id),
    outcome_category public.outcome_type not null,
    clinical_notes text not null,
    recommendations text,
    follow_up_date date,
    recorded_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.back_referrals (
    id uuid primary key default gen_random_uuid(),
    referral_id uuid unique not null references public.referrals (id) on delete cascade,
    created_by_user_id uuid references public.profiles (id),
    outcome_summary text not null,
    recommendations text,
    recommended_followup_date date,
    back_referral_sent boolean not null default false,
    acknowledged_by_phc boolean not null default false,
    acknowledged_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.follow_up_tasks (
    id uuid primary key default gen_random_uuid(),
    referral_id uuid not null references public.referrals (id) on delete cascade,
    assigned_to_user_id uuid not null references public.profiles (id),
    assigned_by_user_id uuid not null references public.profiles (id),
    task_type text not null default 'other'
        check (task_type in ('home_visit', 'phone_call', 'lab_results', 'medication', 'referral', 'other')),
    task_description text not null,
    due_date date not null,
    status public.task_status not null default 'pending',
    completion_notes text,
    completed_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.profiles (id),
    facility_id uuid references public.facilities (id),
    action text not null,
    resource_type text not null,
    resource_id uuid,
    details jsonb not null default '{}'::jsonb,
    ip_address text,
    user_agent text,
    created_at timestamptz not null default now()
);

create index if not exists idx_referrals_referring_facility
    on public.referrals (referring_facility_id);
create index if not exists idx_referrals_receiving_facility
    on public.referrals (receiving_facility_id);
create index if not exists idx_referrals_status
    on public.referrals (status);
create index if not exists idx_referrals_patient
    on public.referrals (patient_id);
create index if not exists idx_referrals_created_at
    on public.referrals (created_at);
create index if not exists idx_patients_identifier
    on public.patients (patient_identifier);
create index if not exists idx_patients_abha
    on public.patients (abha_id);
create index if not exists idx_referral_events_referral
    on public.referral_events (referral_id);
create index if not exists idx_referral_events_created_at
    on public.referral_events (created_at);
create index if not exists idx_follow_up_tasks_assignee
    on public.follow_up_tasks (assigned_to_user_id);
create index if not exists idx_follow_up_tasks_status
    on public.follow_up_tasks (status);
create index if not exists idx_follow_up_tasks_due_date
    on public.follow_up_tasks (due_date);
create index if not exists idx_audit_logs_resource
    on public.audit_logs (resource_type, resource_id);
create index if not exists idx_audit_logs_created_at
    on public.audit_logs (created_at);
