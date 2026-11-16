-- SAARTHII Supabase migration 0003
-- Notifications and escalations.
--
-- These tables power in-app alerts, realtime badges, and supervisor
-- escalation queues. Writes are performed by the FastAPI backend using the
-- server-side database credentials; browsers read only their own rows.

create table if not exists public.notifications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles (id) on delete cascade,
    referral_id uuid references public.referrals (id) on delete cascade,
    type text not null check (type in (
        'referral_created',
        'referral_acknowledged',
        'patient_arrived',
        'outcome_recorded',
        'back_referral_sent',
        'follow_up_assigned',
        'follow_up_completed',
        'closure_blocked',
        'referral_closed',
        'escalation_raised',
        'system'
    )),
    title text not null,
    body text,
    channel text not null default 'in_app'
        check (channel in ('in_app', 'email', 'sms')),
    status text not null default 'unread'
        check (status in ('unread', 'read', 'dismissed')),
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    read_at timestamptz
);

create index if not exists idx_notifications_user_status
    on public.notifications (user_id, status);
create index if not exists idx_notifications_referral
    on public.notifications (referral_id);
create index if not exists idx_notifications_created_at
    on public.notifications (created_at);

create table if not exists public.escalations (
    id uuid primary key default gen_random_uuid(),
    referral_id uuid not null references public.referrals (id) on delete cascade,
    facility_id uuid references public.facilities (id),
    raised_by_user_id uuid references public.profiles (id),
    assigned_to_user_id uuid references public.profiles (id),
    assigned_to_facility_id uuid references public.facilities (id),
    reason text not null,
    severity text not null default 'medium'
        check (severity in ('low', 'medium', 'high', 'critical')),
    status text not null default 'open'
        check (status in ('open', 'acknowledged', 'resolved', 'dismissed')),
    due_at timestamptz,
    resolved_at timestamptz,
    resolution_notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_escalations_referral
    on public.escalations (referral_id);
create index if not exists idx_escalations_status_severity
    on public.escalations (status, severity);
create index if not exists idx_escalations_assignee
    on public.escalations (assigned_to_user_id);
create index if not exists idx_escalations_facility
    on public.escalations (assigned_to_facility_id);
