-- SAARTHII Supabase migration 0001
-- Extensions and enum types.
--
-- Run the files in supabase/migrations in numeric order in the Supabase SQL
-- Editor. This migration is additive and safe to re-run.

create extension if not exists pgcrypto with schema extensions;

do $$
begin
    create type public.user_role as enum (
        'phc_staff',
        'hospital_staff',
        'medical_officer',
        'supervisor',
        'admin'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.facility_type as enum (
        'phc',
        'chc',
        'sub_district_hospital',
        'district_hospital'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.gender_type as enum ('male', 'female', 'other');
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.referral_status as enum (
        'draft',
        'issued',
        'pending_ack',
        'acknowledged',
        'arrived',
        'outcome_recorded',
        'back_referral_pending',
        'back_referral_completed',
        'follow_up_pending',
        'follow_up_completed',
        'closed',
        'rejected',
        'cancelled'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.outcome_type as enum (
        'treated_discharged',
        'admitted_inpatient',
        'surgery_performed',
        'stabilized_transferred_higher',
        'referred_back_outpatient',
        'patient_refused_treatment',
        'expired',
        'other',
        'recovered',
        'improved',
        'stable',
        'worsened',
        'discharged',
        'transferred'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.task_status as enum (
        'pending',
        'in_progress',
        'completed',
        'overdue',
        'cancelled'
    );
exception
    when duplicate_object then null;
end $$;

-- Reconcile enums that may already exist from the legacy local schema.
alter type public.user_role add value if not exists 'medical_officer';
alter type public.referral_status add value if not exists 'pending_ack';
alter type public.outcome_type add value if not exists 'recovered';
alter type public.outcome_type add value if not exists 'improved';
alter type public.outcome_type add value if not exists 'stable';
alter type public.outcome_type add value if not exists 'worsened';
alter type public.outcome_type add value if not exists 'discharged';
alter type public.outcome_type add value if not exists 'transferred';
